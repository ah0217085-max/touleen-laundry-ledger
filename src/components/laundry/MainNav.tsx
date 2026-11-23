import { Link } from "@tanstack/react-router";
import { NAV_ICONS } from "./icons";

const NAV = [
  { to: "/", label: "السجاد والحرامات", icon: NAV_ICONS.inventory },
  { to: "/tailoring", label: "التصليح والخياطة", icon: NAV_ICONS.tailoring },
  { to: "/washing", label: "الغسيل", icon: NAV_ICONS.washing },
  { to: "/fourth", label: "الكوي", icon: NAV_ICONS.fourth },
  { to: "/stats", label: "الإحصائيات", icon: NAV_ICONS.stats },
] as const;

/** The 5 main buttons: floating bottom bar on phones, inline bar on wider screens. */
export function MainNav() {
  return (
    <nav
      aria-label="الأقسام"
      className="glass-strong fixed inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-40 grid grid-cols-5 gap-1 rounded-3xl p-1.5 md:static md:mt-3"
    >
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          activeOptions={{ exact: true }}
          className="group flex min-h-15 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-center text-[11px] font-bold leading-tight text-muted-foreground transition-all duration-300 hover:bg-accent/70 hover:text-accent-foreground data-[status=active]:bg-brand data-[status=active]:shadow-glow md:min-h-12 md:flex-row md:gap-2 md:text-sm"
        >
          <Icon className="size-5.5 shrink-0 transition-transform duration-300 group-data-[status=active]:scale-110" strokeWidth={2.2} />
          <span className="text-balance">{label}</span>
        </Link>
      ))}
    </nav>
  );
}
