import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { Alert, Incident, InsertUser, alerts, assets, auditLogs, incidentActions, incidents, reports, riskSnapshots, users } from "../drizzle/schema";
import { ENV } from "./_core/env";
import type { IncidentStatus } from "./socRules";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("La base de données est indisponible.");
  return db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  values.role = user.openId === ENV.ownerOpenId ? "admin" : user.role ?? "analyst";
  updateSet.role = values.role;
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getSocSummary() {
  const db = await requireDb();
  const [allAlerts, allIncidents, allAssets, snapshots] = await Promise.all([
    db.select().from(alerts).orderBy(desc(alerts.createdAt)),
    db.select().from(incidents).orderBy(desc(incidents.createdAt)),
    db.select().from(assets).orderBy(desc(assets.riskScore)),
    db.select().from(riskSnapshots).orderBy(desc(riskSnapshots.capturedAt)).limit(12),
  ]);
  const activeAlerts = allAlerts.filter(alert => alert.status !== "resolved");
  const openIncidents = allIncidents.filter(incident => incident.status !== "closed");
  const globalRiskScore = allAssets.length === 0 ? 0 : Math.round(allAssets.reduce((sum, asset) => sum + asset.riskScore, 0) / allAssets.length);
  const alertsBySeverity = (["critical", "high", "medium", "low"] as const).map(severity => ({ severity, count: allAlerts.filter(alert => alert.severity === severity).length }));

  return {
    metrics: {
      activeAlerts: activeAlerts.length,
      criticalAlerts: allAlerts.filter(alert => alert.severity === "critical" && alert.status !== "resolved").length,
      openIncidents: openIncidents.length,
      globalRiskScore,
      monitoredSystems: allAssets.length,
      onlineSystems: allAssets.filter(asset => asset.status === "online").length,
    },
    alertsBySeverity,
    riskTrend: snapshots.reverse().map(snapshot => ({ capturedAt: snapshot.capturedAt, score: snapshot.globalRiskScore, activeAlerts: snapshot.activeAlerts, openIncidents: snapshot.openIncidents })),
    highRiskAssets: allAssets.filter(asset => asset.riskLevel === "critical" || asset.riskLevel === "high").slice(0, 5),
    recentAlerts: allAlerts.slice(0, 6),
    isDemoData: allAssets.some(asset => asset.name.startsWith("[Démo]")),
  };
}

export async function listAssets() {
  const db = await requireDb();
  return db.select().from(assets).orderBy(desc(assets.riskScore));
}

export async function getAssetById(id: number) {
  const db = await requireDb();
  const result = await db.select().from(assets).where(eq(assets.id, id)).limit(1);
  return result[0];
}

export async function createAsset(input: Omit<typeof assets.$inferInsert, "id" | "createdAt" | "updatedAt" | "lastSeen">) {
  const db = await requireDb();
  const result = await db.insert(assets).values(input);
  return (await db.select().from(assets).where(eq(assets.id, Number(result[0].insertId))).limit(1))[0]!;
}

