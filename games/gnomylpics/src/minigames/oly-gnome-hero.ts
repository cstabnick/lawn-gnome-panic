// Gnome Hero: a Gnome Party slice of gnomylpics. Notes fall down a 4-lane highway in time with a drum beat; hit each
// one in its lane as it crosses the line. The four gnomes jam on a stage: every hit (yours or theirs) plays a note.
// Most points wins. The chart is random but seeded, so every seat judges the same notes.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import type { MinigameDef } from '@lawn/party';
import { soleWinner } from '@lawn/party';
import { createJam, type Jam } from '../hero/audio';
import { chartFor, type Chart } from '../hero/chart';
import { addRacers, createBoard, laneX, poseRacer } from '../olympic/field';
import { placesFrom } from '../olympic/rank';

// ---- Tuning ----------------------------------------------------------------------------------------------------
const PERFECT = 0.06, GOOD = 0.15; // seconds either side of a note
const PTS_PERFECT = 100, PTS_GOOD = 50;
const COMBO_STEP = 8, MAX_MULT = 4; // multiplier = min(MAX_MULT, 1 + floor(combo / COMBO_STEP)), combo AFTER the hit
const END_PAD = 1.5; // the round ends at songS + END_PAD
const LOOKAHEAD = 1.6; // view: seconds of notes visible on the highway
const ROUND_S = 50;

const SKILL_MIN = 0.65, SKILL_RANGE = 0.3; // CPU judging skill
const LANE_COLORS = ['#4caf50', '#f44336', '#ffeb3b', '#2196f3'];
const LANE_KEYS: string[][] = [
  ['KeyA', 'ArrowLeft', 'KeyJ'],
  ['KeyS', 'ArrowDown', 'KeyK'],
  ['KeyD', 'ArrowUp', 'KeyL'],
  ['KeyF', 'ArrowRight', 'Semicolon'],
];
const HINT_TEXT = 'A S D F  or  ← ↓ ↑ →';
const HINT_S = 3; // seconds the key hint stays up
const HIT_FLASH_S = 0.1; // a lane ring stays filled this long after a press
const STRUM_S = 0.15; // a strum arm swing eases back over this long
const STRUM_ANGLE = -1.2;
const FLASH_S = 0.3; // a seat's spotlight flash after a hit fades over this long
const BOB = 0.06; // metres a gnome hops on the beat
const STAGE_GAP = 1.4; // metres between gnomes on the stage (on top of LANE_W spacing)
const HIGHWAY_BG = 'rgba(0,0,0,0.5)';

// ---- State -----------------------------------------------------------------------------------------------------
interface Seat { score: number; hits: number; miss: number; combo: number; best: number; lane: number; skill: number }
interface S { t: number; seed: number; ni: number; seats: Seat[] }
// A human's counters (judged on their own screen) or, for a CPU, auto: true (judged here in step).
interface I { score: number; hits: number; miss: number; combo: number; best: number; lane: number; auto: boolean }

function mult(combo: number): number {
  return Math.min(MAX_MULT, 1 + Math.floor(combo / COMBO_STEP));
}

