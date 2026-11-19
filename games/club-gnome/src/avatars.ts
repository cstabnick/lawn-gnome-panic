// Gnome models in the world (mine and other players'), their walk animation, and the DOM labels over their heads:
// name tag (in the player's colour, with 🎮 while they are in a game) and speech/emote bubble.
import * as THREE from 'three';
import { createGnomeModel, type GnomeLook, type GnomeModel, type PlayerState } from '@lawn/gnome';
import { createEmotePlayer, type EmotePlayer } from '@lawn/emotes';
import { Interp } from '@lawn/mp/interp';
import { CHAT, ME, type AvatarPose } from './config';
import type { World } from './world';

export interface Avatars {
  /** Creates the avatar, or rebuilds its model with a new look (keeps its pose and labels). */
  upsert(id: number, look: GnomeLook, name: string, color: number): void;
  remove(id: number): void;
  /** Removes every avatar except `keep` (used when changing map). */
  removeAllExcept(keep: number): void;
  has(id: number): boolean;
  /** Ids of every avatar, mine included. */
  ids(): number[];
  /** Shows this pose at once (my own gnome). */
  setPose(id: number, pose: AvatarPose): void;
  /** Buffers a remote pose taken at the sender's clock sentAt (ms); shown interpolated a little in the past. */
  pushPose(id: number, pose: AvatarPose, sentAt: number): void;
  /** Forgets the interpolation buffer so the next pushed pose shows at once (they changed map). */
  snap(id: number): void;
  /** Speech bubble over their head (chat line or emote emoji). */
  say(id: number, text: string): void;
  /** Plays an animated emote (@lawn/emotes id) on this avatar; unknown ids are ignored. */
  playEmote(id: number, emoteId: string): void;
  /** Animates models, samples remote poses, moves the labels. Call once per frame after the camera moved. */
  update(dt: number): void;
}

/** Height of the label anchor above the feet (world units). */
const LABEL_HEIGHT = 1.75;
/** Interp sample layout: x, z, facing, moving (0/1), busy (0/1). */
const SAMPLE_LEN = 5;
/** Walk speed cap for the leg animation, so a snap does not make the legs flail. */
const MAX_SPEED = 8;
/** A text that is one emoji (optionally with modifiers or a ZWJ sequence) shows big. */
const EMOJI_ONLY = /^\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier}|‍\p{Extended_Pictographic}️?)*$/u;
const BIG_EMOJI_S = 3;

function hex(color: number): string {
  return '#' + (color & 0xffffff).toString(16).padStart(6, '0');
}

interface Avatar {
  id: number;
  model: GnomeModel;
  emote: EmotePlayer;
  state: PlayerState;
  interp: Interp;
  buf: number[];
  pose: AvatarPose;
  /** False until a pose has been shown (the model stays hidden until then). */
  hasPose: boolean;
  /** Last shown position, for the walking speed; NaN when there is no previous one. */
  px: number;
  pz: number;
  name: string;
  tagBusy: boolean | null;
  group: HTMLDivElement;
  tag: HTMLDivElement;
  bubble: HTMLDivElement;
  bubbleText: HTMLSpanElement;
  bubbleLeft: number;
  shown: boolean;
}

