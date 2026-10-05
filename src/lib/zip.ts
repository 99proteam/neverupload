import { zipSync, type Zippable } from 'fflate';
import { uniqueNames } from './format';

export interface NamedFile {
  name: string;
  data: Uint8Array;
}

/**
 * Bundle files into a zip archive. PDFs and images are already compressed, so we
 * store them without deflate (level 0) — this is fast even for very large inputs.
 */
export function zipFiles(files: NamedFile[], level: 0 | 6 = 0): Uint8Array {
  if (files.length === 0) throw new Error('Nothing to zip.');
  const names = uniqueNames(files.map((f) => f.name));
  const entries: Zippable = {};
  files.forEach((file, i) => {
    entries[names[i] as string] = [file.data, { level }];
  });
  return zipSync(entries);
}
