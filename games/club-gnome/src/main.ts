// Club Gnome: a shared town of gnomes. Walk around (tap or click the ground), chat, and step into buildings to play
// the arcade's games. Online by default: the page joins the one public town room at once (or ?room=CODE).
// This file only wires the modules together; each module owns one job (see README.md).
import { GNORMAN_LOOK, getMyGnome, loadMyGnome, onLooksChanged, prefetchLooks, resolveLook, type GnomeLook } from '@lawn/gnome';
import { whileHidden } from '@lawn/mp/background';
import { checkName } from '@lawn/mp/textFilter';
import {
  EMOTES, GAME_LINKS, MAP_NAMES, ME, STORAGE, isMapId,
  type AvatarPose, type MapId, type NetStatus, type Peer, type PortalDef, type SeatDef, type SpotDef,
} from './config';
import { MAPS } from './maps';
import { newWalker, nearestWalkable, portalAt, seatNear, spotNear, stepWalker } from './walk';
import { createWorld } from './world';
import { createAvatars } from './avatars';
import { createNet } from './net';
import { createHud } from './hud';
import { createOverlay } from './overlay';
import { createMusic } from './music';
import { accountState, finishSignInIfReturning, goToAccount, showGuestPrompt } from './account';
import { loadMyEmotes, type EmoteDef } from '@lawn/emotes';
import { initAchievements, onAnimSent, onChatSent, onCrowd, onEmoteSent, onOpenGame, onSit, onVisitMap } from './achievements';

await finishSignInIfReturning();
await loadMyGnome();

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ui = document.getElementById('ui') as HTMLElement;

// ---------------------------------------------------------------- who I am

function store(kind: 'local' | 'session'): Storage | null {
  try {
    return kind === 'local' ? localStorage : sessionStorage;
  } catch {
    return null;
  }
}

function startingName(): string {
  const gnome = getMyGnome()?.name;
  if (gnome && gnome !== 'Gnome') {
    const c = checkName(gnome);
    if (c.ok) return c.name;
  }
  const saved = checkName(store('local')?.getItem(STORAGE.name) ?? '');
  if (saved.ok) return saved.name;
  const made = `Gnome${1000 + Math.floor(Math.random() * 9000)}`;
  store('local')?.setItem(STORAGE.name, made);
  return made;
}

const myName = startingName();
const myCharacter = getMyGnome()?.code ?? 'gnorman';
const myLook: GnomeLook = getMyGnome()?.look ?? GNORMAN_LOOK;

// ---------------------------------------------------------------- modules

const world = createWorld(canvas);
const avatars = createAvatars(world, ui);
const overlay = createOverlay(ui);
initAchievements(ui);
const music = createMusic();

let mapId: MapId = 'town';
const savedMap = store('session')?.getItem(STORAGE.map);
if (isMapId(savedMap)) mapId = savedMap;
let map = MAPS[mapId];
const walker = newWalker(map.spawn.x, map.spawn.z);
/** What the walk is for: use this portal, spot or seat on arrival. */
let intent: { kind: 'portal' | 'spot' | 'seat'; id: string } | null = null;
/** The spot, portal or seat the action button stands for right now ('stand' while sitting). */
let actionTarget:
  | { kind: 'portal'; p: PortalDef }
  | { kind: 'spot'; s: SpotDef }
  | { kind: 'seat'; s: SeatDef }
  | { kind: 'stand' }
  | null = null;
/** The seat I am sitting on, or null when standing. Any walking stands me up. */
let seated: SeatDef | null = null;

const peers = new Map<number, Peer>();
const peerMap = new Map<number, MapId>();
let inTown = 1;
let netStatus: NetStatus = 'connecting';
let myColor: number | null = null;

// Never zoom the page by accident (iOS Safari ignores user-scalable=no): block pinch, double-tap and ctrl+wheel zoom.
for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) {
  document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
}
document.addEventListener('touchmove', (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
  const now = Date.now();
  const t = e.target as HTMLElement | null;
  if (now - lastTouchEnd < 350 && !t?.closest('input, textarea')) e.preventDefault();
  lastTouchEnd = now;
}, { passive: false });
window.addEventListener('wheel', (e) => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });

