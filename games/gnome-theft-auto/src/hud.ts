// Gnome Theft Auto HUD: Hat Watch hats, health bar, gun and ammo, flight readout, cracked count, crosshair, prompts,
// toasts, a biome label, a big banner and a minimap. Everything lives in one #gta-hud container appended to #ui.
import { damagedDef, getPrefab, prefabIcon, prefabIconElement } from '@lawn/prefabs';
import { CITY_HALF, GUNS, MAX_HEAT, ROAD_WIDTH } from './config';
import { REGIONS, REGION_IDS, waterBodies, waterPaths } from './levels';
import { normalAt, terrainFlat } from './terrain';
import type { Blip, GunKind, Hud, HudState, RoadNode, World } from './types';
import { PIT_LANE, TRACK, trackSamples } from './raceTrack/track';

const CSS = `
#gta-hud{position:fixed;inset:0;pointer-events:none;font-family:system-ui,sans-serif;font-weight:700;color:#fff;
  text-shadow:0 1px 3px rgba(0,0,0,.85);
  --sat:env(safe-area-inset-top,0px);--sar:env(safe-area-inset-right,0px);
  --sab:env(safe-area-inset-bottom,0px);--sal:env(safe-area-inset-left,0px);--m:max(18px,4vw);}
#gta-hud .gta-tl{position:absolute;top:calc(var(--sat) + var(--m));left:calc(var(--sal) + var(--m));max-width:190px;
  padding:8px 10px;border-radius:10px;background:rgba(0,0,0,.25);font-size:12px;box-sizing:border-box;}
#gta-hud .gta-label{font-size:11px;letter-spacing:.08em;opacity:.95;}
#gta-hud .gta-hats{display:flex;gap:4px;margin-top:4px;}
/*
 * The right-hand column, top to bottom: the minimap, the icon row (two faces, then the settings gear), the gun with its
 * ammo, and the gun's name. --gta-map is the minimap's size in px; the settings gear uses the same offset (options.ts).
 */
#gta-hud .gta-meters{position:absolute;top:calc(var(--sat) + var(--m) + var(--gta-map, 128px) + 8px);right:calc(var(--sar) + 62px);
  height:44px;display:flex;align-items:center;gap:8px;}
#gta-hud .gta-meter{position:relative;display:block;width:40px;height:40px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.6));}
#gta-hud .gta-meter img{position:absolute;left:3px;top:3px;width:34px;height:34px;}
#gta-hud .gta-meter svg{display:block;position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible;}
#gta-hud .gta-meter.hot{animation:gta-pulse .9s ease-in-out infinite;}
#gta-hud .gta-meter.hoa{animation:gta-pulse .65s ease-in-out infinite;
  filter:drop-shadow(0 0 5px rgba(212,175,55,.85)) drop-shadow(0 1px 2px rgba(0,0,0,.7));}
#gta-hud .gta-hoa{display:none;align-items:center;gap:5px;margin-bottom:4px;padding:3px 8px;border-radius:999px;
  background:#18181f;border:1.5px solid #d4af37;color:#ffd23f;font-size:10px;font-weight:800;letter-spacing:.1em;
  box-shadow:0 0 8px rgba(212,175,55,.45);animation:gta-pulse .9s ease-in-out infinite;width:fit-content;}
#gta-hud .gta-hoa.on{display:inline-flex;}
#gta-hud .gta-gunblock{position:absolute;right:calc(var(--sar) + var(--m));top:calc(var(--sat) + var(--m) + var(--gta-map, 128px) + 60px);
  display:flex;flex-direction:column;align-items:flex-end;gap:2px;}
#gta-hud .gta-gunname{font-size:11px;letter-spacing:.06em;opacity:.9;}
/* The ammo number floats over the left of the gun; the gun shows on the right. */
#gta-hud .gta-gunbox{position:relative;width:92px;height:48px;}
#gta-hud .gta-gunicon{position:absolute;right:0;bottom:0;width:48px;height:48px;display:inline-flex;align-items:center;justify-content:center;}
#gta-hud .gta-gunicon img,#gta-hud .gta-gunicon canvas{width:48px;height:48px;object-fit:contain;
  filter:drop-shadow(0 0 1px #fff) drop-shadow(0 0 2px rgba(255,255,255,.7));}
#gta-hud .gta-gunicon span{font-size:30px;line-height:1;}
#gta-hud .gta-ammo{position:absolute;left:0;top:0;font-size:15px;line-height:1;font-weight:800;
  white-space:nowrap;font-variant-numeric:tabular-nums;text-shadow:0 0 3px rgba(0,0,0,.95),0 1px 2px #000;}
#gta-hud .gta-reload{flex-basis:100%;font-size:12px;line-height:14px;letter-spacing:.08em;color:#ffd84a;
  visibility:hidden;}
#gta-hud .gta-reload.on{visibility:visible;animation:gta-blink .5s ease-in-out infinite;}
#gta-hud .gta-flight{margin-top:6px;margin-bottom:4px;font-size:12px;line-height:1.35;font-variant-numeric:tabular-nums;}
#gta-hud .gta-chute{color:#bff3ff;}
#gta-hud .gta-acorns{font-size:13px;font-weight:800;line-height:1.25;color:#ffd23f;font-variant-numeric:tabular-nums;}
#gta-hud .gta-debt{font-size:11px;line-height:1.25;color:#f5b7b1;margin-top:2px;font-variant-numeric:tabular-nums;}
#gta-hud .gta-cracked{font-size:12px;margin-top:4px;}
#gta-hud .gta-substats{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px;font-size:11px;opacity:.92;}
#gta-hud .gta-buff{margin-top:4px;padding:2px 8px;border-radius:999px;background:rgba(247,230,28,.2);border:1px solid #f7e61c;color:#fff799;font-size:11px;width:fit-content;}
#gta-hud .gta-boost-wrap{width:140px;height:7px;border-radius:999px;background:rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.35);overflow:hidden;display:none;}
#gta-hud .gta-boost-fill{height:100%;width:100%;background:linear-gradient(90deg,#f59e0b,#38bdf8);transition:width .06s linear;}
#gta-hud .gta-callout{position:absolute;left:50%;top:16%;transform:translateX(-50%);text-align:center;pointer-events:none;z-index:25;}
#gta-hud .gta-callout-main{font-size:clamp(22px,5vw,42px);font-weight:900;letter-spacing:.04em;color:#ffd23f;text-shadow:0 2px 8px rgba(0,0,0,.95);animation:gta-scale-in .25s ease-out both;}
#gta-hud .gta-callout-sub{font-size:clamp(13px,2.5vw,18px);font-weight:700;color:#bff3ff;text-shadow:0 1px 4px rgba(0,0,0,.95);margin-top:2px;}
#gta-hud .gta-flash{position:fixed;inset:0;background:#fff;opacity:0;pointer-events:none;z-index:40;transition:opacity .28s ease-out;}
#gta-hud .gta-quest{display:none;margin-top:10px;font-size:11.5px;line-height:1.3;}
#gta-hud .gta-qtitle{font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;opacity:.7;}
#gta-hud .gta-qline{margin-top:3px;font-weight:600;animation:gta-qline-in .35s ease-out both;}
#gta-hud .gta-qline::before{content:'';display:inline-block;width:4px;height:4px;border-radius:50%;background:#ffd23f;margin:0 6px 2px 0;vertical-align:middle;}
#gta-hud .gta-name{color:#ffd23f;font-weight:800;}
#gta-hud .gta-quest .gta-demo{display:inline-block;margin-left:6px;padding:0 6px;border-radius:999px;background:#d64541;font-size:10px;letter-spacing:.08em;}
#gta-hud .gta-help{font-size:11px;margin-top:6px;opacity:.95;line-height:1.3;}
#gta-hud .gta-tr{position:absolute;top:calc(var(--sat) + var(--m));right:calc(var(--sar) + var(--m));}
#gta-hud .gta-map{display:block;border-radius:12px;border:2px solid rgba(255,255,255,.75);
  box-shadow:0 2px 6px rgba(0,0,0,.4);pointer-events:auto;cursor:zoom-in;touch-action:none;}
#gta-hud .gta-big{position:absolute;inset:0;display:none;align-items:center;justify-content:center;flex-direction:column;
  gap:8px;background:rgba(0,0,0,.72);pointer-events:auto;cursor:zoom-out;touch-action:none;z-index:30;}
#gta-hud .gta-big.open{display:flex;}
#gta-hud .gta-big canvas{border-radius:12px;border:2px solid rgba(255,255,255,.85);}
#gta-hud .gta-big .gta-bighint{font-size:12px;opacity:.9;}
#gta-hud .gta-toasts{position:absolute;top:calc(var(--sat) + var(--m));left:50%;transform:translateX(-50%);
  display:flex;flex-direction:column;align-items:center;gap:6px;width:max-content;max-width:50vw;}
#gta-hud .gta-pill{background:rgba(0,0,0,.62);border-radius:999px;padding:6px 14px;font-size:14px;
  line-height:1.25;text-align:center;box-sizing:border-box;max-width:100%;}
#gta-hud .gta-toast{transition:opacity .4s ease;}
#gta-hud .gta-toast.out{opacity:0;}
#gta-hud .gta-cross{position:absolute;left:50%;top:50%;width:24px;height:24px;margin:-12px 0 0 -12px;}
#gta-hud .gta-cross svg{width:24px;height:24px;overflow:visible;display:block;}
#gta-hud .gta-biome{position:absolute;left:0;right:0;top:22%;text-align:center;padding:0 16px;box-sizing:border-box;
  font-size:clamp(20px,5.5vw,40px);line-height:1.1;font-weight:800;text-shadow:0 2px 6px rgba(0,0,0,.9);
  opacity:0;transition:opacity .6s ease;}
#gta-hud .gta-biome.show{opacity:1;transition:opacity .15s ease;}
#gta-hud .gta-bottom{position:absolute;left:0;right:0;bottom:calc(var(--sab) + 120px);
  display:flex;flex-direction:column;align-items:center;gap:6px;padding:0 16px;box-sizing:border-box;}
#gta-hud .gta-banner{position:absolute;left:0;right:0;top:38%;transform:translateY(-50%);text-align:center;padding:0 16px;}
#gta-hud .gta-banner-text{display:inline-block;font-size:clamp(28px,7vw,64px);line-height:1.1;font-weight:800;
  text-shadow:0 2px 6px rgba(0,0,0,.9);animation:gta-scale-in .3s ease-out both;}
#gta-hud .gta-banner-text.out{animation:gta-fade-out .4s ease-in both;}
#gta-hud .gta-online{position:absolute;right:calc(var(--sar) + var(--m));top:calc(var(--sat) + var(--m) + var(--gta-map, 128px) + 124px);font-size:12px;}
@keyframes gta-pulse{0%,100%{transform:scale(1);}50%{transform:scale(1.18);}}
@keyframes gta-blink{0%,100%{opacity:1;}50%{opacity:.35;}}
@keyframes gta-scale-in{0%{transform:scale(2.2);opacity:0;}60%{transform:scale(.95);opacity:1;}100%{transform:scale(1);opacity:1;}}
@keyframes gta-fade-out{from{opacity:1;}to{opacity:0;}}
@keyframes gta-qline-in{from{opacity:0;transform:translateX(-6px);}to{opacity:1;transform:none;}}
@media (max-width:600px){
  #gta-hud .gta-toasts{top:calc(var(--sat) + 210px);max-width:80vw;}
  #gta-hud .gta-qtitle{font-size:9px;}
  #gta-hud .gta-qline{font-size:11px;margin-top:3px;}
}
/* Portrait phone: the touch buttons fill the bottom ~260 px, so the prompt sits above them. */
@media (max-width:600px) and (min-height:501px){
  #gta-hud .gta-bottom{bottom:calc(var(--sab) + 275px);}
}
@media (max-width:420px){
}
/* Short screens (a phone in landscape): smaller panel, prompt down low between the stick and the buttons. */
@media (max-height:500px){
  #gta-hud .gta-tl{transform:scale(.78);transform-origin:top left;}
  #gta-hud .gta-bottom{bottom:calc(var(--sab) + 10px);left:200px;right:240px;padding:0;}
  #gta-hud .gta-bottom .gta-pill{font-size:12px;padding:4px 10px;}
  #gta-hud .gta-help{display:none;}
  #gta-hud .gta-toasts{top:calc(var(--sat) + 8px);max-width:40vw;}
}
`;

