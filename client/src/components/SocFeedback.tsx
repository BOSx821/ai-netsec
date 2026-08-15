import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { AlertCircle, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

export function SocLoadingState({ label, className }: { label: string; className?: string }) {
  return <div className={cn("soc-feedback-state", className)} role="status"><Loader2 className="size-5 animate-spin text-cyan-300" aria-hidden="true" /><p>{label}</p></div>;
}

export function SocErrorState({ title = "Les données ne sont pas disponibles", description, className }: { title?: string; description: string; className?: string }) {
  return <div className={cn("soc-feedback-state soc-feedback-error", className)} role="alert"><AlertCircle className="size-5" aria-hidden="true" /><div><p className="font-medium text-rose-100">{title}</p><p>{description}</p></div></div>;
}

export function SocEmptyState({ icon: Icon, title, description, className, children }: { icon: LucideIcon; title: string; description: string; className?: string; children?: ReactNode }) {
  return <div className={cn("soc-feedback-state soc-feedback-empty", className)}><span className="soc-feedback-icon"><Icon className="size-5" aria-hidden="true" /></span><div><p className="font-medium text-slate-200">{title}</p><p>{description}</p>{children ? <div className="mt-3">{children}</div> : null}</div></div>;
}
