'use client';

import { useMemo } from 'react';

/**
 * AnimatedDotGrid
 * A dot-matrix background: an evenly-spaced grid of circular dots (not lines)
 * with layered pulsing + slow drifting movement, plus a scattered set of
 * brighter "twinkle" dots for depth. Purely presentational — no logic/state.
 */
export function AnimatedDotGrid() {
  // A scattered set of brighter accent dots that twinkle at random intervals.
  const twinkles = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        id: i,
        top: Math.round((Math.sin(i * 12.9898) * 43758.5453 % 1 + 1) % 1 * 100),
        left: Math.round((Math.cos(i * 78.233) * 12543.1234 % 1 + 1) % 1 * 100),
        delay: (i % 10) * 0.45,
        duration: 2.8 + (i % 5) * 0.7,
        accent: i % 2 === 0,
      })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
      {/* Base matrix: evenly-spaced circle dots, gentle pulse via opacity */}
      <div
        className="absolute inset-0 animate-[dotPulse_5s_ease-in-out_infinite]"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(14,165,233,0.45) 1.6px, transparent 1.8px)',
          backgroundSize: '30px 30px',
        }}
      />

      {/* Second matrix layer: light green, offset + slow drift for parallax depth */}
      <div
        className="absolute inset-0 opacity-70 animate-[dotDrift_22s_linear_infinite]"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(34,197,94,0.30) 1.4px, transparent 1.6px)',
          backgroundSize: '30px 30px',
          backgroundPosition: '15px 15px',
        }}
      />

      {/* Scattered brighter twinkle dots */}
      {twinkles.map((t) => (
        <span
          key={t.id}
          className={`absolute w-1.5 h-1.5 rounded-full ${
            t.accent
              ? 'bg-accent-400/80 dark:bg-accent-300/80'
              : 'bg-primary-400/80 dark:bg-primary-300/80'
          }`}
          style={{
            top: `${t.top}%`,
            left: `${t.left}%`,
            animation: `dotPulse ${t.duration}s ease-in-out ${t.delay}s infinite`,
          }}
        />
      ))}

      {/* Soft radial vignette so the matrix recedes toward the edges */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(244,248,251,0.85)_78%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(7,11,20,0.9)_78%)]" />
    </div>
  );
}
