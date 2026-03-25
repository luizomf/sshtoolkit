import { zipSync, strToU8 } from 'fflate';

export interface ZipEntry {
  name: string;
  content: string;
}

export function createZipBlob(entries: ZipEntry[]): Blob {
  const files: Record<string, Uint8Array> = {};
  for (const entry of entries) {
    files[entry.name] = strToU8(entry.content);
  }
  const zipped = zipSync(files);
  return new Blob([zipped], { type: 'application/zip' });
}

export function downloadZip(entries: ZipEntry[], filename: string): void {
  const blob = createZipBlob(entries);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
