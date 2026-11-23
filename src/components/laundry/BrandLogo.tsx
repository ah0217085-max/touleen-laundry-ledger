import { cn } from "@/lib/utils";

/** Hanger + wave mark for مصبغة تولين. */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative grid size-13 shrink-0 place-items-center overflow-hidden rounded-2xl bg-brand shadow-glow",
        className,
      )}
    >
      <svg
        viewBox="0 0 48 48"
        className="relative z-10 size-10"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 12.5a3.2 3.2 0 1 1 4.6 2.9c-1 .5-1.6 1.3-1.6 2.4V19" />
        <path
          d="M24 19 9.8 28.6a1.8 1.8 0 0 0 1 3.3h26.4a1.8 1.8 0 0 0 1-3.3Z"
          fill="currentColor"
          fillOpacity={0.2}
        />
        <path d="M8 38.5c2.7-2.4 5.3-2.4 8 0s5.3 2.4 8 0 5.3-2.4 8 0 5.3 2.4 8 0" strokeWidth={2} />
      </svg>
      <span className="absolute -bottom-4 inset-x-0 h-8 rounded-[50%] bg-primary-glow/50 blur-md" />
    </span>
  );
}
