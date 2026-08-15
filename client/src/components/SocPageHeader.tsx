import type { ReactNode } from "react";

type SocPageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

export function SocPageHeader({ eyebrow, title, description, actions }: SocPageHeaderProps) {
  return (
    <header className="soc-page-header">
      <div className="max-w-3xl">
        <p className="soc-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="soc-page-description">{description}</p>
      </div>
      {actions ? <div className="soc-page-actions">{actions}</div> : null}
    </header>
  );
}
