import { degrees, type PDFPage } from 'pdf-lib';

/**
 * Pages can carry a /Rotate of 90, 180 or 270 degrees, and their visible area (crop box)
 * may not start at 0,0. Tools that draw on pages think in "what the reader sees" (visual)
 * coordinates; these helpers map that onto the page's own coordinate system.
 */
export interface PageFrame {
  /** Visible width and height as displayed, after rotation. */
  width: number;
  height: number;
  /** Map a visual point (origin bottom-left, as displayed) to page coordinates. */
  toPage: (x: number, y: number) => { x: number; y: number };
  /** Page rotation, to add to text so it reads upright. */
  rotation: number;
}

export function pageFrame(page: PDFPage): PageFrame {
  const box = page.getCropBox();
  const rotation = (((page.getRotation().angle % 360) + 360) % 360) as 0 | 90 | 180 | 270;
  const { x: ox, y: oy, width: w, height: h } = box;
  const sideways = rotation === 90 || rotation === 270;
  const toPageRaw = (x: number, y: number): [number, number] => {
    switch (rotation) {
      // Displayed clockwise: the page's left edge becomes the top, its bottom edge the left.
      case 90:
        return [w - y, x];
      case 180:
        return [w - x, h - y];
      case 270:
        return [y, h - x];
      default:
        return [x, y];
    }
  };
  return {
    width: sideways ? h : w,
    height: sideways ? w : h,
    rotation,
    toPage: (x, y) => {
      const [px, py] = toPageRaw(x, y);
      return { x: ox + px, y: oy + py };
    },
  };
}

/**
 * Where to start a line of text so that, after rotating it by `angle` degrees
 * (counter-clockwise, visual), its center lands on (cx, cy).
 */
export function centeredTextOrigin(
  cx: number,
  cy: number,
  textWidth: number,
  textHeight: number,
  angle: number,
): { x: number; y: number } {
  const a = (angle * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  return {
    x: cx - (textWidth / 2) * cos + (textHeight / 2) * sin,
    y: cy - (textWidth / 2) * sin - (textHeight / 2) * cos,
  };
}

/** pdf-lib rotation for text drawn at a visual angle on a page with the given frame. */
export function textRotation(frame: PageFrame, visualAngle = 0) {
  return degrees(frame.rotation + visualAngle);
}
