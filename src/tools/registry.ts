import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import { TOOL_METAS } from './meta';
import type { ToolMeta } from './types';

/** Each tool's UI is loaded on demand so the home page stays small. */
const COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  'merge-pdf': lazy(() => import('./merge-pdf/MergePdfTool')),
  'split-pdf': lazy(() => import('./split-pdf/SplitPdfTool')),
  'compress-pdf': lazy(() => import('./compress-pdf/CompressPdfTool')),
  'organize-pdf': lazy(() => import('./organize-pdf/OrganizePdfTool')),
  'images-to-pdf': lazy(() => import('./images-to-pdf/ImagesToPdfTool')),
  'pdf-to-images': lazy(() => import('./pdf-to-images/PdfToImagesTool')),
  'compress-image': lazy(() => import('./compress-image/CompressImageTool')),
  'resize-image': lazy(() => import('./resize-image/ResizeImageTool')),
  'convert-image': lazy(() => import('./convert-image/ConvertImageTool')),
  'qr-code-generator': lazy(() => import('./qr-code-generator/QrCodeTool')),
};

export interface ToolEntry {
  meta: ToolMeta;
  Component: LazyExoticComponent<ComponentType>;
}

export const TOOLS: ToolEntry[] = TOOL_METAS.map((meta) => {
  const Component = COMPONENTS[meta.slug];
  if (!Component) throw new Error(`No component registered for tool "${meta.slug}"`);
  return { meta, Component };
});