/*
 * The two meters are faces, after the Doom status face: the head shows the level in five stages, and a ring round it
 * fills to the exact share, so the amount reads without a number.
 *  - Clay (life): the face cracks and chunks off as health drops, down to a crumbled head.
 *  - Hat Watch (wanted): the face goes from calm to alarmed as the watch rises, and gets a cap from the second stage.
 */
const METER_R = 14.5;
const RING_C = 2 * Math.PI * METER_R;
/** Chunks knocked out of a life head: [shape, the stage at or below which it is gone]. */
const CHUNKS: [string, number][] = [
  ['19,4 30,5 28,13 22,10 18,8', 3],
  ['3,20 8,19 9,27 4,28', 2],
  ['3,8 9,6 8,13 4,14', 1],
  ['9,3 17,2 16,8 10,9', 0],
];
/** Cracks in a life head: [line, the stage at or below which it shows]. */
const CRACKS: [string, number][] = [
  ['17,6 15,11 18,14 16,19', 3],
  ['9,13 12,15 10,19', 2],
  ['23,15 21,19 24,22', 1],
];
const eye = (x: number, y: number, ink: string, r = 1.3) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${ink}" stroke="none"/>`;
const EYES_X = '<path d="M9.5 12.5 L13 15.5 M13 12.5 L9.5 15.5 M19 12.5 L22.5 15.5 M22.5 12.5 L19 15.5"/>';
/** Hat Watch's police cap, with its badge: it marks the wanted face as a cop-watch gnome, never a plain gnome. */
const COP_CAP = '<path d="M6.5 10.5 Q16 -1 25.5 10.5 Z" fill="#2f55d4"/>' +
  '<path d="M4.5 10.6 H27.5" stroke="#1d3aa0" stroke-width="2"/>' +
  '<circle cx="16" cy="6.8" r="1.5" fill="#ffd23f" stroke="none"/>';
/** THE HOA's obsidian-and-gold enforcement cap for heat stage 4. */
const HOA_CAP = '<path d="M6.5 10.5 Q16 -1 25.5 10.5 Z" fill="#18181f"/>' +
  '<path d="M4.5 10.6 H27.5" stroke="#d4af37" stroke-width="2"/>' +
  '<polygon points="16,4.5 18.2,7.4 16,9 13.8,7.4" fill="#d4af37" stroke="none"/>';
/** The smug gnome's pointed red hat. */
const GNOME_HAT = '<path d="M16 -1 L21.5 8.4 L10.5 8.4 Z" fill="#c8322b"/>' +
  '<rect x="9" y="7" width="14" height="2.4" rx="1.2" fill="#c8322b"/>';

/**
 * The features of a face for a stage. Life: 4 is a smug gnome (half-lidded, smirking), and it falls to a crumbled 0.
 * Wanted: 0 is a stern cop-watch gnome and 4 is furious and shouting.
 */
function featuresSvg(kind: 'life' | 'wanted', stage: number, ink: string): string {
  if (kind === 'life') {
    const smugEyes = '<path d="M9.5 14 Q12 12.2 14.5 14 M17.5 14 Q20 12.2 22.5 14"/>';
    const mouths = [
      '<path d="M10 23.5 L12 21.5 L14 23.5 L16 21.5 L18 23.5 L20 21.5 L22 23.5"/>',
      '<ellipse cx="16" cy="22.5" rx="2.2" ry="1.6"/>',
      '<path d="M11 23 Q16 20 21 23"/>',
      '<path d="M12 21.5 Q17 22.5 21.5 20"/>',
      '<path d="M12 21.5 Q17.5 24.5 21.5 19.5"/>',
    ];
    const eyes = stage <= 1 ? EYES_X : stage === 2 ? '<path d="M10 13.5 L13.5 14.5 M18.5 14.5 L22 13.5"/>' : smugEyes;
    return eyes + mouths[stage];
  }
  const eyes = eye(12, 14, ink) + eye(20, 14, ink);
  const brows = (y1: number, y2: number, w: number) =>
    `<path d="M9.5 ${y1} L13.5 ${y2} M18.5 ${y2} L22.5 ${y1}" stroke-width="${w}"/>`;
  switch (stage) {
    case 0: return eyes + brows(12, 12, 1.3) + '<path d="M11.5 22 H20.5"/>' + COP_CAP;
    case 1: return eyes + brows(11.2, 12.2, 1.4) + '<path d="M11.5 22.5 Q16 21.5 20.5 22.5"/>' + COP_CAP;
    case 2: return eyes + brows(10, 11.8, 1.4) + '<path d="M11 23 Q16 21 21 23"/>' + COP_CAP;
    case 3: return eye(12, 14, ink, 1.5) + eye(20, 14, ink, 1.5) + brows(9.8, 11.5, 1.6) + '<path d="M11 23.5 Q16 19.5 21 23.5"/>' + COP_CAP;
    default:
      return `<path d="M9.5 13.5 L14.5 14.5 M17.5 14.5 L22.5 13.5"/>` +
        `<ellipse cx="16" cy="22.5" rx="2.6" ry="2.2" fill="${ink}" stroke="none"/>` + HOA_CAP;
  }
}

