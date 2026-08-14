import { describe, beforeEach, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  createAlert: vi.fn(),
  createIncident: vi.fn(),
  writeAuditLog: vi.fn(),
  getIncidentById: vi.fn(),
  assignIncidentToActor: vi.fn(),
  addIncidentComment: vi.fn(),
  listIncidentActions: vi.fn(),
  getSocSummary: vi.fn(),
  listAssets: vi.fn(),
  listAlerts: vi.fn(),
  listIncidents: vi.fn(),
  createReport: vi.fn(),
  notifyOwner: vi.fn(),
}));

vi.mock("./db", () => ({
  createAlert: mocks.createAlert,
  createIncident: mocks.createIncident,
  writeAuditLog: mocks.writeAuditLog,
  getIncidentById: mocks.getIncidentById,
  assignIncidentToActor: mocks.assignIncidentToActor,
  addIncidentComment: mocks.addIncidentComment,
  listIncidentActions: mocks.listIncidentActions,
  getSocSummary: mocks.getSocSummary,
  listAssets: mocks.listAssets,
  listAlerts: mocks.listAlerts,
  listIncidents: mocks.listIncidents,
  createReport: mocks.createReport,
}));

vi.mock("./_core/notification", () => ({ notifyOwner: mocks.notifyOwner }));
vi.mock("./routers/assistant", () => ({ assistantRouter: {} }));

import { socRouter } from "./routers/soc";

function analystContext(): TrpcContext {
  return {
    user: { id: 8, openId: "analyst-8", name: "Analyste", email: "analyst@example.test", loginMethod: "manus", role: "analyst", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function anonymousContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("mutations SOC sensibles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createAlert.mockImplementation(async input => ({ id: 11, ...input }));
    mocks.createIncident.mockImplementation(async input => ({ id: 22, ...input }));
    mocks.getIncidentById.mockResolvedValue({ id: 22, status: "open" });
    mocks.assignIncidentToActor.mockResolvedValue({ id: 22, assignedUserId: 8 });
    mocks.addIncidentComment.mockResolvedValue({ id: 4, comment: "Vérification engagée" });
    mocks.listIncidentActions.mockResolvedValue([{ action: { id: 1, actionType: "created", createdAt: new Date() }, actorName: "Analyste" }]);
    mocks.getSocSummary.mockResolvedValue({ metrics: { activeAlerts: 2 } });
    mocks.listAssets.mockResolvedValue([{ id: 1, name: "[Démo] API" }]);
    mocks.listAlerts.mockResolvedValue([{ alert: { id: 11, status: "open" } }]);
    mocks.listIncidents.mockResolvedValue([{ incident: { id: 22, status: "open" } }]);
    mocks.createReport.mockImplementation(async input => ({ id: 5, ...input }));
    mocks.notifyOwner.mockResolvedValue(true);
    mocks.writeAuditLog.mockResolvedValue(undefined);
  });

  it("notifie le propriétaire pour une alerte critique et pas pour une alerte moyenne", async () => {
    const caller = socRouter.createCaller(analystContext());
    await caller.alerts.create({ title: "Alerte critique", description: "Description de test suffisante.", category: "Authentification", severity: "critical", riskScore: 95, detectionMethod: "rule", confidence: 91 });
    expect(mocks.notifyOwner).toHaveBeenCalledTimes(1);
    expect(mocks.notifyOwner).toHaveBeenCalledWith(expect.objectContaining({ title: "Alerte SOC critique créée" }));

    await caller.alerts.create({ title: "Alerte moyenne", description: "Description de test suffisante.", category: "Réseau", severity: "medium", riskScore: 42, detectionMethod: "manual", confidence: 70 });
    expect(mocks.notifyOwner).toHaveBeenCalledTimes(1);
  });

  it("notifie le propriétaire pour un incident de sévérité élevée", async () => {
    const caller = socRouter.createCaller(analystContext());
    await caller.incidents.create({ title: "Incident de test", description: "Description de test suffisante.", severity: "high", riskScore: 82 });
    expect(mocks.notifyOwner).toHaveBeenCalledWith(expect.objectContaining({ title: "Incident SOC à haute sévérité créé" }));
  });

  it("conserve les opérations d’assignation, de commentaire et de génération de rapport", async () => {
    const caller = socRouter.createCaller(analystContext());
    await caller.incidents.assignSelf({ id: 22 });
    await caller.incidents.addComment({ incidentId: 22, comment: "Vérification engagée" });
    const report = await caller.reports.generatePosture();
    expect(mocks.assignIncidentToActor).toHaveBeenCalledWith({ incidentId: 22, actorUserId: 8 });
    expect(mocks.addIncidentComment).toHaveBeenCalledWith({ incidentId: 22, actorUserId: 8, comment: "Vérification engagée" });
    expect(mocks.createReport).toHaveBeenCalledTimes(1);
    expect(report).toMatchObject({ id: 5, reportType: "posture" });
  });

  it("refuse les procédures SOC sans session authentifiée", async () => {
    const caller = socRouter.createCaller(anonymousContext());
    await expect(caller.alerts.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(mocks.listAlerts).not.toHaveBeenCalled();
  });

  it("rejette les entrées hors contrat avant toute mutation", async () => {
    const caller = socRouter.createCaller(analystContext());
    await expect(caller.alerts.create({ title: "x", description: "court", category: "Réseau", severity: "invalid" as never, riskScore: 101, detectionMethod: "manual", confidence: -1 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.incidents.addComment({ incidentId: 22, comment: "" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mocks.createAlert).not.toHaveBeenCalled();
    expect(mocks.addIncidentComment).not.toHaveBeenCalled();
  });

  it("renvoie une erreur contrôlée pour un incident inexistant", async () => {
    mocks.getIncidentById.mockResolvedValueOnce(undefined);
    const caller = socRouter.createCaller(analystContext());
    await expect(caller.incidents.transition({ id: 9999, nextStatus: "in_progress" })).rejects.toThrow("Incident introuvable");
  });
});
