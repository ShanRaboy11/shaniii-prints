'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

/**
 * AnimatedDotGrid
 * A canvas-rendered interactive dot matrix.
 *  - Default: an evenly-spaced grid of circular dots with a gentle, uniform
 *    pulse (subtle synchronized breathing of size + opacity).
 *  - Interaction: the cursor creates a circular repulsion zone — dots within
 *    the radius are pushed radially outward from the pointer (magnetic repel),
 *    easing smoothly back to their home position when the cursor leaves.
 *  - Hover glow: dots inside the cursor radius brighten and grow; in dark mode
 *    they radiate a bright neon halo for a vivid interactive effect.
 *
 * Used as the background matrix on the landing, login, and signup pages.
 */
export function AnimatedDotGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const SPACING = 46;        // distance between dots (open, balanced spacing)
    const BASE_RADIUS = 1.9;   // dot radius at rest (crisp, prominent)
    const REPEL_RADIUS = 170;  // cursor influence radius
    const REPEL_STRENGTH = 34; // max push distance in px
    const GLOW_RADIUS = 190;   // cursor glow influence radius

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let dots: { hx: number; hy: number; x: number; y: number }[] = [];

    // Pointer lives outside the viewport until the user moves in.
    const pointer = { x: -9999, y: -9999, active: false };

    function isDark() {
      return document.documentElement.classList.contains('dark');
    }

    function buildDots() {
      dots = [];
      // Offset so the grid is centered and edges look intentional.
      const cols = Math.ceil(width / SPACING) + 1;
      const rows = Math.ceil(height / SPACING) + 1;
      const offsetX = (width - (cols - 1) * SPACING) / 2;
      const offsetY = (height - (rows - 1) * SPACING) / 2;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const hx = offsetX + c * SPACING;
          const hy = offsetY + r * SPACING;
          dots.push({ hx, hy, x: hx, y: hy });
        }
      }
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.floor(width * dpr);
      canvas!.height = Math.floor(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildDots();
    }

    let raf = 0;
    let t = 0;

    function frame() {
      t += 0.016;
      ctx!.clearRect(0, 0, width, height);

      const dark = isDark();
      // light blue (primary) + light green (accent) tuned per theme
      const blue = dark ? '56, 189, 248' : '14, 165, 233';
      const green = dark ? '74, 222, 128' : '34, 197, 94';

      // Uniform pulse: shared sine so all dots breathe together.
      const pulse = (Math.sin(t * 1.1) + 1) / 2; // 0..1, gentle cadence
      const radius = BASE_RADIUS + pulse * 0.4;
      // Crisper, more prominent resting dots (higher base opacity than before).
      const baseAlpha = dark ? 0.22 + pulse * 0.14 : 0.20 + pulse * 0.12;

      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];

        // Repulsion from pointer
        let tx = d.hx;
        let ty = d.hy;
        if (pointer.active) {
          const dx = d.hx - pointer.x;
          const dy = d.hy - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist < REPEL_RADIUS && dist > 0.001) {
            const force = (1 - dist / REPEL_RADIUS); // 1 at center → 0 at edge
            const push = force * force * REPEL_STRENGTH;
            tx = d.hx + (dx / dist) * push;
            ty = d.hy + (dy / dist) * push;
          }
        }

        // Ease current position toward target (spring-back when cursor leaves)
        d.x += (tx - d.x) * 0.16;
        d.y += (ty - d.y) * 0.16;

        // Alternate blue / green in a checker so the matrix reads as two-tone
        const col = (i % 2 === 0) ? blue : green;

        // Interactive hover glow: dots within the cursor radius light up and,
        // in dark mode, radiate a bright neon halo (shadowBlur) alongside the
        // magnetic repulsion/expansion above.
        let alpha = baseAlpha;
        let rad = radius;
        let glow = 0;
        if (pointer.active) {
          const pd = Math.hypot(d.hx - pointer.x, d.hy - pointer.y);
          if (pd < GLOW_RADIUS) {
            const f = 1 - pd / GLOW_RADIUS; // 1 at cursor → 0 at edge
            const ease = f * f;
            alpha = Math.min(1, baseAlpha + ease * (dark ? 0.78 : 0.6));
            rad = radius + ease * (dark ? 2.4 : 1.6);
            glow = ease;
          }
        }

        ctx!.beginPath();
        ctx!.arc(d.x, d.y, rad, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${col}, ${alpha})`;
        if (glow > 0.02 && dark) {
          // Bright neon halo around dots near the cursor (dark mode only).
          ctx!.shadowBlur = 14 * glow;
          ctx!.shadowColor = `rgba(${col}, ${0.9 * glow})`;
        } else {
          ctx!.shadowBlur = 0;
        }
        ctx!.fill();
      }
      ctx!.shadowBlur = 0;

      raf = requestAnimationFrame(frame);
    }

    function onPointerMove(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
    }
    function onPointerLeave() {
      pointer.active = false;
      pointer.x = -9999;
      pointer.y = -9999;
    }

    resize();
    frame();

    window.addEventListener('resize', resize);
    // Listen on window so movement anywhere over the page repels the dots.
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerleave', onPointerLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [resolvedTheme]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {/* Soft radial vignette so the matrix recedes toward the edges.
          Lighter than before so the denser/brighter grid stays prominent. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(244,248,251,0.70)_88%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(5,7,14,0.78)_90%)]" />
    </div>
  );
}
