import { useCallback, useState } from 'react';
import { makeId } from '../lib/files';
import type { ImageFileInput } from '../lib/imageTransform';
import type { ImageItem } from '../components/ImageBatch';

export function useImageItems() {
  const [items, setItems] = useState<ImageItem[]>([]);
  const add = useCallback(
    (files: File[]) =>
      setItems((prev) => [...prev, ...files.map((file) => ({ id: makeId(), file }))]),
    [],
  );
  const remove = useCallback(
    (index: number) => setItems((l) => l.filter((_, i) => i !== index)),
    [],
  );
  const clear = useCallback(() => setItems([]), []);
  const inputs = (): ImageFileInput[] =>
    items.map(({ file }) => ({ name: file.name, type: file.type, size: file.size, blob: file }));
  return { items, add, remove, clear, inputs };
}