const hud = createHud(ui, {
  onChat(text) {
    net.chat(text);
    onChatSent();
  },
  onEmote(e) {
    net.emote(e);
    onEmoteSent();
  },
  onAnim(id) {
    playAnim(id);
  },
  onEmoteMenu() {
    refreshAnims();
  },
  onAction() {
    doAction();
  },
  onAccount() {
    const a = accountState();
    if (a.enabled && !a.signedIn) showGuestPrompt(ui, true);
    else goToAccount(false);
  },
  onCreator() {
    music.pause();
    overlay.open(GAME_LINKS.creator, `Back to ${MAP_NAMES[mapId]}`);
  },
  onTravel(to) {
    if (to !== mapId) enterMap(to, MAPS[to].spawn.x, MAPS[to].spawn.z);
  },
});

const net = createNet({
  onStatus(status, players) {
    netStatus = status;
    inTown = players;
    if (net.myColor !== null && net.myColor !== myColor) {
      myColor = net.myColor;
      avatars.upsert(ME, myLook, myName, myColor);
    }
    refreshStatus();
  },
  onPeerJoin(p) {
    peers.set(p.id, p);
    void prefetchLooks([p]);
  },
  onPeerLeave(id) {
    peers.delete(id);
    peerMap.delete(id);
    avatars.remove(id);
    refreshStatus();
  },
  onPeerPose(id, m, pose, sentAt) {
    const p = peers.get(id);
    if (!p) return;
    const was = peerMap.get(id);
    peerMap.set(id, m);
    if (m !== mapId) {
      if (avatars.has(id)) avatars.remove(id);
      if (was !== m) refreshStatus();
      return;
    }
    if (!avatars.has(id)) avatars.upsert(id, lookOf(p), p.name, p.color);
    if (was !== m) {
      avatars.snap(id);
      refreshStatus();
    }
    avatars.pushPose(id, pose, sentAt);
  },
  onChat(id, name, color, text) {
    const mine = id === ME || id === net.myId;
    if (!mine && peerMap.get(id) !== mapId) return; // chat is heard in the room it is said in
    hud.log(name, color, text);
    avatars.say(mine ? ME : id, text);
  },
  onEmote(id, e) {
    const mine = id === net.myId || id === ME;
    if (!mine && peerMap.get(id) !== mapId) return;
    avatars.say(mine ? ME : id, EMOTES[e]);
  },
  onAnim(id, a) {
    const mine = id === net.myId || id === ME;
    if (!mine && peerMap.get(id) !== mapId) return;
    avatars.playEmote(mine ? ME : id, a);
  },
  onChatRate() {
    hud.system('Slow down a little: that line was not sent.');
  },
  onReset() {
    peers.clear();
    peerMap.clear();
    avatars.removeAllExcept(ME);
    refreshStatus();
  },
});

// Animated emotes equipped in the Gnome Creator (the 😀 row shows them; keys 1-4 play them on desktop).
let myAnims: EmoteDef[] = [];
function refreshAnims(): void {
  void loadMyEmotes().then((list) => {
    myAnims = list;
    hud.setAnimEmotes(list);
  });
}
refreshAnims();

function playAnim(id: string): void {
  net.anim(id);
  onAnimSent();
}

function lookOf(p: Peer): GnomeLook {
  return resolveLook({ id: p.id, character: p.character, userId: p.userId }) ?? GNORMAN_LOOK;
}

onLooksChanged(() => {
  for (const id of avatars.ids()) {
    const p = peers.get(id);
    if (p) avatars.upsert(id, lookOf(p), p.name, p.color);
  }
});

function othersHere(): number {
  let n = 0;
  for (const m of peerMap.values()) if (m === mapId) n++;
  return n;
}

function refreshStatus(): void {
  const others = othersHere();
  hud.setStatus(netStatus, others + 1, inTown);
  onCrowd(others);
}

function refreshAccount(): void {
  const a = accountState();
  hud.setAccount(a.enabled && !a.signedIn ? '👤 Guest' : `👤 ${myName}`);
}

const volumeBox = document.createElement('div');
hud.addTopControl(volumeBox);
music.mountButton(volumeBox);

