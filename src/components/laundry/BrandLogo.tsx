import { cn } from "@/lib/utils";

interface Props {
  size?: "md" | "lg";
  className?: string;
}

/** Bespoke inline SVG emblem for مصبغة تولين: sleek hanger, fabric waves & freshness sparkles. */
export function BrandLogo({ size = "md", className }: Props) {
  const isLg = size === "lg";
  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden bg-brand text-primary-foreground ring-1 ring-pearl/60 shadow-glow",
        isLg ? "size-18 rounded-[1.35rem]" : "size-13 rounded-2xl sm:size-14",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-5 -right-5 size-12 rounded-full bg-aqua-mint/35 blur-md"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-4 inset-x-0 h-8 rounded-[50%] bg-primary-glow/55 blur-md"
      />
      <svg
        viewBox="0 0 56 56"
        className={cn("relative z-10", isLg ? "size-13" : "size-10 sm:size-11")}
        fill="none"
        aria-hidden="true"
      >
        {/* Freshness sparkle stars */}
        <path
          d="M42.5 9.5l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9.9-2.4Z"
          fill="currentColor"
          fillOpacity="0.92"
        />
        <path
          d="M14 14l.6 1.5 1.5.6-1.5.6-.6 1.5-.6-1.5-1.5-.6 1.5-.6.6-1.5Z"
          fill="currentColor"
          fillOpacity="0.72"
        />
        {/* Cleanliness bubble */}
        <circle
          cx="38.5"
          cy="18.5"
          r="2"
          stroke="currentColor"
          strokeOpacity="0.65"
          strokeWidth="1.4"
        />

        {/* Sleek garment hanger hook & frame */}
        <path
          d="M24.6 13.5a3.5 3.5 0 1 1 5.1 3.1c-1.1.6-1.7 1.4-1.7 2.6v1.5"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M28 20.7 11.4 31.3a2 2 0 0 0 1.1 3.7h31a2 2 0 0 0 1.1-3.7Z"
          fill="currentColor"
          fillOpacity="0.2"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Crisp draped fabric & freshness waves */}
        <path
          d="M9 41.2c3.2-2.6 6.3-2.6 9.5 0s6.3 2.6 9.5 0 6.3-2.6 9.5 0 6.3 2.6 9.5 0"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M14 46.5c2.6-1.9 5-1.9 7.5 0s5 1.9 7.5 0 5-1.9 7.5 0 5 1.9 7.5 0"
          stroke="currentColor"
          strokeOpacity="0.65"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
