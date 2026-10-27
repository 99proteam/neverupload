import {
  ArrowLeftRight,
  Combine,
  FileImage,
  FileStack,
  Files,
  ImageDown,
  Images,
  ListOrdered,
  Minimize2,
  QrCode,
  Scaling,
  Scissors,
  Stamp,
  type LucideProps,
} from 'lucide-react';
import type { ToolIconName } from '../tools/types';

const ICONS: Record<ToolIconName, React.ComponentType<LucideProps>> = {
  merge: Combine,
  split: Scissors,
  compress: Minimize2,
  organize: FileStack,
  imagesToPdf: Images,
  pdfToImages: FileImage,
  imageCompress: ImageDown,
  resize: Scaling,
  convert: ArrowLeftRight,
  qr: QrCode,
  pageNumbers: ListOrdered,
  watermark: Stamp,
};

export function ToolIcon({ name, ...props }: { name: ToolIconName } & LucideProps) {
  const Icon = ICONS[name] ?? Files;
  return <Icon aria-hidden="true" {...props} />;
}
