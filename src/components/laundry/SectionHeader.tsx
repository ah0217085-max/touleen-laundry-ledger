import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  actions?: ReactNode;
}

export function SectionHeader({ title, subtitle, icon, actions }: Props) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <span className="glass grid size-12 shrink-0 place-items-center rounded-2xl text-primary [&_svg]:size-6">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-xl font-extrabold text-foreground">{title}</h2>
        {subtitle && <p className="text-sm font-medium text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex w-full items-center gap-2 sm:w-auto">{actions}</div>}
    </div>
  );
}
