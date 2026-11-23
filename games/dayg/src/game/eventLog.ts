// The gnome's own event log: every bus event that matters becomes one plain sentence, read back by the death recap.
import { REGIONS } from '../sim/regions';
import { ITEMS } from '../items/defs';
import type { Bus } from './bus';
import type { BodyPart, Clock, CrackLevel, EventLog, PlayerState } from './types';

const CAP = 200;
const HIT_BURST_S = 3;
const NUMBER_WORDS = ['', 'One', 'Two', 'Three', 'Four', 'Five'];
const REGION_NAME: Record<string, string> = Object.fromEntries(REGIONS.map((r) => [r.id, r.name]));
const HAVEN_NAME: Record<string, string> = { waystation: 'Lychgate Waystation', tap: 'The Tap' };
const PART_NAME: Record<BodyPart, string> = {
  head: 'head', chest: 'chest', armL: 'left arm', armR: 'right arm', legL: 'left leg', legR: 'right leg',
};
const CRACK_WORD: Record<CrackLevel, string> = { 0: '', 1: 'chipped', 2: 'cracked', 3: 'cracked deep' };
const VIA_NAME: Record<string, string> = { rope: 'rope', ladder: 'ladder', route: 'the climbing route' };

interface Entry { t: number; text: string; kind: string }

export function createEventLog(bus: Bus, _clock: Clock, getPlayer: () => PlayerState): EventLog {
  const entries: Entry[] = [];
  let hitBurst = 0;          // hits in the current burst
  let hitBurstT = -Infinity; // time of the last hit
  let hitBurstIdx = -1;      // index of the entry the burst writes into
  let destroyed = 0, searched = 0, climbs = 0;

  const now = () => performance.now() / 1000;
  const push = (kind: string, text: string) => {
    entries.push({ t: now(), text, kind });
    if (entries.length > CAP) entries.splice(0, entries.length - CAP);
  };
  const stance = (): string => {
    const p = getPlayer();
    if (p.pos.y > 2 && p.stance === 'crouch') return 'You were crouched on a headstone. ';
    return '';
  };

  bus.on('entered-region', (e) => push('region', `You came into the ${REGION_NAME[e.region] ?? e.region}.`));
  bus.on('haven', (e) => {
    const name = HAVEN_NAME[e.haven] ?? e.haven;
    push('haven', e.inside ? `You reached the ${name}.` : `You left the ${name}.`);
  });
  bus.on('climbed', (e) => {
    climbs++;
    push('climb', `You climbed ${Math.round(e.height)} gm by ${VIA_NAME[e.via] ?? e.via}.`);
  });
  bus.on('fell', (e) => push('fall', `You fell ${Math.round(e.height)} gm.`));
  bus.on('player-hit', () => {
    const t = now();
    if (t - hitBurstT > HIT_BURST_S || hitBurstIdx < 0 || hitBurstIdx >= entries.length) {
      hitBurst = 0;
      hitBurstIdx = entries.length;
      push('hit', '');
    }
    hitBurstT = t;
    hitBurst++;
    const who = hitBurst === 1 ? 'A Hatless scratched you.'
      : hitBurst <= 5 ? `${NUMBER_WORDS[hitBurst]} Hatless had hold of you.`
      : `A pile of ${hitBurst} Hatless had hold of you.`;
    const e = entries[hitBurstIdx];
    if (e) e.text = stance() + who;
  });
  bus.on('cracked', (e) => {
    const word = CRACK_WORD[e.level];
    if (!word) return;
    const part = PART_NAME[e.part];
    push('crack', `Your ${part} ${word}.`);
  });
  bus.on('infection', (e) => {
    const part = PART_NAME[e.part];
    if (e.stage === 'turned') push('infection', 'Your hat slipped.');
    else if (e.stage === 0) push('infection', `Moss got into the crack on your ${part}.`);
    else if (e.stage === 1) push('infection', `The moss took root in your ${part}.`);
    else if (e.stage === 2) push('infection', 'The grey spread.');
    else push('infection', `The grey took your ${part}.`);
  });
  bus.on('infection-cured', () => push('cured', 'The moss came off you.'));
  bus.on('campfire-lit', () => push('fire', 'You lit a fire.'));
  bus.on('ate', (e) => push('ate', `You ate ${ITEMS[e.def]?.name ?? 'something'}.`));
  bus.on('drank', (e) => push('drank', e.clean ? 'You drank clean water.' : 'You drank dirty water.'));
  bus.on('container-opened', () => {
    searched++;
    push('search', 'You searched a crate.');
  });
  bus.on('hatless-destroyed', () => {
    destroyed++;
    push('destroy', "You cracked a Hatless's core.");
  });
  bus.on('dusk', () => push('dusk', 'Night fell.'));
  bus.on('dawn', () => push('dawn', 'Dawn came up grey over the stones.'));

  return {
    lines(seconds: number): string[] {
      const since = now() - seconds;
      const out: string[] = [];
      for (const e of entries) {
        if (e.t < since || !e.text) continue;
        if (out[out.length - 1] === e.text) continue;
        out.push(e.text);
      }
      return out;
    },
    stats() {
      return { hatlessDestroyed: destroyed, containersSearched: searched, climbs };
    },
  };
}
