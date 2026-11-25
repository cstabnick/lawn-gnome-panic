// The Burrowfolk at home in Loamdeep (E17 issue B11): moles placed in the halls (built on every entry), bobbing,
// nodding, waving and talking; DJ Moleman at the Under-Chorus decks once he visits. Animated in updateMoleFolk.
import type { Object3D } from 'three';
import { getPrefab } from '@lawn/prefabs';
import type { InteriorKit } from '../../interiors/types';
import { currentInterior, interiorToWorld } from '../../interiors';
import { playAt } from '../../sound/bus';
import { LOAMDEEP, SOCIETY_CAST, SOCIETY_INTERIORS } from '../config';
import { loadSocietySave } from '../save';

const TAU = Math.PI * 2;
const E = Math.PI / 2;
const W = -Math.PI / 2;
const S = 0;
const N = Math.PI;
const TALK_DIST = 1.3;

type Kind = 'idle' | 'walker' | 'dancer' | 'pup' | 'moleman';

/** One animated mole. The pivots are looked up once after the prefab is placed. */
interface Mole {
  kind: Kind;
  root: Object3D;
  body?: Object3D;
  head?: Object3D;
  armR?: Object3D;
  baseY: number;
  phase: number;
  nextPaw: number;
  pawUntil: number;
  // walker: moves along one axis between two ends
  axis?: 'x' | 'z';
  p?: number;
  from?: number;
  to?: number;
  dir?: 1 | -1;
  // pup: circles a centre at radius r; ang0 is its starting angle
  cx?: number;
  cz?: number;
  r?: number;
  ang0?: number;
}

let moles: Mole[] = [];
let nextSqueak = -1;

/** Lines for each named mole, said in turn each time the player talks to them. */
const LINES = {
  tumblesoil: [
    'Welcome to the Mother\'s Hall, if it pleases you. Mind the moss rug. It is moss, and it is listening.',
    'Everything here is stored. Roots, grubs, the good spoons. Nothing is lost, only put somewhere sensible.',
    'Gnomes say we are root-eaters. We are not. We keep the roots away from the grubs, which is a delicate arrangement, and I manage it.',
  ],
  tamp: [
    'Gnomes say we eat roots. We store them. For the grubs. Who eat them. It is a long story and nobody stays for the end.',
    'This one smells of dandelion. Dandelion roots go to Hearth Hall on Thursdays. Nobody asked, but they go.',
    'A root sorted by smell is a root sorted properly. I have never once been thanked for it, and that is perfectly fine.',
  ],
  delve: [
    'The lamps are trimmed, the wicks are straight, and the oil is counted twice. If it pleases you, do not breathe on the big one.',
    'Lamplight Hall keeps the dark out of the Mother\'s Hall. It is a quiet, humble job, and we are proud of it.',
    'Yes, the lamps are lit by moles. No, the surface has never asked how. Thank you for not asking.',
  ],
  sift: [
    'Post for the Mother\'s Hall goes in the top holes. Post for everyone else goes in the lower holes. Please do not post yourself.',
    'I sort the letters. The letters sort themselves, mostly. Sorting is a matter of asking them nicely.',
    'You have post? Oh. It is addressed to a hole in a lawn. We will deliver it. We always deliver.',
  ],
  crumb: [
    'Supper is at the oven, if it pleases you. Grub loaf, grub rolls, and a grub jam that is not for the faint.',
    'Bread takes three days down here, because the Tall Ones take the sun away, and then they blame the bread.',
    'Do not eat the root. The root is for the grubs, the grubs are for the bread, and the bread is for you. That is all the order there is.',
  ],
  nubbin: [
    'Good morning, if it pleases you. Nubbin is never quite asleep, never quite awake, and always sniffing.',
    'When it rains up top, our family sends word out by the Burrow Door. The Tall Ones never reply, which we think is a shame.',
    'I was born under the grass and I will be buried under it, and in between I am the post runner. Do not tell the Flock I said so.',
  ],
  pim: [
    'Hello! Hello! Pod says hello too, but Pod is very slow at saying things.',
    'We go round the moss because it is the only round thing that does not bump the walls. Mind you do not walk on it.',
    'Are you a big one? You are, aren\'t you. It is alright. It is very nice to be big. Sometimes.',
  ],
  pod: [
    'Pod here. Pim is talking. Pim is always talking.',
    'I count the moss. It is a hundred and twelve. It was a hundred and twelve yesterday.',
    'Thank you for coming down. Nobody comes down. It is very kind of you, if it pleases you.',
  ],
};

/** The chat toast for a talk spot (the page shows it like any interior line). */
function say(name: string, line: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('gta:interior-say', { detail: { name, line } }));
}

