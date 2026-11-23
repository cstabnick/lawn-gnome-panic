// The voice budget (music-ui-and-tech.md section 3.5): at most 16 one-shot voices, with a cap per kind. When a cap or the
// total is full, a new voice steals the lowest-priority, oldest voice, but only one of equal or lower priority.

export type VoiceKind = 'ui' | 'sfx' | 'step' | 'voice' | 'stinger';

export const VOICE_TOTAL = 16;
export const VOICE_CAP: Record<VoiceKind, number> = { ui: 3, sfx: 8, step: 3, voice: 2, stinger: 1 };
const PRIORITY: Record<VoiceKind, number> = { voice: 4, ui: 3, stinger: 2, sfx: 1, step: 1 };

export interface VoiceRequest { ok: boolean; stolen: number | null }
export interface VoiceBudget {
  request(kind: VoiceKind, id: number): VoiceRequest;
  release(id: number): void;
  count(kind?: VoiceKind): number;
}

interface Live { id: number; kind: VoiceKind; seq: number }

export function createVoiceBudget(): VoiceBudget {
  let live: Live[] = [];
  let seq = 0;

  // The weakest voice: lowest priority, then the oldest.
  const weakest = (list: Live[]): Live | null => {
    let best: Live | null = null;
    for (const v of list) {
      if (!best || PRIORITY[v.kind] < PRIORITY[best.kind] || (PRIORITY[v.kind] === PRIORITY[best.kind] && v.seq < best.seq)) best = v;
    }
    return best;
  };

  return {
    request(kind, id) {
      const pr = PRIORITY[kind];
      let stolen: number | null = null;
      const same = live.filter((v) => v.kind === kind);
      if (same.length >= VOICE_CAP[kind]) {
        const victim = weakest(same);
        if (!victim || PRIORITY[victim.kind] > pr) return { ok: false, stolen: null };
        live = live.filter((v) => v !== victim);
        stolen = victim.id;
      }
      if (live.length >= VOICE_TOTAL) {
        const victim = weakest(live);
        if (!victim || PRIORITY[victim.kind] > pr) return { ok: false, stolen: null };
        live = live.filter((v) => v !== victim);
        stolen = stolen ?? victim.id;
      }
      live.push({ id, kind, seq: seq++ });
      return { ok: true, stolen };
    },
    release(id) { live = live.filter((v) => v.id !== id); },
    count(kind) { return kind ? live.filter((v) => v.kind === kind).length : live.length; },
  };
}
