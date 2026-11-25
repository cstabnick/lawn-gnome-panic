// Plays a SceneScript in the game: builds the stage (a room set, or the real world), its actors, vehicles and props,
// moves them and the camera from timeline.ts samples, types the dialogue (subtitles.ts), fires audio cues (cueAudio.ts)
// and triggers, and handles tap / key to finish a line, advance and skip.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import type { Mutter } from '@lawn/mutter';
import { speech } from '../voice/speech';
import { voiceFor } from '../voice/voices';
import type { GnomeLook } from '@lawn/gnome';
import type { Vehicle } from '../types';
import { beginMount, stepMount, type MountSeq } from '../mount';
import { setDoorOpen } from '../vehicles';
import { gnomeState } from '../gnomes';
import { castOf, type ResolvedCast } from './cast';
import { envFor } from './check';
import { createStageActor, drawMountPose, poseActor, removeStageActor, type StageActor } from './actors';
import { createSubtitles, type Subtitles } from './subtitles';
import { createCueAudio, type CueAudio, type EngineVoice } from './cueAudio';
import { ROOM_ORIGIN, ROOM_THEMES, buildRoom, fitPrefab, type BuiltRoom } from './rooms';
import { poseSceneVehicle, removeSceneVehicle, seatLocal, spawnSceneVehicle, vehicleGroundFor } from './sceneVehicles';
import type { SceneScript, ScriptActor, StageEnv, Timeline, TimedStep, SceneFrame, Vec3 } from './script';
import { compile, eventsBetween, sampleFrame, targetPoint } from './timeline';
import { lineTiming } from './textSpeed';
import { liveWorldFor, type LiveWorld } from './liveArea';
import { CAST_INTROS, introFor } from './castIntros';
import { createIntroCard } from './introCard';

export interface DirectorHooks {
  setUiVisible(v: boolean): void;
  /** World stages: hide / show the player's own gnome (and its held gun) while the scene plays. */
  setPlayerVisible?(v: boolean): void;
  /** The vehicle the player is driving now, for ScriptVehicle `from: 'player'`. */
  playerVehicle?(): Vehicle | null;
  /** A spawned vehicle with `keep: true`, handed to the game when the scene ends (push it to the game's vehicle list). */
  adoptVehicle?(v: Vehicle): void;
  /** The player's own look, for `player: true` actors. */
  playerLook?(): GnomeLook | null;
  /** The player's vehicle was moved by a scene: rebuild its physics chassis (app.ts refreshDriving). */
  resetVehicle?(v: Vehicle): void;
  /** World stages: a `player: true` actor that ends the scene on foot leaves the real player there. */
  placePlayer?(x: number, z: number, yaw: number): void;
  /** World stages with `sky`: time-lapse the sky to that hour; returns the seconds the director holds the first shot while it runs (0 or nothing: no hold). null scrubs the sky back to world time. */
  setSky?(mode: 'noon' | 'golden' | 'night' | null): number | void;
}

export interface ScenePlayOptions {
  /** 'call' steps: quest state, spawns, unlocks. Every remaining one also fires when the scene is skipped. */
  onTrigger?(name: string, arg?: unknown): void;
}

export interface Director {
  readonly active: boolean;
  play(script: SceneScript, onDone: () => void, opts?: ScenePlayOptions): void;
  update(dt: number, camera: THREE.PerspectiveCamera): void;
  skip(): void;
  /** Scene time of the playing scene (seconds), or -1 when idle. */
  readonly clock: number;
  /**
   * A live-world scene is playing (SceneScript.world, liveArea.ts): the game keeps its ambient world running and keeps
   * these zones clear. null when idle, in a room, or for a 'paused' scene.
   */
  readonly live: LiveWorld | null;
}

type Phase = 'off' | 'in' | 'play' | 'out' | 'after';

interface ActorRec { a: StageActor; cast: ResolvedCast; def: ScriptActor }
interface VehicleRec { v: Vehicle; spawned: boolean; keep: boolean; driverBefore: Vehicle['driver']; ownedBefore: boolean | undefined; engine: EngineVoice }
interface Mount { seq: MountSeq; done: boolean; end: number }

