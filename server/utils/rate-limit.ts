/**
 * Limiet per sleutel (meestal een IP) voor publieke formulieren. In het
 * geheugen van de instantie: genoeg om een script af te remmen, zonder een
 * tabel voor een formulier.
 */
export function createRateLimiter({ windowMs, max }: { windowMs: number; max: number }) {
  /** Sleutel → tijdstippen van recente aanvragen. */
  const recent = new Map<string, number[]>();

  return function rateLimited(key: string) {
    const now = Date.now();
    const hits = (recent.get(key) ?? []).filter((t) => now - t < windowMs);
    if (hits.length >= max) {
      recent.set(key, hits);
      return true;
    }
    hits.push(now);
    recent.set(key, hits);

    // Hou de map klein: verlopen sleutels opruimen zodra ze zich opstapelen.
    if (recent.size > 1000) {
      for (const [k, times] of recent) {
        if (times.every((t) => now - t >= windowMs)) recent.delete(k);
      }
    }
    return false;
  };
}