export function createAvatars(world: World, ui: HTMLElement): Avatars {
  const layer = document.createElement('div');
  layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;overflow:hidden';
  ui.appendChild(layer);

  const avatars = new Map<number, Avatar>();

  function buildLabels(id: number): Pick<Avatar, 'group' | 'tag' | 'bubble' | 'bubbleText'> {
    // One column per avatar, its bottom centred on the label anchor: the bubble sits above the name tag.
    const group = document.createElement('div');
    group.style.cssText =
      'position:absolute;left:0;top:0;display:none;flex-direction:column;align-items:center;will-change:transform';

    const bubble = document.createElement('div');
    bubble.style.cssText =
      'display:none;position:relative;margin-bottom:8px;background:#fff;color:#1b1b1b;border-radius:12px;' +
      'padding:6px 10px;font:14px/1.3 system-ui,sans-serif;max-width:220px;white-space:pre-wrap;' +
      'overflow-wrap:anywhere;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,.3)';
    const bubbleText = document.createElement('span');
    bubble.appendChild(bubbleText);
    const tail = document.createElement('div');
    tail.style.cssText =
      'position:absolute;left:50%;bottom:-6px;transform:translateX(-50%);width:0;height:0;' +
      'border-left:6px solid transparent;border-right:6px solid transparent;border-top:6px solid #fff';
    bubble.appendChild(tail);

    const tag = document.createElement('div');
    tag.style.cssText =
      'font:700 13px/1.2 system-ui,sans-serif;white-space:nowrap;' +
      'text-shadow:-1px 0 #111,1px 0 #111,0 -1px #111,0 1px #111,0 0 4px #111';
    if (id === ME) tag.style.fontSize = '11px';

    group.appendChild(bubble);
    group.appendChild(tag);
    layer.appendChild(group);
    return { group, tag, bubble, bubbleText };
  }

  function setShown(a: Avatar, on: boolean): void {
    if (a.shown === on) return;
    a.shown = on;
    a.group.style.display = on ? 'flex' : 'none';
  }

  function renderTag(a: Avatar, busy: boolean): void {
    a.tagBusy = busy;
    a.tag.textContent = (busy ? '🎮 ' : '') + a.name;
  }

  return {
    upsert(id, look, name, color) {
      const model = createGnomeModel(look);
      let a = avatars.get(id);
      if (a) {
        world.scene.remove(a.model.object);
        a.model = model;
        a.emote.setModel(model);
      } else {
        const labels = buildLabels(id);
        a = {
          id,
          model,
          emote: createEmotePlayer(model),
          state: { position: new THREE.Vector3(), velocity: new THREE.Vector3(), facing: 0, grounded: true, jumpsUsed: 0 },
          interp: new Interp({ angles: [2], steps: [3, 4], pos: [0, 1], snapDist: 6 }),
          buf: new Array<number>(SAMPLE_LEN).fill(0),
          pose: { x: 0, z: 0, facing: 0, moving: false, busy: false },
          hasPose: false,
          px: NaN,
          pz: NaN,
          name,
          tagBusy: null,
          shown: false,
          bubbleLeft: 0,
          ...labels,
        };
        avatars.set(id, a);
      }
      world.scene.add(a.model.object);
      a.model.object.visible = a.hasPose;
      a.name = name;
      a.tag.style.color = hex(color);
      renderTag(a, a.pose.busy);
    },

    remove(id) {
      const a = avatars.get(id);
      if (!a) return;
      world.scene.remove(a.model.object);
      a.group.remove();
      avatars.delete(id);
    },

    removeAllExcept(keep) {
      for (const id of [...avatars.keys()]) if (id !== keep) this.remove(id);
    },

    has: (id) => avatars.has(id),

    ids: () => [...avatars.keys()],

    setPose(id, pose) {
      const a = avatars.get(id);
      if (!a) return;
      Object.assign(a.pose, pose);
      a.hasPose = true;
    },

    pushPose(id, pose, sentAt) {
      const a = avatars.get(id);
      if (!a) return;
      a.interp.push([pose.x, pose.z, pose.facing, pose.moving ? 1 : 0, pose.busy ? 1 : 0], sentAt);
    },

    snap(id) {
      avatars.get(id)?.interp.clear();
    },

    playEmote(id, emoteId) {
      avatars.get(id)?.emote.play(emoteId);
    },

    say(id, text) {
      const a = avatars.get(id);
      if (!a) return;
      const t = text.trim();
      if (!t) return;
      const emoji = EMOJI_ONLY.test(t);
      a.bubbleText.textContent = t;
      a.bubbleText.style.fontSize = emoji ? '28px' : '14px';
      a.bubble.style.padding = emoji ? '4px 8px' : '6px 10px';
      a.bubbleLeft = emoji ? BIG_EMOJI_S : Math.min(CHAT.bubbleMaxS, CHAT.bubbleBaseS + t.length * CHAT.bubblePerCharS);
      a.bubble.style.display = '';
    },

    update(dt) {
      for (const a of avatars.values()) {
        if (a.bubbleLeft > 0) {
          a.bubbleLeft -= dt;
          if (a.bubbleLeft <= 0) a.bubble.style.display = 'none';
        }

        if (a.interp.ready && a.interp.sample(a.buf)) {
          const b = a.buf;
          a.pose.x = b[0];
          a.pose.z = b[1];
          a.pose.facing = b[2];
          a.pose.moving = b[3] > 0.5;
          a.pose.busy = b[4] > 0.5;
          a.hasPose = true;
        }

        a.model.object.visible = a.hasPose;
        if (!a.hasPose) {
          a.px = NaN;
          a.pz = NaN;
          setShown(a, false);
          continue;
        }

        const p = a.pose;
        const dx = Number.isNaN(a.px) ? 0 : p.x - a.px;
        const dz = Number.isNaN(a.pz) ? 0 : p.z - a.pz;
        a.px = p.x;
        a.pz = p.z;
        if (p.moving && dt > 0) {
          let vx = dx / dt;
          let vz = dz / dt;
          const speed = Math.hypot(vx, vz);
          if (speed > MAX_SPEED) {
            vx *= MAX_SPEED / speed;
            vz *= MAX_SPEED / speed;
          }
          a.state.velocity.set(vx, 0, vz);
        } else {
          a.state.velocity.set(0, 0, 0);
        }
        a.state.position.set(p.x, 0, p.z);
        a.state.facing = p.facing;
        a.model.update(a.state, dt);
        a.emote.update(dt, p.moving);

        if (p.busy !== a.tagBusy) renderTag(a, p.busy);

        const v = world.project(p.x, LABEL_HEIGHT, p.z);
        setShown(a, v.visible);
        if (v.visible) a.group.style.transform = `translate(${v.x}px,${v.y}px) translate(-50%,-100%)`;
      }
    },
  };
}
