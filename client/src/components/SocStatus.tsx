import { cn } from "@/lib/utils";
import { getRiskProgressLabel, securitySeverityMeta, type SecuritySeverity } from "@/lib/security-ui";
import { CheckCircle2, CircleDot, CircleGauge, CircleX, Clock3, ShieldAlert } from "lucide-react";

const severityClasses: Record<SecuritySeverity, string> = {
  critical: "border-rose-400/25 bg-rose-400/10 text-rose-100",
  high: "border-orange-400/25 bg-orange-400/10 text-orange-100",
  medium: "border-amber-300/25 bg-amber-300/10 text-amber-100",
  low: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100",
};

const alertStatusLabels = { open: "Ouverte", in_progress: "En cours", resolved: "Résolue" };
const incidentStatusLabels = { open: "Ouvert", in_progress: "En cours", resolved: "Résolu", closed: "Fermé" };

export function SeverityBadge({ severity }: { severity: SecuritySeverity }) {
  const meta = securitySeverityMeta[severity];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold", severityClasses[severity])} aria-label={meta.iconLabel}>
      <ShieldAlert className="size-3.5" aria-hidden="true" />
      {meta.label}
    </span>
  );
}

export function AlertStatusBadge({ status }: { status: keyof typeof alertStatusLabels }) {
  const style = status === "resolved"
    ? { className: "border-emerald-400/25 bg-emerald-400/10 text-emerald-100", icon: CheckCircle2 }
    : status === "in_progress"
      ? { className: "border-cyan-400/25 bg-cyan-400/10 text-cyan-100", icon: Clock3 }
      : { className: "border-slate-600 bg-slate-800/90 text-slate-200", icon: CircleDot };
  const Icon = style.icon;
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium", style.className)}><Icon className="size-3.5" aria-hidden="true" />{alertStatusLabels[status]}</span>;
}

export function IncidentStatusBadge({ status }: { status: keyof typeof incidentStatusLabels }) {
  const style = status === "closed"
    ? { className: "border-slate-600 bg-slate-800 text-slate-300", icon: CircleX }
    : status === "resolved"
      ? { className: "border-emerald-400/25 bg-emerald-400/10 text-emerald-100", icon: CheckCircle2 }
      : status === "in_progress"
        ? { className: "border-cyan-400/25 bg-cyan-400/10 text-cyan-100", icon: Clock3 }
        : { className: "border-slate-600 bg-slate-800/90 text-slate-200", icon: CircleDot };
  const Icon = style.icon;
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium", style.className)}><Icon className="size-3.5" aria-hidden="true" />{incidentStatusLabels[status]}</span>;
}

export function RiskMeter({ value }: { value: number }) {
  const normalized = Math.max(0, Math.min(value, 100));
  const color = normalized >= 80 ? "bg-rose-400" : normalized >= 60 ? "bg-orange-400" : normalized >= 35 ? "bg-amber-300" : "bg-cyan-400";
  return (
    <div className="flex items-center gap-2.5" aria-label={`Score de risque : ${getRiskProgressLabel(normalized)}`}>
      <CircleGauge className="size-3.5 text-slate-500" aria-hidden="true" />
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-800" aria-hidden="true">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${Math.max(4, normalized)}%` }} />
      </div>
      <span className="font-mono text-xs text-slate-300">{normalized}/100</span>
    </div>
  );
}
