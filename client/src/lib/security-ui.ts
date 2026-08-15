export type SecuritySeverity = "critical" | "high" | "medium" | "low";

export const securitySeverityMeta: Record<SecuritySeverity, { label: string; iconLabel: string }> = {
  critical: { label: "Critique", iconLabel: "Priorité critique" },
  high: { label: "Élevée", iconLabel: "Priorité élevée" },
  medium: { label: "Moyenne", iconLabel: "Priorité moyenne" },
  low: { label: "Faible", iconLabel: "Priorité faible" },
};

export function getRiskPresentation(score?: number) {
  if (score === undefined || Number.isNaN(score)) {
    return { label: "Évaluation en attente", shortLabel: "En attente", tone: "neutral" as const, description: "Les données de risque seront disponibles après la première synchronisation." };
  }

  if (score >= 80) return { label: "Niveau de menace critique", shortLabel: "Critique", tone: "critical" as const, description: "Une qualification ou une mesure de confinement est requise sans délai." };
  if (score >= 60) return { label: "Niveau de menace élevé", shortLabel: "Élevé", tone: "high" as const, description: "Des signaux prioritaires nécessitent une investigation active." };
  if (score >= 35) return { label: "Niveau de menace modéré", shortLabel: "Modéré", tone: "medium" as const, description: "La posture doit rester sous surveillance et être réévaluée." };
  return { label: "Niveau de menace maîtrisé", shortLabel: "Maîtrisé", tone: "low" as const, description: "Aucun signal de risque élevé n’est actuellement consolidé." };
}

export function getRiskProgressLabel(score: number) {
  const normalized = Math.max(0, Math.min(score, 100));
  return `${normalized} sur 100`;
}
