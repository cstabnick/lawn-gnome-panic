// The director: runs the chapters in order, implements ChapterCtx, and drives every frame
// (input -> player -> collecting -> waits -> interactions -> HUD counters). Owns the lift ride, eggs and saving.
import { prefabIcon } from '@lawn/prefabs';
import {
  ACH, CHAPTER_FLOOR, CHAPTER_ORDER, CHAPTER_TITLES, EGG_COUNT, EGGS, ITEM_KINDS, ITEM_ORDER,
  LIFT_BUTTONS, NARRATOR_NAME, SPEAKERS, TUNING,
} from './config';
import { CHAPTERS } from './chapters';
import { formatCount, rain, scatter, spawnItem, stepCollect } from './collect';
import { resetSave, writeSave } from './save';
import type {
  AchievementId, CameraMode, ChapterCtx, ChapterId, CounterRow, Director, DirectorDeps, EggId, FloorId,
  InputState, Interactable, ItemKind, MoveMode, Pickup, Rect, SfxName, Speaker, TrackId, Vec2,
} from './types';

const NO_INPUT: InputState = { moveX: 0, moveZ: 0, jump: false, jumpPressed: false, interactPressed: false };
const SAVE_EVERY = 5;
const COUNTER_EVERY = 0.1;

interface TimerWait { until: number; resolve: () => void }
interface Every { period: number; next: number; fn: () => void; dead: boolean }
interface AreaWatch { area: string; inside: boolean; fn: () => void; dead: boolean }

