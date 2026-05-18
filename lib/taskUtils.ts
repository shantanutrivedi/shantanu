// Shared task ID generation — consistent across all pages.
// SH- prefix for action items (from MOM or Workbench).
// AC- prefix for activity log entries.
// Based on the last 5 chars of the item's UUID / timestamp ID.

export function getTaskId(id: string): string {
  const clean = id.replace(/^(mom|act)-/, '');
  return `SH-${clean.slice(-5).toUpperCase()}`;
}

export function getActivityId(id: string): string {
  return `AC-${id.slice(-5).toUpperCase()}`;
}
