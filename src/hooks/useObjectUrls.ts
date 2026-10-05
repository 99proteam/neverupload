import { useEffect, useMemo } from 'react';

/** Object URLs for previews, revoked automatically when the blobs change or on unmount. */
export function useObjectUrls(blobs: Blob[]): string[] {
  const urls = useMemo(() => blobs.map((b) => URL.createObjectURL(b)), [blobs]);
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls]);
  return urls;
}
