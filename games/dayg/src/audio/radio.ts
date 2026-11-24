// Procedural camp & portable radio stations using @lawn/music's shared AudioContext.
import { getAudioContext } from '@lawn/music';

export interface RadioStation {
  id: number;
  name: string;
  tagline: string;
  broadcasts: readonly string[];
}

export const RADIO_STATIONS: readonly RadioStation[] = [
  { id: 0, name: 'Off', tagline: 'Silence.', broadcasts: [] },
  {
    id: 1,
    name: '88.5 FM — Mossgrave Emergency',
    tagline: 'Automated beacon & survivor advisories',
    broadcasts: [
      '📻 "Lychgate Waystation remains lit. Keep your glaze sealed before dusk."',
      '📻 "Avoid the Sinks in heavy rain — Hatless gather near low walls."',
      '📻 "This is an automated Fescue Civil Defense loop. Do not trust the quiet."',
    ],
  },
  {
    id: 2,
    name: '94.2 FM — Old Lawn Lullaby',
    tagline: 'Warm pre-breakout garden ballads',
    broadcasts: [
      '📻 ♪ Playing: "Porcelain Waltz (1987 Pressing)" ♪',
      '📻 ♪ Playing: "Rain on the Greenhouse Roof" ♪',
    ],
  },
  {
    id: 3,
    name: '101.7 FM — Subsoil Rebel',
    tagline: 'Pirate beats from beneath the roots',
    broadcasts: [
      '📻 "Subsoil Rebel live! If you can hear this, you still have your hat on."',
      '📻 ♪ Playing: "Trowel & Bass" ♪',
    ],
  },
  {
    id: 4,
    name: '107.9 FM — The Quiet Channel',
    tagline: 'Numbers, wind, and distant chimes',
    broadcasts: [
      '📻 "...seven... four... north-west gate... stay low..."',
      '📻 ♪ Soft chime resonates through static ♪',
    ],
  },
  {
    id: 5,
    name: '104.3 FM — Fescue Folk & Tales',
    tagline: 'Warm acoustic arpeggios & survivor stories',
    broadcasts: [
      '📻 "Back before the damp, we used to string paper lanterns from the yew boughs to the tap."',
      '📻 ♪ Playing: "Acorn Waltz by the Standpipe" ♪',
      '📻 "Old Barnaby says a good coat of linseed keeps the moss off till spring. Here’s to spring."',
    ],
  },
];

export interface RadioAudio {
  cycleStation(): RadioStation;
  current(): RadioStation;
  setProximity(gain01: number): void;
  setPortable(on: boolean): void;
  tick(dt: number, onBroadcast?: (line: string) => void): void;
}

export function createRadioAudio(): RadioAudio {
  let stationIdx = 0;
  let proximity = 0;
  let portable = false;
  let noteTimer = 0;
  let broadcastTimer = 10;
  let step = 0;
  let broadcastIdx = 0;
  let masterGain: GainNode | null = null;

  function ensureGain(): { ctx: AudioContext; out: GainNode } | null {
    const ctx = getAudioContext() as unknown as AudioContext | null;
    if (!ctx || ctx.state !== 'running') return null;
    if (!masterGain) {
      masterGain = ctx.createGain();
      masterGain.gain.value = 0;
      masterGain.connect(ctx.destination);
    }
    return { ctx, out: masterGain };
  }

  function playTone(freq: number, dur: number, type: OscillatorType, vol: number): void {
    const g = ensureGain();
    if (!g) return;
    const { ctx, out } = g;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(out);
    osc.start();
    osc.stop(ctx.currentTime + dur + 0.03);
  }

  function playStaticSweep(): void {
    const g = ensureGain();
    if (!g) return;
    const { ctx, out } = g;
    const dur = 0.16;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * 0.45;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(750, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2800, ctx.currentTime + dur);
    filter.Q.value = 1.6;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(out);
    src.start();
    src.stop(ctx.currentTime + dur + 0.02);
  }

  const MELODY_2 = [261.6, 329.6, 392.0, 329.6, 293.7, 349.2, 440.0, 392.0];
  const BASS_3 = [110, 110, 146.8, 130.8, 110, 164.8, 146.8, 98];
  const FOLK_5 = [196.0, 246.94, 293.66, 392.0, 293.66, 246.94, 220.0, 293.66, 349.23, 440.0];

  return {
    cycleStation() {
      stationIdx = (stationIdx + 1) % RADIO_STATIONS.length;
      noteTimer = 0;
      broadcastTimer = 3;
      playStaticSweep();
      return RADIO_STATIONS[stationIdx];
    },
    current: () => RADIO_STATIONS[stationIdx],
    setProximity(gain01: number) {
      proximity = Math.max(0, Math.min(1, gain01));
    },
    setPortable(on: boolean) {
      portable = on;
    },
    tick(dt: number, onBroadcast?: (line: string) => void) {
      const activeGain = stationIdx === 0 ? 0 : Math.max(proximity, portable ? 0.45 : 0);
      const g = ensureGain();
      if (g) g.out.gain.setTargetAtTime(activeGain * 0.14, g.ctx.currentTime, 0.15);
      if (stationIdx === 0 || activeGain <= 0.02) return;

      noteTimer -= dt;
      if (noteTimer <= 0) {
        step++;
        if (stationIdx === 1) {
          noteTimer = 1.6;
          playTone(step % 2 === 0 ? 660 : 440, 0.18, 'sine', 0.25);
        } else if (stationIdx === 2) {
          noteTimer = 0.55;
          playTone(MELODY_2[step % MELODY_2.length], 0.48, 'triangle', 0.35);
        } else if (stationIdx === 3) {
          noteTimer = 0.32;
          playTone(BASS_3[step % BASS_3.length], 0.25, 'sawtooth', 0.22);
        } else if (stationIdx === 4) {
          noteTimer = 2.2;
          playTone(523.25 * (step % 3 === 0 ? 1.5 : 1), 0.9, 'sine', 0.18);
        } else {
          noteTimer = 0.42;
          playTone(FOLK_5[step % FOLK_5.length], 0.38, 'triangle', 0.3);
        }
      }

      broadcastTimer -= dt;
      if (broadcastTimer <= 0) {
        broadcastTimer = 16;
        const lines = RADIO_STATIONS[stationIdx].broadcasts;
        if (lines.length > 0 && onBroadcast) {
          onBroadcast(lines[broadcastIdx % lines.length]);
          broadcastIdx++;
        }
      }
    },
  };
}
