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
  {
    id: 'lore-yew-lantern',
    era: 'pre-breakout',
    title: 'Yew Walk Lamplighter Log',
    region: 'lower-walk',
    offset: [5, -6],
    summary: 'Oiled notebook left in a hollow yew trunk.',
    body: 'Oct 18 — Replaced six wicks along the lower hedge. The mist hangs thicker under the yews this autumn; doubled the oil ration for night patrols.',
  },
  {
    id: 'lore-ornament-inventory',
    era: 'pre-breakout',
    title: 'Garden Ornament Registry',
    region: 'ornament-lawn',
    offset: [-6, 5],
    summary: 'Brass-pinned card from the display plinths.',
    body: 'Forty-two terracotta frogs, eighteen sundials, and nine glazed mushrooms catalogued for the Harvest Pageant. Keep the unglazed seconds behind the birdbath.',
  },
  {
    id: 'lore-wreathwood-bells',
    era: 'post-breakout',
    title: 'Tied Ribbon Message',
    region: 'the-rings',
    offset: [7, 4],
    summary: 'Knotted around a snapped wreath frame.',
    body: 'Do not ring the brass chimes in Wreathwood. The Hatless follow the echo through the rings and corner anyone without a climb route.',
  },
  {
    id: 'lore-compost-journal',
    era: 'pre-breakout',
    title: 'Compost Heat Readings',
    region: 'warm-bays',
    offset: [-5, -5],
    summary: 'Pencil chart on waterproofed card.',
    body: 'Bay 3 reached 58°C overnight. Good for winter tomatoes, bad for anyone storing cracked clay near the steaming vents.',
  },
  {
    id: 'lore-chapel-bell',
    era: 'post-breakout',
    title: 'Bell-Chapel Choir Slip',
    region: 'the-nave',
    offset: [4, -7],
    summary: 'Torn hymnal page weighted down with a pebble.',
    body: 'Day 9 — Seven of us held the nave through the storm. When the roof leaked, we sealed every seam with candle wax and prayed the glaze held.',
  },
  {
    id: 'lore-lily-pond-oars',
    era: 'post-breakout',
    title: 'Boardwalk Chalk Mark',
    region: 'lily-pond',
    offset: [-7, 6],
    summary: 'Carved into a damp cedar plank.',
    body: 'The reeds hide them until they are two paces away. Listen for the wet crunch of gravel before stepping onto the footbridge.',
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
