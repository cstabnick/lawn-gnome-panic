// 26 ambient chatter gnomes scattered across Turfton and the four outer biomes with 3D pop-up speech bubbles
// that appear smoothly overhead only when the player approaches (no HUD toast spam).
import * as THREE from 'three';
import type { GnomeLook, GnomeModel } from '@lawn/gnome';
import type { VoiceSpec } from '@lawn/mutter';
import { angleDiff } from './collide';
import { gnomeState, makeGnome } from './gnomes';
import { speakAt } from './voice/speech';
import { voiceFor } from './voice/voices';
import { heightAt } from './terrain';
import { createAnimator, type Animator } from './anim/animator';
import { pickFor } from './anim/index';
import { WORK_IDS, type AnimId } from './anim/types';
import { PERSONAS, idleFor, type Persona } from './anim/persona';
import { biomeAt } from './config';
import { animStride, newAnimClock, stepAnimClock, type AnimClock } from './animStride';

export interface AmbientGnomeDef {
  id: string;
  name: string;
  x: number;
  z: number;
  yaw: number;
  look: Partial<GnomeLook>;
  bubble: string;
  /** Optional voice overrides on top of voiceFor(name). None set yet. */
  voice?: Partial<VoiceSpec>;
  /** The idle loop this gnome plays while it stands about (an anim row id). Default: a stable pick by id. */
  idle?: AnimId;
}

/** A gnome says its bubble line at most this often (seconds), however often the player walks past. */
const SPEAK_COOLDOWN = 20;
/** Speech reaches this far (world units); beyond it the line is silent. */
const SPEAK_DIST = 16;

const BASE_LOOK: GnomeLook = {
  hat: 0xd93636,
  shirt: 0x3b6ea5,
  pants: 0x2c3e50,
  skin: 0xf1c27d,
  boots: 0x222222,
  beard: 0xdddddd,
  hair: null,
  freckles: false,
  dress: false,
  glasses: false,
  bowlCut: null,
};

