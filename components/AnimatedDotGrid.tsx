'use client';

/**
 * AnimatedDotGrid
 * A transparent, decorative background of subtle pulsing/drifting circle dots
 * arranged in a grid pattern. Purely presentational — no logic, no state
 * that affects the rest of the app. Safe to drop into any relative/absolute
 * positioned container.
 */
export function AnimatedDotGrid() {
  // Pre-computed grid of dots with varied delay/duration for organic pulsing.
  const dots = Array.from({ length: 64 }, (_, i) => {
    const col = i % 8;
    const row = Math.floor(i / 8);
    const delay = ((col * 7 + row * 3) % 20) / 4; // 0 - 5s
    const duration = 3.5 + ((col + row) % 4) * 0.6; // 3.5 - 5.9s
    return { id: i, col, row, delay, duration };
  });

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
      {/* Slowly drifting grid layer */}
      <div
        className="absolute inset-0 opacity-[0.35] dark:opacity-[0.5]"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(14,165,233,0.35) 1.5px, transparent 1.5px)',
          backgroundSize: '32px 32px',
          animation: 'dotDrift 18s linear infinite',
        }}
      />

      {/* Foreground pulsing dots grid */}
      <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
        {dots.map((d) => (
          <div key={d.id} className="relative flex items-center justify-center">
            <span
              className={`block w-1.5 h-1.5 rounded-full ${
                d.id % 3 === 0
                  ? 'bg-primary-400/70 dark:bg-primary-300/70'
                  : 'bg-accent-400/60 dark:bg-accent-300/60'
              }`}
              style={{
                animation: `dotPulse ${d.duration}s ease-in-out ${d.delay}s infinite`,
              }}
            />
          </div>
        ))}
      </div>

      {/* Soft radial fade so the grid recedes toward the edges */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(244,248,251,0.9)_75%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(7,11,20,0.92)_75%)]" />
    </div>
  );
}
