// Pay 'n' Glaze shop panel: headlights: lamp style and beam colour, plus a preview toggle.
//
// Preview contract: the panel cannot reach the vehicle, so the preview toggle dispatches
//   window.dispatchEvent(new CustomEvent('gta-glaze-lights', { detail: { on: boolean } }))
// The shop listens for it and lights the preview vehicle's lamps (rig.setLightsOn / setVehicleHeadlights).
// Nobody listening is fine: the event is then a no-op. `build` sends `{ on: false }` so a re-opened shop starts dark.
import { BEAMS, LAMPS } from '@lawn/glaze';
import type { BeamId, LampId } from '@lawn/glaze';
import type { OptionItem, Panel, PanelCtx } from './glazeUi';
import { glazeThumb, optionGrid, ownedBadge, sectionLabel } from './glazeUi';

/** Window event name for the beam preview (see the header comment). */
export const GLAZE_LIGHTS_EVENT = 'gta-glaze-lights';

let panelCtx: PanelCtx | null = null;
let lampGrid: { el: HTMLElement; set(v: LampId): void } | null = null;
let beamGrid: { el: HTMLElement; set(v: BeamId): void } | null = null;
let previewBtn: HTMLButtonElement | null = null;
let previewOn = false;

function sendLights(on: boolean): void {
  window.dispatchEvent(new CustomEvent(GLAZE_LIGHTS_EVENT, { detail: { on } }));
}

function paintPreviewLabel(): void {
  if (!previewBtn) return;
  previewBtn.textContent = previewOn ? 'Beams on (tap to turn off)' : 'Preview the beams';
  previewBtn.setAttribute('aria-pressed', previewOn ? 'true' : 'false');
}

function beamThumb(id: BeamId): HTMLElement | null {
  const beam = BEAMS.find((b) => b.id === id);
  if (!beam) return null;
  const dot = document.createElement('div');
  dot.style.width = '28px';
  dot.style.height = '28px';
  dot.style.borderRadius = '50%';
  dot.style.background = '#' + beam.color.toString(16).padStart(6, '0');
  return dot;
}

export const lightsPanel: Panel = {
  id: 'lights',
  label: 'Lights',
  icon: '💡',
  build(c: PanelCtx): HTMLElement {
    panelCtx = c;

    const root = document.createElement('div');

    root.appendChild(sectionLabel('Headlights'));
    const lampItems: OptionItem<LampId>[] = LAMPS.map((d) => ({
      id: d.id as LampId,
      name: d.name,
      blurb: d.blurb,
      price: d.price,
    }));
    lampGrid = optionGrid<LampId>({
      items: lampItems,
      value: c.draft().lamp,
      onPick: (id) => c.patch({ lamp: id }),
      thumb: glazeThumb('lamp'),
      badge: ownedBadge(() => c.owned().lamp),
    });
    root.appendChild(lampGrid.el);

    root.appendChild(sectionLabel('Beam colour'));
    const beamItems: OptionItem<BeamId>[] = BEAMS.map((d) => ({
      id: d.id as BeamId,
      name: d.name,
      blurb: d.blurb,
      price: d.price,
    }));
    beamGrid = optionGrid<BeamId>({
      items: beamItems,
      value: c.draft().beam,
      onPick: (id) => c.patch({ beam: id }),
      thumb: beamThumb,
      badge: ownedBadge(() => c.owned().beam),
    });
    root.appendChild(beamGrid.el);

    // Every fresh build starts with the beams off, and tells the shop so.
    previewOn = false;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gz-btn gz-btn-ghost';
    btn.addEventListener('click', () => {
      previewOn = !previewOn;
      paintPreviewLabel();
      sendLights(previewOn);
    });
    previewBtn = btn;
    paintPreviewLabel();
    sendLights(false);
    root.appendChild(btn);

    return root;
  },
  refresh(): void {
    if (!panelCtx) return;
    const d = panelCtx.draft();
    lampGrid?.set(d.lamp);
    beamGrid?.set(d.beam);
  },
};
