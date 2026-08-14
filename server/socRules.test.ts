import { describe, expect, it } from "vitest";
import { assertIncidentTransition, canAccessSoc, isValidIncidentTransition, requiresCriticalAlertOwnerNotification, requiresOwnerNotification } from "./socRules";

describe("règles métier SOC", () => {
  it("n’autorise que la séquence stricte du cycle de vie des incidents", () => {
    expect(isValidIncidentTransition("open", "in_progress")).toBe(true);
    expect(isValidIncidentTransition("in_progress", "resolved")).toBe(true);
    expect(isValidIncidentTransition("resolved", "closed")).toBe(true);
    expect(isValidIncidentTransition("open", "resolved")).toBe(false);
    expect(isValidIncidentTransition("closed", "open")).toBe(false);
    expect(() => assertIncidentTransition("open", "closed")).toThrow("Transition d’incident invalide");
  });

  it("reconnaît les rôles SOC et les seuils de notification", () => {
    expect(canAccessSoc("analyst")).toBe(true);
    expect(canAccessSoc("admin")).toBe(true);
    expect(requiresOwnerNotification("critical")).toBe(true);
    expect(requiresOwnerNotification("high")).toBe(true);
    expect(requiresOwnerNotification("medium")).toBe(false);
    expect(requiresCriticalAlertOwnerNotification("critical")).toBe(true);
    expect(requiresCriticalAlertOwnerNotification("high")).toBe(false);
  });
});
