# Contributing to neverupload

Thanks for helping! Bug fixes, new tools, translations of wording, accessibility fixes and
docs improvements are all welcome.

## The one rule

**Files never leave the user's device.** A contribution must not:

- send file data (or anything derived from it) over the network,
- add analytics, trackers, ads, cookies or third-party scripts/fonts/CDNs,
- require a backend, database or account.

The production Content Security Policy (`connect-src 'self'`) enforces most of this; please
don't loosen it.

## Getting started

```bash
npm install
npm run dev     # app on http://localhost:5173
npm test        # unit tests
npm run lint    # ESLint + Prettier
```

Before opening a pull request, run `npm run lint && npm run typecheck && npm test && npm run build`.
CI runs the same checks on every pull request.

## How to add a new tool (step by step)

Every tool lives in its own folder and follows the same pattern. Say you're adding
**"Watermark PDF"** with the route `/watermark-pdf/`.

### 1. Create the folder

```
src/tools/watermark-pdf/
  meta.ts               # name, route, SEO title + description, FAQ
  process.ts            # pure processing function(s), no DOM, no React
  WatermarkPdfTool.tsx  # the page UI
tests/tools/watermark-pdf.test.ts
```

### 2. Write the processing function (`process.ts`)

Keep it **pure**: bytes and options in, bytes out. No `document`, `window` or React, so it
runs in a Web Worker and in Vitest (Node). Throw `UserFacingError` for problems the user can
fix, and accept an optional `onProgress(fraction)` callback.

```ts
import { degrees, rgb, StandardFonts } from 'pdf-lib';
import { UserFacingError } from '../../lib/errors';
import { loadPdfDocument, SAVE_OPTIONS } from '../../lib/pdf';
import type { ProgressFn } from '../../workers/protocol';

export async function watermarkPdf(
  data: Uint8Array,
  text: string,
  onProgress?: ProgressFn,
): Promise<Uint8Array> {
  if (!text.trim()) throw new UserFacingError('Enter the watermark text.');
  const doc = await loadPdfDocument(data);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const pages = doc.getPages();
  pages.forEach((page, i) => {
    page.drawText(text, {
      x: 60,
      y: 60,
      size: 48,
      font,
      color: rgb(0.8, 0.1, 0.1),
      opacity: 0.3,
      rotate: degrees(45),
    });
    onProgress?.((i + 1) / pages.length);
  });
  return doc.save(SAVE_OPTIONS);
}
```

If the work needs browser-only APIs (canvas, pdf.js rendering), don't call them directly from
`process.ts`. Take them as a parameter instead (see `PageRenderer` in
`compress-pdf/process.ts` or `ImageTransformer` in `lib/imageTransform.ts`), so tests can pass a
fake.

### 3. Run heavy work in a Web Worker

Register an operation in `src/workers/pdf.worker.ts` (or `image.worker.ts`):

```ts
watermark: ({ file, text }: { file: PdfInput; text: string }, onProgress) =>
  watermarkPdf(file.data, text, onProgress),
```

Then call it from the UI with `runPdfJob('watermark', { file, text }, { onProgress })`. Typed
arrays in the payload are transferred, not copied, so 100 MB+ files stay fast.

### 4. Describe the tool (`meta.ts`)

```ts
import { OFFLINE_FAQ, PRIVACY_FAQ } from '../faq.ts';
import type { ToolMeta } from '../types.ts';

export const meta: ToolMeta = {
  slug: 'watermark-pdf',
  name: 'Watermark PDF',
  category: 'pdf',
  icon: 'merge', // add a new icon name in types.ts + components/ToolIcon.tsx if needed
  summary: 'Stamp text across every page of a PDF.',
  title: 'Add a watermark to a PDF, free and private | neverupload',
  description:
    'Add a text watermark to every page of a PDF in your browser. Free, and your files never leave your device.',
  keywords: ['stamp', 'confidential', 'draft'],
  faq: [{ q: 'How do I add a watermark?', a: '...' }, PRIVACY_FAQ, OFFLINE_FAQ],
};
```

Note the `.ts` extensions on imports in `meta.ts` files: the build config loads them directly.

### 5. Build the page (`WatermarkPdfTool.tsx`)

Copy the closest existing tool (e.g. `split-pdf/SplitPdfTool.tsx`) and adapt it. Use the shared
building blocks so every tool behaves the same:

- `ToolPage`: heading, "How it works" FAQ, related tools, page title/meta
- `DropZone`: drag and drop plus file picker
- `useJob` + `JobStatus`: progress bar and error display
- `ResultPanel` + `DownloadButton`: "Processed on your device" badge, download, "Process another"

The component must be the file's **default export**.

### 6. Register it

- Add the meta to `TOOL_METAS` in `src/tools/meta.ts`. The home page, routes, sitemap and
  pre-rendered SEO page are generated from this list.
- Add the lazy component to `src/tools/registry.ts`.

### 7. Test it

Add `tests/tools/watermark-pdf.test.ts` using the small files in `tests/fixtures/` (add new ones
in `scripts/generate-fixtures.mjs` rather than committing unknown binaries):

```ts
import { expect, it } from 'vitest';
import { watermarkPdf } from '../../src/tools/watermark-pdf/process';
import { fixture, pdfInfo } from '../helpers';

it('keeps every page', async () => {
  const out = await watermarkPdf(fixture('three-pages.pdf'), 'DRAFT');
  expect((await pdfInfo(out)).pageCount).toBe(3);
});
```

Then try it by hand with `npm run dev`: keyboard only, a phone-sized window, dark mode, and a
large file.

## Code style

- Strict TypeScript; no `any`.
- Prettier formats everything (`npm run format`).
- Keep functions small and comments useful: explain _why_, not _what_.
- UI text: short, friendly, plain English. Errors should say what to do next.

## Commit and pull request

1. Fork, create a branch (`git checkout -b feat/watermark-pdf`), commit and push.
2. Open a pull request and fill in the template.
3. A maintainer will review it. Small, focused PRs get merged fastest.

By contributing you agree that your work is licensed under the [MIT License](LICENSE) and that
you follow the [Code of Conduct](CODE_OF_CONDUCT.md).
