// "Read the notices" (D58): a dense notice board keeps a short headline on its plate, and an interact spot in front of it
// toasts the board's full lines one press at a time (as Hyssop's wall does), so the jokes reach a phone player too.
import { addInteractSpot } from '../interactables';

/** How long each notice line stays up, ms. */
export const NOTICE_TOAST_MS = 4200;

/** The line shown on the n-th press (0-based): the lines in turn, then round again. Pure. */
export function noticeLine(lines: readonly string[], n: number): string {
  if (!lines.length) return '';
  return lines[((n % lines.length) + lines.length) % lines.length];
}

/**
 * A "Read the notices" spot at `pos` (stand it about 1.2 m in front of the board, on the approach side). Each press
 * toasts the next line, prefixed "(k/n)" when there are several. Returns the remover (addInteractSpot's).
 */
export function addNoticeSpot(
  pos: { x: number; z: number; y?: number },
  lines: readonly string[],
  prompt = 'Read the notices',
): () => void {
  let n = 0;
  return addInteractSpot({
    x: pos.x,
    z: pos.z,
    ...(pos.y !== undefined ? { y: pos.y } : {}),
    prompt,
    run: (_player, deps) => {
      const k = n % lines.length;
      const line = noticeLine(lines, n++);
      deps.hud.toast(lines.length > 1 ? `(${k + 1}/${lines.length}) ${line}` : line, NOTICE_TOAST_MS);
      return true;
    },
  });
}
