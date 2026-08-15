import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type KpiTone = "critical" | "high" | "info" | "success";

const toneClasses: Record<KpiTone, string> = {
  critical: "border-rose-400/20 bg-rose-400/[0.06] text-rose-200",
  high: "border-orange-400/20 bg-orange-400/[0.06] text-orange-200",
  info: "border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-100",
  success: "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-100",
};

export function SecurityKpiCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  detail: string;
  tone: KpiTone;
}) {
  return (
    <article className="soc-panel soc-kpi-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-50 tabular-nums">{value}</p>
          <p className="mt-2 text-xs leading-5 text-slate-400">{detail}</p>
        </div>
        <div className={cn("grid size-11 shrink-0 place-items-center rounded-xl border", toneClasses[tone])}>
          <Icon className="size-5" aria-hidden="true" />
        </div>
      </div>
    </article>
  );
}
