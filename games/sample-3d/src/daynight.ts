import * as THREE from 'three';
import { COLORS, TUNING, type DayNight, type DayNightState, type WorldTheme } from './config';

/** The day/night clock and its colour palette. */

interface PaletteSpec {
  lightColor: number; lightIntensity: number;
  hemiSky: number; hemiGround: number; hemiIntensity: number;
  skyZenith: number; skyHorizon: number; fogColor: number;
}

interface Palette {
  lightColor: THREE.Color; lightIntensity: number;
  hemiSky: THREE.Color; hemiGround: THREE.Color; hemiIntensity: number;
  skyZenith: THREE.Color; skyHorizon: THREE.Color; fogColor: THREE.Color;
}

function makePalette(p: PaletteSpec): Palette {
  return {
    lightColor: new THREE.Color(p.lightColor), lightIntensity: p.lightIntensity,
    hemiSky: new THREE.Color(p.hemiSky), hemiGround: new THREE.Color(p.hemiGround), hemiIntensity: p.hemiIntensity,
    skyZenith: new THREE.Color(p.skyZenith), skyHorizon: new THREE.Color(p.skyHorizon), fogColor: new THREE.Color(p.fogColor),
  };
}

const DAY = makePalette({
  lightColor: 0xfff2d6, lightIntensity: 2.8,
  hemiSky: 0xffffff, hemiGround: 0x446644, hemiIntensity: 1.2,
  skyZenith: 0x5aa9ff, skyHorizon: 0xcfe9ff, fogColor: COLORS.sky,
});
/** Desert day: hot white light, pale bleached sky, sandy bounce light. */
const DESERT_DAY = makePalette({
  lightColor: 0xfff0d0, lightIntensity: 3.1,
  hemiSky: 0xfff6e6, hemiGround: 0x9a7a4a, hemiIntensity: 1.25,
  skyZenith: 0x4f9de0, skyHorizon: 0xf3e2c0, fogColor: 0xe9d7b0,
});
const GOLDEN = makePalette({
  lightColor: 0xffa45c, lightIntensity: 1.7,
  hemiSky: 0xffd2a0, hemiGround: 0x3a4a2a, hemiIntensity: 0.8,
  skyZenith: 0x4f6fb8, skyHorizon: 0xffa070, fogColor: 0xe8a27a,
});
const NIGHT = makePalette({
  lightColor: 0x9fb4ff, lightIntensity: 0.45,
  hemiSky: 0x2a3a70, hemiGround: 0x0d1a12, hemiIntensity: 0.35,
  skyZenith: 0x070b22, skyHorizon: 0x1b2550, fogColor: 0x141c3a,
});

function smoothstep(e0: number, e1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, k: number): number {
  return a + (b - a) * k;
}

/** Writes the mix of GOLDEN -> target by k into out (no allocation). */
function blendInto(out: DayNightState, target: Palette, k: number): void {
  out.lightColor.lerpColors(GOLDEN.lightColor, target.lightColor, k);
  out.lightIntensity = lerp(GOLDEN.lightIntensity, target.lightIntensity, k);
  out.hemiSky.lerpColors(GOLDEN.hemiSky, target.hemiSky, k);
  out.hemiGround.lerpColors(GOLDEN.hemiGround, target.hemiGround, k);
  out.hemiIntensity = lerp(GOLDEN.hemiIntensity, target.hemiIntensity, k);
  out.skyZenith.lerpColors(GOLDEN.skyZenith, target.skyZenith, k);
  out.skyHorizon.lerpColors(GOLDEN.skyHorizon, target.skyHorizon, k);
  out.fogColor.lerpColors(GOLDEN.fogColor, target.fogColor, k);
}

export function createDayNight(): DayNight {
  const s: DayNightState = {
    t: TUNING.dayStartT, phase: 'day', night01: 0,
    lightDir: new THREE.Vector3(0, 1, 0), lightColor: new THREE.Color(), lightIntensity: 0,
    hemiSky: new THREE.Color(), hemiGround: new THREE.Color(), hemiIntensity: 0,
    skyZenith: new THREE.Color(), skyHorizon: new THREE.Color(), fogColor: new THREE.Color(),
  };

  const recompute = (): void => {
    const a = 2 * Math.PI * s.t;
    const c = Math.cos(a);
    const sn = Math.sin(a); // sun height: +1 noon, -1 midnight

    s.night01 = 1 - smoothstep(-0.12, 0.1, sn);

    if (sn >= 0.25) s.phase = 'day';
    else if (sn <= -0.15) s.phase = 'night';
    else s.phase = (s.t < 0.25 || s.t > 0.75) ? 'dawn' : 'dusk';

    if (sn >= 0) {
      s.lightDir.set(c * 0.8, Math.max(sn, 0.15), 0.45).normalize(); // never flat: long-but-sane shadows at sunrise and sunset
    } else {
      // moon: opposite side of the sun, up at night; keep it high enough that shadows are not flat
      const my = Math.max(-sn, 0.15);
      s.lightDir.set(-c * 0.8, my, -0.45).normalize();
    }

    if (sn >= 0.05) {
      blendInto(s, day, smoothstep(0.05, 0.4, sn));
    } else {
      blendInto(s, NIGHT, smoothstep(0.05, -0.15, sn));
    }
  };

  let day = DAY;

  recompute();

  return {
    setTheme(theme: WorldTheme): void {
      day = theme === 'desert' ? DESERT_DAY : DAY;
      recompute();
    },
    update(dt: number): DayNightState {
      s.t = (s.t + dt / TUNING.dayLengthS) % 1;
      recompute();
      return s;
    },
    state(): DayNightState { return s; },
    setTime(t: number): void {
      s.t = t;
      recompute();
    },
  };
}
