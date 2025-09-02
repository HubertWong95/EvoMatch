// Server-side similarity (start simple; replace with embedding later)
export function isAnswerSimilar(a: string, b: string) {
  const na = a.toLowerCase().trim();
  const nb = b.toLowerCase().trim();
  if (na === nb) return true;
  // loose contain / synonym heuristics
  return na.includes(nb) || nb.includes(na);
}
