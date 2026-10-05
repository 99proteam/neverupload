/** Does a File match an `accept` string like "application/pdf,.pdf" or "image/*"? */
export function matchesAccept(file: Pick<File, 'name' | 'type'>, accept: string): boolean {
  if (!accept.trim()) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return accept
    .split(',')
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean)
    .some((rule) => {
      if (rule.startsWith('.')) return name.endsWith(rule);
      if (rule.endsWith('/*')) return type.startsWith(rule.slice(0, -1));
      return type === rule;
    });
}

/** Read a File into bytes. */
export async function readFileBytes(file: Blob): Promise<Uint8Array> {
  return new Uint8Array(await file.arrayBuffer());
}

/** Anything above this is refused up front with a clear message. */
export const MAX_FILE_BYTES = 1024 * 1024 * 1024; // 1 GB

let nextId = 0;
/** Stable id for list keys. */
export function makeId(): string {
  nextId += 1;
  return `f${Date.now().toString(36)}${nextId}`;
}
