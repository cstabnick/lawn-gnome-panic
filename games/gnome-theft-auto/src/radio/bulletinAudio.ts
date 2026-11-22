// News bulletin alert stinger + SamJs "News bulletin" spoken announcement routed through a broadcast radio EQ.
import SamJs from 'sam-js';
import { isMuted } from '@lawn/music';
import { getAudioOutput } from '../audio';

const SAM_SAMPLE_RATE = 22050;
let cachedPcm: Float32Array | null | undefined;

function getBulletinPcm(): Float32Array | null {
  if (cachedPcm !== undefined) return cachedPcm;
  try {
    const sam = new SamJs({ pitch: 68, speed: 74, throat: 120, mouth: 124 });
    const out = sam.buf32('News bulletin');
    cachedPcm = out instanceof Float32Array && out.length > 0 ? out : null;
  } catch {
    cachedPcm = null;
  }
  return cachedPcm;
}

export interface BulletinIntroOpts {
  gain?: number;
  pan?: number;
  muffled?: boolean;
}

/**
 * Plays a crisp 3-note news-flash chime followed by SamJs saying "News bulletin".
 * Returns the delay (in seconds) before the bulletin text should pop up on screen.
 */
export function playBulletinIntro(opts: BulletinIntroOpts = {}): number {
  const gainScale = opts.gain ?? 1;
  if (isMuted() || gainScale <= 0.005) return 0.35;

  const out = getAudioOutput();
  if (!out || out.muted || out.ctx.state !== 'running') return 0.35;

  const { ctx, master } = out;
  try {
    const now = ctx.currentTime;

    const channelGain = ctx.createGain();
    channelGain.gain.value = Math.max(0, Math.min(1, gainScale));

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 220;

    const presence = ctx.createBiquadFilter();
    presence.type = 'peaking';
    presence.frequency.value = 1800;
    presence.Q.value = 1.2;
    presence.gain.value = 4;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = opts.muffled ? 1200 : 3800;

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 5;
    comp.attack.value = 0.004;
    comp.release.value = 0.12;

    hp.connect(presence);
    presence.connect(lp);
    lp.connect(comp);
    comp.connect(channelGain);

    if (typeof ctx.createStereoPanner === 'function') {
      const panner = ctx.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, opts.pan ?? 0));
      channelGain.connect(panner);
      panner.connect(master);
    } else {
      channelGain.connect(master);
    }

    // Subtle 25ms radio squelch click at t = 0
    const squelchLen = Math.max(1, Math.floor(ctx.sampleRate * 0.025));
    const squelchBuf = ctx.createBuffer(1, squelchLen, ctx.sampleRate);
    const sqData = squelchBuf.getChannelData(0);
    for (let i = 0; i < squelchLen; i++) sqData[i] = (Math.random() * 2 - 1) * (1 - i / squelchLen);
    const sqSrc = ctx.createBufferSource();
    sqSrc.buffer = squelchBuf;
    const sqBp = ctx.createBiquadFilter();
    sqBp.type = 'bandpass';
    sqBp.frequency.value = 2200;
    sqBp.Q.value = 2;
    const sqGain = ctx.createGain();
    sqGain.gain.value = 0.18;
    sqSrc.connect(sqBp).connect(sqGain).connect(hp);
    sqSrc.start(now);

    // 3-note news-flash chime (0.00s - 0.36s): A5 -> D6 -> G6
    const notes = [880, 1174.7, 1568];
    notes.forEach((freq, i) => {
      const t0 = now + i * 0.09;
      const dur = i === notes.length - 1 ? 0.18 : 0.11;
      const tri = ctx.createOscillator();
      tri.type = 'triangle';
      tri.frequency.setValueAtTime(freq, t0);
      const sine = ctx.createOscillator();
      sine.type = 'sine';
      sine.frequency.setValueAtTime(freq * 2, t0);
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.0001, t0);
      ng.gain.linearRampToValueAtTime(0.28, t0 + 0.008);
      ng.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      const sg = ctx.createGain();
      sg.gain.value = 0.25;
      tri.connect(ng);
      sine.connect(sg).connect(ng);
      ng.connect(hp);
      tri.start(t0);
      sine.start(t0);
      tri.stop(t0 + dur + 0.01);
      sine.stop(t0 + dur + 0.01);
    });

    const pcm = getBulletinPcm();
    if (!pcm) return 0.45;

    const audioBuf = ctx.createBuffer(1, pcm.length, SAM_SAMPLE_RATE);
    audioBuf.getChannelData(0).set(pcm);
    const src = ctx.createBufferSource();
    src.buffer = audioBuf;
    const playbackRate = 0.96;
    src.playbackRate.value = playbackRate;
    const voiceGain = ctx.createGain();
    voiceGain.gain.value = 0.85;
    src.connect(voiceGain).connect(hp);
    src.start(now + 0.32);

    const voiceDur = audioBuf.duration / playbackRate;
    return Math.min(1.6, Math.max(0.75, 0.32 + voiceDur));
  } catch {
    return 0.35;
  }
}
