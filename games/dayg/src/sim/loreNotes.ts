// Environmental storytelling: pre-breakout & post-breakout lore notes discovered in Mossgrave.
import type { RegionId } from '../sim/types';

export interface LoreNote {
  id: string;
  era: 'pre-breakout' | 'post-breakout';
  title: string;
  region: RegionId;
  offset: [number, number];
  summary: string;
  body: string;
}

export const LORE_NOTES: readonly LoreNote[] = [
  {
    id: 'lore-groundskeeper-ledger',
    era: 'pre-breakout',
    title: "Groundskeeper's Final Ledger",
    region: 'forecourt',
    offset: [-14, 10],
    summary: 'Routine maintenance notes before the moss bloom.',
    body: 'Oct 14 — Third shipment of cheap unglazed lawn ornaments arrived cracked at the seam. Told the Yard Council to seal them before the autumn damp, or the moss will root right into the clay.',
  },
  {
    id: 'lore-gate-roster',
    era: 'post-breakout',
    title: 'Lychgate Watch Roster',
    region: 'gate-roof',
    offset: [-10, -4],
    summary: 'Chalked shift schedule on the gatehouse parapet.',
    body: 'Day 3 — Do not open the lower grate after sundown. The Hatless pile up against the kerbs if you shine a lantern over the edge. Keep two coils of rope ready on the north post.',
  },
  {
    id: 'lore-verge-picnic',
    era: 'pre-breakout',
    title: 'Faded Picnic Flyer',
    region: 'verge-path',
    offset: [6, -6],
    summary: 'A damp paper flyer pinned beneath a stone.',
    body: 'ANNUAL MOSSGRAVE LANTERN STROLL — Bring cider, seed-cakes, and your brightest Sunday hat! Prizes for tallest cone. Hosted by the Keeping.',
  },
  {
    id: 'lore-bin-scavenger',
    era: 'post-breakout',
    title: 'Scratched Tin Tag',
    region: 'bin-corner',
    offset: [-5, 5],
    summary: 'Left beside an overturned compost bin.',
    body: 'Cleared the bins at dawn. Left two candles under the hedge for Pip. If the bells ring from the Chapel, run east — do not cut through the Ivy Rows.',
  },
  {
    id: 'lore-ivy-wedding',
    era: 'pre-breakout',
    title: 'Pressed Clover Card',
    region: 'ivy-rows',
    offset: [8, 8],
    summary: 'An invitation tucked inside a weathered vase.',
    body: 'To Barnaby & Fern — May your glaze never craze and your garden stay green. Meet us at The Tap after the evening bell.',
  },
  {
    id: 'lore-leaning-warning',
    era: 'post-breakout',
    title: 'Chalk Arrow on Headstone',
    region: 'leaning-rows',
    offset: [-8, 4],
    summary: 'Hurried warning scrawled in white chalk.',
    body: 'THEY CLIMB THE SHORT KERBS NOW. Keep above 2 metres if you have to rest. Do not drop your trowel — noise draws them from three rows over.',
  },
  {
    id: 'lore-sinks-drainage',
    era: 'pre-breakout',
    title: 'Surveyor Drainage Memo',
    region: 'the-sinks',
    offset: [6, -8],
    summary: 'Stamped by the Fescue Water Board.',
    body: 'Sub-grade basin continues to pool after storms. Standing water softens unsealed clay bases; recommend gravel fill before winter.',
  },
  {
    id: 'lore-angel-vow',
    era: 'post-breakout',
    title: 'Ribbon Tied to the Angel',
    region: 'angel-square',
    offset: [-6, 6],
    summary: 'A frayed yellow scarf knotted around stone.',
    body: 'We counted fourteen survivors at the Tap yesterday. Someone is still broadcasting on 101.7 FM from under the roots. Keep listening.',
  },
  {
    id: 'lore-mason-chisel',
    era: 'pre-breakout',
    title: "Mason's Guild Receipt",
    region: 'masons-corner',
    offset: [4, -4],
    summary: 'Carved tally of limestone plinths.',
    body: 'Twelve plinths delivered, four angel capitals, one brass standpipe cap. Paid in full: 180 acorns.',
  },
  {
    id: 'lore-tap-ration',
    era: 'post-breakout',
    title: 'The Tap Ration Board',
    region: 'the-tap',
    offset: [4, 4],
    summary: 'Charcoal tally on a plank.',
    body: 'Clean water: 1/2 litre per gnome at dusk. Bring firewood or nails if you want a warm spot by the standpipe.',
  },
];

const STORAGE_KEY = 'dayg_lore_notes_v1';

export function getDiscoveredNotes(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function markNoteDiscovered(id: string): boolean {
  const list = getDiscoveredNotes();
  if (list.includes(id)) return false;
  list.push(id);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch { /* ignore */ }
  return true;
}
