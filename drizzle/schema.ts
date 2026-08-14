import { index, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["analyst", "admin"]).default("analyst").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const assets = mysqlTable(
  "assets",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    hostname: varchar("hostname", { length: 160 }),
    ipAddress: varchar("ipAddress", { length: 45 }),
    assetType: mysqlEnum("assetType", ["server", "workstation", "network", "security", "cloud", "iot", "unknown"]).notNull(),
    operatingSystem: varchar("operatingSystem", { length: 160 }),
    owner: varchar("owner", { length: 160 }),
    status: mysqlEnum("status", ["online", "degraded", "offline", "unknown"]).default("unknown").notNull(),
    riskLevel: mysqlEnum("riskLevel", ["critical", "high", "medium", "low"]).default("low").notNull(),
    riskScore: int("riskScore").default(0).notNull(),
    criticality: int("criticality").default(1).notNull(),
    lastSeen: timestamp("lastSeen"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("assets_risk_level_idx").on(table.riskLevel), index("assets_status_idx").on(table.status)],
);

export const incidents = mysqlTable(
  "incidents",
  {
    id: int("id").autoincrement().primaryKey(),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description").notNull(),
    severity: mysqlEnum("severity", ["critical", "high", "medium", "low"]).notNull(),
    status: mysqlEnum("status", ["open", "in_progress", "resolved", "closed"]).default("open").notNull(),
    riskScore: int("riskScore").default(0).notNull(),
    assetId: int("assetId").references(() => assets.id, { onDelete: "set null" }),
    createdByUserId: int("createdByUserId").notNull().references(() => users.id),
    assignedUserId: int("assignedUserId").references(() => users.id, { onDelete: "set null" }),
    openedAt: timestamp("openedAt").defaultNow().notNull(),
    resolvedAt: timestamp("resolvedAt"),
    closedAt: timestamp("closedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("incidents_status_idx").on(table.status), index("incidents_severity_idx").on(table.severity)],
);

export const alerts = mysqlTable(
  "alerts",
  {
    id: int("id").autoincrement().primaryKey(),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description").notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    severity: mysqlEnum("severity", ["critical", "high", "medium", "low"]).notNull(),
    status: mysqlEnum("status", ["open", "in_progress", "resolved"]).default("open").notNull(),
    riskScore: int("riskScore").default(0).notNull(),
    sourceIp: varchar("sourceIp", { length: 45 }),
    destinationIp: varchar("destinationIp", { length: 45 }),
    assetId: int("assetId").references(() => assets.id, { onDelete: "set null" }),
    incidentId: int("incidentId").references(() => incidents.id, { onDelete: "set null" }),
    assignedUserId: int("assignedUserId").references(() => users.id, { onDelete: "set null" }),
    detectionMethod: mysqlEnum("detectionMethod", ["rule", "ids", "ml", "correlation", "manual"]).notNull(),
    confidence: int("confidence").default(0).notNull(),
    aiExplanation: text("aiExplanation"),
    recommendedActions: text("recommendedActions"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    resolvedAt: timestamp("resolvedAt"),
  },
  table => [index("alerts_status_idx").on(table.status), index("alerts_severity_idx").on(table.severity), index("alerts_created_at_idx").on(table.createdAt)],
);

export const incidentActions = mysqlTable(
  "incident_actions",
  {
    id: int("id").autoincrement().primaryKey(),
    incidentId: int("incidentId").notNull().references(() => incidents.id, { onDelete: "cascade" }),
    actorUserId: int("actorUserId").references(() => users.id, { onDelete: "set null" }),
    actionType: mysqlEnum("actionType", ["created", "status_changed", "comment", "assignment", "evidence"]).notNull(),
    previousStatus: varchar("previousStatus", { length: 32 }),
    nextStatus: varchar("nextStatus", { length: 32 }),
    comment: text("comment"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("incident_actions_incident_idx").on(table.incidentId)],
);

export const riskSnapshots = mysqlTable(
  "risk_snapshots",
  {
    id: int("id").autoincrement().primaryKey(),
    globalRiskScore: int("globalRiskScore").notNull(),
    activeAlerts: int("activeAlerts").notNull(),
    openIncidents: int("openIncidents").notNull(),
    capturedAt: timestamp("capturedAt").defaultNow().notNull(),
  },
  table => [index("risk_snapshots_captured_at_idx").on(table.capturedAt)],
);

export const reports = mysqlTable(
  "reports",
  {
    id: int("id").autoincrement().primaryKey(),
    reportType: mysqlEnum("reportType", ["posture", "incident", "inventory"]).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    generatedByUserId: int("generatedByUserId").notNull().references(() => users.id),
    content: json("content"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("reports_created_at_idx").on(table.createdAt)],
);

export const auditLogs = mysqlTable(
  "audit_logs",
  {
    id: int("id").autoincrement().primaryKey(),
    actorUserId: int("actorUserId").references(() => users.id, { onDelete: "set null" }),
    action: varchar("action", { length: 120 }).notNull(),
    resourceType: varchar("resourceType", { length: 80 }).notNull(),
    resourceId: varchar("resourceId", { length: 80 }),
    success: mysqlEnum("success", ["true", "false"]).default("true").notNull(),
    metadata: json("metadata"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("audit_logs_created_at_idx").on(table.createdAt), index("audit_logs_actor_idx").on(table.actorUserId)],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Asset = typeof assets.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
export type Incident = typeof incidents.$inferSelect;
