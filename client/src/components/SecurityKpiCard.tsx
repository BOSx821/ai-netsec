import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type KpiTone = "critical" | "high" | "info" | "success";

const toneClasses: Record<KpiTone, string> = {
  critical: "border-rose-400/20 bg-rose-400/[0.06] text-rose-200",
  high: "border-orange-400/20 bg-orange-400/[0.06] text-orange-200",
  info: "border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-100",
  success: "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-100",
};

export function SecurityKpiCard({ icon: Icon, label, value, detail, tone, progress }: { icon: LucideIcon; label: string; value: string | number; detail: string; tone: KpiTone; progress?: number }) {
  const safeProgress = progress === undefined ? undefined : Math.max(0, Math.min(100, progress));
  const circumference = 2 * Math.PI * 15.5;
  const offset = safeProgress === undefined ? circumference * 0.25 : circumference * (1 - safeProgress / 100);

  return <article className="soc-panel soc-kpi-card"><div className="soc-kpi-layout"><span className={cn("soc-kpi-icon", toneClasses[tone])}><Icon className="size-4" aria-hidden="true" /></span><span className={cn("soc-kpi-ring", `soc-kpi-ring--${tone}`)} aria-label={safeProgress === undefined ? "Indicateur de statut" : `Progression : ${safeProgress}%`}><svg viewBox="0 0 40 40" aria-hidden="true"><circle className="soc-kpi-ring-track" cx="20" cy="20" r="15.5" /><circle className="soc-kpi-ring-value" cx="20" cy="20" r="15.5" strokeDasharray={circumference} strokeDashoffset={offset} /></svg></span><div className="soc-kpi-content"><p>{value}</p><span>{label}</span><small>{detail}</small></div></div></article>;
}
