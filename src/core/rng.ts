export type Rng = () => number;

// Mulberry32: https://github.com/bryc/code/blob/master/jshash/PRNGs.md#mulberry32
export function mulberry32(seed: number): Rng {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), state | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

// FNV-1a-style hash over UTF-16 code units, without Unicode normalization.
export function hash(text: string): number {
  let value = 0x811c9dc5;

  for (let index = 0; index < text.length; index++) {
    value = Math.imul(value ^ text.charCodeAt(index), 0x01000193);
  }

  return value >>> 0;
}