export const AMBIENT_GNOMES: readonly AmbientGnomeDef[] = [
  // ---- Turfton Downtown & Districts (10) ----
  {
    id: 'amb-glaze-buffer',
    idle: 'paint-wall',
    name: 'Polly Polish',
    x: 16,
    z: 36,
    yaw: -Math.PI / 2,
    look: { hat: 0x3ec9b6, shirt: 0xf4f4f8, beard: null, glasses: true },
    bubble: 'Fresh kiln glaze! Do NOT park a Two-Stroke next to me.',
  },
  {
    id: 'amb-acorn-broker',
    idle: 'cross-arms',
    name: 'Penny Pinch',
    x: 78,
    z: -16,
    yaw: Math.PI,
    look: { hat: 0xd4af37, shirt: 0x1e242b, beard: 0x555555, glasses: true },
    bubble: 'Acorn futures are up 12%. Red Caps are shorting Dandelion Fizz.',
  },
  {
    id: 'amb-park-birdwatcher',
    idle: 'look-around',
    name: 'Finch',
    x: -36,
    z: 36,
    yaw: 0.4,
    look: { hat: 0x4f7a5a, shirt: 0x8d6e4c, beard: 0xbcbcbc, glasses: true },
    bubble: 'That pigeon has been staring at the fountain for three days.',
  },
  {
    id: 'amb-claymart-clerk',
    idle: 'vendor-call',
    name: 'Milo Stack',
    x: -134,
    z: 146,
    yaw: 0.2,
    look: { hat: 0x2f64c9, shirt: 0xffd23f, beard: null, freckles: true },
    bubble: 'Everything at Clay-Mart is 0% APR until your glaze cracks.',
  },
  {
    id: 'amb-greenhouse-botanist',
    idle: 'water',
    name: 'Sprout',
    x: 72,
    z: 14,
    yaw: -1.1,
    look: { hat: 0x76b041, shirt: 0x3b4d36, beard: null, hair: { color: 0x6b3a1e, style: 'pigtails' } },
    bubble: 'Grow-lamps run 24/7. The moths pay rent in bottlecaps.',
  },
  {
    id: 'amb-thorne-intern',
    idle: 'take-notes',
    name: 'Biff Beige',
    x: 18,
    z: -24,
    yaw: Math.PI / 2,
    look: { hat: 0xc9b99b, shirt: 0x18181e, beard: null, glasses: true },
    bubble: 'Thorne Tower Rule 12: smile only at regulation lawn height.',
  },
  {
    id: 'amb-patio-gardener',
    idle: 'rake',
    name: 'Trellis',
    x: 152,
    z: -148,
    yaw: -0.6,
    look: { hat: 0xf4f4f8, shirt: 0xc9b99b, beard: 0xe5e5e5 },
    bubble: 'I trim the astroturf with nail scissors. Yes, I hate it too.',
  },
  {
    id: 'amb-amphitheater-critic',
    name: 'Critique Carl',
    x: -82,
    z: -74,
    yaw: 0.8,
    look: { hat: 0x8e44ad, shirt: 0x2b2e34, beard: 0x333333, glasses: true },
    bubble: 'Needs more papier-mache boots crashing through the orchestra.',
  },
  {
    id: 'amb-paynglaze-sweeper',
    idle: 'sweep',
    name: 'Glossy Gus',
    x: 74,
    z: 142,
    yaw: 1.2,
    look: { hat: 0xff3b9a, shirt: 0x2c3e50, beard: 0x8b5a2b },
    bubble: 'One coat of hot pink and even the Hat Watch forgets your face.',
  },
  {
    id: 'amb-sidevalve-grease',
    idle: 'wrench-fix',
    name: 'Lugnut',
    x: -136,
    z: 74,
    yaw: -0.9,
    look: { hat: 0xf08a24, shirt: 0x3a3f45, beard: 0x4a3828, freckles: true },
    bubble: 'Tansy says if a bolt is left over, the mower is lighter now.',
  },

  // ---- Mossy Wood & Compost Heap (6) ----
  {
    id: 'amb-compost-union',
    name: 'Grout Jr.',
    x: -246,
    z: -48,
    yaw: 0.5,
    look: { hat: 0xffd23f, shirt: 0x5c4a32, beard: 0x6b4423 },
    bubble: 'Local 404 says the potholes on Ring Road are heritage sites.',
  },
  {
    id: 'amb-moss-whisperer',
    idle: 'sit-ground',
    name: 'Lichen',
    x: -332,
    z: 24,
    yaw: 1.4,
    look: { hat: 0x2e6f40, shirt: 0x3b2a1a, beard: 0xd8d8d0 },
    bubble: 'Listen close. The moss remembers when there were no roads.',
  },
  {
    id: 'amb-chapel-runaway',
    idle: 'sit-ground',
    name: 'Brother Loam',
    x: -292,
    z: -24,
    yaw: -0.4,
    look: { hat: 0x4a3828, shirt: 0x3b3530, beard: 0xc8c0b4 },
    bubble: 'Our Chapel van broke down here three weeks ago. Honestly? Nicer.',
  },
  {
    id: 'amb-porch-watcher',
    idle: 'look-around',
    name: 'Bisque',
    x: -544,
    z: 52,
    yaw: Math.PI / 2,
    look: { hat: 0xf4f4f8, shirt: 0xe6e8f0, skin: 0xfafafa, beard: null, dress: true },
    bubble: 'Do not stare at the porch lantern. Just keep walking, clay-kin.',
  },
  {
    id: 'amb-mushroom-forager',
    idle: 'dig',
    name: 'Morel',
    x: -415,
    z: -45,
    yaw: 0.3,
    look: { hat: 0xc94a2f, shirt: 0x4b3522, beard: 0xbbbbbb },
    bubble: 'If a truffle starts whispering about mulch, leave it in the dirt.',
  },
  {
    id: 'amb-overlook-peeker',
    idle: 'lean-back',
    name: 'Knot-Eye Ned',
    x: -576,
    z: -98,
    yaw: -Math.PI / 2,
    look: { hat: 0x5c7344, shirt: 0x6b4a2e, beard: 0x9e9e9e, glasses: true },
    bubble: 'Beyond the fence? Grass ten feet tall and a hose like a python.',
  },

  // ---- Cloverfield Farms & Canal (4) ----
  {
    id: 'amb-pumpkin-guard',
    idle: 'guard-stand',
    name: 'Gourd Greg',
    x: -68,
    z: 332,
    yaw: 0.9,
    look: { hat: 0xe6731e, shirt: 0x4a6b3b, beard: 0x6b4423 },
    bubble: 'Touch Granny\'s prize pumpkins and you\'ll be eating rock salt.',
  },
  {
    id: 'amb-crater-surveyor',
    idle: 'measure',
    name: 'Pawprint Pete',
    x: 64,
    z: 356,
    yaw: -0.7,
    look: { hat: 0x8b5a2b, shirt: 0x3d6b99, beard: 0xd9d9d9, glasses: true },
    bubble: 'Biscuit napped here once. The seismic station is still calibrating.',
  },
  {
    id: 'amb-canal-angler',
    idle: 'fish',
    name: 'Bobber',
    x: -24,
    z: 226,
    yaw: 0,
    look: { hat: 0x4f9d92, shirt: 0xd9c79e, beard: 0xbbbbbb },
    bubble: 'Caught two bottlecaps and an HOA citation. Threw the citation back.',
  },
  {
    id: 'amb-farm-milkman',
    name: 'Clover',
    x: 24,
    z: 422,
    yaw: -1.3,
    look: { hat: 0xf08bb4, shirt: 0x8e5ea2, beard: null, dress: true },
    bubble: 'Acorn-flour cakes cool faster on a Combine hood. Fact.',
  },

  // ---- Frostbite Fells (3) ----
  {
    id: 'amb-fells-skater',
    name: 'Rime',
    x: -18,
    z: -332,
    yaw: 0.4,
    look: { hat: 0x7cf0ff, shirt: 0x284366, beard: null, glasses: true },
    bubble: 'Zero-Turns drift better on black ice than on asphalt. Try it!',
  },
  {
    id: 'amb-fells-shrine-monk',
    idle: 'think',
    name: 'Kiln-Keeper',
    x: -24,
    z: -504,
    yaw: 0.1,
    look: { hat: 0x9ec6de, shirt: 0x3c5266, beard: 0xeeeeee },
    bubble: 'Warm Kiln-Resin heals any crack. Even Father Loam\'s temper.',
  },
  {
    id: 'amb-fells-leyline',
    name: 'Aether Al',
    x: 48,
    z: -522,
    yaw: -0.8,
    look: { hat: 0x33ffd6, shirt: 0x222034, beard: 0xdddddd, glasses: true },
    bubble: 'Hit that blue ramp above 12 speed and gravity takes a coffee break.',
  },

  // ---- The Dust Flats (3) ----
  {
    id: 'amb-dust-ufologist',
    idle: 'point',
    name: 'Foil Phil',
    x: 382,
    z: 136,
    yaw: 0.7,
    look: { hat: 0xc0c6ce, shirt: 0x4b5563, beard: 0x7a5c3e, glasses: true },
    bubble: 'A faster-than-lawn cruiser scorched this circle! I saw the crew!',
  },
  {
    id: 'amb-dust-mech',
    idle: 'saw',
    name: 'Rivet',
    x: 428,
    z: -102,
    yaw: -0.4,
    look: { hat: 0xc29b61, shirt: 0x556b2f, beard: 0x4a3b2c },
    bubble: 'Crop Duster keys are in the flower pot. Don\'t tell Diggs.',
  },
  {
    id: 'amb-dust-combine-watcher',
    idle: 'look-around',
    name: 'Mirage',
    x: 340,
    z: -165,
    yaw: 1.5,
    look: { hat: 0xd99b66, shirt: 0x7c4a2d, beard: 0xe5e0d4 },
    bubble: 'Sometimes an unmanned chrome Combine rolls out there by itself...',
  },
];

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(next).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

