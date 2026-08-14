import { cn } from "@/lib/utils";

const severityClasses = {
  critical: "border-rose-400/20 bg-rose-400/10 text-rose-200",
  high: "border-orange-400/20 bg-orange-400/10 text-orange-200",
  medium: "border-amber-300/20 bg-amber-300/10 text-amber-100",
  low: "border-cyan-300/20 bg-cyan-300/10 text-cyan-100",
};

const severityLabels = { critical: "Critique", high: "Élevée", medium: "Moyenne", low: "Faible" };

const alertStatusLabels = { open: "Ouverte", in_progress: "En cours", resolved: "Résolue" };
const incidentStatusLabels = { open: "Ouvert", in_progress: "En cours", resolved: "Résolu", closed: "Fermé" };

export function SeverityBadge({ severity }: { severity: keyof typeof severityClasses }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold", severityClasses[severity])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {severityLabels[severity]}
    </span>
  );
}

export function AlertStatusBadge({ status }: { status: keyof typeof alertStatusLabels }) {
  const className = status === "resolved" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : "border-slate-600 bg-slate-800 text-slate-200";
  return <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-medium", className)}>{alertStatusLabels[status]}</span>;
}

export function IncidentStatusBadge({ status }: { status: keyof typeof incidentStatusLabels }) {
  const className = status === "closed" ? "border-slate-600 bg-slate-800 text-slate-300" : status === "resolved" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : "border-cyan-400/20 bg-cyan-400/10 text-cyan-100";
  return <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-medium", className)}>{incidentStatusLabels[status]}</span>;
}

export function RiskMeter({ value }: { value: number }) {
  const color = value >= 80 ? "bg-rose-400" : value >= 60 ? "bg-orange-400" : value >= 35 ? "bg-amber-300" : "bg-cyan-400";
  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-800">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${Math.max(4, Math.min(value, 100))}%` }} />
      </div>
      <span className="font-mono text-xs text-slate-300">{value}/100</span>
    </div>
  );
}
