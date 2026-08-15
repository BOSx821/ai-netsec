import { AlertStatusBadge, RiskMeter, SeverityBadge } from "@/components/SocStatus";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

type AlertCardData = {
  id: number;
  title: string;
  category: string;
  createdAt: Date | string | number;
  severity: "critical" | "high" | "medium" | "low";
  status: "open" | "in_progress" | "resolved";
  riskScore: number;
};

export function SocAlertCard({ alert, assetName, onDetails, onStatusChange, disabled }: { alert: AlertCardData; assetName?: string | null; onDetails: () => void; onStatusChange: (status: AlertCardData["status"]) => void; disabled?: boolean }) {
  return <article className="soc-panel soc-alert-card"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2"><span className="soc-row-icon size-8 shrink-0"><AlertTriangle className="size-4" /></span><p className="font-medium leading-6 text-slate-100">{alert.title}</p></div><p className="mt-2 text-xs text-slate-500">{alert.category} · {new Date(alert.createdAt).toLocaleString("fr-FR")}</p></div><SeverityBadge severity={alert.severity} /></div><div className="mt-4 grid grid-cols-2 gap-3 border-y border-slate-800 py-3"><div><p className="soc-card-kicker">Actif</p><p className="mt-1 truncate text-sm text-slate-300">{assetName ?? "Non associé"}</p></div><div><p className="soc-card-kicker">Statut</p><div className="mt-1"><AlertStatusBadge status={alert.status} /></div></div></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><RiskMeter value={alert.riskScore} /><div className="flex flex-wrap items-center gap-2"><Button size="sm" variant="outline" className="soc-secondary-button" onClick={onDetails}>Détails</Button><select aria-label={`Statut de ${alert.title}`} className="soc-select !py-1.5 text-xs" value={alert.status} disabled={disabled} onChange={event => onStatusChange(event.target.value as AlertCardData["status"])}><option value="open">Ouverte</option><option value="in_progress">En cours</option><option value="resolved">Résolue</option></select></div></div></article>;
}
