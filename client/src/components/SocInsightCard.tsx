import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

const toneClasses = {
  info: "border-cyan-400/18 bg-cyan-400/[0.045] text-cyan-200",
  safe: "border-emerald-400/18 bg-emerald-400/[0.045] text-emerald-200",
  warning: "border-amber-300/18 bg-amber-300/[0.045] text-amber-100",
};

export function SocInsightCard({ icon: Icon, eyebrow, title, description, tone = "info", className, children }: { icon: LucideIcon; eyebrow?: string; title: string; description: string; tone?: keyof typeof toneClasses; className?: string; children?: ReactNode }) {
  return <article className={cn("soc-panel soc-insight-card", className)}><span className={cn("soc-insight-icon", toneClasses[tone])}><Icon className="size-4" aria-hidden="true" /></span>{eyebrow ? <p className="soc-card-kicker mt-4">{eyebrow}</p> : null}<h2>{title}</h2><p>{description}</p>{children ? <div className="mt-4">{children}</div> : null}</article>;
}
