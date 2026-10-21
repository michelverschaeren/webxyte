/**
 * Per-key limit (usually an IP) for public forms. Kept in the instance's
 * memory: enough to slow a script down, without a table for one form. On
 * Vercel each instance counts on its own — fine for a contact form, not for
 * login (use a shared store there, e.g. Better Auth's `storage: "database"`).
 */
export function createRateLimiter({ windowMs, max }: { windowMs: number, max: number }) {
  /** Key → timestamps of recent requests. */
  const recent = new Map<string, number[]>()

  return function rateLimited(key: string) {
    const now = Date.now()
    const hits = (recent.get(key) ?? []).filter(t => now - t < windowMs)
    if (hits.length >= max) {
      recent.set(key, hits)
      return true
    }
    hits.push(now)
    recent.set(key, hits)

    // Keep the map small: drop expired keys once they pile up.
    if (recent.size > 1000) {
      for (const [k, times] of recent) {
        if (times.every(t => now - t >= windowMs)) recent.delete(k)
      }
    }
    return false
  }
}
