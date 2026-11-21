// Snigms: a gnome life sim. Wiring only: creates the modules, owns the shared App object and the frame loop.
import { getMyGnome, loadMyGnome } from '@lawn/gnome';
import { createAchievementSink } from './achievements';
import { createSfx } from './audio';
import { createBrain } from './brain';
import { NEEDS, SPEEDS } from './config';
import { runCreate } from './create';
import { clearSave, loadHousehold, saveHousehold } from './save';
import { dayOf, newHousehold } from './sim';
import { createTools } from './tools';
import { createUi } from './ui';
import { createView } from './view';
import { detectRooms } from './world';
import type { App } from './types';

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
    view.setLot(app.h.lot);
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
});
brain = createBrain(app, view.gnome);
const tools = createTools(app, view, brain, canvas);

view.setLot(app.h.lot);
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
