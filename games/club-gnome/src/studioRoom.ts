// The dressing room (Gnome Market, Yarrow Thimble) and the Gnome Salon (Juniper Shearwell): the shared gnome studio
// (@lawn/gnome-editor createGnomeStudio) full screen over the town. STUB: issue 2G fills it in.
import type { PanelCtx } from './panel';

/** Opens the studio in this mode over the town. */
export function openStudio(ctx: PanelCtx, mode: 'dressing' | 'salon'): void {
  ctx.system(`The ${mode === 'salon' ? 'salon' : 'dressing room'} is not open yet.`);
}