export function createDirector(deps: DirectorDeps): Director {
  const { player, hud, input, collect, save } = deps;

  // ---- state ----
  const names = Object.fromEntries(
    (Object.keys(SPEAKERS) as Speaker[]).map((s) => [s, SPEAKERS[s].name]),
  ) as Record<Speaker, string>;
  let camMode: CameraMode = 'follow';
  let now = 0;
  /** In-flight say/choose calls: while > 0 the player cannot move or interact. */
  let busy = 0;
  let goal: string | null = null;
  let muteWired = false;

  const pickupListeners = new Set<(p: Pickup) => void>();
  const interactListeners = new Map<string, Set<() => void>>();
  const areaWatches: AreaWatch[] = [];
  const everies: Every[] = [];
  let timerWaits: TimerWait[] = [];
  let countWaits: { kind: ItemKind; n: number; resolve: () => void }[] = [];
  let totalWaits: { n: number; resolve: () => void }[] = [];
  let interactWaits: { id: string; resolve: () => void }[] = [];
  let areaWaits: { area: string; inside: boolean; resolve: () => void }[] = [];
  /** Unsubscribers made during the current chapter; called when it ends. */
  let chapterUnsubs: (() => void)[] = [];

  const seen = new Set<ItemKind>();
  const icons = new Map<ItemKind, string>();
  let combo = 0;
  let lastPickupAt = -Infinity;
  let counterAcc = 0;
  let lastCounterKey = '';
  let shownInteract: string | null | undefined;
  let lastSaveAt = 0;
  let bestDirty = false;
  const warnedAreas = new Set<string>();

  const scale = (s: number) => (deps.fast ? s / 10 : s);

  // ---- helpers ----
  const floor = () => deps.getFloor();

  /** True inside a solid's footprint (a desk, a cabinet): an item there would be hidden by it or sunk in it. */
  function hiddenSpot(x: number, z: number): boolean {
    const M = 0.3;
    return floor().colliders.some((b) => b.max[1] > 0.1
      && x >= b.min[0] - M && x <= b.max[0] + M && z >= b.min[2] - M && z <= b.max[2] + M);
  }
  function wholeFloor(): Rect {
    const { w, d } = floor().layout;
    return { x0: -w / 2 + 1, z0: -d / 2 + 1, x1: w / 2 - 1, z1: d / 2 - 1 };
  }
  function areaRect(name: string): Rect | null {
    const r = floor().layout.areas[name];
    if (r) return r;
    const key = floor().id + ':' + name;
    if (!warnedAreas.has(key)) { warnedAreas.add(key); console.warn(`[director] unknown area "${name}" on floor ${floor().id}`); }
    return null;
  }
  function inArea(name: string): boolean {
    const r = floor().layout.areas[name];
    if (!r) { areaRect(name); return false; }
    const p = player.pos;
    return p.x >= r.x0 && p.x <= r.x1 && p.z >= r.z0 && p.z <= r.z1;
  }
  function teleportToSpawn(): void {
    const f = floor();
    const sp = f.layout.spawn;
    player.teleport(sp.x, f.groundAt(sp.x, sp.z), sp.z, sp.facing);
  }
  function afterFloorChange(): void {
    seen.clear();
    shownInteract = undefined;
    lastCounterKey = '';
    // Re-baseline area edges so a new floor does not fire a spurious "entered".
    for (const a of areaWatches) a.inside = inArea(a.area);
    for (const a of areaWaits) a.inside = inArea(a.area);
  }
  function track(unsub: () => void): () => void {
    chapterUnsubs.push(unsub);
    return unsub;
  }
  function liftInteractable(): Interactable {
    const l = floor().layout;
    return { id: 'elevator', label: 'Lift', x: l.elevatorX, z: -l.d / 2 + 1.2, radius: TUNING.interactRadius };
  }
  function nearestInteractable(): Interactable | null {
    const candidates = [...floor().layout.interactables, liftInteractable()];
    let best: Interactable | null = null;
    let bestD = Infinity;
    for (const c of candidates) {
      const live = (interactListeners.get(c.id)?.size ?? 0) > 0 || interactWaits.some((w) => w.id === c.id);
      if (!live) continue;
      const d = Math.hypot(player.pos.x - c.x, player.pos.z - c.z);
      if (d <= c.radius && d < bestD) { best = c; bestD = d; }
    }
    return best;
  }
  function setInteractLabel(label: string | null): void {
    if (label === shownInteract) return;
    shownInteract = label;
    input.setInteract(label);
  }
  function iconFor(kind: ItemKind): string {
    const cached = icons.get(kind);
    if (cached) return cached;
    const def = ITEM_KINDS[kind];
    const url = prefabIcon(def.prefab);
    if (url) { icons.set(kind, url); return url; }
    return def.emoji;
  }
  function updateCounters(): void {
    const rows: CounterRow[] = [];
    for (const kind of ITEM_ORDER) {
      if (!seen.has(kind) && !(collect.counts[kind] > 0)) continue;
      rows.push({ kind, label: ITEM_KINDS[kind].label, value: formatCount(collect.counts[kind]), icon: iconFor(kind) });
    }
    const key = rows.map((r) => r.kind + '=' + r.value + '|' + r.icon.length).join(',');
    if (key === lastCounterKey) return;
    lastCounterKey = key;
    hud.setCounters(rows);
  }
  function dropChapterState(): void {
    for (const u of chapterUnsubs) { try { u(); } catch (e) { console.error(e); } }
    chapterUnsubs = [];
    pickupListeners.clear();
    interactListeners.clear();
    areaWatches.length = 0;
    everies.length = 0;
    timerWaits = [];
    countWaits = [];
    totalWaits = [];
    interactWaits = [];
    areaWaits = [];
  }

  // ---- ChapterCtx ----
  const ctx: ChapterCtx = {
    player, collect, hud, save,
    floor,
    name(who: Speaker, display: string) { names[who] = display; },
    async say(who: Speaker, text: string, opts?: { auto?: number }) {
      let auto = opts?.auto;
      if (deps.fast) auto = auto !== undefined && auto < 0.2 ? auto : 0.2;
      busy++;
      try {
        deps.sfx.voice(who, text);
        await hud.say(who, names[who], text, auto);
      } finally {
        busy--;
      }
    },
    async lines(list: readonly (readonly [Speaker, string])[]) {
      for (const [who, text] of list) await ctx.say(who, text);
    },
    async choose(prompt: string | null, options: string[]) {
      busy++;
      try {
        const i = await hud.choose(prompt, options);
        deps.sfx.play('ui');
        return i;
      } finally {
        busy--;
      }
    },
    toast(title: string, body?: string) { deps.sfx.play('toast'); hud.toast(title, body); },
    setGoal(text: string | null) { goal = text; hud.setGoal(text); },
    spawn(kind: ItemKind, n: number, area: string) {
      const n2 = scatter(collect, kind, n, areaRect(area) ?? wholeFloor(), undefined, hiddenSpot);
      seen.add(kind);
      return n2;
    },
    spawnAt(kind: ItemKind, x: number, z: number, y?: number, prefab?: string) {
      spawnItem(collect, kind, x, z, y, prefab);
      seen.add(kind);
    },
    spawnLine(kind: ItemKind, n: number, from: Vec2, to: Vec2, y?: number) {
      for (let i = 0; i < n; i++) {
        const t = n <= 1 ? 0 : i / (n - 1);
        spawnItem(collect, kind, from.x + (to.x - from.x) * t, from.z + (to.z - from.z) * t, y);
      }
      seen.add(kind);
    },
    rain(kind: ItemKind, n: number, area: string) {
      const n2 = rain(collect, kind, n, areaRect(area) ?? wholeFloor());
      seen.add(kind);
      return n2;
    },
    count(kind: ItemKind) { return collect.counts[kind]; },
    waitCount(kind: ItemKind, n: number) {
      if (collect.counts[kind] >= n) return Promise.resolve();
      return new Promise<void>((resolve) => { countWaits.push({ kind, n, resolve }); });
    },
    waitTotal(n: number) {
      if (collect.total >= n) return Promise.resolve();
      return new Promise<void>((resolve) => { totalWaits.push({ n, resolve }); });
    },
    waitInteract(id: string) {
      return new Promise<void>((resolve) => { interactWaits.push({ id, resolve }); });
    },
    waitArea(area: string) {
      if (inArea(area)) return Promise.resolve();
      return new Promise<void>((resolve) => { areaWaits.push({ area, inside: false, resolve }); });
    },
    wait(seconds: number) {
      return new Promise<void>((resolve) => { timerWaits.push({ until: now + scale(seconds), resolve }); });
    },
    onPickup(fn: (p: Pickup) => void) {
      pickupListeners.add(fn);
      return track(() => { pickupListeners.delete(fn); });
    },
    onInteract(id: string, fn: () => void) {
      let set = interactListeners.get(id);
      if (!set) { set = new Set(); interactListeners.set(id, set); }
      set.add(fn);
      return track(() => { interactListeners.get(id)?.delete(fn); });
    },
    onArea(area: string, fn: () => void) {
      const w: AreaWatch = { area, inside: inArea(area), fn, dead: false };
      areaWatches.push(w);
      return track(() => {
        w.dead = true;
        const i = areaWatches.indexOf(w);
        if (i >= 0) areaWatches.splice(i, 1);
      });
    },
    every(seconds: number, fn: () => void) {
      const period = Math.max(0.001, scale(seconds));
      const e: Every = { period, next: now + period, fn, dead: false };
      everies.push(e);
      return track(() => {
        e.dead = true;
        const i = everies.indexOf(e);
        if (i >= 0) everies.splice(i, 1);
      });
    },
    setControls(mode: MoveMode) {
      player.mode = mode;
      input.setEnabled(mode !== 'locked');
    },
    camera(mode: CameraMode) { camMode = mode; },
    async goToFloor(id: FloorId) {
      await hud.fade(1, 0.5);
      deps.setFloor(id);
      teleportToSpawn();
      afterFloorChange();
      await hud.fade(0, 0.5);
    },
    async rideElevator(to: FloorId) {
      if (goal === null) ctx.setGoal('Take the lift');
      await ctx.waitInteract('elevator');

      ctx.setControls('locked');
      const l = floor().layout;
      floor().setElevatorOpen(true);
      ctx.sfx('ding');
      await player.moveTo(l.elevatorX, 0, -l.d / 2 + 0.4, 0.8);
      floor().setElevatorOpen(false);
      await hud.fade(0.85, 0.4);

      const track0 = deps.music.current();
      deps.music.muffle(true);

      for (;;) {
        const i = await ctx.choose('Floor?', LIFT_BUTTONS.map((b) => b.label));
        const btn = LIFT_BUTTONS[i];
        if (!btn) continue;
        if (btn.floor === to) break;
        if (btn.floor === null) {
          await ctx.say('narrator', 'Floor B. Where the collectibles are made.');
          await ctx.say('narrator', "Hundreds of gnomes, gluing acorns back together so you can find them again. It's very moving. Don't look too closely.");
          await ctx.say('narrator', "Anyway. That's not your floor.");
          ctx.egg('basement');
          continue;
        }
        ctx.toast('That floor is not part of your interview.');
        ctx.sfx('denied');
      }

      await ctx.wait(1.5);
      ctx.sfx('ding');
      deps.setFloor(to);
      teleportToSpawn();
      afterFloorChange();
      deps.music.muffle(false);
      if (track0 && deps.music.current() !== track0) deps.music.play(track0);
      floor().setElevatorOpen(true);
      await hud.fade(0, 0.5);
      floor().setElevatorOpen(false);
      ctx.setGoal(null);
      ctx.setControls('walk');
    },
    music(track: TrackId | null) {
      if (track === null) deps.music.stop();
      else deps.music.play(track);
    },
    intensity(x: number) { deps.music.intensity(x); },
    sfx(name: SfxName) { deps.sfx.play(name); },
    unlock(id: AchievementId) { void deps.achievements.unlock(id); },
    increment(id: AchievementId, by?: number) { void deps.achievements.increment(id, by); },
    egg(id: EggId) {
      if (save.eggs.includes(id)) return;
      save.eggs.push(id);
      writeSave(save);
      ctx.sfx('fanfare');
      ctx.toast('Easter egg: ' + EGGS[id], save.eggs.length + ' of ' + EGG_COUNT + ' found');
      ctx.increment(ACH.eggs);
    },
  };

  // ---- per frame ----
  function tick(dt: number): void {
    now += dt;
    const f = floor();

    // 1-2. input and player
    const raw = input.read();
    const frozen = busy > 0 || player.mode === 'locked';
    player.update(dt, frozen ? NO_INPUT : raw, f);

    // 3. collecting
    const picks = stepCollect(collect, [player.pos], dt);
    for (const p of picks) {
      deps.items.burst(p);
      combo = now - lastPickupAt <= TUNING.comboGap ? combo + 1 : 1;
      lastPickupAt = now;
      seen.add(p.kind);
      deps.sfx.pickup(p.kind, combo);
      deps.music.pickup();
      for (const fn of [...pickupListeners]) { try { fn(p); } catch (e) { console.error(e); } }
    }
    deps.items.sync(collect, dt);

    // 4. waits
    if (countWaits.length) {
      const keep: typeof countWaits = [];
      for (const w of countWaits) (collect.counts[w.kind] >= w.n ? w.resolve() : keep.push(w));
      countWaits = keep;
    }
    if (totalWaits.length) {
      const keep: typeof totalWaits = [];
      for (const w of totalWaits) (collect.total >= w.n ? w.resolve() : keep.push(w));
      totalWaits = keep;
    }
    if (areaWaits.length) {
      const keep: typeof areaWaits = [];
      for (const w of areaWaits) {
        const inside = inArea(w.area);
        if (inside && !w.inside) w.resolve();
        else { w.inside = inside; keep.push(w); }
      }
      areaWaits = keep;
    }
    for (const a of [...areaWatches]) {
      if (a.dead) continue;
      const inside = inArea(a.area);
      const entered = inside && !a.inside;
      a.inside = inside;
      if (entered) { try { a.fn(); } catch (e) { console.error(e); } }
    }
    if (timerWaits.length) {
      const keep: TimerWait[] = [];
      for (const w of timerWaits) (now >= w.until ? w.resolve() : keep.push(w));
      timerWaits = keep;
    }
    for (const e of [...everies]) {
      // At most one fire per tick, so a long frame does not burst.
      if (e.dead || now < e.next) continue;
      e.next = Math.max(e.next + e.period, now);
      try { e.fn(); } catch (err) { console.error(err); }
    }

    // 5. interaction
    const near = frozen ? null : nearestInteractable();
    setInteractLabel(near ? near.label : null);
    if (near && raw.interactPressed && !frozen) {
      const set = interactListeners.get(near.id);
      if (set) for (const fn of [...set]) { try { fn(); } catch (e) { console.error(e); } }
      const keep: typeof interactWaits = [];
      for (const w of interactWaits) (w.id === near.id ? w.resolve() : keep.push(w));
      interactWaits = keep;
    }

    // 6. HUD counters at 10 Hz
    counterAcc += dt;
    if (counterAcc >= COUNTER_EVERY) { counterAcc = 0; updateCounters(); }

    // 7. best total, saved at most every 5 s
    if (collect.total > save.bestTotal) { save.bestTotal = collect.total; bestDirty = true; }
    if (bestDirty && now - lastSaveAt >= SAVE_EVERY) { bestDirty = false; lastSaveAt = now; writeSave(save); }
  }

  // ---- chapters ----
  async function run(from: ChapterId, forced: boolean): Promise<void> {
    if (!muteWired) {
      muteWired = true;
      hud.onMute((m) => { deps.music.setMuted(m); deps.sfx.setMuted(m); });
    }

    if (!forced) {
      if (save.finished) {
        // A finished run starts over from the prologue; eggs and best total are kept.
        from = 'prologue';
        save.finished = false;
      } else if (save.chapter !== 'prologue') {
        const i = await ctx.choose(null, ['Continue: ' + CHAPTER_TITLES[save.chapter].title, 'Start over']);
        if (i === 0) from = save.chapter;
        else {
          Object.assign(save, resetSave());
          from = 'prologue';
        }
      }
    }

    const start = Math.max(0, CHAPTER_ORDER.indexOf(from));
    for (const id of CHAPTER_ORDER.slice(start)) {
      try {
        save.chapter = id;
        writeSave(save);
        ctx.name('narrator', NARRATOR_NAME[id]);
        if (deps.getFloor().id !== CHAPTER_FLOOR[id]) {
          deps.setFloor(CHAPTER_FLOOR[id]);
          teleportToSpawn();
          afterFloorChange();
        }
        ctx.camera('follow');
        ctx.setControls('walk');
        const t = CHAPTER_TITLES[id];
        if (t.kicker) {
          ctx.setControls('locked');
          await hud.titleCard(t.kicker, t.title, t.sub);
          ctx.setControls('walk');
        }
        await CHAPTERS[id].run(ctx);
      } catch (e) {
        console.error(`[director] chapter ${id} failed`, e);
      } finally {
        dropChapterState();
      }
    }

    save.finished = true;
    writeSave(save);
  }

  return { ctx, tick, cameraMode: () => camMode, run };
}