let maskSeq = 0;
/** A meter face: `stage` (0..4) sets its look, and `share` (0..1) sets how far the ring is filled. */
function faceSvg(kind: 'life' | 'wanted', stage: number, share: number, color: string): string {
  const s = Math.max(0, Math.min(4, stage));
  const sh = clamp01(share);
  const ring = `<circle cx="16" cy="16" r="${METER_R}" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="2.4"/>` +
    `<circle cx="16" cy="16" r="${METER_R}" fill="none" stroke="${color}" stroke-width="2.4" ` +
    `stroke-dasharray="${(sh * RING_C).toFixed(2)} ${RING_C.toFixed(2)}" transform="rotate(-90 16 16)"/>`;
  const life = kind === 'life';
  const ink = life ? '#2b1b10' : '#ffffff';
  const headFill = life ? color : s === 4 ? '#8a2a2a' : 'rgba(255,255,255,.14)';
  const head = `<circle cx="16" cy="16" r="11.5" fill="${headFill}" stroke="rgba(255,255,255,.85)" stroke-width="1.1"/>`;
  let body = head;
  if (life) {
    const id = `gta-crumb-${++maskSeq}`;
    const gone = CHUNKS.filter(([, at]) => s <= at).map(([pts]) => `<polygon points="${pts}" fill="#000"/>`).join('');
    const cracks = CRACKS.filter(([, at]) => s <= at).map(([pts]) => `<polyline points="${pts}"/>`).join('');
    body = `<mask id="${id}"><rect width="32" height="32" fill="#fff"/>${gone}</mask>` +
      `<g mask="url(#${id})">${head}<g fill="none" stroke="rgba(40,20,10,.75)" stroke-width="0.9">${cracks}</g></g>`;
  }
  const feat = `<g fill="none" stroke="${ink}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${featuresSvg(kind, s, ink)}</g>`;
  return `<svg viewBox="0 0 32 32" aria-hidden="true">${ring}${body}${life ? GNOME_HAT : ''}${feat}</svg>`;
}

/**
 * The 3D face for a meter at a damage level (gta-faces.ts), as a picture. Null without WebGL, and the SVG face is used.
 * Level 0 is the healthy or calm face; the stages are cumulative.
 */
function faceArt(kind: 'life' | 'wanted', level: number): string | null {
  const base = getPrefab(kind === 'life' ? 'gta-face-clay' : 'gta-face-wanted');
  if (!base) return null;
  try {
    return prefabIcon(damagedDef(base, level), { size: 96, yaw: 0, variant: `lv${level}` });
  } catch {
    return null;
  }
}

/** The ring round a meter: its arc is the share (0..1) and it sits round the 40 px face. */
function ringSvg(share: number, color: string): string {
  const C = 2 * Math.PI * 18;
  return '<svg viewBox="0 0 40 40" aria-hidden="true">' +
    '<circle cx="20" cy="20" r="18" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="2.6"/>' +
    `<circle cx="20" cy="20" r="18" fill="none" stroke="${color}" stroke-width="2.6" ` +
    `stroke-dasharray="${(clamp01(share) * C).toFixed(2)} ${C.toFixed(2)}" transform="rotate(-90 20 20)"/></svg>`;
}

/** Draws a meter: its 3D face at `level` with the ring at `share`, or the SVG face if there is no picture. */
function drawMeter(slot: HTMLElement, kind: 'life' | 'wanted', level: number, share: number, color: string): void {
  const art = faceArt(kind, level);
  if (!art) {
    const stage = kind === 'life' ? 4 - level : level;
    slot.innerHTML = faceSvg(kind, stage, share, color);
    return;
  }
  const img = document.createElement('img');
  img.src = art;
  img.alt = '';
  slot.replaceChildren(img);
  slot.insertAdjacentHTML('beforeend', ringSvg(share, color));
}

// Centred crosshair: a dot with four ticks. A dark halo under a white line reads on light and dark ground.
const TICKS = 'M12 3.5V8.5M12 15.5V20.5M3.5 12H8.5M15.5 12H20.5';
const CROSS_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true">' +
  `<path d="${TICKS}" fill="none" stroke="rgba(0,0,0,.65)" stroke-width="3.4" stroke-linecap="round"/>` +
  '<circle cx="12" cy="12" r="2.4" fill="rgba(0,0,0,.65)"/>' +
  `<path d="${TICKS}" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>` +
  '<circle cx="12" cy="12" r="1.3" fill="#fff"/></svg>';

const DRY_DARK = [120, 40, 20];
const DRY_LIGHT = [214, 140, 80];
const MAP_RANGE = 150;            // the minimap shows this far from the player, each way
const MAP_VIEW = MAP_RANGE * 2;   // world units across the minimap
const MAP_BLANK = '#0b0d10';
const BIOME_SHOW_MS = 3000;
const HELP_DESKTOP =
  'WASD move · mouse look · click fire · R reload · Q swap gun · E enter/exit · Space jump / climb · ' +
  'Shift descend · bail out of a plane in the air with E';
const HELP_TOUCH = 'Stick to move · drag to look · Fire · Reload · Enter / Exit';
const hexColor = (n: number) => '#' + n.toString(16).padStart(6, '0');
/** Big-map name positions where the average of the border would land on a corner (world coordinates). */
const LABEL_AT: Partial<Record<string, [number, number]>> = { 'loch-moss': [-720, -720], 'tallgrass-commons': [-720, 720] };
const averagePoint = (pts: [number, number][]): [number, number] => {
  let x = 0;
  let z = 0;
  for (const [px, pz] of pts) {
    x += px;
    z += pz;
  }
  return [x / pts.length, z / pts.length];
};

/** Minimap colours: their own palette, pushed apart so areas and objects read at a glance (the 3D world keeps its own). */
const MAP = {
  city: 0x4a5560, desert: 0xe9bd62, forest: 0x1d5a33, tundra: 0xd3e9f5, farmland: 0x9ccb3c,
  road: 0x23272e, roadEdge: 0xfff1c2, sand: 0xf3dc98, wall: 0x3b2f14, runway: 0x23272e, runwayEdge: 0xffffff,
  building: 0x9aa6b4, outline: 0x0c0f13, loch: 0x3f7f6a, parkland: 0xb6e05a, water: 0x3d8fd6,
} as const;
const OUTLINE = hexColor(MAP.outline);
const PIN = '#ffd23f';
const TAXI_YELLOW = '#f2c230';
const TAU = Math.PI * 2;

/** Vertical bob of an objective pin, in CSS px: a slow lift and drop. */
const pinBob = (t: number, r: number) => Math.sin(t * 4) * r * 0.25;

