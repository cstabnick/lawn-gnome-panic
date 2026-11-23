// The dressing room (Gnome Market, Poppy Thimble) and the Gnome Salon (Lavender Shearwell): the shared gnome studio
// (@lawn/gnome-editor createGnomeStudio) full screen over the town. Only one studio is open at a time.
import { createGnomeStudio, type Studio } from '@lawn/gnome-editor';
import { closePanel, type PanelCtx } from './panel';
import { HAIR_PRICES } from './shops/catalog';
import { onHairBought } from './achievements';

let open: { studio: Studio | null; container: HTMLElement; close: () => void } | null = null;

/** Opens the studio in this mode over the town. */
export function openStudio(ctx: PanelCtx, mode: 'dressing' | 'salon'): void {
  if (open) return;
  closePanel();

  const keeper = mode === 'salon' ? 'lavender-shearwell' : 'poppy-thimble';
  const container = document.createElement('div');
  container.style.cssText =
    'position:fixed;inset:0;z-index:45;pointer-events:auto;background:#8fd3f4;overflow:hidden;';
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'display:block;width:100vw;height:100vh;height:100dvh;';
  container.appendChild(canvas);

  // Taps and keys inside the studio must not reach the town; Escape leaves the studio.
  const stop = (e: Event): void => e.stopPropagation();
  container.addEventListener('pointerdown', stop);
  container.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Escape') close(false);
  });
  const onWindowKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') close(false);
  };
  window.addEventListener('keydown', onWindowKey, true);

  const entry = { studio: null as Studio | null, container, close: () => close(true) };
  open = entry;
  let closed = false;

  function close(line: boolean): void {
    if (closed) return;
    closed = true;
    window.removeEventListener('keydown', onWindowKey, true);
    entry.studio?.dispose();
    entry.studio = null;
    container.remove();
    if (open === entry) open = null;
    ctx.setTownHidden(false);
    if (line) {
      ctx.system(mode === 'salon' ? 'You leave the salon.' : 'You step out of the dressing room.');
    }
  }

  ctx.ui.appendChild(container);
  ctx.setTownHidden(true);

  createGnomeStudio({
    canvas,
    ui: container,
    mode,
    title: mode === 'salon' ? 'GNOME SALON' : 'DRESSING ROOM',
    onClose: () => close(true),
    onSaved: () => {
      ctx.onLookSaved();
      ctx.npcSay(keeper, mode === 'salon' ? 'Gorgeous! Your new look suits you.' : 'Wonderful, that outfit fits you well!');
    },
    hairPrices: mode === 'salon' ? HAIR_PRICES : undefined,
    onHairBought: () => {
      onHairBought();
    },
  })
    .then((studio) => {
      if (closed) {
        studio.dispose();
        return;
      }
      entry.studio = studio;
    })
    .catch(() => {
      if (closed) return;
      close(false);
      ctx.system('The studio could not open.');
    });
}
