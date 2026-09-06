'use client';

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

interface RollingNumberProps {
  /** The numeric value to display. */
  value: number;
  /** Optional prefix rendered before the digits (e.g. "₱"). */
  prefix?: string;
  className?: string;
}

/**
 * DigitReel
 * A single digit slot rendered as a vertical 0–9 reel. The reel is translated
 * to the active digit and the CSS transition animates the move, so increasing
 * the digit rolls the reel UP and decreasing rolls it DOWN. The element is
 * keyed by its POSITION (not its value) by the parent, so it persists across
 * value changes and the transform actually transitions instead of snapping.
 */
function DigitReel({ digit }: { digit: number }) {
  return (
    <span
      className="relative inline-block overflow-hidden tabular-nums"
      style={{ height: '1em', width: '0.6em', verticalAlign: 'baseline' }}
      aria-hidden
    >
      <span
        className="absolute inset-x-0 top-0 flex flex-col items-center"
        style={{
          transform: `translateY(-${digit}em)`,
          transition: 'transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
          willChange: 'transform',
        }}
      >
        {DIGITS.map((d) => (
          <span key={d} className="flex items-center justify-center leading-none" style={{ height: '1em' }}>
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

/**
 * RollingNumber
 * An odometer / slot-machine style number display. When the value changes each
 * digit reel rolls vertically to its new position — reels move UP as the value
 * increases and DOWN as it decreases — giving crisp tactile feedback during
 * rapid stepper / dropdown adjustments. Non-digit characters (₱, commas)
 * render statically.
 */
export function RollingNumber({ value, prefix = '', className = '' }: RollingNumberProps) {
  const safe = Number.isFinite(value) ? Math.trunc(value) : 0;
  const negative = safe < 0;
  const text = Math.abs(safe).toLocaleString('en-US');
  const chars = text.split('');

  // Key digit slots by their position counted FROM THE RIGHT, so a slot always
  // represents the same place value (ones, tens, …) even when the total number
  // of digits changes. This keeps each reel mounted so the transform animates.
  const digitPositions: number[] = [];
  let placeFromRight = chars.filter((c) => c >= '0' && c <= '9').length - 1;

  return (
    <span
      className={`inline-flex items-baseline leading-none ${className}`}
      aria-label={`${prefix}${negative ? '-' : ''}${text}`}
    >
      {prefix && <span className="tabular-nums mr-[0.05em]">{prefix}</span>}
      {negative && <span className="tabular-nums">-</span>}
      {chars.map((ch, i) => {
        const isDigit = ch >= '0' && ch <= '9';
        if (!isDigit) {
          return <span key={`sep-${i}`} className="tabular-nums">{ch}</span>;
        }
        const place = placeFromRight--;
        digitPositions.push(place);
        return <DigitReel key={`place-${place}`} digit={Number(ch)} />;
      })}
    </span>
  );
}