const def: MinigameDef<S, I> = {
  meta: {
    id: 'oly-gnome-hero',
    title: 'Gnome Hero',
    game: 'gnomylpics',
    goal: 'Hit the most notes on the beat and score the most points.',
    controls: 'Lanes: A S D F (or ← ↓ ↑ →, or J K L ;), or tap the four lane buttons.',
    maxSeconds: ROUND_S,
  },

  init(seats, rng) {
    const seed = Math.floor(rng() * 2147483647);
    return {
      t: 0,
      seed,
      ni: 0,
      seats: seats.map(() => ({
        score: 0,
        hits: 0,
        miss: 0,
        combo: 0,
        best: 0,
        lane: 1,
        skill: SKILL_MIN + rng() * SKILL_RANGE,
      })),
    };
  },

  step(s, inputs, dt, rng) {
    s.t += dt;
    const c = chartFor(s.seed);

    // Humans judge themselves on their own screen: copy their counters.
    s.seats.forEach((seat, k) => {
      const i = inputs[k];
      if (i && !i.auto) {
        seat.score = i.score;
        seat.hits = i.hits;
        seat.miss = i.miss;
        seat.combo = i.combo;
        seat.best = i.best;
        seat.lane = i.lane;
      }
    });

    // CPU judging: every note whose window has closed is judged for each auto seat.
    while (s.ni < c.notes.length && c.notes[s.ni].t <= s.t - GOOD) {
      const note = c.notes[s.ni];
      s.seats.forEach((seat, k) => {
        const i = inputs[k];
        if (!i || !i.auto) return;
        if (rng() < seat.skill) {
          seat.combo += 1;
          seat.best = Math.max(seat.best, seat.combo);
          seat.hits += 1;
          seat.lane = note.lane;
          seat.score += (rng() < seat.skill ? PTS_PERFECT : PTS_GOOD) * mult(seat.combo);
        } else {
          seat.miss += 1;
          seat.combo = 0;
        }
      });
      s.ni += 1;
    }
  },

  cpu(s, seat) {
    const me = s.seats[seat];
    return { score: me.score, hits: me.hits, miss: me.miss, combo: me.combo, best: me.best, lane: me.lane, auto: true };
  },

  result(s, timeUp) {
    if (!timeUp && s.t < chartFor(s.seed).songS + END_PAD) return null;
    return placesFrom(s.seats.map((x) => x.score), true);
  },

  report(s, places, seats) {
    const total = chartFor(s.seed).notes.length;
    const w = soleWinner(places);
    const who = w === null ? null : (seats[w]?.name ?? null);
    const ws = w === null ? null : s.seats[w];
    const headline = !who || !ws ? undefined
      : total > 0 && ws.hits === total && ws.miss === 0 ? `${who} played a perfect run!`
      : `${who} rocked out for ${ws.score} pts`;
    return {
      headline,
      stats: [
        { key: 'score', label: 'Points', unit: 'pts', format: 'int', better: 'higher' },
        { key: 'hits', label: 'Notes hit', format: 'int', better: 'higher' },
        { key: 'best', label: 'Best streak', format: 'int', better: 'higher' },
      ],
      values: s.seats.map((x) => ({ score: x.score, hits: x.hits, best: x.best })),
      notes: s.seats.map((x) => (total > 0 && x.hits === total && x.miss === 0 ? 'Perfect run!' : null)),
    };
  },

  createView(ctx) {
    const { scene, camera, ui, seats, mySeat } = ctx;

    // Stage: a dim jam room, a wooden stage, one coloured spotlight per gnome.
    scene.background = new THREE.Color(0x1a1033);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x221133, 0.5));
    const stage = new THREE.Mesh(
      new THREE.BoxGeometry(12, 0.4, 5),
      new THREE.MeshStandardMaterial({ color: 0x5d4037 }),
    );
    stage.position.set(0, -0.2, 0);
    stage.receiveShadow = true;
    scene.add(stage);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: 0x0b0716 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.42;
    scene.add(floor);

    // The camera looks down -z, so negate laneX to put seat 0 on the left as on the scoreboard.
    const xOf = (k: number): number => -laneX(k) * STAGE_GAP;
    const racers = addRacers(scene, seats);
    const spots = seats.map((seat, k) => {
      const spot = new THREE.SpotLight(seat.color, 2, 30, Math.PI / 6, 0.5);
      spot.position.set(xOf(k), 6, 2);
      spot.target.position.set(xOf(k), 1, 0);
      scene.add(spot);
      scene.add(spot.target);
      return spot;
    });

    // A guitar per gnome: a body in the seat colour facing the camera, and a neck.
    racers.forEach((r, k) => {
      const guitar = buildPrefab('guitar', { tint: seats[k].color, scale: 0.9 });
      guitar.rotation.z = -1.2;
      guitar.position.set(-0.14, 0.35, 0.2);
      r.model.object.add(guitar);
    });

    camera.position.set(0, 2.4, 7.5);
    camera.lookAt(0, 1.1, 0);

    const board = createBoard(ui, seats, mySeat);
    const strum: number[] = seats.map(() => 0);
    const flash: number[] = seats.map(() => 0);
    const lastPressAt: number[] = [-1, -1, -1, -1];

    // Per-run state, set on the first render (the chart and jam come from the host's seed).
    let state: { chart: Chart; jam: Jam; judged: boolean[]; prevHits: number[] } | null = null;
    let songT = 0;

    // My own judging counters.
    let myScore = 0, myHits = 0, myMiss = 0, myCombo = 0, myBest = 0, myLane = 1;
    let judgeText = '';
    let judgeColor = '#ffffff';
    let judgeAt = -10;
    let hintShown = '';

    // The highway (my seat only).
    let highway: HTMLCanvasElement | null = null;
    let g2d: CanvasRenderingContext2D | null = null;
    if (mySeat !== null) {
      highway = document.createElement('canvas');
      highway.style.cssText =
        'position:absolute;left:50%;transform:translateX(-50%);bottom:4vh;width:min(92vw,420px);height:60vh;pointer-events:none';
      ui.appendChild(highway);
      g2d = highway.getContext('2d');
    }

    const judge = (text: string, color: string): void => {
      judgeText = text;
      judgeColor = color;
      judgeAt = songT;
    };

    // A press in lane L: the first unjudged note in that lane inside the GOOD window is hit.
    const press = (L: number): void => {
      if (!state || mySeat === null) return;
      const { chart, jam, judged } = state;
      lastPressAt[L] = songT;
      let hitIdx = -1;
      for (let i = 0; i < chart.notes.length; i++) {
        const n = chart.notes[i];
        if (n.t > songT + GOOD) break;
        if (!judged[i] && n.lane === L && Math.abs(n.t - songT) <= GOOD) {
          hitIdx = i;
          break;
        }
      }
      if (hitIdx >= 0) {
        const d = Math.abs(chart.notes[hitIdx].t - songT);
        judged[hitIdx] = true;
        myCombo += 1;
        myBest = Math.max(myBest, myCombo);
        myHits += 1;
        myLane = L;
        const perfect = d <= PERFECT;
        myScore += (perfect ? PTS_PERFECT : PTS_GOOD) * mult(myCombo);
        judge(perfect ? 'PERFECT' : 'GOOD', perfect ? '#ffd54f' : '#ffffff');
        jam.note(L, mySeat, true);
        strum[mySeat] = 1;
        flash[mySeat] = 1;
      } else {
        myCombo = 0;
        jam.clunk();
        judge('MISS', '#ff5252');
      }
    };

    const onKey = (e: KeyboardEvent): void => {
      if (e.repeat) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      for (let L = 0; L < 4; L++) {
        if (LANE_KEYS[L].includes(e.code)) {
          e.preventDefault();
          press(L);
          return;
        }
      }
    };
    if (mySeat !== null) window.addEventListener('keydown', onKey);

    // Touch: four lane buttons across the bottom of the highway.
    if (mySeat !== null && window.matchMedia('(pointer: coarse)').matches) {
      const wrap = document.createElement('div');
      wrap.style.cssText =
        'position:absolute;left:50%;transform:translateX(-50%);bottom:4vh;width:min(92vw,420px);height:14vh;display:flex;gap:6px';
      for (let L = 0; L < 4; L++) {
        const b = document.createElement('div');
        b.style.cssText = `flex:1;border-radius:10px;background:${LANE_COLORS[L]};opacity:0.35;pointer-events:auto;touch-action:none`;
        b.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          press(L);
        });
        wrap.appendChild(b);
      }
      ui.appendChild(wrap);
    }

    // Draws the highway canvas for my seat: lanes, beat lines, the hit line, notes and the judgement text.
    const drawHighway = (c: Chart): void => {
      const cv = highway;
      const g = g2d;
      if (!cv || !g) return;
      const dpr = window.devicePixelRatio || 1;
      const W = cv.clientWidth;
      const H = cv.clientHeight;
      if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
        cv.width = Math.round(W * dpr);
        cv.height = Math.round(H * dpr);
      }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      g.fillStyle = HIGHWAY_BG;
      g.fillRect(0, 0, W, H);

      const laneW = W / 4;
      const hitY = H * 0.85;
      const cx = (L: number): number => (L + 0.5) * laneW;
      const yOf = (dt: number): number => hitY - (dt / LOOKAHEAD) * hitY;
      const gemR = Math.min(laneW * 0.32, 24);

      // Lane tints.
      g.globalAlpha = 0.1;
      for (let L = 0; L < 4; L++) {
        g.fillStyle = LANE_COLORS[L];
        g.fillRect(L * laneW, 0, laneW, H);
      }
      g.globalAlpha = 1;

      // Beat lines on the beat grid the drums use (song time 0 = beat 0).
      g.strokeStyle = 'rgba(255,255,255,0.18)';
      g.lineWidth = 1;
      for (let n = Math.max(0, Math.floor(songT / c.beat)); ; n++) {
        const t = n * c.beat;
        const dt = t - songT;
        if (dt > LOOKAHEAD) break;
        if (dt < 0) continue;
        const y = yOf(dt);
        g.beginPath();
        g.moveTo(0, y);
        g.lineTo(W, y);
        g.stroke();
      }

      // The hit line and a ring per lane (filled while that lane was just pressed).
      g.strokeStyle = '#ffffff';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(0, hitY);
      g.lineTo(W, hitY);
      g.stroke();
      for (let L = 0; L < 4; L++) {
        const lit = songT - lastPressAt[L] < HIT_FLASH_S;
        g.beginPath();
        g.arc(cx(L), hitY, gemR, 0, Math.PI * 2);
        if (lit) {
          g.fillStyle = LANE_COLORS[L];
          g.fill();
        } else {
          g.lineWidth = 3;
          g.strokeStyle = LANE_COLORS[L];
          g.stroke();
        }
      }

      // Notes in the lookahead window.
      if (state) {
        const { judged } = state;
        for (let i = 0; i < c.notes.length; i++) {
          if (judged[i]) continue;
          const n = c.notes[i];
          const dt = n.t - songT;
          if (dt < 0) continue;
          if (dt > LOOKAHEAD) break;
          g.fillStyle = LANE_COLORS[n.lane];
          g.beginPath();
          g.arc(cx(n.lane), yOf(dt), gemR * 0.8, 0, Math.PI * 2);
          g.fill();
        }
      }

      // Judgement text (fades over 0.4 s) and my combo, above the hit line.
      const age = songT - judgeAt;
      g.textAlign = 'center';
      if (age >= 0 && age < 0.4) {
        g.globalAlpha = 1 - age / 0.4;
        g.fillStyle = judgeColor;
        g.font = '900 22px system-ui';
        g.fillText(judgeText, W / 2, hitY - H * 0.1);
        g.globalAlpha = 1;
      }
      g.fillStyle = '#ffffff';
      g.font = '700 18px system-ui';
      g.fillText(`${myCombo}  x${mult(myCombo)}`, W / 2, hitY - H * 0.16);
    };

    return {
      render(s, dt) {
        if (!state) {
          const chart = chartFor(s.seed);
          const jam = createJam({ bpm: chart.bpm, leadS: chart.leadS, songS: chart.songS });
          songT = s.t;
          // Notes that passed before I arrived are not misses.
          state = {
            chart,
            jam,
            judged: chart.notes.map((n) => n.t < songT),
            prevHits: s.seats.map((x) => x.hits),
          };
          board.banner('JAM!', '#ffd54f', 1500);
        }
        const { chart, jam, judged, prevHits } = state;

        // Song clock: advance with the frame, ease towards the host's time.
        songT += dt;
        if (Math.abs(s.t - songT) > 0.25) songT = s.t;
        else songT += (s.t - songT) * Math.min(1, dt * 2);
        jam.tick(songT);

        // Other seats' hits play their note and strum their gnome.
        s.seats.forEach((x, k) => {
          if (k === mySeat) return;
          if (x.hits > prevHits[k]) {
            jam.note(x.lane, k, false);
            strum[k] = 1;
            flash[k] = 1;
          }
          prevHits[k] = x.hits;
        });

        // My misses: notes whose window has closed unjudged.
        if (mySeat !== null) {
          for (let i = 0; i < chart.notes.length; i++) {
            if (!judged[i] && chart.notes[i].t < songT - GOOD) {
              judged[i] = true;
              myMiss += 1;
              myCombo = 0;
              judge('MISS', '#ff5252');
            }
          }
        }

        // Stage: bob on the beat, pulse the spotlights, swing the strums back.
        const beatPhase = (songT / chart.beat) % 1;
        const pulse = Math.exp(-beatPhase * 6);
        const bob = BOB * Math.max(0, Math.cos((2 * Math.PI * songT) / chart.beat));
        racers.forEach((r, k) => {
          poseRacer(r, xOf(k), bob, 0, 0, dt);
          strum[k] = Math.max(0, strum[k] - dt / STRUM_S);
          flash[k] = Math.max(0, flash[k] - dt / FLASH_S);
          r.model.arms.right.rotation.x = STRUM_ANGLE * strum[k];
          spots[k].intensity = 1.5 + 3 * pulse + 3 * flash[k];
        });

        // Scoreboard: my row uses my own counters (they are ahead of the host's copy).
        seats.forEach((_seat, k) => {
          board.set(k, k === mySeat ? `${myScore}  x${mult(myCombo)}` : `${s.seats[k].score}`);
        });
        const hint = mySeat !== null && songT < HINT_S ? HINT_TEXT : '';
        if (hint !== hintShown) {
          board.hint(hint);
          hintShown = hint;
        }

        drawHighway(chart);
      },

      input() {
        return { score: myScore, hits: myHits, miss: myMiss, combo: myCombo, best: myBest, lane: myLane, auto: false };
      },

      dispose() {
        window.removeEventListener('keydown', onKey);
        state?.jam.dispose();
      },
    };
  },
};

export default def;
