/** Trigger a browser download for in-memory data. Nothing is sent anywhere. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser time to start the download before releasing memory.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function bytesToBlob(data: Uint8Array, type: string): Blob {
  return new Blob([data as Uint8Array<ArrayBuffer>], { type });
}
