import { ReactNode } from "react";

type SocPageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

export function SocPageHeader({ eyebrow, title, description, actions }: SocPageHeaderProps) {
  return (
    <header className="flex flex-col gap-5 border-b border-slate-800/80 pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-400">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-50">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div> : null}
    </header>
  );
}
