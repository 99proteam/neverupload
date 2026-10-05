/** Human-readable byte size, e.g. 1.4 MB. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[unit]}`;
}

/** Percentage saved going from `before` to `after` bytes (negative when it grew). */
export function percentSaved(before: number, after: number): number {
  if (before <= 0) return 0;
  return Math.round(((before - after) / before) * 100);
}

/** Strip the extension from a file name. */
export function baseName(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(0, dot) : name;
}

/** Replace (or add) the extension of a file name. */
export function withExtension(name: string, ext: string): string {
  return `${baseName(name)}.${ext.replace(/^\./, '')}`;
}

/**
 * Make every name in the list unique by appending " (2)", " (3)", ... before the
 * extension. Needed for zip archives, which can't hold two entries with one name.
 */
export function uniqueNames(names: string[]): string[] {
  const seen = new Map<string, number>();
  const used = new Set<string>();
  return names.map((name) => {
    let candidate = name;
    let n = seen.get(name.toLowerCase()) ?? 1;
    while (used.has(candidate.toLowerCase())) {
      n++;
      const dot = name.lastIndexOf('.');
      candidate = dot > 0 ? `${name.slice(0, dot)} (${n})${name.slice(dot)}` : `${name} (${n})`;
    }
    seen.set(name.toLowerCase(), n);
    used.add(candidate.toLowerCase());
    return candidate;
  });
}
