// Snigms: a gnome life sim. Wiring only: creates the modules, owns the shared App object and the frame loop.
import { getMyGnome, loadMyGnome } from '@lawn/gnome';
import { createAchievementSink } from './achievements';
import { createSfx } from './audio';
import { createBrain } from './brain';
import { NEEDS, SPEEDS } from './config';
import { runCreate } from './create';
import { createNeighbours } from './npcs';
import { PEOPLE } from './people';
import { clearSave, loadHousehold, saveHousehold } from './save';
import { dayOf, minuteOfDay, newHousehold } from './sim';
import { townLot } from './town';
import { createTools } from './tools';
import { createUi } from './ui';
import { createView } from './view';
import { detectRooms } from './world';
import type { App, Lot } from './types';

await loadMyGnome();

const canvas = document.getElementById('game') as HTMLCanvasElement;
const root = document.getElementById('ui') as HTMLElement;

const saved = loadHousehold();
// ?quick=starter|empty skips the start screen (smoke checks and demos).
const quick = new URLSearchParams(location.search).get('quick');
const choice: Awaited<ReturnType<typeof runCreate>> =
  quick === 'starter' || quick === 'empty'
    ? { householdName: 'The Mossbottoms', gnomeName: getMyGnome()?.name ?? 'Gnorman', trait: 'neat', lot: quick }
    : await runCreate(root, {
        defaultGnomeName: getMyGnome()?.name ?? null,
        saved: saved ? { householdName: saved.name, gnomeName: saved.gnome.name, day: dayOf(saved.clock) } : null,
      });
const household = choice === 'continue' && saved ? saved : newHousehold(choice === 'continue' ? { householdName: 'The Mossbottoms', gnomeName: 'Gnorman', trait: 'neat', lot: 'starter' } : choice);

const view = createView(canvas);
const sfx = createSfx();
window.addEventListener('pointerdown', () => sfx.unlock(), { once: true });
const sendEvent = createAchievementSink(root);

// The town is a level document (see town.ts). The home lot is the household's own.
const town: Lot = townLot();

let ui: ReturnType<typeof createUi>;
let brain: ReturnType<typeof createBrain>;

const app: App = {
  h: household,
  mode: 'live',
  speed: 1,
  tool: { tool: 'select', kind: null, floor: 'wood', rot: 0 },
  selected: null,
  walls: 'cut',
  activity: '',
  lotChanged() {
    if (app.h.gnome.where === 'home') view.setLot(app.h.lot, true);
    brain.replan();
    saveHousehold(app.h);
    ui.refresh();
    checkRoomAchievement();
  },
  stateChanged() {
    saveHousehold(app.h);
    ui.refresh();
  },
  toast: (msg) => ui.toast(msg),
  sfx: (id) => sfx.play(id),
  event: (name, n) => sendEvent(name, n),
  here: () => (app.h.gnome.where === 'town' ? town : app.h.lot),
  say: (speaker, line) => ui.say(speaker, line),
};

// Achievement events the game does not raise itself (see achievements.ts). Each fires once per session.
const raised = new Set<string>();
const triedJobs = new Set<string>();
function raiseOnce(name: string) {
  if (raised.has(name)) return;
  raised.add(name);
  app.event(name);
}
function checkRoomAchievement() {
  if (detectRooms(app.h.lot).some((r) => r.enclosed && r.tiles.length >= 4)) raiseOnce('first-room');
}
function checkProgress() {
  const needs = app.h.gnome.needs;
  if (NEEDS.every((k) => needs[k] >= 90)) raiseOnce('full-house');
  if (dayOf(app.h.clock) >= 8) raiseOnce('week-survived');
  const job = app.h.gnome.job;
  if (job && !triedJobs.has(job)) {
    triedJobs.add(job);
    app.event('all-jobs-tried', 1);
  }
}

ui = createUi(root, app, {
  newGame() {
    clearSave();
    location.reload();
  },
  suggestChat: (id) => brain.suggestChat(id),
  suggestTrip: (to) => brain.suggestTrip(to),
});

// The neighbours: one gnome puppet each, walked by npcs.ts (in town only; hidden at home).
const neighbours = createNeighbours(town, minuteOfDay(app.h.clock));
const neighbourPuppets = PEOPLE.map((p) => view.addNeighbour(p.look));
brain = createBrain(app, view.gnome, neighbours);
const tools = createTools(app, view, brain, canvas);

let shownLot: Lot | null = null;
function showCurrentLot(): void {
  const want = app.here();
  if (want === shownLot) return;
  shownLot = want;
  view.setLot(want, want === app.h.lot);
  // Build and furnish edit the home lot: the town takes them back to live.
  if (want === town && app.mode !== 'live') {
    app.mode = 'live';
    app.selected = null;
    ui.refresh();
  }
}
showCurrentLot();
window.addEventListener('resize', () => view.resize());
view.resize();

// Frame loop. The sim runs at SPEEDS[app.speed] sim minutes per real second; the brain steps it.
let last = performance.now();
let lastWalls = app.walls;
let lastSelected: number | null = null;
let lastSave = 0;
let lastUi = 0;
function frame(now: number) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (app.walls !== lastWalls) {
    lastWalls = app.walls;
    view.setWalls(app.walls);
  }
  if (app.selected !== lastSelected) {
    lastSelected = app.selected;
    view.setSelected(app.selected);
    ui.refresh();
  }
  tools.update(dt);
  brain.update(dt, dt * SPEEDS[app.speed]);
  showCurrentLot();
  const inTown = app.h.gnome.where === 'town';
  const gnomeAt = brain.position();
  neighbours.update(dt, town, minuteOfDay(app.h.clock), inTown ? gnomeAt : null);
  neighbours.list().forEach((n, i) => {
    const puppet = neighbourPuppets[i];
    puppet.setPosition(n.x, n.z);
    puppet.setFacing(n.facing);
    puppet.setPose(n.walking ? 'walk' : 'stand');
    puppet.setVisible(inTown);
    puppet.update(dt);
  });
  checkProgress();
  view.setDaylight(((app.h.clock % 1440) + 1440) % 1440);
  view.render(dt);
  if (now - lastUi > 250) {
    lastUi = now;
    ui.refresh();
  }
  if (now - lastSave > 5000) {
    lastSave = now;
    saveHousehold(app.h);
  }
  requestAnimationFrame(frame);
}
view.setWalls(app.walls);
requestAnimationFrame(frame);

// Handy for the smoke check and demos: ?debug exposes the app.
if (new URLSearchParams(location.search).has('debug')) (window as unknown as { snigms: App }).snigms = app;
