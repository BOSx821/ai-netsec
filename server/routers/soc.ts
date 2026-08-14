import { z } from "zod";
import * as db from "../db";
import { assertIncidentTransition, requiresCriticalAlertOwnerNotification, requiresOwnerNotification } from "../socRules";
import { notifyOwner } from "../_core/notification";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { assistantRouter } from "./assistant";

const severitySchema = z.enum(["critical", "high", "medium", "low"]);
const alertStatusSchema = z.enum(["open", "in_progress", "resolved"]);
const incidentStatusSchema = z.enum(["open", "in_progress", "resolved", "closed"]);

export const socRouter = router({
  dashboard: protectedProcedure.query(() => db.getSocSummary()),

  assets: router({
    list: protectedProcedure.query(() => db.listAssets()),
    get: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(({ input }) => db.getAssetById(input.id)),
    create: adminProcedure
      .input(
        z.object({
          name: z.string().min(2).max(160),
          hostname: z.string().max(160).optional(),
          ipAddress: z.string().max(45).optional(),
          assetType: z.enum(["server", "workstation", "network", "security", "cloud", "iot", "unknown"]),
          operatingSystem: z.string().max(160).optional(),
          owner: z.string().max(160).optional(),
          status: z.enum(["online", "degraded", "offline", "unknown"]),
          riskLevel: severitySchema,
          riskScore: z.number().int().min(0).max(100),
          criticality: z.number().int().min(1).max(5),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const asset = await db.createAsset(input);
        await db.writeAuditLog({ actorUserId: ctx.user.id, action: "asset.create", resourceType: "asset", resourceId: String(asset.id) });
        return asset;
      }),
  }),

  alerts: router({
    list: protectedProcedure
      .input(z.object({ severity: severitySchema.optional(), status: alertStatusSchema.optional() }).optional())
      .query(({ input }) => db.listAlerts(input)),
    get: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(({ input }) => db.getAlertById(input.id)),
    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(3).max(200),
          description: z.string().min(5).max(4000),
          category: z.string().min(2).max(100),
          severity: severitySchema,
          riskScore: z.number().int().min(0).max(100),
          sourceIp: z.string().max(45).optional(),
          destinationIp: z.string().max(45).optional(),
          assetId: z.number().int().positive().optional(),
          detectionMethod: z.enum(["rule", "ids", "ml", "correlation", "manual"]),
          confidence: z.number().int().min(0).max(100),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const alert = await db.createAlert({ ...input, assignedUserId: ctx.user.id });
        await db.writeAuditLog({ actorUserId: ctx.user.id, action: "alert.create", resourceType: "alert", resourceId: String(alert.id) });
        if (requiresCriticalAlertOwnerNotification(input.severity)) {
          const delivered = await notifyOwner({ title: "Alerte SOC critique créée", content: `ALT-${String(alert.id).padStart(5, "0")} · ${alert.title} · score de risque ${alert.riskScore}/100.` });
          await db.writeAuditLog({ actorUserId: ctx.user.id, action: "alert.critical.notification", resourceType: "alert", resourceId: String(alert.id), metadata: { delivered } });
        }
        return alert;
      }),
    updateStatus: protectedProcedure
      .input(z.object({ id: z.number().int().positive(), status: alertStatusSchema }))
      .mutation(async ({ ctx, input }) => {
        const alert = await db.updateAlertStatus(input.id, input.status, ctx.user.id);
        await db.writeAuditLog({ actorUserId: ctx.user.id, action: "alert.status.update", resourceType: "alert", resourceId: String(input.id), metadata: { status: input.status } });
        return alert;
      }),
  }),

  incidents: router({
    list: protectedProcedure.query(() => db.listIncidents()),
    get: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input }) => {
      const incident = await db.getIncidentById(input.id);
      if (!incident) return undefined;
      const history = await db.listIncidentActions(input.id);
      return { incident, history };
    }),
    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(3).max(200),
          description: z.string().min(5).max(4000),
          severity: severitySchema,
          riskScore: z.number().int().min(0).max(100),
          assignedUserId: z.number().int().positive().optional(),
          assetId: z.number().int().positive().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const incident = await db.createIncident({ ...input, createdByUserId: ctx.user.id });
        await db.writeAuditLog({ actorUserId: ctx.user.id, action: "incident.create", resourceType: "incident", resourceId: String(incident.id) });
        if (requiresOwnerNotification(input.severity)) {
          const delivered = await notifyOwner({ title: "Incident SOC à haute sévérité créé", content: `INC-${String(incident.id).padStart(4, "0")} · ${incident.title} · sévérité ${input.severity} · score de risque ${incident.riskScore}/100.` });
          await db.writeAuditLog({ actorUserId: ctx.user.id, action: "incident.high_severity.notification", resourceType: "incident", resourceId: String(incident.id), metadata: { delivered } });
        }
        return incident;
      }),
    transition: protectedProcedure
      .input(z.object({ id: z.number().int().positive(), nextStatus: incidentStatusSchema, comment: z.string().max(2000).optional() }))
      .mutation(async ({ ctx, input }) => {
        const incident = await db.getIncidentById(input.id);
        if (!incident) throw new Error("Incident introuvable.");
        assertIncidentTransition(incident.status, input.nextStatus);
        const updated = await db.transitionIncident({ incidentId: input.id, actorUserId: ctx.user.id, currentStatus: incident.status, nextStatus: input.nextStatus, comment: input.comment });
        await db.writeAuditLog({ actorUserId: ctx.user.id, action: "incident.transition", resourceType: "incident", resourceId: String(input.id), metadata: { from: incident.status, to: input.nextStatus } });
        return updated;
      }),
    assignSelf: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const incident = await db.getIncidentById(input.id);
        if (!incident) throw new Error("Incident introuvable.");
        const updated = await db.assignIncidentToActor({ incidentId: input.id, actorUserId: ctx.user.id });
        await db.writeAuditLog({ actorUserId: ctx.user.id, action: "incident.assign.self", resourceType: "incident", resourceId: String(input.id) });
        return updated;
      }),
    addComment: protectedProcedure
      .input(z.object({ incidentId: z.number().int().positive(), comment: z.string().min(1).max(2000) }))
      .mutation(async ({ ctx, input }) => {
        const action = await db.addIncidentComment({ incidentId: input.incidentId, actorUserId: ctx.user.id, comment: input.comment });
        await db.writeAuditLog({ actorUserId: ctx.user.id, action: "incident.comment", resourceType: "incident", resourceId: String(input.incidentId) });
        return action;
      }),
  }),

  admin: router({
    auditLogs: adminProcedure.query(() => db.listAuditLogs()),
    seedDemo: adminProcedure.mutation(async ({ ctx }) => {
      const result = await db.seedDemoSocData(ctx.user.id);
      await db.writeAuditLog({ actorUserId: ctx.user.id, action: "demo.seed", resourceType: "soc", metadata: result });
      return result;
    }),
  }),

  reports: router({
    list: protectedProcedure.query(() => db.listReports()),
    generatePosture: protectedProcedure.mutation(async ({ ctx }) => {
      const [summary, assetsList, alertsList, incidentsList] = await Promise.all([db.getSocSummary(), db.listAssets(), db.listAlerts(), db.listIncidents()]);
      const content = {
        generatedAt: new Date().toISOString(),
        summary,
        highRiskAssets: assetsList.filter(asset => asset.riskLevel === "critical" || asset.riskLevel === "high"),
        activeAlerts: alertsList.filter(({ alert }) => alert.status !== "resolved").slice(0, 20),
        activeIncidents: incidentsList.filter(({ incident }) => incident.status !== "closed").slice(0, 20),
        recommendation: "Traiter prioritairement les alertes critiques, confirmer les propriétaires des actifs à risque élevé et documenter chaque décision de réponse dans l’historique d’incident.",
      };
      const report = await db.createReport({ reportType: "posture", title: `Posture de sécurité — ${new Date().toLocaleDateString("fr-FR")}`, generatedByUserId: ctx.user.id, content });
      await db.writeAuditLog({ actorUserId: ctx.user.id, action: "report.generate.posture", resourceType: "report", resourceId: String(report.id) });
      return report;
    }),
  }),

  assistant: assistantRouter,
});
