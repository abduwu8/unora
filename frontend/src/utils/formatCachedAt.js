/**
 * Format cachedAt (Unix ms) for display. Returns null if invalid.
 */
export function formatCachedAt(cachedAt) {
  if (cachedAt == null || typeof cachedAt !== 'number') return null;
  const d = new Date(cachedAt);
  if (Number.isNaN(d.getTime())) return null;
  const dateStr = d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return `Data as of ${dateStr}`;
}
