/** Fixed decorative freshness & cleanliness waves + soft bubbles behind every screen. */
export function WaveBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Ambient cleanliness glows: rose, lavender-mist, and aqua-mint */}
      <div className="absolute -top-24 -right-20 size-72 rounded-full bg-wave-2/45 blur-3xl" />
      <div className="absolute top-1/4 -left-24 size-80 rounded-full bg-lavender-mist/90 blur-3xl" />
      <div className="absolute top-1/2 right-1/4 size-64 rounded-full bg-aqua-mint/25 blur-3xl" />
      <div className="absolute bottom-8 left-1/3 size-72 rounded-full bg-pearl/70 blur-3xl" />

      {/* Top silk & water-ripple fabric waves */}
      <svg
        className="wave-drift absolute -top-2 left-0 h-40 w-[130%] md:h-56"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        <path
          className="fill-wave-2/45"
          d="M0,128L60,138.7C120,149,240,171,360,170.7C480,171,600,149,720,122.7C840,96,960,64,1080,74.7C1200,85,1320,139,1380,165.3L1440,192L1440,0L0,0Z"
        />
      </svg>
      <svg
        className="wave-drift-slow absolute -top-4 left-0 h-28 w-[130%] md:h-40"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        <path
          className="fill-wave-3/25"
          d="M0,64L80,90.7C160,117,320,171,480,170.7C640,171,800,117,960,106.7C1120,96,1280,128,1360,144L1440,160L1440,0L0,0Z"
        />
      </svg>

      {/* Subtle soap bubbles & freshness accents */}
      <svg
        className="absolute inset-0 h-full w-full opacity-55"
        viewBox="0 0 400 800"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <circle
          cx="54"
          cy="146"
          r="14"
          className="fill-pearl/60 stroke-aqua-mint/70"
          strokeWidth="1.2"
        />
        <path
          d="M47 139a9 9 0 0 1 8-3"
          className="stroke-pearl"
          strokeWidth="1.6"
          strokeLinecap="round"
        />

        <circle
          cx="342"
          cy="198"
          r="10"
          className="fill-pearl/55 stroke-lavender-mist"
          strokeWidth="1.2"
        />
        <circle
          cx="326"
          cy="222"
          r="5"
          className="fill-aqua-mint/35 stroke-pearl"
          strokeWidth="1"
        />

        <circle
          cx="72"
          cy="480"
          r="8"
          className="fill-pearl/50 stroke-aqua-mint/50"
          strokeWidth="1"
        />
        <circle
          cx="336"
          cy="610"
          r="16"
          className="fill-pearl/55 stroke-wave-2/60"
          strokeWidth="1.2"
        />
        <path
          d="M328 601a10 10 0 0 1 9-3"
          className="stroke-pearl"
          strokeWidth="1.6"
          strokeLinecap="round"
        />

        <circle cx="96" cy="672" r="6" className="fill-aqua-mint/30 stroke-pearl" strokeWidth="1" />
      </svg>

      {/* Bottom crisp folded-linen waves */}
      <svg
        className="wave-drift-slow absolute -bottom-2 left-0 h-44 w-[130%] md:h-60"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        <path
          className="fill-wave-1/85"
          d="M0,224L80,208C160,192,320,160,480,165.3C640,171,800,213,960,229.3C1120,245,1280,235,1360,229.3L1440,224L1440,320L0,320Z"
        />
      </svg>
      <svg
        className="wave-drift absolute -bottom-2 left-0 h-32 w-[130%] md:h-44"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        <path
          className="fill-aqua-mint/20"
          d="M0,256L60,240C120,224,240,192,360,197.3C480,203,600,245,720,256C840,267,960,245,1080,224C1200,203,1320,181,1380,170.7L1440,160L1440,320L0,320Z"
        />
      </svg>
    </div>
  );
}