// ---------------------------------------------------------------- maps, portals, spots

function enterMap(to: MapId, x: number, z: number): void {
  const from = mapId;
  mapId = to;
  map = MAPS[to];
  store('session')?.setItem(STORAGE.map, to);
  world.load(map);
  const at = nearestWalkable(map, x, z);
  walker.x = at.x;
  walker.z = at.z;
  walker.target = null;
  walker.moving = false;
  intent = null;
  seated = null;
  avatars.removeAllExcept(ME);
  for (const [id, m] of peerMap) {
    const p = peers.get(id);
    if (m === to && p) avatars.upsert(id, lookOf(p), p.name, p.color);
  }
  world.follow(walker.x, walker.z, 0, true);
  hud.setMapName(MAP_NAMES[to]);
  if (from !== to) hud.system(`You walked into ${MAP_NAMES[to]}.`);
  onVisitMap(to);
  music.setMap(to);
  refreshStatus();
}

function doAction(): void {
  if (seated) standUp();
  else if (actionTarget?.kind === 'portal') usePortal(actionTarget.p);
  else if (actionTarget?.kind === 'spot') useSpot(actionTarget.s);
  else if (actionTarget?.kind === 'seat') sitDown(actionTarget.s);
}

function usePortal(p: PortalDef): void {
  enterMap(p.to, p.spawnX, p.spawnZ);
}

/** Sit down on a seat: the gnome stands in the seat's place, turned to face where it says. */
function sitDown(s: SeatDef): void {
  intent = null;
  walker.target = null;
  walker.moving = false;
  walker.x = s.x;
  walker.z = s.z;
  walker.facing = s.facing;
  seated = s;
  onSit();
}

function standUp(): void {
  seated = null;
}

function useSpot(s: SpotDef): void {
  intent = null;
  walker.target = null;
  walker.moving = false;
  hud.setVisible(false);
  music.pause();
  overlay.open(GAME_LINKS[s.game], `Back to ${MAP_NAMES[mapId]}`);
  onOpenGame(s.game);
}

overlay.onClose(() => {
  hud.setVisible(true);
  music.resume();
  last = performance.now();
});

/** Walk toward a portal or spot; it is used on arrival. */
function walkTo(kind: 'portal' | 'spot' | 'seat', id: string): void {
  const thing = kind === 'portal'
    ? map.portals.find((p) => p.id === id)
    : kind === 'seat'
      ? map.seats.find((s) => s.id === id)
      : map.spots.find((s) => s.id === id);
  if (!thing) return;
  const d = Math.hypot(thing.x - walker.x, thing.z - walker.z);
  if (d <= thing.r) {
    if (kind === 'portal') usePortal(thing as PortalDef);
    else if (kind === 'seat') sitDown(thing as SeatDef);
    else useSpot(thing as SpotDef);
    return;
  }
  standUp();
  intent = { kind, id };
  walker.target = { x: thing.x, z: thing.z };
}

// ---------------------------------------------------------------- input

canvas.addEventListener('pointerdown', (e) => {
  if (overlay.isOpen) return;
  const hit = world.pick(e.clientX, e.clientY);
  if (!hit) return;
  if (hit.kind === 'building') {
    if (hit.link && map.portals.some((p) => p.id === hit.link)) walkTo('portal', hit.link);
    else if (hit.link && map.spots.some((s) => s.id === hit.link)) walkTo('spot', hit.link);
    return;
  }
  // A tap near a spot, seat or portal walks there to use it; anywhere else just walks.
  const spot = spotNear(map, hit.x, hit.z);
  if (spot) {
    walkTo('spot', spot.id);
    return;
  }
  const seat = seatNear(map, hit.x, hit.z);
  if (seat) {
    walkTo('seat', seat.id);
    return;
  }
  const portal = portalAt(map, hit.x, hit.z);
  if (portal) {
    walkTo('portal', portal.id);
    return;
  }
  intent = null;
  standUp();
  walker.target = nearestWalkable(map, hit.x, hit.z);
});