export async function listAlerts(filters?: { severity?: Alert["severity"]; status?: Alert["status"] }) {
  const db = await requireDb();
  const conditions = [];
  if (filters?.severity) conditions.push(eq(alerts.severity, filters.severity));
  if (filters?.status) conditions.push(eq(alerts.status, filters.status));
  return db
    .select({ alert: alerts, assetName: assets.name, assigneeName: users.name })
    .from(alerts)
    .leftJoin(assets, eq(alerts.assetId, assets.id))
    .leftJoin(users, eq(alerts.assignedUserId, users.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(alerts.createdAt));
}

export async function getAlertById(id: number) {
  const db = await requireDb();
  const result = await db
    .select({ alert: alerts, assetName: assets.name, assigneeName: users.name })
    .from(alerts)
    .leftJoin(assets, eq(alerts.assetId, assets.id))
    .leftJoin(users, eq(alerts.assignedUserId, users.id))
    .where(eq(alerts.id, id))
    .limit(1);
  return result[0];
}

export async function createAlert(input: Omit<typeof alerts.$inferInsert, "id" | "createdAt" | "updatedAt" | "status" | "resolvedAt" | "aiExplanation" | "recommendedActions" | "incidentId">) {
  const db = await requireDb();
  const result = await db.insert(alerts).values({ ...input, status: "open" });
  return (await db.select().from(alerts).where(eq(alerts.id, Number(result[0].insertId))).limit(1))[0]!;
}

export async function updateAlertStatus(id: number, status: Alert["status"], actorUserId: number) {
  const db = await requireDb();
  await db.update(alerts).set({ status, assignedUserId: actorUserId, resolvedAt: status === "resolved" ? new Date() : null, updatedAt: new Date() }).where(eq(alerts.id, id));
  const result = await db.select().from(alerts).where(eq(alerts.id, id)).limit(1);
  return result[0];
}

export async function listIncidents() {
  const db = await requireDb();
  return db
    .select({ incident: incidents, assetName: assets.name, assigneeName: users.name })
    .from(incidents)
    .leftJoin(assets, eq(incidents.assetId, assets.id))
    .leftJoin(users, eq(incidents.assignedUserId, users.id))
    .orderBy(desc(incidents.updatedAt));
}

export async function getIncidentById(id: number): Promise<Incident | undefined> {
  const db = await requireDb();
  const result = await db.select().from(incidents).where(eq(incidents.id, id)).limit(1);
  return result[0];
}

export async function createIncident(input: Omit<typeof incidents.$inferInsert, "id" | "createdAt" | "updatedAt" | "openedAt" | "resolvedAt" | "closedAt" | "status">) {
  const db = await requireDb();
  const result = await db.insert(incidents).values({ ...input, status: "open" });
  const incident = (await db.select().from(incidents).where(eq(incidents.id, Number(result[0].insertId))).limit(1))[0]!;
  await db.insert(incidentActions).values({ incidentId: incident.id, actorUserId: input.createdByUserId, actionType: "created", comment: "Incident créé." });
  return incident;
}

export async function transitionIncident(input: { incidentId: number; actorUserId: number; currentStatus: IncidentStatus; nextStatus: IncidentStatus; comment?: string }) {
  const db = await requireDb();
  const timestamps = input.nextStatus === "resolved" ? { resolvedAt: new Date() } : input.nextStatus === "closed" ? { closedAt: new Date() } : {};
  await db.update(incidents).set({ status: input.nextStatus, updatedAt: new Date(), ...timestamps }).where(eq(incidents.id, input.incidentId));
  await db.insert(incidentActions).values({ incidentId: input.incidentId, actorUserId: input.actorUserId, actionType: "status_changed", previousStatus: input.currentStatus, nextStatus: input.nextStatus, comment: input.comment });
  return getIncidentById(input.incidentId);
}

export async function assignIncidentToActor(input: { incidentId: number; actorUserId: number }) {
  const db = await requireDb();
  await db.update(incidents).set({ assignedUserId: input.actorUserId, updatedAt: new Date() }).where(eq(incidents.id, input.incidentId));
  await db.insert(incidentActions).values({ incidentId: input.incidentId, actorUserId: input.actorUserId, actionType: "assignment", comment: "Incident pris en charge par l’analyste." });
  return getIncidentById(input.incidentId);
}

export async function addIncidentComment(input: { incidentId: number; actorUserId: number; comment: string }) {
  const db = await requireDb();
  const result = await db.insert(incidentActions).values({ incidentId: input.incidentId, actorUserId: input.actorUserId, actionType: "comment", comment: input.comment });
  return (await db.select().from(incidentActions).where(eq(incidentActions.id, Number(result[0].insertId))).limit(1))[0]!;
}

export async function listIncidentActions(incidentId: number) {
  const db = await requireDb();
  return db
    .select({ action: incidentActions, actorName: users.name })
    .from(incidentActions)
    .leftJoin(users, eq(incidentActions.actorUserId, users.id))
    .where(eq(incidentActions.incidentId, incidentId))
    .orderBy(desc(incidentActions.createdAt));
}

export async function writeAuditLog(input: { actorUserId?: number; action: string; resourceType: string; resourceId?: string; metadata?: Record<string, unknown> }) {
  const db = await requireDb();
  await db.insert(auditLogs).values({ ...input, success: "true" });
}

export async function listAuditLogs() {
  const db = await requireDb();
  return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(100);
}

export async function createReport(input: { reportType: "posture" | "incident" | "inventory"; title: string; generatedByUserId: number; content: Record<string, unknown> }) {
  const db = await requireDb();
  const result = await db.insert(reports).values(input);
  return (await db.select().from(reports).where(eq(reports.id, Number(result[0].insertId))).limit(1))[0]!;
}

export async function listReports() {
  const db = await requireDb();
  return db.select().from(reports).orderBy(desc(reports.createdAt)).limit(50);
}

export async function seedDemoSocData(adminUserId: number) {
  const db = await requireDb();
  const existingAssets = await db.select({ id: assets.id }).from(assets).limit(1);
  if (existingAssets.length > 0) return { created: false as const, reason: "inventory_not_empty" as const };

  const createdAt = new Date();
  const [gatewayResult, apiResult, workstationResult] = await Promise.all([
    db.insert(assets).values({ name: "[Démo] Passerelle périmétrique", hostname: "gw-demo", ipAddress: "198.51.100.10", assetType: "security", operatingSystem: "Appliance", owner: "Équipe réseau", status: "online", riskLevel: "high", riskScore: 78, criticality: 5, lastSeen: createdAt }),
    db.insert(assets).values({ name: "[Démo] API métier", hostname: "api-demo", ipAddress: "203.0.113.22", assetType: "server", operatingSystem: "Linux", owner: "Équipe applicative", status: "online", riskLevel: "critical", riskScore: 92, criticality: 5, lastSeen: createdAt }),
    db.insert(assets).values({ name: "[Démo] Poste analyste", hostname: "soc-ws-demo", ipAddress: "192.0.2.45", assetType: "workstation", operatingSystem: "Windows", owner: "SOC", status: "degraded", riskLevel: "medium", riskScore: 46, criticality: 3, lastSeen: createdAt }),
  ]);
  const gatewayId = Number(gatewayResult[0].insertId);
  const apiId = Number(apiResult[0].insertId);
  const workstationId = Number(workstationResult[0].insertId);

  const incidentResult = await db.insert(incidents).values({ title: "[Démo] Investiguer une activité de reconnaissance", description: "Données fictives de démonstration. Plusieurs signaux synthétiques ciblent un service exposé; aucune activité réseau réelle n’est représentée.", severity: "high", status: "open", riskScore: 84, assetId: apiId, createdByUserId: adminUserId, openedAt: createdAt });
  const incidentId = Number(incidentResult[0].insertId);
  await db.insert(incidentActions).values({ incidentId, actorUserId: adminUserId, actionType: "created", comment: "Incident fictif créé pour la démonstration du parcours SOC." });
  await db.insert(alerts).values([
    { title: "[Démo] Multiples tentatives d’authentification", description: "Signal synthétique, uniquement destiné à démontrer la qualification d’alerte.", category: "Authentification", severity: "critical", status: "open", riskScore: 91, sourceIp: "198.51.100.45", destinationIp: "203.0.113.22", assetId: apiId, incidentId, assignedUserId: adminUserId, detectionMethod: "rule", confidence: 94, aiExplanation: "Contexte fictif : une succession inhabituelle de tentatives est simulée contre le service API.", recommendedActions: "Vérifier les journaux d’authentification, la liste des comptes concernés et les contrôles d’accès." },
    { title: "[Démo] Variation de trafic sortant", description: "Signal synthétique de volume de trafic; il ne provient d’aucun collecteur réel.", category: "Anomalie réseau", severity: "high", status: "in_progress", riskScore: 76, sourceIp: "203.0.113.22", destinationIp: "192.0.2.100", assetId: apiId, assignedUserId: adminUserId, detectionMethod: "ml", confidence: 79, aiExplanation: "Contexte fictif : un écart de volume est présenté pour illustrer la priorisation assistée.", recommendedActions: "Comparer les flux à la baseline autorisée et vérifier les processus initiateurs." },
    { title: "[Démo] Service exposé à vérifier", description: "Signal synthétique d’exposition réseau dans l’environnement de démonstration.", category: "Surface d’exposition", severity: "medium", status: "open", riskScore: 58, sourceIp: "198.51.100.10", destinationIp: "203.0.113.22", assetId: gatewayId, assignedUserId: adminUserId, detectionMethod: "ids", confidence: 70, aiExplanation: null, recommendedActions: "Valider que le service est attendu et que les restrictions d’accès sont appliquées." },
    { title: "[Démo] Poste nécessitant une vérification", description: "Alerte fictive permettant de visualiser un risque faible à moyen.", category: "Poste de travail", severity: "low", status: "resolved", riskScore: 24, sourceIp: "192.0.2.45", destinationIp: "198.51.100.10", assetId: workstationId, assignedUserId: adminUserId, detectionMethod: "manual", confidence: 65, aiExplanation: null, recommendedActions: "Documenter la vérification menée avant clôture." },
  ]);
  const now = Date.now();
  await db.insert(riskSnapshots).values([
    { globalRiskScore: 42, activeAlerts: 2, openIncidents: 1, capturedAt: new Date(now - 1000 * 60 * 60 * 48) },
    { globalRiskScore: 58, activeAlerts: 3, openIncidents: 1, capturedAt: new Date(now - 1000 * 60 * 60 * 24) },
    { globalRiskScore: 72, activeAlerts: 3, openIncidents: 1, capturedAt: new Date(now) },
  ]);
  return { created: true as const };
}
