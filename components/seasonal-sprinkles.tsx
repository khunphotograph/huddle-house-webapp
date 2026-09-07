'use client';

import { useMemo } from 'react';

type SprinkleTheme = 'sunflower' | 'christmas' | 'new-year' | 'valentine' | 'chinese-new-year' | 'songkran' | 'halloween' | 'loy-krathong';
type Sprinkle = { kind: SprinkleTheme; glyph?: string; left: number; delay: number; duration: number; drift: number; size: number; rotation: number };

function bangkokDate() {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Bangkok', year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(new Date());
  return { month: Number(parts.find((part) => part.type === 'month')?.value), day: Number(parts.find((part) => part.type === 'day')?.value) };
}

function themeForDate(month: number, day: number): SprinkleTheme {
  if (month === 12 && day >= 31) return 'new-year';
  if (month === 12 && day >= 20) return 'christmas';
  if (month === 1 && day === 1) return 'new-year';
  if (month === 2 && day === 14) return 'valentine';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 20)) return 'chinese-new-year';
  if (month === 4 && day >= 13 && day <= 15) return 'songkran';
  if (month === 10 && day === 31) return 'halloween';
  if (month === 11 && day >= 1 && day <= 30) return 'loy-krathong';
  return 'sunflower';
}

const glyphs: Record<Exclude<SprinkleTheme, 'sunflower'>, string[]> = {
  christmas: ['❄', '✦', '•'],
  'new-year': ['✦', '✺', '•'],
  valentine: ['♥', '♡', '✦'],
  'chinese-new-year': ['✦', '◇', '•'],
  songkran: ['✦', '•', '◦'],
  halloween: ['✦', '☾', '•'],
  'loy-krathong': ['✦', '☾', '•'],
};

function makeSprinkles(theme: SprinkleTheme): Sprinkle[] {
  return Array.from({ length: 7 }, (_, index) => ({
    kind: theme,
    glyph: theme === 'sunflower' ? undefined : glyphs[theme][index % glyphs[theme].length],
    left: (index * 47 + 9) % 101,
    delay: -((index * 3.6) % 22),
    duration: 17 + (index % 6) * 1.6,
    drift: ((index % 5) - 2) * 42,
    size: theme === 'sunflower' ? 8 + (index % 3) * 1 : 9 + (index % 3) * 1,
    rotation: (index * 29) % 360,
  }));
}

export function SeasonalSprinkles() {
  const theme = useMemo(() => {
    const { month, day } = bangkokDate();
    return themeForDate(month, day);
  }, []);
  const sprinkles = useMemo(() => makeSprinkles(theme), [theme]);

  return <div className="sprinkle-layer" aria-hidden="true" data-sprinkle-theme={theme}>
    {sprinkles.map((sprinkle, index) => <span
      key={`${theme}-${index}`}
      className={`sprinkle sprinkle-${theme} ${sprinkle.glyph ? 'sprinkle-glyph' : ''}`}
      style={{
        left: `${sprinkle.left}%`,
        animationDelay: `${sprinkle.delay}s`,
        animationDuration: `${sprinkle.duration}s`,
        ['--sprinkle-drift' as string]: `${sprinkle.drift}px`,
        ['--sprinkle-size' as string]: `${sprinkle.size}px`,
        ['--sprinkle-rotation' as string]: `${sprinkle.rotation}deg`,
      }}
    >{sprinkle.glyph ?? <><i className="sprinkle-petal" /><i className="sprinkle-petal" /><i className="sprinkle-petal" /><i className="sprinkle-petal" /><i className="sprinkle-petal" /><i className="sprinkle-petal" /><i className="sprinkle-petal" /><i className="sprinkle-petal" /><i className="sprinkle-center" /></>}</span>)}
  </div>;
}