/** Everything one playing scene owns; dropped when it ends. */
interface Playing {
  script: SceneScript;
  tl: Timeline;
  env: StageEnv;
  room: boolean;
  skippable: boolean;
  onDone: () => void;
  onTrigger?: (name: string, arg?: unknown) => void;
  /** The stage: the room's group, or a fresh group at the origin for the world. */
  stage: THREE.Group;
  built: BuiltRoom | null;
  actors: Map<string, ActorRec>;
  vehicles: Map<string, VehicleRec>;
  props: Map<string, THREE.Object3D>;
  mounts: Map<string, Mount>;
  fired: Set<number>;
  lastSayOrder: number;
  lastFrame: SceneFrame;
  clock: number;
  lastFired: number;
  pendingJump: number | null;
  /** Seconds of first-shot hold left while the sky time-lapses (the clock does not run). */
  holdT: number;
  subtitles: Subtitles;
  subShown: boolean;
  savedBg: THREE.Scene['background'];
  savedFog: THREE.Scene['fog'];
  lightsSaved: { l: THREE.Light; i: number }[];
  savedFov: number | null;
  camStep: number;
  camPos: THREE.Vector3;
  live: LiveWorld | null;
}

const ZERO = new THREE.Vector3();
const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** Builds the scene player. One instance per game; `play` runs one scene at a time. */
export function createDirector(scene: THREE.Scene, ui: HTMLElement, hooks: DirectorHooks): Director {
  // The game's shared voice engine (voice/speech.ts): through the Voices slider and the mute key.
  const voice: Mutter = speech();
  const unlockVoice = (): void => voice.unlock();
  window.addEventListener('pointerdown', unlockVoice);
  window.addEventListener('keydown', unlockVoice);
  const cue: CueAudio = createCueAudio();

  // ---- Overlay: letterbox bars, title pill, caption, Skip, fade ---------------------------------------------------------
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:60;display:none;pointer-events:auto;font-family:system-ui,sans-serif;';
  const bar = (top: boolean): HTMLDivElement => {
    const b = document.createElement('div');
    b.style.cssText = `position:absolute;left:0;right:0;${top ? 'top' : 'bottom'}:0;height:11vh;background:#000;`;
    return b;
  };
  const titleEl = document.createElement('div');
  titleEl.style.cssText = 'position:absolute;top:max(14vh,calc(env(safe-area-inset-top) + 12px));left:50%;transform:translateX(-50%);padding:6px 16px;border-radius:999px;background:rgba(0,0,0,.72);border:1px solid rgba(255,210,63,.55);color:#ffd23f;font:800 13px/1.2 system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;display:none;white-space:nowrap;';
  const captionEl = document.createElement('div');
  captionEl.style.cssText = 'position:absolute;left:50%;transform:translateX(-50%);bottom:calc(11vh + max(10px,env(safe-area-inset-bottom)));width:max-content;max-width:88vw;box-sizing:border-box;padding:8px 16px;border-radius:12px;background:rgba(0,0,0,.6);color:#ffd23f;font:600 15px/1.4 system-ui,sans-serif;text-align:center;display:none;pointer-events:none;';
  const skipBtn = document.createElement('button');
  skipBtn.type = 'button';
  skipBtn.textContent = 'Skip ▶▶';
  skipBtn.style.cssText = 'position:absolute;top:max(14px,calc(env(safe-area-inset-top) + 8px));right:max(14px,env(safe-area-inset-right));min-width:96px;min-height:44px;padding:8px 16px;border-radius:999px;border:2px solid rgba(255,255,255,.65);background:rgba(0,0,0,.55);color:#fff;font:700 14px system-ui,sans-serif;cursor:pointer;touch-action:manipulation;display:none;';
  const timeEl = document.createElement('div');
  timeEl.textContent = '⏩ Time passes…';
  timeEl.style.cssText = 'position:absolute;top:calc(11vh + 12px);left:50%;transform:translateX(-50%);padding:6px 14px;border-radius:999px;background:rgba(0,0,0,.45);color:#fff;font:600 14px system-ui,sans-serif;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity .3s;';
  const fadeEl = document.createElement('div');
  fadeEl.style.cssText = 'position:absolute;inset:0;background:#000;opacity:0;pointer-events:none;';
  overlay.append(bar(true), bar(false), titleEl, captionEl, skipBtn, timeEl, fadeEl);
  ui.appendChild(overlay);
  // Character intro cards ('intro' steps), drawn under the fade.
  const introCard = createIntroCard(overlay);
  overlay.insertBefore(introCard.el, fadeEl);
  let introShown = false;
  const hideIntro = (): void => {
    if (!introShown) return;
    introShown = false;
    introCard.hide();
  };

  let phase: Phase = 'off';
  let phaseT = 0;
  let cur: Playing | null = null;
  const camTmp = new THREE.Vector3();

  // ---- Helpers --------------------------------------------------------------------------------------------------------

  /** A scene point in world coordinates (room points are room-local). */
  function worldOf(c: Playing, p: Vec3): THREE.Vector3 {
    return new THREE.Vector3(p[0], p[1], p[2]).add(c.room ? ROOM_ORIGIN : ZERO);
  }

  /** A mount step's end is a gate: the clock waits for the real mount sequence to finish. */
  function gate(c: Playing, next: number): number {
    let n = next;
    for (const m of c.mounts.values()) {
      if (!m.done) n = Math.min(n, Math.max(c.clock, m.end - 0.001));
    }
    return Math.max(c.clock, n);
  }

  /** `camera` is null only when a skip fires the remaining 'call' steps (those need no camera). */
  function fire(c: Playing, ts: TimedStep, camera: THREE.PerspectiveCamera | null): void {
    const st = ts.step;
    switch (st.do) {
      case 'say': {
        const rec = c.actors.get(st.who);
        c.subtitles.show(
          { speaker: rec ? rec.cast.name : st.who, text: st.text, icon: st.icon, hz: st.hz ?? rec?.cast.voice.hz ?? rec?.cast.hz ?? 100, voice: rec?.cast.voice ?? voiceFor(st.who, st.hz) },
          ts.order === c.lastSayOrder,
        );
        c.subShown = true;
        if (st.music !== undefined) cue.music(st.music);
        if (st.stinger) cue.stinger(st.stinger);
        if (st.sfx) cue.sfx(st.sfx);
        break;
      }
      case 'music': cue.music(st.track, st.fade); break;
      case 'ambience': cue.ambience(st.bed, st.fade); break;
      case 'stinger': cue.stinger(st.id); break;
      case 'radio': cue.radio(st.level); break;
      case 'sfx': {
        let pan = 0;
        let gain = st.gain ?? 1;
        const p = st.at !== undefined && camera ? targetPoint(c.lastFrame, st.at) : null;
        if (p && camera) {
          const to = worldOf(c, p).sub(camera.position);
          const dist = to.length();
          const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
          if (dist > 0) pan = clamp(right.dot(to.normalize()), -1, 1);
          gain *= clamp(1 - dist / 60, 0.1, 1);
        }
        cue.sfx(st.id, { pan, gain });
        break;
      }
      case 'horn': {
        const rec = c.vehicles.get(st.vehicle);
        // Loaded on demand, like cueAudio.ts: audio.ts touches window when it loads.
        if (rec) void import('../audio').then((m) => m.playHorn(rec.v.kind));
        break;
      }
      case 'call': c.onTrigger?.(st.name, st.arg); break;
      case 'intro': {
        const rec = c.actors.get(st.who);
        const key = rec?.def.preset ?? st.who;
        // The stored card's name wins over the cast's short display name; an unlisted actor keeps its own name.
        const known = !!CAST_INTROS[key.toLowerCase()];
        introCard.show(
          introFor(key, { name: st.name ?? (known ? undefined : rec?.cast.name), role: st.role, line: st.line }),
          { seconds: ts.dur, freeze: st.freeze !== false },
        );
        introShown = true;
        cue.stinger('intro');
        break;
      }
      case 'enter': {
        const vr = c.vehicles.get(st.vehicle);
        const from = c.lastFrame.actors[st.who];
        if (!vr || !from) { console.warn(`[director] enter: no vehicle "${st.vehicle}" or actor "${st.who}"`); break; }
        c.mounts.set(st.who, { seq: beginMount('enter', vr.v, { x: from.x, y: from.y, z: from.z }, st.seat ?? 0), done: false, end: ts.start + ts.dur });
        break;
      }
      case 'exit': {
        const from = c.lastFrame.actors[st.who];
        const vr = from?.seatedIn ? c.vehicles.get(from.seatedIn) : undefined;
        if (!vr || !from) { console.warn(`[director] exit: "${st.who}" is not in a scene vehicle`); break; }
        c.mounts.set(st.who, { seq: beginMount('exit', vr.v, { x: from.x, y: from.y, z: from.z }, from.seat), done: false, end: ts.start + ts.dur });
        break;
      }
      default: break;
    }
  }

  /** Fires the one-shot steps in [from, to) that have not fired yet, in timeline order. */
  function fireRange(c: Playing, from: number, to: number, camera: THREE.PerspectiveCamera): void {
    for (const ts of eventsBetween(c.tl, from, to)) {
      if (c.fired.has(ts.order)) continue;
      c.fired.add(ts.order);
      fire(c, ts, camera);
    }
  }

  function lightsDim(c: Playing): void {
    scene.traverse((o) => {
      const l = o as THREE.Light;
      if (l.isLight && !c.stage.getObjectById(l.id)) {
        c.lightsSaved.push({ l, i: l.intensity });
        l.intensity *= 0.3;
      }
    });
  }

  function finish(c: Playing, camera: THREE.PerspectiveCamera): void {
    const fin = sampleFrame(c.tl, c.tl.duration, c.env);
    const world = !c.room;

    for (const [id, vr] of c.vehicles) {
      const s = fin.vehicles[id];
      if (s) poseSceneVehicle(vr.v, s, 0);
      vr.engine.stop();
      if (vr.spawned) {
        if (vr.keep && world) {
          vr.v.driver = 'none';
          hooks.adoptVehicle?.(vr.v);
        } else {
          removeSceneVehicle(scene, vr.v);
        }
      } else {
        // The player's own vehicle: put its driver back and give the game a fresh chassis.
        vr.v.driver = vr.driverBefore;
        vr.v.questOwned = vr.ownedBefore;
        hooks.resetVehicle?.(vr.v);
      }
    }

    for (const [id, rec] of c.actors) {
      const s = fin.actors[id];
      if (world && rec.def.player && s && !s.seatedIn && !s.mount) hooks.placePlayer?.(s.x, s.z, s.yaw);
      removeStageActor(rec.a);
    }
    for (const obj of c.props.values()) obj.removeFromParent();
    c.stage.removeFromParent();

    for (const s of c.lightsSaved) s.l.intensity = s.i;
    scene.background = c.savedBg;
    scene.fog = c.savedFog;
    if (c.savedFov !== null) {
      camera.fov = c.savedFov;
      camera.updateProjectionMatrix();
    }

    cue.stopAll();
    voice.stop();
    c.subtitles.destroy();
    hideIntro();
    if (world) hooks.setPlayerVisible?.(true);
    if (world && c.script.sky) hooks.setSky?.(null);
    timeEl.style.opacity = '0';
    hooks.setUiVisible(true);

    cur = null;
    phase = 'after';
    phaseT = 0;
    c.onDone();
  }

  // ---- Public ---------------------------------------------------------------------------------------------------------

  function tap(): void {
    if (!cur || (phase !== 'in' && phase !== 'play') || cur.holdT > 0) return;
    const say = cur.lastFrame.say;
    if (!say) return;
    const ts = cur.tl.steps[say.step];
    if (!ts) return;
    cur.pendingJump = say.typing ? ts.start + (ts.typeDur ?? 0) : ts.start + ts.dur;
  }

  function skip(): void {
    if (!cur || !cur.skippable || (phase !== 'in' && phase !== 'play')) return;
    for (const ts of cur.tl.steps) {
      if (ts.step.do === 'call' && !cur.fired.has(ts.order)) {
        cur.fired.add(ts.order);
        fire(cur, ts, null);
      }
    }
    voice.stop();
    cur.subtitles.hide();
    cur.subShown = false;
    hideIntro();
    cur.holdT = 0;
    timeEl.style.opacity = '0';
    phase = 'out';
    phaseT = 0;
  }

  overlay.addEventListener('pointerdown', () => tap());
  skipBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); skip(); });
  window.addEventListener('keydown', (e) => {
    if (!cur) return;
    if (e.code === 'Escape') skip();
    else if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      tap();
    }
  });

  const director: Director = {
    get active() { return phase === 'in' || phase === 'play' || phase === 'out'; },
    get clock() { return cur && director.active ? cur.clock : -1; },
    get live() { return cur && director.active ? cur.live : null; },

    play(script, onDone, opts = {}) {
      if (phase === 'in' || phase === 'play' || phase === 'out') return;
      if (typeof document !== 'undefined' && document.pointerLockElement) document.exitPointerLock();
      hooks.setUiVisible(false);

      const tl = compile(script, lineTiming());
      const env = envFor(script);
      const spec = script.stage;
      const room = spec.kind === 'room';
      let built: BuiltRoom | null = null;
      let stage: THREE.Group;
      if (spec.kind === 'room') {
        built = buildRoom(spec.room, { set: true, bodega: spec.bodega });
        stage = built.group;
      } else {
        stage = new THREE.Group();
      }
      scene.add(stage);

      const skippable = script.skippable !== false;
      const subtitles = createSubtitles(overlay, voice, { onNext: tap, onSkip: skip }, { skippable });
      overlay.insertBefore(subtitles.el, fadeEl);

      const c: Playing = {
        script, tl, env, room, skippable, onDone, onTrigger: opts.onTrigger,
        stage, built,
        actors: new Map(), vehicles: new Map(), props: new Map(), mounts: new Map(),
        fired: new Set(), lastSayOrder: -1,
        lastFrame: sampleFrame(tl, 0, env),
        clock: 0, lastFired: 0, pendingJump: null, holdT: 0,
        subtitles, subShown: false,
        savedBg: scene.background, savedFog: scene.fog,
        lightsSaved: [], savedFov: null, camStep: -2, camPos: new THREE.Vector3(),
        live: liveWorldFor(script, tl, env),
      };
      for (const ts of tl.steps) if (ts.step.do === 'say') c.lastSayOrder = Math.max(c.lastSayOrder, ts.order);

      if (spec.kind === 'room') {
        const bg = ROOM_THEMES[spec.room].bg;
        scene.background = new THREE.Color(bg);
        scene.fog = new THREE.Fog(bg, 14, 40);
        lightsDim(c);
      }

      // Actors.
      const playerLook = hooks.playerLook?.() ?? null;
      for (const def of script.actors ?? []) {
        const cast = castOf(def, { room, playerLook });
        c.actors.set(def.id, { a: createStageActor(stage, def, cast), cast, def });
      }

      // Vehicles: the player's own, or spawned. Room stages have none.
      for (const def of script.vehicles ?? []) {
        if (room) {
          console.warn(`[director] vehicle "${def.id}" skipped: no vehicles on a room stage`);
          continue;
        }
        const engine = cue.engine();
        const pv = def.from === 'player' ? hooks.playerVehicle?.() : null;
        if (pv) {
          const [x, z] = def.at.length === 2 ? def.at : [def.at[0], def.at[2]];
          pv.x = x;
          pv.z = z;
          pv.y = def.at.length === 3 ? def.at[1] : vehicleGroundFor(pv.kind, x, z);
          pv.yaw = def.yaw ?? 0;
          // Owned by the scene while it plays: a driving pose sets driver 'npc', and live traffic must not take it over.
          const ownedBefore = pv.questOwned;
          pv.questOwned = true;
          c.vehicles.set(def.id, { v: pv, spawned: false, keep: false, driverBefore: pv.driver, ownedBefore, engine });
        } else {
          const v = spawnSceneVehicle(scene, def);
          c.vehicles.set(def.id, { v, spawned: true, keep: !!def.keep, driverBefore: v.driver, ownedBefore: false, engine });
        }
      }

      // Props.
      for (const def of script.props ?? []) {
        const obj = def.size !== undefined
          ? fitPrefab(def.prefab, def.size, def.by ?? 'w').obj
          : buildPrefab(def.prefab, { lights: false });
        obj.visible = !def.hidden;
        stage.add(obj);
        c.props.set(def.id, obj);
      }

      if (script.music) cue.music(script.music);
      if (script.ambience) cue.ambience(script.ambience);
      cue.radio(script.radio ?? 0.25);
      if (!room) hooks.setPlayerVisible?.(false);
      if (!room && script.sky) { const s = hooks.setSky?.(script.sky); c.holdT = typeof s === 'number' && s > 0 ? s : 0; }

      cur = c;
      phase = 'in';
      phaseT = 0;
      overlay.style.display = 'block';
    },

    update(dt, camera) {
      if (phase === 'off') return;
      if (phase === 'after') {
        phaseT += dt;
        fadeEl.style.opacity = String(clamp(1 - phaseT / 0.5, 0, 1));
        if (phaseT >= 0.5) {
          overlay.style.display = 'none';
          phase = 'off';
        }
        return;
      }
      const c = cur;
      if (!c) return;
      if (c.savedFov === null) c.savedFov = camera.fov;

      phaseT += dt;
      const fadeIn = c.script.fadeIn ?? 0.7;
      const fadeOut = c.script.fadeOut ?? 0.7;

      // Clock: runs through 'in' and 'play'; a tap or skip jumps it; mount sequences hold it.
      if (phase === 'in' || phase === 'play') {
        if (c.holdT > 0) {
          // The sky is time-lapsing: the clock stays at the start of the scene; only the fade-in goes on.
          c.holdT = Math.max(0, c.holdT - dt);
          c.pendingJump = null;
          if (phase === 'in' && phaseT >= fadeIn) {
            phase = 'play';
            phaseT = 0;
          }
        } else {
          let next = c.pendingJump ?? c.clock + dt;
          c.pendingJump = null;
          next = gate(c, Math.max(c.clock, next));
          const finished = next >= c.tl.duration;
          if (finished) next = c.tl.duration;
          // Steps at exactly the end still fire (the range is open at the top).
          fireRange(c, c.lastFired, finished ? c.tl.duration + 1e-6 : next, camera);
          c.lastFired = next;
          c.clock = next;
          if (finished) {
            phase = 'out';
            phaseT = 0;
          } else if (phase === 'in' && phaseT >= fadeIn) {
            phase = 'play';
            phaseT = 0;
          }
        }
      }

      const frame = sampleFrame(c.tl, c.clock, c.env);
      c.lastFrame = frame;

      // Actors: a running mount sequence drives the model; otherwise the sample does.
      for (const [id, rec] of c.actors) {
        const s = frame.actors[id];
        if (!s) continue;
        const m = c.mounts.get(id);
        if (m && !m.done) {
          const f = stepMount(m.seq, dt);
          drawMountPose(rec.a, f.pose, dt);
          if (f.door) setDoorOpen(m.seq.vehicle, f.door.pivot, f.door.open);
          if (f.done) m.done = true;
          continue;
        }
        if (m && m.done && s.mount) continue; // the sequence finished before its step: hold its last pose (never back in the seat)
        if (s.seatedIn) {
          const vr = c.vehicles.get(s.seatedIn);
          if (vr) {
            poseActor(rec.a, s, dt, c.clock, { object: vr.v.object, local: seatLocal(vr.v, s.seat), vehicle: vr.v, index: s.seat });
            continue;
          }
        }
        if (s.mount) continue; // a finished mount still on the sample: hold the last pose
        poseActor(rec.a, s, dt, c.clock);
      }

      // Vehicles: pose, engine hum by distance from the camera.
      for (const [id, vr] of c.vehicles) {
        const s = frame.vehicles[id];
        if (!s) continue;
        poseSceneVehicle(vr.v, s, dt);
        const dist = camera.position.distanceTo(new THREE.Vector3(s.x, s.y, s.z));
        vr.engine.set(clamp(Math.abs(s.speed) / vr.v.spec.maxSpeed, 0, 1), s.visible ? clamp(1 - dist / 50, 0, 1) : 0);
      }

      // Props.
      for (const [id, obj] of c.props) {
        const s = frame.props[id];
        if (!s) continue;
        obj.visible = s.visible;
        obj.position.set(s.x, s.y, s.z);
        obj.rotation.y = s.yaw;
      }

      // Bodega corner: the keeper sweeps, the cat turns, like the old dialogue cutscene.
      if (c.built?.bodega) {
        const { keeper, cat } = c.built.bodega;
        const sweep = Math.sin(c.clock * 2.2) * 0.35;
        keeper.update(gnomeState(-0.7 + sweep, 0, -2.1, 0.2, 0, false), dt);
        keeper.arms.left.rotation.set(-0.7, 0, -0.2);
        keeper.arms.right.rotation.set(-0.7 + Math.sin(c.clock * 4.4) * 0.2, 0, 0.2);
        cat.rotation.y = Math.sin(c.clock * 2.6) * 0.25;
      }

      // Camera: room-local shots get the room's origin; 'follow' shots ease their position; a new shot snaps.
      const cam = frame.camera;
      const origin = c.room ? ROOM_ORIGIN : ZERO;
      const shot = cam.step >= 0 ? c.tl.steps[cam.step]?.step : undefined;
      const lag = shot?.do === 'cam' && shot.shot.kind === 'follow' ? (shot.shot.lag ?? 0.35) : 0;
      const want = new THREE.Vector3(cam.pos[0], cam.pos[1], cam.pos[2]).add(origin);
      if (cam.step !== c.camStep || lag <= 0) c.camPos.copy(want);
      else c.camPos.lerp(want, 1 - Math.exp(-dt / lag));
      c.camStep = cam.step;
      camTmp.copy(c.camPos);
      if (cam.shake > 0) {
        camTmp.add(new THREE.Vector3(
          (Math.random() - 0.5) * 2 * cam.shake,
          (Math.random() - 0.5) * 2 * cam.shake,
          (Math.random() - 0.5) * 2 * cam.shake,
        ));
      }
      // Handheld: a slow operator's drift on the position and the aim (sums of sines on the scene clock, not noise).
      const hand = shot?.do === 'cam' ? (shot.shot.handheld ?? 0) : 0;
      const lookAt = new THREE.Vector3(cam.look[0], cam.look[1], cam.look[2]).add(origin);
      if (hand > 0) {
        const k = c.clock;
        camTmp.add(new THREE.Vector3(
          hand * (Math.sin(k * 1.3) + 0.5 * Math.sin(k * 3.1 + 1)),
          hand * (0.6 * Math.sin(k * 1.7 + 2) + 0.3 * Math.sin(k * 4.3)),
          hand * (Math.sin(k * 0.9 + 4) * 0.5),
        ));
        lookAt.add(new THREE.Vector3(hand * 0.8 * Math.sin(k * 1.1 + 3), hand * 0.6 * Math.sin(k * 2.3), 0));
      }
      camera.fov = cam.fov;
      camera.updateProjectionMatrix();
      camera.position.copy(camTmp);
      camera.lookAt(lookAt);

      // Dialogue, titles, caption, fade, skip.
      if (frame.say) {
        c.subtitles.reveal(frame.say.shown);
        c.subShown = true;
      } else if (c.subShown) {
        c.subtitles.hide();
        c.subShown = false;
      }
      const hasTitleStep = c.tl.steps.some((ts) => ts.step.do === 'title');
      // The scene's own title shows until the first 'title' step takes over.
      const title = hasTitleStep ? frame.title : (c.script.title ?? null);
      titleEl.textContent = title ?? '';
      titleEl.style.display = title ? 'block' : 'none';
      captionEl.textContent = frame.caption ?? '';
      captionEl.style.display = frame.caption ? 'block' : 'none';
      if (!frame.intro) hideIntro();

      let phaseFade = 0;
      if (phase === 'in') phaseFade = 1 - phaseT / fadeIn;
      else if (phase === 'out') phaseFade = phaseT / fadeOut;
      fadeEl.style.opacity = String(clamp(Math.max(frame.fade, phaseFade), 0, 1));
      timeEl.style.opacity = c.holdT > 0 ? '1' : '0';
      skipBtn.style.display = c.skippable && !frame.say && (phase === 'in' || phase === 'play') ? 'block' : 'none';

      if (phase === 'out' && phaseT >= fadeOut) finish(c, camera);
    },

    skip,
  };

  return director;
}
