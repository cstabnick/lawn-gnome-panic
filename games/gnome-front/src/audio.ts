// src/audio.ts: sound effects from game events (quieter with distance), the vehicle engine hum, and music from @lawn/music.
import { buildRunTrack, isMuted, pauseSong, playSong, resumeSong, setMuteKey, setMuted } from '@lawn/music';
import type { Game, GameEvent } from './config';

setMuteKey('gf-music-muted');

export interface GameAudio {
  /** Call from a user gesture (the Play click): unlocks audio and starts the music. */
  start(): void;
  update(dt: number): void;
}

const MASTER_GAIN = 0.5;
/** Sounds fade to silence at this distance from the camera. */
const HEARING_RANGE = 120;
/** Minimum volume worth playing. */
const MIN_VOL = 0.02;
/** Minimum gap between two shots by other soldiers, in ms. */
const OTHER_SHOT_GAP_MS = 30;

interface FilterSpec {
  type: BiquadFilterType;
  f0: number;
  f1?: number; // sweep target, reached at the end of the sound
  q?: number;
}

interface Point {
  x: number;
  y: number;
  z: number;
}

export function initAudio(game: Game): GameAudio {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let noiseBuf: AudioBuffer | null = null;
  let musicStarted = false;
  let lastOtherShotMs = -Infinity;

  // Engine hum: created on the first update after start(), then kept running.
  let engineSaw: OscillatorNode | null = null;
  let engineSquare: OscillatorNode | null = null;
  let engineGainSaw: GainNode | null = null;
  let engineGainSquare: GainNode | null = null;

  /** 0..1 volume for a sound at p: full at the camera, silent beyond HEARING_RANGE. 0 if too quiet to play. */
  function falloff(p: Point): number {
    const c = game.camera.position;
    const d = Math.hypot(p.x - c.x, p.y - c.y, p.z - c.z);
    const v = Math.min(1, Math.max(0, 1 - d / HEARING_RANGE));
    return v < MIN_VOL ? 0 : v;
  }

  function tone(f0: number, f1: number, dur: number, type: OscillatorType, vol: number, delay = 0): void {
    if (!ctx || !master) return;
    const c = ctx;
    const t = c.currentTime + delay;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  function noise(dur: number, vol: number, filter: FilterSpec, delay = 0): void {
    if (!ctx || !master) return;
    const c = ctx;
    if (!noiseBuf) {
      const len = Math.floor(c.sampleRate * 0.7);
      noiseBuf = c.createBuffer(1, len, c.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    const t = c.currentTime + delay;
    const src = c.createBufferSource();
    src.buffer = noiseBuf;
    const bq = c.createBiquadFilter();
    bq.type = filter.type;
    bq.Q.value = filter.q ?? 1;
    bq.frequency.setValueAtTime(filter.f0, t);
    if (filter.f1 !== undefined) bq.frequency.exponentialRampToValueAtTime(filter.f1, t + dur);
    const gain = c.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(bq);
    bq.connect(gain);
    gain.connect(master);
    src.start(t, Math.random() * 0.1);
    src.stop(t + dur);
  }

  function click(vol: number, delay: number): void {
    noise(0.015, 0.2 * vol, { type: 'highpass', f0: 2000, q: 0.7 }, delay);
  }

  function onEvent(e: GameEvent): void {
    if (!ctx) return;
    const me = game.player;
    switch (e.type) {
      case 'shot': {
        const mine = e.shooter === me;
        // The player's own shots play at full volume; others are limited in rate.
        const v = mine ? 1 : falloff(e.from);
        if (!v) return;
        if (!mine) {
          const now = performance.now();
          if (now - lastOtherShotMs < OTHER_SHOT_GAP_MS) return;
          lastOtherShotMs = now;
        }
        noise(0.06, 0.25 * v, { type: 'bandpass', f0: 1800, q: 1.2 });
        tone(150, 60, 0.08, 'sine', 0.3 * v);
        break;
      }
      case 'hit': {
        if (e.shooter === me) {
          const v = falloff(e.victim.pos);
          if (v) tone(1400, 1400, 0.04, 'square', 0.08 * v);
        } else if (e.victim === me) {
          const v = falloff(e.victim.pos);
          if (v) tone(200, 90, 0.2, 'sine', 0.35 * v);
        }
        break;
      }
      case 'kill': {
        if (e.killer === me) {
          const v = falloff(e.victim.pos);
          if (v) {
            tone(880, 880, 0.12, 'sine', 0.12 * v);
            tone(1320, 1320, 0.3, 'sine', 0.12 * v, 0.12);
          }
        }
        break;
      }
      case 'explosion': {
        const v = falloff(e.pos);
        if (!v) return;
        noise(0.6, 0.5 * v, { type: 'lowpass', f0: 1200, f1: 200, q: 0.7 });
        tone(90, 30, 0.6, 'sine', 0.5 * v);
        break;
      }
      case 'grenadeThrown': {
        const v = falloff(e.thrower.pos);
        if (v) noise(0.25, 0.15 * v, { type: 'highpass', f0: 800, f1: 3000, q: 0.7 });
        break;
      }
      case 'reload': {
        if (e.soldier === me) {
          const v = falloff(e.soldier.pos);
          if (v) {
            click(v, 0.25);
            click(v, 1.4);
          }
        }
        break;
      }
      case 'jump': {
        if (e.soldier === me) {
          const v = falloff(e.soldier.pos);
          if (v) tone(400, 600, 0.1, 'sine', 0.12 * v);
        }
        break;
      }
      case 'spawn': {
        if (e.soldier === me) {
          const v = falloff(e.soldier.pos);
          if (v) [523, 659, 784].forEach((f, i) => tone(f, f, 0.12, 'triangle', 0.12 * v, i * 0.1));
        }
        break;
      }
      case 'enterVehicle': {
        if (e.soldier === me) {
          const v = falloff(e.soldier.pos);
          if (!v) return;
          // Engine-start rattle: quick bandpassed pulses, then a low sawtooth catching.
          for (let i = 0; i < 6; i++) {
            noise(0.05, 0.2 * v, { type: 'bandpass', f0: 300 + i * 40, q: 2 }, i * 0.07);
          }
          tone(50, 90, 0.5, 'sawtooth', 0.06 * v, 0.1);
        }
        break;
      }
      case 'exitVehicle': {
        if (e.soldier === me) {
          const v = falloff(e.soldier.pos);
          if (!v) return;
          noise(0.03, 0.3 * v, { type: 'highpass', f0: 2500 });
          tone(500, 250, 0.05, 'square', 0.08 * v);
        }
        break;
      }
      case 'flagCaptured': {
        const v = falloff({ x: e.flag.def.x, y: game.camera.position.y, z: e.flag.def.z });
        if (!v) return;
        const notes = e.team === me.team ? [440, 554, 659, 880] : [880, 659, 554, 440];
        notes.forEach((f, i) => tone(f, f, 0.12, 'triangle', 0.12 * v, i * 0.1));
        break;
      }
      case 'flagLost': {
        if (e.team !== me.team) break;
        const v = falloff({ x: e.flag.def.x, y: game.camera.position.y, z: e.flag.def.z });
        if (v) {
          tone(440, 330, 0.15, 'triangle', 0.12 * v);
          tone(330, 220, 0.25, 'triangle', 0.12 * v, 0.15);
        }
        break;
      }
      case 'gameOver': {
        if (e.winner === me.team) {
          [523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.18, 'square', 0.07, i * 0.14));
        } else {
          // Sad trombone: three falling sawtooth notes.
          tone(311, 293, 0.4, 'sawtooth', 0.12, 0);
          tone(293, 277, 0.4, 'sawtooth', 0.12, 0.4);
          tone(277, 207, 0.9, 'sawtooth', 0.12, 0.8);
        }
        break;
      }
      default:
        break;
    }
  }

  function createEngine(c: AudioContext, out: GainNode): void {
    const lowpass = c.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 800;
    lowpass.connect(out);

    engineGainSaw = c.createGain();
    engineGainSaw.gain.value = 0;
    engineGainSaw.connect(lowpass);
    engineSaw = c.createOscillator();
    engineSaw.type = 'sawtooth';
    engineSaw.frequency.value = 60;
    engineSaw.connect(engineGainSaw);

    engineGainSquare = c.createGain();
    engineGainSquare.gain.value = 0;
    engineGainSquare.connect(lowpass);
    engineSquare = c.createOscillator();
    engineSquare.type = 'square';
    engineSquare.frequency.value = 30;
    engineSquare.connect(engineGainSquare);

    engineSaw.start();
    engineSquare.start();
  }

  function start(): void {
    try {
      if (!ctx) {
        const c = new AudioContext();
        const m = c.createGain();
        m.gain.value = MASTER_GAIN;
        m.connect(c.destination);
        ctx = c;
        master = m;
      }
      void ctx.resume().catch(() => {});
    } catch {
      ctx = null;
      master = null;
      return;
    }
    if (!musicStarted) {
      musicStarted = true;
      try {
        const seed = Math.floor(Math.random() * 2 ** 31);
        playSong((T, keep, out) => buildRunTrack(T, keep, out, seed));
      } catch {
        // Music is optional.
      }
    }
  }

  function update(dt: number): void {
    void dt;
    if (!ctx || !master) return;
    try {
      if (!engineSaw) createEngine(ctx, master);
      const now = ctx.currentTime;
      const v = game.player.vehicle;
      if (v && engineSaw && engineSquare && engineGainSaw && engineGainSquare) {
        const s = Math.abs(v.speed);
        const f = v.def.kind === 'combine' ? 35 + 3 * s : 60 + 7 * s;
        engineSaw.frequency.setTargetAtTime(f, now, 0.05);
        engineSquare.frequency.setTargetAtTime(f / 2, now, 0.05);
        engineGainSaw.gain.setTargetAtTime(0.05, now, 0.1);
        engineGainSquare.gain.setTargetAtTime(0.025, now, 0.1);
      } else if (engineGainSaw && engineGainSquare) {
        engineGainSaw.gain.setTargetAtTime(0, now, 0.15);
        engineGainSquare.gain.setTargetAtTime(0, now, 0.15);
      }
    } catch {
      // Audio must never break the game.
    }
  }

  game.on((e) => {
    try {
      onEvent(e);
    } catch {
      // Audio must never break the game.
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyM' && !e.repeat) setMuted(!isMuted());
  });

  // Leaving the tab (or locking the phone): pause the music instead of letting throttled timers
  // break its scheduler, and wake the audio back up on return. On phones the browser may still want
  // a tap before sound comes back; the music package listens for that tap.
  document.addEventListener('visibilitychange', () => {
    if (!musicStarted) return;
    try {
      if (document.hidden) {
        pauseSong();
        void ctx?.suspend().catch(() => {});
      } else {
        void ctx?.resume().catch(() => {});
        resumeSong();
      }
    } catch {
      // Audio must never break the game.
    }
  });
  // Our own effects context can also be suspended by the browser: wake it on any tap or key.
  const wake = (): void => {
    if (ctx && ctx.state !== 'running') void ctx.resume().catch(() => {});
  };
  for (const ev of ['pointerdown', 'keydown', 'touchend'] as const) window.addEventListener(ev, wake, true);

  return { start, update };
}