/** A "Talk to <name>" spot 1.3 m in front of a mole, cycling through its lines. */
function talk(kit: InteriorKit, id: string, name: string, x: number, z: number, yaw: number, lines: readonly string[]): void {
  let i = 0;
  kit.spot({
    id: 'talk-' + id,
    x: x + Math.sin(yaw) * TALK_DIST,
    z: z + Math.cos(yaw) * TALK_DIST,
    prompt: 'Talk to ' + name,
    run: () => {
      say(name, lines[i % lines.length]);
      i++;
    },
  });
}

/** Puts one prefab mole in the room and records its pivots. Null when the prefab is not in the catalog yet. */
function place(
  kit: InteriorKit, id: string, x: number, z: number, yaw: number, kind: Kind, extra: Partial<Mole> = {},
  size?: { by: 'h'; size: number },
): Mole | null {
  if (!getPrefab(id)) return null;
  const root = kit.put(id, x, z, yaw, { solid: false, ...size });
  const body = root.getObjectByName('body');
  const m: Mole = {
    kind,
    root,
    body,
    head: root.getObjectByName('head'),
    armR: root.getObjectByName('arm-r'),
    baseY: body ? body.position.y : 0,
    phase: Math.random() * TAU,
    nextPaw: Math.random() * 6,
    pawUntil: -1,
    ...extra,
  };
  moles.push(m);
  return m;
}

/** A walker on a tunnel's centre line: `axis` moves it between `from` and `to`, starting at `start` heading `dir`. */
function walker(kit: InteriorKit, axis: 'x' | 'z', line: number, from: number, to: number, start: number, dir: 1 | -1): void {
  const yaw = axis === 'x' ? (dir > 0 ? E : W) : (dir > 0 ? S : N);
  const x = axis === 'x' ? start : line;
  const z = axis === 'z' ? start : line;
  place(kit, 'burrowfolk-mole', x, z, yaw, 'walker', { axis, from, to, dir, p: start });
}

/** Puts the moles into the room being built (called from loamdeep/interior.ts on every entry). */
export function buildMoleFolk(kit: InteriorKit): void {
  moles = [];
  nextSqueak = -1;
  const sp = LOAMDEEP.spots;

  // Old Mother Tumblesoil, beside her chair, facing south.
  const tx = sp.tumblesoil[0] + 1.3, tz = sp.tumblesoil[1] + 0.3;
  place(kit, 'mole-tumblesoil', tx, tz, S, 'idle');
  talk(kit, 'tumblesoil', SOCIETY_CAST.tumblesoil, tx, tz, S, LINES.tumblesoil);

  // Named moles in their halls.
  place(kit, 'burrowfolk-mole', -44, 16, E, 'idle', {}, { by: 'h', size: 0.8 });
  talk(kit, 'tamp', SOCIETY_CAST.tamp, -44, 16, E, LINES.tamp);
  place(kit, 'burrowfolk-mole', 34, 16, E, 'idle');
  talk(kit, 'delve', SOCIETY_CAST.delve, 34, 16, E, LINES.delve);
  place(kit, 'burrowfolk-mole', -48, -30, E, 'idle');
  talk(kit, 'sift', SOCIETY_CAST.sift, -48, -30, E, LINES.sift);
  place(kit, 'burrowfolk-mole', 46, -26, W, 'idle');
  talk(kit, 'crumb', SOCIETY_CAST.crumb, 46, -26, W, LINES.crumb);
  place(kit, 'mole-nubbin', -34, -26, E, 'idle');
  talk(kit, 'nubbin', SOCIETY_CAST.nubbin, -34, -26, E, LINES.nubbin);

  // Pim and Pod circle the moss rug in the Mother's Hall. Their talk spots sit at the edge of the circle.
  const pcx = -6, pcz = 18, pr = 1.5;
  place(kit, 'mole-pup', pcx + pr, pcz, 0, 'pup', { cx: pcx, cz: pcz, r: pr, ang0: 0 });
  place(kit, 'mole-pup', pcx - pr, pcz, 0, 'pup', { cx: pcx, cz: pcz, r: pr, ang0: Math.PI });
  if (getPrefab('mole-pup')) {
    talk(kit, 'pim', SOCIETY_CAST.pim, pcx - 0.8, pcz + 2.4, N, LINES.pim);
    talk(kit, 'pod', SOCIETY_CAST.pod, pcx + 0.8, pcz + 2.4, N, LINES.pod);
  }

  // Six more Burrowfolk about their business (standing, not talking).
  place(kit, 'burrowfolk-mole', -34, 22, S, 'idle');     // by a root crate in Rootway Hall
  place(kit, 'burrowfolk-mole', 36, -30, E, 'idle');     // at a table in Hearth Hall
  place(kit, 'burrowfolk-mole', -4, 23, S, 'idle');      // sweeping the entry tunnel mouth
  place(kit, 'burrowfolk-mole', 44, 14, W, 'idle');      // Lamplight Hall, tending a lamp
  place(kit, 'burrowfolk-mole', -32, -34, E, 'idle');    // Postern Hall, filing
  place(kit, 'burrowfolk-mole', -8, -24, E, 'idle');     // Under-Chorus Hall, by the wall

  // Three walkers back and forth along the tunnels' centre lines, 0.7 m/s.
  walker(kit, 'x', 18, -28, -14, -28, 1);                // west gallery
  walker(kit, 'x', 18, 14, 28, 22, -1);                 // east gallery
  walker(kit, 'z', 0, -14, 2, -6, 1);                   // the north tunnel of the Mother's Hall

  // DJ Moleman's decks and the dancers, once he has come up to play.
  if (loadSocietySave().molemanVisits) {
    const [dx, dz] = sp.decks;
    place(kit, 'moleman-decks', dx, dz, S, 'idle');
    place(kit, 'dj-moleman', dx, dz - 0.7, S, 'moleman');
    const [fx, fz] = sp.danceFloor;
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * TAU;
      place(kit, 'burrowfolk-mole', fx + 3.5 * Math.sin(a), fz + 3.5 * Math.cos(a), a + Math.PI, 'dancer');
    }
  }
}