const keys = new Set<string>();
window.addEventListener('keydown', (e) => {
  if (overlay.isOpen || hud.typing) return;
  if (e.key === 'Enter') {
    e.preventDefault();
    hud.focusChat();
    return;
  }
  if (e.key === 'e' || e.key === 'E' || e.key === ' ') {
    e.preventDefault();
    doAction();
    return;
  }
  if (e.key >= '1' && e.key <= '4') {
    const anim = myAnims[Number(e.key) - 1];
    if (anim) {
      e.preventDefault();
      playAnim(anim.id);
      return;
    }
  }
  keys.add(e.key.toLowerCase());
});
window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());

/** Arrow keys / WASD: walk a short step ahead in that direction each frame. */
function keyTarget(): { x: number; z: number } | null {
  let dx = 0;
  let dz = 0;
  if (keys.has('arrowleft') || keys.has('a')) dx -= 1;
  if (keys.has('arrowright') || keys.has('d')) dx += 1;
  if (keys.has('arrowup') || keys.has('w')) dz -= 1;
  if (keys.has('arrowdown') || keys.has('s')) dz += 1;
  if (dx === 0 && dz === 0) return null;
  const len = Math.hypot(dx, dz);
  return { x: walker.x + (dx / len) * 0.6, z: walker.z + (dz / len) * 0.6 };
}

// ---------------------------------------------------------------- loop

function myPose(): AvatarPose {
  return {
    x: walker.x,
    z: walker.z,
    facing: walker.facing,
    moving: walker.moving,
    busy: overlay.isOpen,
    sit: seated ? seated.y : 0,
  };
}

/** Simulation and net: runs every frame, and from whileHidden while the tab is hidden (keeps the relay hearing us). */
function step(dt: number): void {
  if (!overlay.isOpen) {
    const k = keyTarget();
    if (k) {
      intent = null;
      standUp();
      walker.target = k;
    }
    const stopped = stepWalker(walker, dt, map);
    const portal = portalAt(map, walker.x, walker.z);
    if (portal) {
      usePortal(portal);
    } else if (stopped && intent) {
      const want = intent;
      intent = null;
      if (want.kind === 'seat') {
        const seat = map.seats.find((s) => s.id === want.id);
        if (seat && Math.hypot(seat.x - walker.x, seat.z - walker.z) <= seat.r + 0.6) sitDown(seat);
      } else {
        const spot = want.kind === 'spot' ? map.spots.find((s) => s.id === want.id) : undefined;
        if (spot && Math.hypot(spot.x - walker.x, spot.z - walker.z) <= spot.r + 0.6) useSpot(spot);
      }
    }
  }
  net.setPose(mapId, myPose());
}

function updateAction(): void {
  if (seated) {
    actionTarget = { kind: 'stand' };
    hud.setAction('Stand up');
    return;
  }
  const spot = spotNear(map, walker.x, walker.z);
  if (spot) {
    actionTarget = { kind: 'spot', s: spot };
    hud.setAction(spot.label);
    return;
  }
  const seat = seatNear(map, walker.x, walker.z);
  if (seat) {
    actionTarget = { kind: 'seat', s: seat };
    hud.setAction(seat.label);
    return;
  }
  actionTarget = null;
  hud.setAction(null);
}

let last = performance.now();
function frame(now: number): void {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  step(dt);
  if (overlay.isOpen) return; // the game covers the town: skip drawing it
  updateAction();
  avatars.setPose(ME, myPose());
  world.follow(walker.x, walker.z, dt);
  avatars.update(dt);
  world.render();
}

whileHidden((dt) => step(dt));

// ---------------------------------------------------------------- start

avatars.upsert(ME, myLook, myName, 0xffffff);
enterMap(mapId, map.spawn.x, map.spawn.z);
refreshAccount();
hud.system(`Welcome to Club Gnome, ${myName}! Tap the ground to walk, step into a door to go in.`);
const room = /[?&#]room=([A-Za-z0-9]{4,8})/.exec(location.search + location.hash)?.[1]?.toUpperCase() ?? null;
const offline = location.search.includes('offline') || location.hash.includes('offline');
net.start(myName, myCharacter, room, offline);
showGuestPrompt(ui);
requestAnimationFrame(frame);