/** An objective pin: a gold star that turns and bobs, with a ring rippling out from it. `dot` is the colour at its heart. */
function drawPin(g: CanvasRenderingContext2D, x: number, y: number, r: number, t: number, dot: string): void {
  const cy = y + pinBob(t, r);
  const f = (t * 0.8) % 1;
  g.globalAlpha = 1 - f;
  g.strokeStyle = PIN;
  g.lineWidth = 1.5;
  g.beginPath();
  g.arc(x, cy, r + f * r, 0, TAU);
  g.stroke();
  g.globalAlpha = 1;
  g.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = t * 1.6 + (i * Math.PI) / 4;
    const rr = i % 2 === 0 ? r : r * 0.55;
    if (i === 0) g.moveTo(x + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    else g.lineTo(x + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  g.closePath();
  g.fillStyle = PIN;
  g.fill();
  g.strokeStyle = OUTLINE;
  g.lineWidth = 1.2;
  g.stroke();
  g.fillStyle = dot;
  g.beginPath();
  g.arc(x, cy, r * 0.3, 0, TAU);
  g.fill();
}

/** An objective off the edge of the minimap: an arrow on the rim (at x, y) pointing away from the centre (cx, cy). */
function drawEdgePointer(
  g: CanvasRenderingContext2D, x: number, y: number, cx: number, cy: number, t: number, color = PIN,
): void {
  const len = Math.hypot(x - cx, y - cy) || 1;
  const ux = (x - cx) / len;
  const uy = (y - cy) / len;
  const push = Math.sin(t * 4) * 1.5; // bobs in and out along its ray
  const bx = x - ux * push;
  const by = y - uy * push;
  const px = -uy;
  const py = ux;
  g.beginPath();
  g.moveTo(bx + ux * 6, by + uy * 6);
  g.lineTo(bx - ux * 3 + px * 4.5, by - uy * 3 + py * 4.5);
  g.lineTo(bx - ux * 3 - px * 4.5, by - uy * 3 - py * 4.5);
  g.closePath();
  g.fillStyle = color;
  g.fill();
  g.strokeStyle = OUTLINE;
  g.lineWidth = 1.2;
  g.stroke();
}

/** The colour an edge pointer or pulse takes for a quest blip: gold for a story giver or an untyped blip, else its own. */
function kindColor(b: Blip): string {
  return b.kind === undefined || b.kind === 'main' ? PIN : b.color;
}

/** A ring that fades out from a marker, in `color`. */
function pulseRing(g: CanvasRenderingContext2D, x: number, y: number, r: number, t: number, color: string): void {
  const f = (t * 0.8) % 1;
  g.globalAlpha = 1 - f;
  g.strokeStyle = color;
  g.lineWidth = 1.5;
  g.beginPath();
  g.arc(x, y, r + f * r, 0, TAU);
  g.stroke();
  g.globalAlpha = 1;
}

/**
 * A quest blip by its kind: story = gold star, side = coloured "?" diamond, objective = orange target rings, taxi =
 * yellow "T" square. A blip with no kind is drawn as the plain objective pin. Bobs and pulses unless `still`.
 */
function drawMarker(g: CanvasRenderingContext2D, x: number, y: number, r: number, t: number, b: Blip, still = false): void {
  if (!b.kind) {
    drawPin(g, x, y, r, t, b.color);
    return;
  }
  if (b.kind === 'speedway' || b.kind === 'glaze') {
    drawPlace(g, x, y, r, b.kind);
    return;
  }
  const cy = still ? y : y + pinBob(t, r);
  if (!still) pulseRing(g, x, cy, r, t, b.kind === 'main' ? PIN : b.kind === 'taxi' ? TAXI_YELLOW : b.color);
  if (b.kind === 'main') {
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 === 0 ? r * 1.25 : r * 0.5;
      if (i === 0) g.moveTo(x + Math.cos(a) * rr, cy + Math.sin(a) * rr);
      else g.lineTo(x + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
    g.closePath();
    g.fillStyle = PIN;
    g.fill();
    g.strokeStyle = OUTLINE;
    g.lineWidth = 1.2;
    g.stroke();
  } else if (b.kind === 'side') {
    const d = r * 1.15;
    g.beginPath();
    g.moveTo(x, cy - d);
    g.lineTo(x + d, cy);
    g.lineTo(x, cy + d);
    g.lineTo(x - d, cy);
    g.closePath();
    g.fillStyle = b.color;
    g.fill();
    g.strokeStyle = OUTLINE;
    g.lineWidth = 1.2;
    g.stroke();
    g.font = `700 ${Math.round(r * 1.4)}px system-ui,sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#fff';
    g.fillText('?', x, cy);
    g.textBaseline = 'alphabetic';
  } else if (b.kind === 'objective') {
    g.strokeStyle = b.color;
    g.lineWidth = 2;
    g.beginPath();
    g.arc(x, cy, r, 0, TAU);
    g.stroke();
    g.beginPath();
    g.arc(x, cy, r * 0.45, 0, TAU);
    g.fillStyle = b.color;
    g.fill();
    g.strokeStyle = OUTLINE;
    g.lineWidth = 1.2;
    g.stroke();
  } else {
    const h = r * 0.9;
    const rr = 2;
    g.beginPath();
    g.moveTo(x - h + rr, cy - h);
    g.arcTo(x + h, cy - h, x + h, cy + h, rr);
    g.arcTo(x + h, cy + h, x - h, cy + h, rr);
    g.arcTo(x - h, cy + h, x - h, cy - h, rr);
    g.arcTo(x - h, cy - h, x + h, cy - h, rr);
    g.closePath();
    g.fillStyle = TAXI_YELLOW;
    g.fill();
    g.strokeStyle = OUTLINE;
    g.lineWidth = 1.2;
    g.stroke();
    g.font = `800 ${Math.round(r * 1.3)}px system-ui,sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#000';
    g.fillText('T', x, cy);
    g.textBaseline = 'alphabetic';
  }
}

/** A place marker (never bobs): the Speedway's chequered flag, or Pay 'n' Glaze's pink spray drop. */
function drawPlace(g: CanvasRenderingContext2D, x: number, y: number, r: number, kind: 'speedway' | 'glaze'): void {
  g.strokeStyle = OUTLINE;
  g.lineWidth = 1.2;
  if (kind === 'speedway') {
    // A flag on a pole: 3 x 2 chequer.
    const w = r * 1.8, h = r * 1.2, x0 = x - w / 2 + r * 0.3, y0 = y - h;
    g.fillStyle = '#ffffff';
    g.fillRect(x0, y0, w, h);
    g.fillStyle = '#111111';
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) if ((i + j) % 2 === 0) g.fillRect(x0 + (i * w) / 3, y0 + (j * h) / 2, w / 3, h / 2);
    g.strokeRect(x0, y0, w, h);
    g.beginPath();
    g.moveTo(x0, y0);
    g.lineTo(x0, y + r);
    g.lineWidth = 1.8;
    g.stroke();
    return;
  }
  // A drop: round bottom, pointed top.
  g.beginPath();
  g.moveTo(x, y - r * 1.3);
  g.quadraticCurveTo(x + r, y - r * 0.2, x + r * 0.85, y + r * 0.35);
  g.arc(x, y + r * 0.35, r * 0.85, 0, Math.PI);
  g.quadraticCurveTo(x - r, y - r * 0.2, x, y - r * 1.3);
  g.closePath();
  g.fillStyle = '#ff3b9a';
  g.fill();
  g.stroke();
}

/**
 * The dashed route to the waypoint, in screen points: a dark underlay, then the route colour on top, both dashes crawling
 * along the line. `small` is the minimap's weight; the big map is heavier.
 */
function strokeRoute(g: CanvasRenderingContext2D, pts: [number, number][], color: string, t: number, small: boolean): void {
  g.lineJoin = 'round';
  g.lineCap = 'round';
  g.setLineDash(small ? [4, 3] : [6, 4]);
  g.lineDashOffset = -t * 8;
  g.beginPath();
  pts.forEach(([x, y], i) => (i === 0 ? g.moveTo(x, y) : g.lineTo(x, y)));
  g.strokeStyle = 'rgba(0,0,0,.55)';
  g.lineWidth = small ? 3.2 : 4;
  g.stroke();
  g.strokeStyle = color;
  g.lineWidth = small ? 1.8 : 2.4;
  g.stroke();
  g.setLineDash([]);
  g.lineDashOffset = 0;
}

interface LegendRow { text: string; blip?: Blip; route?: string; dot?: string }
const LEGEND: LegendRow[] = [
  { text: 'Story mission', blip: { x: 0, z: 0, color: PIN, kind: 'main' } },
  { text: 'Side quest (colour = who offers it)', blip: { x: 0, z: 0, color: '#3ad1c4', kind: 'side' } },
  { text: 'Current objective', blip: { x: 0, z: 0, color: '#ff7a00', kind: 'objective' } },
  { text: 'Turfton Taxi', blip: { x: 0, z: 0, color: TAXI_YELLOW, kind: 'taxi' } },
  { text: 'Route to waypoint', route: '#ffd23f' },
  { text: 'Hospital', dot: '#ff3b3b' },
  { text: "Pay 'n' Glaze", blip: { x: 0, z: 0, color: '#ff3b9a', kind: 'glaze' } },
  { text: 'Lost & Found Speedway', blip: { x: 0, z: 0, color: '#ffffff', kind: 'speedway' } },
  { text: 'Side-Valve Salvage', dot: '#f08a24' },
  { text: 'Parked vehicle', dot: '#ffd23f' },
];

/** The big map's legend, bottom-left: what each marker, the route and the dots mean. Sized to its widest label. */
function drawLegend(g: CanvasRenderingContext2D, px: number): void {
  const small = px < 360;
  const fs = small ? 10 : 11;
  const rowH = small ? 14 : 16;
  const pad = 8;
  const iconW = 16;
  const font = `600 ${fs}px system-ui,sans-serif`;
  g.font = font;
  let textW = 0;
  for (const row of LEGEND) textW = Math.max(textW, g.measureText(row.text).width);
  const w = pad * 2 + iconW + 6 + textW;
  const h = pad * 2 + rowH * LEGEND.length;
  const x0 = 8;
  const y0 = px - 8 - h;
  const rad = 8;
  g.fillStyle = 'rgba(10,12,16,.72)';
  g.beginPath();
  g.moveTo(x0 + rad, y0);
  g.arcTo(x0 + w, y0, x0 + w, y0 + h, rad);
  g.arcTo(x0 + w, y0 + h, x0, y0 + h, rad);
  g.arcTo(x0, y0 + h, x0, y0, rad);
  g.arcTo(x0, y0, x0 + w, y0, rad);
  g.closePath();
  g.fill();
  LEGEND.forEach((row, i) => {
    const cy = y0 + pad + rowH * i + rowH / 2;
    const ix = x0 + pad + iconW / 2;
    if (row.blip) {
      drawMarker(g, ix, cy, 5, 0, row.blip, true);
    } else if (row.route) {
      g.setLineDash([4, 3]);
      g.strokeStyle = row.route;
      g.lineWidth = 2.4;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(ix - 7, cy);
      g.lineTo(ix + 7, cy);
      g.stroke();
      g.setLineDash([]);
    } else if (row.dot) {
      g.beginPath();
      g.arc(ix, cy, 3, 0, TAU);
      g.fillStyle = row.dot;
      g.fill();
      g.strokeStyle = OUTLINE;
      g.lineWidth = 0.8;
      g.stroke();
    }
    g.font = font;
    g.textAlign = 'left';
    g.textBaseline = 'middle';
    g.fillStyle = '#fff';
    g.fillText(row.text, x0 + pad + iconW + 6, cy);
  });
  g.textBaseline = 'alphabetic';
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

/** Text where `{{Name}}` is drawn as a gold name. The only markup a quest line or a toast uses. */
function richNodes(text: string): Node[] {
  return text.split(/\{\{(.+?)\}\}/).map((part, i) => (i % 2 === 1 ? el('span', 'gta-name', part) : document.createTextNode(part)));
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

function dryColor(v: number): string {
  const t = clamp01(v);
  const c = (i: number) => Math.round(DRY_DARK[i] + (DRY_LIGHT[i] - DRY_DARK[i]) * t);
  return `rgb(${c(0)},${c(1)},${c(2)})`;
}

/** Hillshade sample spacing, world units. */
const SHADE_CELL = 4;

/**
 * Shade the terrain on the map canvas `g` (W x W pixels, mirrored like buildBackground). Light comes from the north-west
 * and above. Darker than flat ground is black, lighter is white; level ground stays fully transparent.
 */
function drawHillshade(g: CanvasRenderingContext2D, H: number, W: number): void {
  const n = Math.ceil(W / SHADE_CELL);
  const off = document.createElement('canvas');
  off.width = n;
  off.height = n;
  const og = off.getContext('2d');
  if (!og) return;
  const img = og.createImageData(n, n);
  const d = img.data;
  const len = Math.hypot(-0.5, 0.75, -0.5);
  const Lx = -0.5 / len;
  const Ly = 0.75 / len;
  const Lz = -0.5 / len;
  const shade0 = Ly; // flat ground: normal (0, 1, 0)
  const nrm = { x: 0, y: 1, z: 0 };
  for (let py = 0; py < n; py++) {
    for (let px = 0; px < n; px++) {
      const x = H - (px + 0.5) * SHADE_CELL;
      const z = H - (py + 0.5) * SHADE_CELL;
      normalAt(x, z, nrm);
      const shade = nrm.x * Lx + nrm.y * Ly + nrm.z * Lz;
      const i = (py * n + px) * 4;
      if (shade < shade0) {
        d[i] = 0;
        d[i + 1] = 0;
        d[i + 2] = 0;
        d[i + 3] = clamp01((shade0 - shade) * 1.6) * 0.45 * 255;
      } else {
        d[i] = 255;
        d[i + 1] = 255;
        d[i + 2] = 255;
        d[i + 3] = clamp01((shade - shade0) * 1.2) * 0.3 * 255;
      }
    }
  }
  og.putImageData(img, 0, 0);
  g.imageSmoothingEnabled = true;
  g.drawImage(off, 0, 0, W, W);
}

/** The static minimap picture of a world: 1 pixel per world unit, north (+z) up. */
function buildBackground(world: World): HTMLCanvasElement {
  const H = world.half;
  const W = 2 * H;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = W;
  const g = c.getContext('2d');
  if (!g) return c;
  // Mirrored in x so the picture agrees with the 3D view: facing north (+z), east (-x) is on the right.
  const X = (x: number) => H - x;
  const Y = (z: number) => H - z;
  // A world rectangle as a pixel rectangle [x, y, w, h] (the mirror flips it, so take the corners in order).
  const rect = (minX: number, maxX: number, minZ: number, maxZ: number): [number, number, number, number] => {
    const x0 = X(maxX);
    const z0 = Y(maxZ);
    return [x0, z0, X(minX) - x0, Y(minZ) - z0];
  };
  const poly = (pts: [number, number][], color: number, edge?: { color: number; width: number }) => {
    g.beginPath();
    pts.forEach(([x, z], i) => (i === 0 ? g.moveTo(X(x), Y(z)) : g.lineTo(X(x), Y(z))));
    g.closePath();
    g.fillStyle = hexColor(color);
    g.fill();
    if (edge) {
      g.strokeStyle = hexColor(edge.color);
      g.lineWidth = edge.width;
      g.stroke();
    }
  };

  g.fillStyle = hexColor(MAP.city);
  g.fillRect(0, 0, W, W);
  // Regions from their border polygons (data.border in the region documents).
  for (const id of REGION_IDS) {
    if (id === 'turfton') continue;
    poly(REGIONS[id].border, MAP[REGIONS[id].data.region]);
  }
  // Turfton on top.
  g.fillStyle = hexColor(MAP.city);
  g.fillRect(...rect(-CITY_HALF, CITY_HALF, -CITY_HALF, CITY_HALF));

  // Hills: a hillshade over the ground colours (flat terrain draws nothing, so the map is unchanged).
  if (!terrainFlat()) drawHillshade(g, H, W);

  // Still water under the roads: the reserved still-water bodies filled, the river course stroked. The roads drawn
  // after them sit on top, which shows the bridge points.
  g.fillStyle = hexColor(MAP.water);
  for (const w of waterBodies()) g.fillRect(...rect(w.minX, w.maxX, w.minZ, w.maxZ));
  g.strokeStyle = hexColor(MAP.water);
  g.lineCap = 'round';
  g.lineJoin = 'round';
  for (const p of waterPaths()) {
    g.beginPath();
    p.points.forEach(([x, z], i) => (i === 0 ? g.moveTo(X(x), Y(z)) : g.lineTo(X(x), Y(z))));
    g.lineWidth = p.width;
    g.stroke();
  }

  // Roads: every link once (from the lower id to the higher one). A light edge under each dark road keeps it visible on
  // every ground colour.
  const byId = new Map<number, RoadNode>();
  for (const n of world.roads.nodes) byId.set(n.id, n);
  const roadPath = () => {
    g.beginPath();
    for (const n of world.roads.nodes) {
      for (const id of n.links) {
        if (id <= n.id) continue;
        const m = byId.get(id);
        if (!m) continue;
        g.moveTo(X(n.x), Y(n.z));
        g.lineTo(X(m.x), Y(m.z));
      }
    }
  };
  g.lineCap = 'round';
  roadPath();
  g.strokeStyle = hexColor(MAP.roadEdge);
  g.lineWidth = ROAD_WIDTH + 2.5;
  g.stroke();
  roadPath();
  g.strokeStyle = hexColor(MAP.road);
  g.lineWidth = ROAD_WIDTH;
  g.stroke();

  // The Lost & Found Speedway: the closed circuit with a white kerb edge and its pit lane.
  const trackPath = () => {
    g.beginPath();
    trackSamples().forEach((p, i) => (i === 0 ? g.moveTo(X(p.x), Y(p.z)) : i % 3 === 0 ? g.lineTo(X(p.x), Y(p.z)) : undefined));
    g.closePath();
  };
  g.lineJoin = 'round';
  trackPath();
  g.strokeStyle = '#f4f4f4';
  g.lineWidth = TRACK.width + 3;
  g.stroke();
  trackPath();
  g.strokeStyle = hexColor(MAP.road);
  g.lineWidth = TRACK.width;
  g.stroke();
  g.beginPath();
  PIT_LANE.forEach(([x, z], i) => (i === 0 ? g.moveTo(X(x), Y(z)) : g.lineTo(X(x), Y(z))));
  g.lineWidth = 5;
  g.stroke();

  // Fort Sandpit: sand inside a walled outline.
  const b = world.base;
  g.fillStyle = hexColor(MAP.sand);
  g.fillRect(...rect(b.minX, b.maxX, b.minZ, b.maxZ));
  g.strokeStyle = hexColor(MAP.wall);
  g.lineWidth = 2;
  g.strokeRect(...rect(b.minX, b.maxX, b.minZ, b.maxZ));

  // Runway: forward = (sin yaw, cos yaw), width across it.
  const a = world.airfield;
  const fx = Math.sin(a.yaw);
  const fz = Math.cos(a.yaw);
  const sx = Math.cos(a.yaw);
  const sz = -Math.sin(a.yaw);
  const hl = a.length / 2;
  const hw = a.width / 2;
  poly(
    [
      [a.x + fx * hl + sx * hw, a.z + fz * hl + sz * hw],
      [a.x + fx * hl - sx * hw, a.z + fz * hl - sz * hw],
      [a.x - fx * hl - sx * hw, a.z - fz * hl - sz * hw],
      [a.x - fx * hl + sx * hw, a.z - fz * hl + sz * hw],
    ],
    MAP.runway,
    { color: MAP.runwayEdge, width: 1.5 },
  );

  // Buildings and walls: a light fill with a dark edge, so they stand out from the ground around them.
  g.fillStyle = hexColor(MAP.building);
  g.strokeStyle = OUTLINE;
  g.lineWidth = 1;
  for (const bx of world.boxes) {
    if (bx.h < 2) continue;
    const r = rect(bx.minX, bx.maxX, bx.minZ, bx.maxZ);
    g.fillRect(...r);
    g.strokeRect(...r);
  }
  return c;
}

export function createHud(ui: HTMLElement): Hud {
  const root = el('div');
  root.id = 'gta-hud';
  const style = el('style');
  style.textContent = CSS;
  root.append(style);

  // Top-left: Hat Watch, health, gun and ammo, flight readout, cracked count, first-visit help.
  const tl = el('div', 'gta-tl');
  // Meters, under the minimap and left of the gear: Hat Watch (wanted) and Clay (life).
  const meters = el('div', 'gta-meters');
  const wantedEl = el('span', 'gta-meter');
  wantedEl.setAttribute('aria-label', 'Hat Watch');
  const lifeEl = el('span', 'gta-meter');
  lifeEl.setAttribute('aria-label', 'Clay');
  meters.append(wantedEl, lifeEl);
  // Under the icons: the gun with its ammo over it, then the gun's name (and RELOADING, when it applies).
  const gunBlock = el('div', 'gta-gunblock');
  const gunName = el('span', 'gta-gunname');
  const gunBox = el('span', 'gta-gunbox');
  const gunIcon = el('span', 'gta-gunicon');
  const ammoEl = el('span', 'gta-ammo', '0 / 0');
  gunBox.append(gunIcon, ammoEl);
  const reloadEl = el('span', 'gta-reload', 'RELOADING');
  gunBlock.append(gunBox, gunName, reloadEl);
  const hoaEl = el('div', 'gta-hoa', 'HOA ENFORCEMENT');
  const flightEl = el('div', 'gta-flight');
  const altEl = el('div');
  const spdEl = el('div');
  const chuteEl = el('div', 'gta-chute', 'PARACHUTE');
  flightEl.append(altEl, spdEl, chuteEl);
  flightEl.style.display = 'none';
  chuteEl.style.display = 'none';
  const acornsEl = el('div', 'gta-acorns');
  acornsEl.style.display = 'none';
  const debtEl = el('div', 'gta-debt');
  debtEl.style.display = 'none';
  const crackedEl = el('div', 'gta-cracked', 'Cracked: 0');
  const substatsEl = el('div', 'gta-substats');
  const timeEl = el('span');
  const stuntsEl = el('span');
  substatsEl.append(timeEl, stuntsEl);
  const buffEl = el('div', 'gta-buff');
  buffEl.style.display = 'none';
  const questEl = el('div', 'gta-quest');
  tl.append(hoaEl, flightEl, acornsEl, debtEl, crackedEl, substatsEl, buffEl, questEl);
  const fine = matchMedia('(pointer: fine)').matches;
  const help = el('div', 'gta-help', fine ? HELP_DESKTOP : HELP_TOUCH);
  tl.append(help);
  setTimeout(() => help.remove(), 8000);

  // Top-right: minimap.
  const tr = el('div', 'gta-tr');
  const mapCanvas = el('canvas', 'gta-map');
  tr.append(mapCanvas);
  const mapCtx = mapCanvas.getContext('2d');

  const toasts = el('div', 'gta-toasts');
  const cross = el('div', 'gta-cross');
  cross.innerHTML = CROSS_SVG;
  const biomeEl = el('div', 'gta-biome');
  const bannerBox = el('div', 'gta-banner');
  const calloutBox = el('div', 'gta-callout');
  const flashEl = el('div', 'gta-flash');

  // Bottom-centre: vehicle name, boost bar and prompt.
  const bottom = el('div', 'gta-bottom');
  const vehicleEl = el('div', 'gta-pill');
  const boostWrap = el('div', 'gta-boost-wrap');
  const boostFill = el('div', 'gta-boost-fill');
  boostWrap.append(boostFill);
  const promptEl = el('div', 'gta-pill');
  vehicleEl.style.display = 'none';
  promptEl.style.display = 'none';
  bottom.append(vehicleEl, boostWrap, promptEl);

  const online = el('div', 'gta-online');
  online.style.display = 'none';

  // Big map: click or tap the minimap, or press M, to see the whole world; click, tap, M or Esc closes it.
  const big = el('div', 'gta-big');
  const bigCanvas = el('canvas');
  const bigHint = el('div', 'gta-bighint', 'Click, tap, M or Esc to close');
  big.append(bigCanvas, bigHint);

  root.append(tl, tr, meters, gunBlock, toasts, cross, biomeEl, bannerBox, calloutBox, flashEl, bottom, online, big);
  ui.append(root);

  // ---- Minimap -------------------------------------------------------------------------------------------------
  // Objective pins turn and bob; players who ask for less motion get them still.
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clock = () => (reduceMotion ? 0 : performance.now() / 1000);
  let size = 0;
  let mapDpr = 1;
  let bgCanvas: HTMLCanvasElement | null = null;

  function sizeMap(px: number) {
    size = px;
    // The right-hand column hangs off the minimap's size (see the CSS). The settings gear reads the same variable.
    document.documentElement.style.setProperty('--gta-map', `${px}px`);
    mapDpr = window.devicePixelRatio || 1;
    mapCanvas.style.width = `${px}px`;
    mapCanvas.style.height = `${px}px`;
    mapCanvas.width = Math.round(px * mapDpr);
    mapCanvas.height = Math.round(px * mapDpr);
  }

  function drawMap(s: HudState) {
    if (!mapCtx) return;
    const want = window.innerWidth < 420 ? 96 : 128;
    if (want !== size) sizeMap(want);
    const g = mapCtx;
    const dev = mapCanvas.width;
    const px0 = s.player.x;
    const pz0 = s.player.z;
    const t = clock();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, dev, dev);
    if (bgCanvas) {
      const H = bgCanvas.width / 2;
      const k = dev / MAP_VIEW; // device pixels per world unit
      // Window in background pixels (1 px per unit): left edge, top edge. The picture is mirrored in x, so the window
      // starts at the player's mirrored column.
      const bx0 = H - px0 - MAP_RANGE;
      const by0 = H - pz0 - MAP_RANGE;
      g.fillStyle = MAP_BLANK;
      g.fillRect(0, 0, dev, dev);
      const cx0 = Math.max(bx0, 0);
      const cy0 = Math.max(by0, 0);
      const cx1 = Math.min(bx0 + MAP_VIEW, bgCanvas.width);
      const cy1 = Math.min(by0 + MAP_VIEW, bgCanvas.height);
      if (cx1 > cx0 && cy1 > cy0) {
        g.drawImage(
          bgCanvas, cx0, cy0, cx1 - cx0, cy1 - cy0,
          (cx0 - bx0) * k, (cy0 - by0) * k, (cx1 - cx0) * k, (cy1 - cy0) * k,
        );
      }
      // Blips in range, in CSS pixels. Screen x is mirrored like the picture: east (-x) is on the right.
      g.setTransform(mapDpr, 0, 0, mapDpr, 0, 0);
      const ks = size / MAP_VIEW;
      const half = size / 2;
      if (s.route && s.route.points.length >= 2) {
        strokeRoute(
          g,
          s.route.points.map((p): [number, number] => [half - (p.x - px0) * ks, half - (p.z - pz0) * ks]),
          s.route.color,
          t,
          true,
        );
      }
      for (const b of s.blips) {
        const dx = b.x - px0;
        const dz = b.z - pz0;
        if (!b.quest && (b.kind === 'speedway' || b.kind === 'glaze')) {
          if (Math.abs(dx) < MAP_RANGE - 6 && Math.abs(dz) < MAP_RANGE - 6) drawMarker(g, half - dx * ks, half - dz * ks, size < 110 ? 5 : 6, t, b, true);
          continue;
        }
        if (b.quest) {
          // Objectives always show. One off the map sits on its edge as an arrow pointing the way to it.
          const lim = MAP_RANGE - 14;
          const k2 = Math.max(1, Math.abs(dx) / lim, Math.abs(dz) / lim);
          const qx = half - (dx / k2) * ks;
          const qy = half - (dz / k2) * ks;
          if (k2 > 1) drawEdgePointer(g, qx, qy, half, half, t, kindColor(b));
          else drawMarker(g, qx, qy, size < 110 ? 5 : 6, t, b);
          continue;
        }
        // Another player past the map's edge sits on the rim, dimmed, so you can still see which way they are.
        let ex = dx;
        let ez = dz;
        let far = false;
        if (Math.abs(dx) > MAP_RANGE || Math.abs(dz) > MAP_RANGE) {
          if (!b.player) continue;
          const k3 = Math.max(Math.abs(dx), Math.abs(dz)) / (MAP_RANGE - 6);
          ex = dx / k3;
          ez = dz / k3;
          far = true;
        }
        g.globalAlpha = far ? 0.6 : 1;
        g.beginPath();
        g.arc(half - ex * ks, half - ez * ks, far ? 1.5 : 1.8, 0, Math.PI * 2);
        g.fillStyle = b.color;
        g.fill();
        g.strokeStyle = OUTLINE;
        g.lineWidth = 0.8;
        g.stroke();
        g.globalAlpha = 1;
      }
    }
    // Player: white arrow at the centre along yaw. Forward in world (sin, cos) is (sin, -cos) on the map.
    g.setTransform(mapDpr, 0, 0, mapDpr, 0, 0);
    const cx = size / 2;
    const cy = size / 2;
    const fx = -Math.sin(s.player.yaw);
    const fy = -Math.cos(s.player.yaw);
    const perpX = -fy;
    const perpY = fx;
    g.beginPath();
    g.moveTo(cx + fx * 7, cy + fy * 7);
    g.lineTo(cx - fx * 3 + perpX * 4, cy - fy * 3 + perpY * 4);
    g.lineTo(cx - fx * 3 - perpX * 4, cy - fy * 3 - perpY * 4);
    g.closePath();
    g.fillStyle = '#fff';
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,.6)';
    g.lineWidth = 1;
    g.stroke();
  }

  sizeMap(window.innerWidth < 420 ? 96 : 128);

  // ---- Big map ---------------------------------------------------------------------------------------------------
  let bigOpen = false;
  let bigPx = 0;
  function setBig(open: boolean) {
    if (open === bigOpen) return;
    bigOpen = open;
    big.classList.toggle('open', open);
    if (open && document.pointerLockElement) document.exitPointerLock();
  }
  mapCanvas.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); setBig(true); });
  big.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); setBig(false); });
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyM') setBig(!bigOpen);
    else if (e.code === 'Escape') setBig(false);
  });

  function drawBig(s: HudState) {
    if (!bgCanvas) return;
    const t = clock();
    const px = Math.max(160, Math.floor(Math.min(window.innerWidth - 24, window.innerHeight - 70)));
    const dpr = window.devicePixelRatio || 1;
    if (px !== bigPx) {
      bigPx = px;
      bigCanvas.style.width = `${px}px`;
      bigCanvas.style.height = `${px}px`;
      bigCanvas.width = Math.round(px * dpr);
      bigCanvas.height = Math.round(px * dpr);
    }
    const g = bigCanvas.getContext('2d');
    if (!g) return;
    const W = bgCanvas.width;
    const k = px / W; // CSS pixels per world unit
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.imageSmoothingEnabled = true;
    g.drawImage(bgCanvas, 0, 0, px, px);
    const X = (x: number) => (W / 2 - x) * k; // mirrored, as on the minimap
    const Y = (z: number) => (W / 2 - z) * k;
    if (s.route && s.route.points.length >= 2) {
      strokeRoute(g, s.route.points.map((p): [number, number] => [X(p.x), Y(p.z)]), s.route.color, t, false);
    }
    for (const b of s.blips) {
      if (!b.quest && (b.kind === 'speedway' || b.kind === 'glaze')) {
        drawMarker(g, X(b.x), Y(b.z), 7, t, b, true);
        if (b.label) {
          g.font = '700 11px system-ui,sans-serif';
          g.textAlign = 'center';
          g.lineWidth = 3;
          g.strokeStyle = 'rgba(0,0,0,.8)';
          g.strokeText(b.label, X(b.x), Y(b.z) + 20);
          g.fillStyle = '#fff';
          g.fillText(b.label, X(b.x), Y(b.z) + 20);
        }
        continue;
      }
      if (b.quest) {
        const qx = X(b.x);
        const qy = Y(b.z);
        drawMarker(g, qx, qy, 8, t, b);
        g.font = '700 12px system-ui,sans-serif';
        g.textAlign = 'center';
        g.lineWidth = 3;
        g.strokeStyle = 'rgba(0,0,0,.8)';
        const ly = qy - 14 + pinBob(t, 8);
        g.strokeText(b.quest, qx, ly);
        g.fillStyle = '#fff';
        g.fillText(b.quest, qx, ly);
        continue;
      }
      g.fillStyle = b.color;
      g.beginPath();
      g.arc(X(b.x), Y(b.z), 2, 0, Math.PI * 2);
      g.fill();
      if (b.label) {
        // Another player's name, small, over their dot.
        g.font = '700 11px system-ui,sans-serif';
        g.textAlign = 'center';
        g.lineWidth = 3;
        g.strokeStyle = 'rgba(0,0,0,.8)';
        g.strokeText(b.label, X(b.x), Y(b.z) - 5);
        g.fillStyle = '#fff';
        g.fillText(b.label, X(b.x), Y(b.z) - 5);
      }
    }
    // One name per region, at its label point (the average of its border; two corner regions use an inner point).
    g.font = px < 360 ? '700 10px system-ui,sans-serif' : '700 12px system-ui,sans-serif';
    g.textAlign = 'center';
    g.fillStyle = 'rgba(0,0,0,.65)';
    for (const id of REGION_IDS) {
      const r = REGIONS[id];
      const lp = LABEL_AT[id] ?? averagePoint(r.border);
      g.fillText(r.name, X(lp[0]), Y(lp[1]));
    }
    drawLegend(g, px);
    // Player arrow.
    const cx = X(s.player.x);
    const cy = Y(s.player.z);
    const fx = -Math.sin(s.player.yaw);
    const fy = -Math.cos(s.player.yaw);
    g.beginPath();
    g.moveTo(cx + fx * 9, cy + fy * 9);
    g.lineTo(cx - fx * 4 - fy * 5, cy - fy * 4 + fx * 5);
    g.lineTo(cx - fx * 4 + fy * 5, cy - fy * 4 - fx * 5);
    g.closePath();
    g.fillStyle = '#fff';
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,.7)';
    g.lineWidth = 1.5;
    g.stroke();
  }

  // ---- Gun icon ------------------------------------------------------------------------------------------------
  let gunShown: string | null = null;
  function setGun(name: string) {
    if (name === gunShown) return;
    gunShown = name;
    const kind = (Object.keys(GUNS) as GunKind[]).find((k) => GUNS[k].name === name);
    let node: HTMLElement | null = null;
    try {
      node = prefabIconElement(kind ? GUNS[kind].prefab : undefined, '🔫', 40);
    } catch {
      node = null;
    }
    if (!node) {
      node = el('span', undefined, '🔫');
    }
    gunIcon.replaceChildren(node);
    gunName.textContent = name;
  }

  // ---- Biome label ---------------------------------------------------------------------------------------------
  let biomeTimer = 0;
  function showBiome(name: string) {
    biomeEl.textContent = name;
    biomeEl.classList.add('show');
    clearTimeout(biomeTimer);
    biomeTimer = window.setTimeout(() => biomeEl.classList.remove('show'), BIOME_SHOW_MS);
  }

  // ---- Per-frame state (DOM written only on change) ----------------------------------------------------------------
  const last: {
    heat?: number; health?: number; ammo?: number; mag?: number; reloading?: boolean; gun?: string;
    vehicle?: string | null; cracked?: number; acorns?: number; debt?: number; prompt?: string | null; online?: string | null;
    altitude?: number | null; speed?: number | null; chute?: boolean; biome?: string; district?: string | null;
    timeLabel?: string; boost?: number | null; buff?: string | null; stunts?: string;
  } = {};

  return {
    setWorld(world: World) {
      bgCanvas = buildBackground(world);
    },
    set(s: HudState) {
      if (s.heat !== last.heat) {
        last.heat = s.heat;
        const maxHeat = Math.max(MAX_HEAT, 4);
        const isHoa = s.heat >= 4;
        const share = isHoa ? 1 : clamp01(s.heat / maxHeat);
        const tier = isHoa ? 4 : Math.min(3, Math.max(0, Math.floor(s.heat)));
        const color = isHoa ? '#d4af37' : tier >= 3 ? '#ff5a4d' : '#2f55d4';
        drawMeter(wantedEl, 'wanted', tier, share, color);
        wantedEl.classList.toggle('hot', s.heat >= 1);
        wantedEl.classList.toggle('hoa', isHoa);
        hoaEl.classList.toggle('on', isHoa);
      }
      if (s.health !== last.health) {
        last.health = s.health;
        const v = clamp01(s.health);
        // Clay's stage counts up from crumbled to smug; the 3D face's damage level counts the other way.
        drawMeter(lifeEl, 'life', 4 - Math.min(4, Math.floor(v * 5)), v, dryColor(v));
      }
      if (s.ammo !== last.ammo || s.mag !== last.mag) {
        last.ammo = s.ammo;
        last.mag = s.mag;
        ammoEl.textContent = `${s.ammo} / ${s.mag}`;
      }
      if (s.reloading !== last.reloading) {
        last.reloading = s.reloading;
        reloadEl.classList.toggle('on', s.reloading);
      }
      if (s.gun !== last.gun) {
        last.gun = s.gun;
        setGun(s.gun);
      }
      if (s.acorns !== last.acorns) {
        last.acorns = s.acorns;
        if (s.acorns === undefined) {
          acornsEl.style.display = 'none';
        } else {
          acornsEl.style.display = '';
          acornsEl.textContent = `🌰 ${s.acorns.toLocaleString()}`;
        }
      }
      if (s.debt !== last.debt) {
        last.debt = s.debt;
        if (s.debt !== undefined && s.debt > 0) {
          debtEl.style.display = '';
          debtEl.textContent = `Kiln-Debt: ${s.debt.toLocaleString()}`;
        } else {
          debtEl.style.display = 'none';
        }
      }
      if (s.cracked !== last.cracked) {
        last.cracked = s.cracked;
        crackedEl.textContent = `Cracked: ${s.cracked}`;
      }
      if (s.vehicle !== last.vehicle) {
        last.vehicle = s.vehicle;
        vehicleEl.style.display = s.vehicle === null ? 'none' : '';
        vehicleEl.textContent = s.vehicle ?? '';
      }
      if (s.prompt !== last.prompt) {
        last.prompt = s.prompt;
        promptEl.style.display = s.prompt === null ? 'none' : '';
        promptEl.textContent = s.prompt === null ? '' : (fine ? 'E: ' : '') + s.prompt;
      }
      if (s.online !== last.online) {
        last.online = s.online;
        online.style.display = s.online === null ? 'none' : '';
        online.textContent = s.online ?? '';
      }
      // Flight panel: only while altitude is known (flying or falling).
      const alt = s.altitude === null ? null : Math.round(s.altitude);
      if (alt !== last.altitude) {
        last.altitude = alt;
        flightEl.style.display = alt === null ? 'none' : '';
        altEl.textContent = alt === null ? '' : `ALT ${alt} m`;
      }
      const spd = s.speed === null ? null : Math.round(s.speed);
      if (spd !== last.speed) {
        last.speed = spd;
        spdEl.style.display = spd === null ? 'none' : '';
        spdEl.textContent = spd === null ? '' : `SPD ${spd}`;
      }
      if (s.chute !== last.chute) {
        last.chute = s.chute;
        chuteEl.style.display = s.chute ? '' : 'none';
      }
      const locLabel = s.district ? `${s.biome} · ${s.district}` : s.biome;
      if (s.biome !== last.biome || s.district !== last.district) {
        last.biome = s.biome;
        last.district = s.district;
        showBiome(locLabel);
      }
      if (s.timeLabel !== last.timeLabel) {
        last.timeLabel = s.timeLabel;
        timeEl.textContent = s.timeLabel ?? '';
      }
      const stuntText = s.stunts ? `Stunts: ${s.stunts.done}/${s.stunts.total}` : '';
      if (stuntText !== last.stunts) {
        last.stunts = stuntText;
        stuntsEl.textContent = stuntText;
      }
      if (s.buff !== last.buff) {
        last.buff = s.buff;
        buffEl.style.display = s.buff ? '' : 'none';
        buffEl.textContent = s.buff ? `⚡ ${s.buff}` : '';
      }
      const boostVal = s.boost === undefined || s.boost === null ? null : Math.round(s.boost);
      if (boostVal !== last.boost) {
        last.boost = boostVal;
        boostWrap.style.display = boostVal === null ? 'none' : 'block';
        if (boostVal !== null) boostFill.style.width = `${Math.max(0, Math.min(100, boostVal))}%`;
      }
      drawMap(s);
      if (bigOpen) drawBig(s);
    },

    toast(text: string, ms = 2600) {
      const t = el('div', 'gta-pill gta-toast');
      t.append(...richNodes(text));
      toasts.append(t);
      while (toasts.children.length > 4) toasts.firstElementChild?.remove();
      setTimeout(() => t.classList.add('out'), Math.max(0, ms - 400));
      setTimeout(() => t.remove(), ms);
    },

    setObjective(o: { title: string; lines: string[]; demo: boolean } | null) {
      questEl.replaceChildren();
      questEl.style.display = o ? 'block' : 'none';
      if (!o) return;
      // Quiet by design: a small caption, then plain sentences with the names picked out in gold.
      const t = el('div', 'gta-qtitle', o.title);
      if (o.demo) t.append(el('span', 'gta-demo', 'DEMO'));
      questEl.append(t);
      for (const line of o.lines) {
        const row = el('div', 'gta-qline');
        row.append(...richNodes(line));
        questEl.append(row);
      }
    },

    setVisible(visible: boolean) {
      root.style.display = visible ? '' : 'none';
    },

    banner(text: string, ms = 2000) {
      const b = el('div', 'gta-banner-text', text);
      bannerBox.replaceChildren(b);
      setTimeout(() => b.classList.add('out'), Math.max(0, ms - 400));
      setTimeout(() => {
        if (b.parentNode === bannerBox) b.remove();
      }, ms);
    },

    callout(title: string, sub?: string) {
      const main = el('div', 'gta-callout-main', title);
      calloutBox.replaceChildren(main);
      if (sub) calloutBox.append(el('div', 'gta-callout-sub', sub));
      setTimeout(() => {
        if (main.parentNode === calloutBox) calloutBox.replaceChildren();
      }, 2200);
    },

    flash() {
      flashEl.style.transition = 'none';
      flashEl.style.opacity = '0.85';
      requestAnimationFrame(() => {
        flashEl.style.transition = 'opacity .32s ease-out';
        flashEl.style.opacity = '0';
      });
    },
  };
}