/** A speech bubble sprite (name over the line). Callers set its scale (about 3.4 x 1.18), position and visibility. Also used by outskirts/npcs.ts. */
export function makeBubbleSprite(name: string, text: string): THREE.Sprite {
  if (typeof document === 'undefined') {
    return new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true }));
  }
  const cv = document.createElement('canvas');
  cv.width = 512;
  cv.height = 176;
  const ctx = cv.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, cv.width, cv.height);
    // Rounded dark pill
    const x = 12, y = 8, w = 488, h = 136, r = 24;
    ctx.fillStyle = 'rgba(14, 16, 22, 0.9)';
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + w / 2 + 16, y + h);
    ctx.lineTo(x + w / 2, y + h + 22);
    ctx.lineTo(x + w / 2 - 16, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffd23f';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#ffd23f';
    ctx.font = '800 24px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(name, cv.width / 2, 40);

    ctx.fillStyle = '#f5f7fa';
    ctx.font = '600 22px system-ui, sans-serif';
    const lines = wrapText(ctx, text, 444).slice(0, 3);
    lines.forEach((ln, idx) => {
      ctx.fillText(ln, cv.width / 2, 74 + idx * 28);
    });
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  sprite.renderOrder = 20;
  return sprite;
}

/** `defs`: the gnomes to make (default the 26 of AMBIENT_GNOMES; parks/life.ts passes its park townsgnomes). */
export function createAmbientGnomes(scene: THREE.Scene, defs: readonly AmbientGnomeDef[] = AMBIENT_GNOMES): { update(dt: number, px: number, pz: number): void } {
  const entries: {
    def: AmbientGnomeDef;
    model: GnomeModel;
    bubble: THREE.Sprite;
    vis: number;
    yaw: number;
    phase: number;
    voice: VoiceSpec;
    /** The bubble was shown last frame (want > 0.5). */
    popped: boolean;
    /** This bubble appearance has already been spoken (reset when the bubble has fully hidden). */
    spoken: boolean;
    /** elapsed time of the last spoken line, for the cooldown. */
    lastSpoke: number;
    /** The idle row this gnome returns to, and the animator that plays it (and the wave). */
    idle: AnimId;
    animator: Animator;
    /** Pose level of detail (animStride.ts). */
    clock: AnimClock;
    /** Character (anim/persona.ts), and seconds until the next little bit of business (a yawn, a map, the weather). */
    persona: Persona;
    bitT: number;
    /** Works, sits or sleeps: keeps its idle (no wave, no bits). */
    keepsIdle: boolean;
  }[] = [];

  for (let i = 0; i < defs.length; i++) {
    const def = defs[i];
    const look: GnomeLook = { ...BASE_LOOK, ...def.look };
    const model = makeGnome(scene, look);
    model.update(gnomeState(def.x, heightAt(def.x, def.z), def.z, def.yaw, 0), 1);

    const bubble = makeBubbleSprite(def.name, def.bubble);
    bubble.position.set(def.x, heightAt(def.x, def.z) + 2.25, def.z);
    bubble.scale.set(0.001, 0.001, 1);
    bubble.visible = false;
    scene.add(bubble);

    const voice: VoiceSpec = { ...voiceFor(def.name), ...(def.voice ?? {}) };
    const idle: AnimId = def.idle ?? pickFor<AnimId>(def.id, ['hands-on-hips', 'look-around', 'think', 'tap-foot', 'cross-arms', 'lean-back']);
    const phase = i * 0.65;
    const animator = createAnimator();
    animator.play(idle, { loop: true, offset: phase });
    entries.push({
      def, model, bubble, vis: 0, yaw: def.yaw, phase,
      voice, popped: false, spoken: false, lastSpoke: -Infinity, idle, animator,
      clock: newAnimClock(i),
      persona: pickFor(def.id, PERSONAS), bitT: 15 + ((i * 7.3) % 30),
      keepsIdle: idle === 'sit-ground' || idle === 'sleep' || (WORK_IDS as readonly AnimId[]).includes(idle),
    });
  }

  let elapsed = 0;

  return {
    update(dt: number, px: number, pz: number) {
      elapsed += dt;
      for (const e of entries) {
        const d = Math.hypot(px - e.def.x, pz - e.def.z);
        const want = d <= 10.5 ? 1 : d >= 12.0 ? 0 : e.vis > 0.5 ? 1 : 0;
        e.vis += (want - e.vis) * Math.min(1, 8 * dt);

        // The bubble pops up: say its line once, in this gnome's voice (not on the cutscene's 1e6 hide).
        const shown = want > 0.5;
        if (shown && !e.popped) {
          if (px < 1e5 && !e.spoken && elapsed - e.lastSpoke >= SPEAK_COOLDOWN) {
            speakAt(e.def.bubble, e.voice, e.def.x, e.def.z, SPEAK_DIST);
            e.spoken = true;
            e.lastSpoke = elapsed;
          }
          // The bubble pops for the player: wave, unless the gnome is sitting, sleeping or working. Then back to idle.
          if (px < 1e5 && !e.keepsIdle) {
            const idle = e.idle;
            e.animator.play('wave', { loop: false, onEnd: () => e.animator.play(idle, { loop: true }) });
          }
        }
        e.popped = shown;
        if (e.vis < 0.03) e.spoken = false;

        // Now and then, out of the player's way, a bit of character by place and time (anim/persona.ts), then the idle.
        e.bitT -= dt;
        if (e.bitT <= 0) {
          e.bitT = 20 + Math.random() * 25;
          if (!shown && !e.keepsIdle && d < 120) {
            const idle = e.idle;
            e.animator.play(idleFor(e.persona, biomeAt(e.def.x, e.def.z)), { loop: false, onEnd: () => e.animator.play(idle, { loop: true }) });
          }
        }

        const targetYaw = want > 0.5 ? Math.atan2(px - e.def.x, pz - e.def.z) : e.def.yaw;
        e.yaw += angleDiff(targetYaw, e.yaw) * Math.min(1, 5 * dt);
        const gy = heightAt(e.def.x, e.def.z);
        // Far gnomes are posed every few frames (animStride.ts); during a live cutscene (px 1e6) every one is posed.
        const step = stepAnimClock(e.clock, dt, px >= 1e5 ? 1 : animStride(d));
        if (step > 0) {
          e.model.update(gnomeState(e.def.x, gy, e.def.z, e.yaw, 0), step);
          // The sway would fight a pose that bends the body (lying, sitting, bowing), so it only runs without one.
          const cur = e.animator.current;
          if (!cur || !cur.parts.includes('body')) e.model.rig.rotation.z = Math.sin(elapsed * 1.5 + e.phase) * 0.025;
          e.animator.apply(e.model, step);
        }

        if (e.vis > 0.03) {
          e.bubble.visible = true;
          const s = e.vis;
          e.bubble.scale.set(3.4 * s, 1.18 * s, 1);
          e.bubble.position.y = gy + 2.25 + Math.sin(elapsed * 2.5 + e.phase) * 0.06;
        } else {
          e.bubble.visible = false;
        }
      }
    },
  };
}