/** Animates the moles built by the last buildMoleFolk (no-op when the player is not in Loamdeep). */
export function updateMoleFolk(dt: number, t: number): void {
  if (moles.length === 0 || currentInterior() !== SOCIETY_INTERIORS.loamdeep) return;
  const beat = TAU * 2.1 * t;
  for (const m of moles) {
    switch (m.kind) {
      case 'idle': {
        if (m.body) m.body.position.y = m.baseY + 0.02 * Math.sin(TAU * 1.2 * t + m.phase);
        if (m.head) m.head.rotation.x = 0.08 * Math.sin(TAU * 0.4 * t + m.phase);
        if (m.armR) {
          if (t >= m.nextPaw) {
            m.pawUntil = t + 1.5;
            m.nextPaw = t + 8 + Math.random() * 6;
          }
          const target = t < m.pawUntil ? -0.9 + 0.3 * Math.sin(TAU * 2 * t) : 0;
          m.armR.rotation.x += (target - m.armR.rotation.x) * Math.min(1, dt * 8);
        }
        break;
      }
      case 'walker': {
        const step = 0.7 * dt * (m.dir ?? 1);
        m.p = (m.p ?? 0) + step;
        const to = m.to ?? 0, from = m.from ?? 0;
        if (m.dir === 1 && m.p >= to) { m.p = to; m.dir = -1; }
        else if (m.dir === -1 && m.p <= from) { m.p = from; m.dir = 1; }
        if (m.axis === 'x') {
          m.root.position.x = m.p;
          m.root.rotation.y = m.dir === 1 ? E : W;
        } else {
          m.root.position.z = m.p;
          m.root.rotation.y = m.dir === 1 ? S : N;
        }
        if (m.body) m.body.position.y = m.baseY + 0.025 * Math.abs(Math.sin(TAU * 1.5 * t + m.phase));
        break;
      }
      case 'dancer': {
        if (m.body) {
          m.body.position.y = m.baseY + 0.06 * Math.sin(beat + m.phase);
          m.body.rotation.z = 0.12 * Math.sin(TAU * 1.05 * t + m.phase);
        }
        break;
      }
      case 'pup': {
        const ang = (m.ang0 ?? 0) + 0.8 * t;
        const r = m.r ?? 1.5;
        m.root.position.x = (m.cx ?? 0) + r * Math.cos(ang);
        m.root.position.z = (m.cz ?? 0) + r * Math.sin(ang);
        m.root.rotation.y = -ang;
        if (m.body) m.body.position.y = m.baseY + 0.02 * Math.sin(TAU * 3 * t + m.phase);
        break;
      }
      case 'moleman': {
        if (m.body) m.body.position.y = m.baseY + 0.03 * Math.sin(beat);
        if (m.head) m.head.rotation.x = 0.12 * Math.sin(beat);
        if (m.armR) m.armR.rotation.x = -0.6 + 0.35 * Math.sin(TAU * 1.05 * t);
        break;
      }
    }
  }

  // Every 6-12 s a squeak or a drip from a random mole.
  if (nextSqueak < 0) nextSqueak = t + 3 + Math.random() * 3;
  if (t >= nextSqueak) {
    nextSqueak = t + 6 + Math.random() * 6;
    const m = moles[Math.floor(Math.random() * moles.length)];
    const [wx, wz] = interiorToWorld(SOCIETY_INTERIORS.loamdeep, m.root.position.x, m.root.position.z);
    playAt(Math.random() < 0.6 ? 'mole-squeak' : 'burrow-drip', { x: wx, z: wz });
  }
}
