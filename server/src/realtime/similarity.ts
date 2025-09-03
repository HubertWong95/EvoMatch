// server/src/realtime/similarity.ts

/**
 * Lightweight text similarity for answers.
 * - lowercases
 * - strips punctuation
 * - tokenizes words
 * - computes Jaccard similarity over word sets
 */
function normalize(s: string): string[] {
  return (s || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ") // remove punctuation (unicode-safe)
    .split(/\s+/)
    .filter(Boolean);
}

function jaccard(a: Set<string>, b: Set<string>): number {
  const inter = new Set<string>();
  for (const t of a) if (b.has(t)) inter.add(t);
  const unionSize = a.size + b.size - inter.size;
  return unionSize === 0 ? 0 : inter.size / unionSize;
}

/**
 * Returns true if two short answers are "similar enough".
 * Tweak THRESHOLD to be stricter/looser.
 */
export function isSimilar(a: string, b: string, THRESHOLD = 0.5): boolean {
  const A = new Set(normalize(a));
  const B = new Set(normalize(b));
  const score = jaccard(A, B);
  return score >= THRESHOLD;
}
