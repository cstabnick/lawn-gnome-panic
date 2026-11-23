import { GSR_TRACKS } from '@lawn/music';
import { getArchipelagoNode } from '../data/archipelago';
import type { GsrLevelId } from '../levels/loader';

export interface RadioTickerHandle {
  setStation(levelId: GsrLevelId): void;
  announce(line: string, ttl?: number): void;
  tick(dt: number, beatPulse: number): void;
  setVisible(v: boolean): void;
}

const DISTRICT_CALLOUTS: Record<GsrLevelId, readonly string[]> = {
  'velvet-keys': [
    'Live from Conservatory Courtyard — D Dorian 162 BPM!',
    'Espresso-Dew half off for all Ley-Line Runners!',
    'Pink Gondola Express departing West Pier for Neon Birdbath!',
  ],
  'bongo-basin': [
    'Master Clock locked at 132 BPM A Mixolydian!',
    'Waitress Brenda says: hot acorn-chili at the Big Acorn Diner!',
    '108.0 Subsoil Lift open on the East Shoulder!',
  ],
  'chrome-kiln': [
    'Local 404 Smelters Union: Days Since Glaze Spill = 0.',
    '138 BPM E Phrygian Acid-Funk rattling the crucible!',
    'Ride the Molten Canyon updrafts straight to the 13m Crown!',
  ],
  'neon-birdbath': [
    '170 BPM Liquid Jazz-DnB drifting over the Mist Lagoon!',
    'Honeymoon gondolas arriving from Velvet Keys!',
    'Spiral up to the 16.5m Birdbath Apex Lighthouse!',
  ],
  'mulch-alley': [
    '2 tokens per grind — welcome to Mulch Alley Arcade!',
    '128 BPM Chiptune Funk-Hop fresh off Don Compost’s bootlegs!',
    'Bounce the CRT Bumper Pads to reach the Pinball Mezzanine!',
  ],
  'tupperware-mall': [
    'Attention shoppers: 126 BPM Vapor-Funk in all aisles!',
    '40% off under the inverted Tupperware dome!',
    'Acorn-fizz smoothies now blending at the Food Court!',
  ],
  'hoa-citadel': [
    'Section 12-B: Neon skate wax is strictly non-compliant!',
    '134 BPM Bylaw Brass Ska-Punk echoing off the Gazebo!',
    'Every marble urn is spaced 10.0m apart—no kickflips!',
  ],
  'subsoil-relay': [
    '108.0 Subsoil Radio streaming 3 yards below Turfton!',
    '166 BPM Deep-Cut Dub-Jungle — phase lock active!',
    'Take the West Subsoil Lift straight back to Bongo Basin!',
  ],
  'zero-hz-zenith': [
    'All 8 regional frequencies converging at 650m!',
    'Paint the silent vinyl grooves to wake the Unfired Choir!',
    'The Original Needle awaits at the 18m Turntable Crown!',
  ],
};

export function createRadioTicker(container: HTMLElement): RadioTickerHandle {
  const box = document.createElement('div');
  box.id = 'gsr-radio-pill';
  box.style.cssText = `
    position:fixed; left:12px; top:76px; z-index:12; display:none; pointer-events:none;
    max-width:min(310px, 56vw); background:rgba(16,6,30,0.84); border:2px solid #00e5ff;
    border-radius:10px; padding:6px 10px; color:#fff; font-family:system-ui,sans-serif;
    box-shadow:3px 3px 0 #ff4ecd;
  `;
  box.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
      <div style="display:flex; align-items:center; gap:6px; min-width:0;">
        <span id="gsr-rad-freq" style="font-size:10px; font-weight:900; padding:2px 6px; border-radius:4px; background:#00e5ff; color:#120624; white-space:nowrap;">88.5 FM</span>
        <span id="gsr-rad-title" style="font-size:11px; font-weight:900; color:#ffd740; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Pirate Radio</span>
      </div>
      <div id="gsr-rad-eq" style="display:flex; align-items:flex-end; gap:2px; height:14px; flex:0 0 auto;">
        <span style="width:3px; height:6px; background:#ff4ecd; border-radius:1px;"></span>
        <span style="width:3px; height:10px; background:#00e5ff; border-radius:1px;"></span>
        <span style="width:3px; height:13px; background:#ffd740; border-radius:1px;"></span>
        <span style="width:3px; height:8px; background:#69f0ae; border-radius:1px;"></span>
      </div>
    </div>
    <div id="gsr-rad-line" style="font-size:10px; color:#dfd3f7; margin-top:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Tuning pirate signal...</div>
  `;
  container.appendChild(box);

  const freqEl = box.querySelector('#gsr-rad-freq') as HTMLElement;
  const titleEl = box.querySelector('#gsr-rad-title') as HTMLElement;
  const lineEl = box.querySelector('#gsr-rad-line') as HTMLElement;
  const eqBars = [...box.querySelectorAll('#gsr-rad-eq span')] as HTMLElement[];

  let currentId: GsrLevelId = 'velvet-keys';
  let calloutIdx = 0;
  let rotateTimer = 6.5;
  let customTtl = 0;

  return {
    setVisible(v) {
      box.style.display = v ? 'block' : 'none';
    },
    setStation(levelId) {
      currentId = levelId;
      calloutIdx = 0;
      rotateTimer = 6.5;
      customTtl = 0;
      const node = getArchipelagoNode(levelId);
      const track = GSR_TRACKS.find((t) => t.areaNumber === node.areaNumber);
      box.style.borderColor = node.color;
      freqEl.style.background = node.color;
      freqEl.textContent = node.frequency;
      titleEl.textContent = track ? `${track.title} · ${track.bpm} BPM` : node.name;
      lineEl.textContent = DISTRICT_CALLOUTS[levelId][0] ?? node.name;
    },
    announce(line, ttl = 4.5) {
      lineEl.textContent = `📻 ${line}`;
      customTtl = ttl;
    },
    tick(dt, beatPulse) {
      for (let i = 0; i < eqBars.length; i++) {
        const h = 4 + Math.round((0.35 + beatPulse * 0.65) * (6 + ((i * 3) % 7)));
        eqBars[i]!.style.height = `${h}px`;
      }
      if (customTtl > 0) {
        customTtl -= dt;
        if (customTtl <= 0) {
          const lines = DISTRICT_CALLOUTS[currentId];
          lineEl.textContent = lines[calloutIdx % lines.length] ?? '';
        }
        return;
      }
      rotateTimer -= dt;
      if (rotateTimer <= 0) {
        rotateTimer = 7.0;
        const lines = DISTRICT_CALLOUTS[currentId];
        calloutIdx = (calloutIdx + 1) % lines.length;
        lineEl.textContent = lines[calloutIdx] ?? '';
      }
    },
  };
}
