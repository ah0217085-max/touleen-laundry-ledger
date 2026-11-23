/** Fixed decorative wavy pink layers behind every screen. */
export function WaveBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-24 -right-20 size-72 rounded-full bg-wave-2/50 blur-3xl" />
      <div className="absolute top-1/3 -left-24 size-80 rounded-full bg-wave-1/70 blur-3xl" />
      <div className="absolute bottom-10 right-1/4 size-64 rounded-full bg-primary-glow/20 blur-3xl" />

      <svg
        className="wave-drift absolute -top-2 left-0 h-40 w-[130%] md:h-56"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        <path
          className="fill-wave-2/60"
          d="M0,128L60,138.7C120,149,240,171,360,170.7C480,171,600,149,720,122.7C840,96,960,64,1080,74.7C1200,85,1320,139,1380,165.3L1440,192L1440,0L0,0Z"
        />
      </svg>
      <svg
        className="wave-drift-slow absolute -top-4 left-0 h-28 w-[130%] md:h-40"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        <path
          className="fill-wave-3/35"
          d="M0,64L80,90.7C160,117,320,171,480,170.7C640,171,800,117,960,106.7C1120,96,1280,128,1360,144L1440,160L1440,0L0,0Z"
        />
      </svg>

      <svg
        className="wave-drift-slow absolute -bottom-2 left-0 h-44 w-[130%] md:h-60"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        <path
          className="fill-wave-1"
          d="M0,224L80,208C160,192,320,160,480,165.3C640,171,800,213,960,229.3C1120,245,1280,235,1360,229.3L1440,224L1440,320L0,320Z"
        />
      </svg>
      <svg
        className="wave-drift absolute -bottom-2 left-0 h-32 w-[130%] md:h-44"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        <path
          className="fill-wave-2/45"
          d="M0,256L60,240C120,224,240,192,360,197.3C480,203,600,245,720,256C840,267,960,245,1080,224C1200,203,1320,181,1380,170.7L1440,160L1440,320L0,320Z"
        />
      </svg>
    </div>
  );
}
