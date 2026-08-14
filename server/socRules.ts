export const incidentStatuses = ["open", "in_progress", "resolved", "closed"] as const;
export type IncidentStatus = (typeof incidentStatuses)[number];

const incidentTransitions: Record<IncidentStatus, readonly IncidentStatus[]> = {
  open: ["in_progress"],
  in_progress: ["resolved"],
  resolved: ["closed"],
  closed: [],
};

export function isValidIncidentTransition(current: IncidentStatus, next: IncidentStatus): boolean {
  return incidentTransitions[current].includes(next);
}

export function assertIncidentTransition(current: IncidentStatus, next: IncidentStatus): void {
  if (!isValidIncidentTransition(current, next)) {
    throw new Error(`Transition d’incident invalide : ${current} → ${next}.`);
  }
}

export function canAccessSoc(role: "analyst" | "admin"): boolean {
  return role === "analyst" || role === "admin";
}

export function requiresOwnerNotification(severity: "critical" | "high" | "medium" | "low"): boolean {
  return severity === "critical" || severity === "high";
}

export function requiresCriticalAlertOwnerNotification(severity: "critical" | "high" | "medium" | "low"): boolean {
  return severity === "critical";
}
