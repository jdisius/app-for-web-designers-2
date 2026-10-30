// Pure helper (no imports) so Node can test it. Realtime events, the initial load and re-fetches can overlap,
// so messages are merged by id and kept in creation order.
export function mergeMessages<T extends { id: string; created_at: string }>(current: T[], incoming: T[]): T[] {
  const byId = new Map(current.map((m) => [m.id, m]));
  for (const m of incoming) byId.set(m.id, m);
  return [...byId.values()].sort((a, b) => a.created_at.localeCompare(b.created_at));
}
