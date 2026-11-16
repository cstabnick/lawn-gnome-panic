#!/usr/bin/env node
/**
 * Programmatic mix analyzer CLI for @lawn/music.
 * Renders tracks offline in headless Chromium via Tone.Offline + WebAudio,
 * runs both audio-graph linting and stereo DSP analysis, and optionally exports WAVs.
 *
 * Usage:
 *   npm run analyze -w packages/music -- [--tracks runTrack,menuTheme,...] [--duration 28] [--seed 42] [--wav samples/wav] [--json samples/report.json] [--no-fail]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import puppeteer from 'puppeteer-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgDir = path.resolve(__dirname, '..');

const BROWSERS = [
  process.env.DEMO_BROWSER,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/microsoft-edge',
].filter(Boolean);

const DEFAULT_TRACKS = ['runTrack', 'menuTheme', 'trance', 'sectorTrack', 'golfAmbient', 'bowlingAmbient'];

const flags = { tracks: DEFAULT_TRACKS.join(','), duration: '28', seed: '42' };
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a === '--no-fail') flags.noFail = true;
  else if (a === '--theory-only') flags.theoryOnly = true;
  else if (a.startsWith('--')) flags[a.slice(2)] = process.argv[++i];
}

const tracks = flags.tracks.split(',').map((s) => s.trim()).filter(Boolean);
const durationS = Number(flags.duration);
const seed = Number(flags.seed);
const wavDir = flags.wav ? path.resolve(pkgDir, flags.wav) : null;
const jsonPath = flags.json ? path.resolve(pkgDir, flags.json) : null;
const wantWav = Boolean(wavDir);

const browserPath = BROWSERS.find((p) => fs.existsSync(p));
if (!browserPath) {
  console.error('analyze: no Chrome/Edge binary found (set DEMO_BROWSER).');
  process.exit(1);
}

// Bundle @lawn/music + Tone + analyzer into a single browser IIFE
const entrySource = `
  import * as Tone from 'tone';
  import {
    buildRunTrack,
    buildMenuTheme,
    buildTranceTrack,
    buildSectorTrack,
    buildGolfAmbient,
    buildBowlingAmbient,
    SECTOR_THEMES,
  } from ${JSON.stringify(path.join(pkgDir, 'src/index.ts'))};
  import { analyzeBuffer, encodeWav } from ${JSON.stringify(path.join(pkgDir, 'src/analyze/dsp.ts'))};
  import { lintSongGraph } from ${JSON.stringify(path.join(pkgDir, 'src/analyze/graph.ts'))};
  import { analyzeTheory } from ${JSON.stringify(path.join(pkgDir, 'src/analyze/theory.ts'))};

  const BUILDERS = {
    runTrack: (s) => (T, keep, out) => buildRunTrack(T, keep, out, s),
    menuTheme: () => buildMenuTheme,
    trance: (s) => (T, keep, out) => buildTranceTrack(T, keep, out, s),
    sectorTrack: (s) => (T, keep, out) => buildSectorTrack(T, keep, out, s, { theme: SECTOR_THEMES[0], battle: () => false }),
    golfAmbient: (s) => (T, keep, out) => buildGolfAmbient(T, keep, out, s),
    bowlingAmbient: (s) => (T, keep, out) => buildBowlingAmbient(T, keep, out, s),
  };

  window.__analyzeTrack = async (name, seed, durationS, wantWav) => {
    const factory = BUILDERS[name];
    if (!factory) throw new Error('Unknown track: ' + name);
    const builder = factory(seed);

    const graph = lintSongGraph(builder);
    const theory = analyzeTheory(builder, durationS);
    if (${JSON.stringify(Boolean(flags.theoryOnly))}) {
      return { track: name, seed, durationS, graph, theory, dsp: null, wavBase64: null };
    }
    const disposables = [];
    const keep = (x) => { disposables.push(x); return x; };

    const buffer = await Tone.Offline(({ transport }) => {
      const out = keep(new Tone.Volume(-12).toDestination());
      builder(Tone, keep, out);
      transport.start(0);
    }, durationS, 2, 48000);

    for (const d of disposables) {
      try { d.dispose(); } catch {}
    }

    const left = buffer.getChannelData(0);
    const right = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : left;
    const dsp = analyzeBuffer(left, right, buffer.sampleRate, { skipStartS: Math.min(2, durationS * 0.1) });

    let wavBase64 = null;
    if (wantWav) {
      const wav = encodeWav(left, right, buffer.sampleRate);
      let bin = '';
      const chunk = 0x8000;
      for (let i = 0; i < wav.length; i += chunk) {
        bin += String.fromCharCode(...wav.subarray(i, i + chunk));
      }
      wavBase64 = btoa(bin);
    }

    return { track: name, seed, durationS, graph, theory, dsp, wavBase64 };
  };
`;

const built = await esbuild.build({
  stdin: { contents: entrySource, resolveDir: pkgDir, loader: 'ts' },
  bundle: true,
  write: false,
  format: 'iife',
  platform: 'browser',
  target: 'es2022',
});

const bundleCode = built.outputFiles[0].text;
const browser = await puppeteer.launch({
  executablePath: browserPath,
  headless: true,
  args: ['--autoplay-policy=no-user-gesture-required', '--no-sandbox'],
});

const results = [];
try {
  const page = await browser.newPage();
  await page.setContent('<!doctype html><html><body></body></html>');
  await page.addScriptTag({ content: bundleCode });

  if (wavDir) fs.mkdirSync(wavDir, { recursive: true });

  for (const name of tracks) {
    const res = await page.evaluate(
      (n, s, d, w) => window.__analyzeTrack(n, s, d, w),
      name,
      seed,
      durationS,
      wantWav,
    );
    if (res.wavBase64 && wavDir) {
      const outWav = path.join(wavDir, `${name}.wav`);
      fs.writeFileSync(outWav, Buffer.from(res.wavBase64, 'base64'));
    }
    delete res.wavBase64;
    results.push(res);
  }
} finally {
  await browser.close();
}

// Print summary table
const fmt = (n, d = 1) => (n >= 0 ? ` ${n.toFixed(d)}` : n.toFixed(d));
console.log(`\n@lawn/music Mix & Theory Analysis (seed=${seed}, duration=${durationS}s)\n`);
console.log(
  'Track            | Graph | Theory      | Key            | InScale | Clash | DSP  | Peak dB | RMS dB | Corr | Side/Mid',
);
console.log(
  '-----------------+-------+-------------+----------------+---------+-------+------+---------+--------+------+---------',
);

let anyError = false;
for (const r of results) {
  const gOk = r.graph.ok ? 'PASS ' : 'FAIL ';
  const tOk = `${r.theory.grade}(${String(r.theory.score).padStart(3)})`;
  const keyStr = `${r.theory.detectedKey.rootName} ${r.theory.detectedKey.mode}`.padEnd(14);
  const inScale = `${(r.theory.detectedKey.inScaleRatio * 100).toFixed(0)}%`.padStart(6);
  const clash = `${(r.theory.clashRatio * 100).toFixed(0)}%`.padStart(4);
  const d = r.dsp;
  const dOk = d ? (d.ok ? 'PASS' : 'FAIL') : 'SKIP';
  if (!r.graph.ok || !r.theory.ok || (d && !d.ok)) anyError = true;
  const peak = d ? fmt(d.peakDb).padStart(7) : '      -';
  const rms = d ? fmt(d.rmsDb).padStart(6) : '     -';
  const corr = d ? d.correlation.toFixed(2).padStart(4) : '   -';
  const sm = d ? fmt(d.sideToMidDb).padStart(8) : '       -';
  console.log(
    `${r.track.padEnd(16)} | ${gOk} | ${tOk.padEnd(11)} | ${keyStr} | ${inScale}  | ${clash}  | ${dOk} | ${peak} | ${rms} | ${corr} | ${sm}`,
  );
}

console.log('');
for (const r of results) {
  const allIssues = [...r.graph.issues, ...r.theory.issues, ...(r.dsp ? r.dsp.issues : [])];
  if (allIssues.length === 0) continue;
  console.log(`[${r.track}]`);
  for (const iss of allIssues) {
    console.log(`  ${iss.severity.toUpperCase().padEnd(5)} (${iss.code}): ${iss.message}`);
  }
}

if (jsonPath) {
  fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify({ seed, durationS, results }, null, 2));
  console.log(`\nWrote JSON report to ${path.relative(pkgDir, jsonPath)}`);
}
if (wavDir) {
  console.log(`Wrote WAV samples to ${path.relative(pkgDir, wavDir)}`);
}

if (anyError && !flags.noFail) {
  process.exit(1);
}
