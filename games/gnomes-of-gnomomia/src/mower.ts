// The Battle of the Verge: the Mower fight in three phases (Mud, Jam, Heartspark), and the allies that change it.
// The boss parts are ordinary enemies (mower-deck, mower-wheel, mower-heartspark, mower-rope). bossmoves.ts fires the
// deck's attacks; this file runs the script around them: the roll, the barricades, the phase flags and the timers.
import * as THREE from 'three';
import { UI, type BossMoveDef, type EnemyDef, type Entity } from './config';
import { ALLIES, ENEMIES } from './content';
import { dealDamage, healPlayer } from './combat';
import { allEntities, killEntity, spawnEnemyAt } from './entities';
import { bus, say } from './events';
import { addItem } from './inventory';
import { player } from './player';
import { checkCondition, questStatus } from './quests';
import { maxHp, setFlag, state } from './state';
import { heightAt } from './world';
import { showEpilogue } from './ui/epilogue';

const QUEST_ID = 'c8-turning-blade';
const PHASE_FLAG = 'c8-phase';
const VALVE = 'c8-valve-head';
const SOCKET = 'c8-stone-socket';
const STAKE = 'c8-stake-point';
const EPILOGUE_FLAG = 'c8-epilogue-seen';

const DECK = 'mower-deck';
const WHEEL = 'mower-wheel';
const HEART = 'mower-heartspark';
const ROPE = 'mower-rope';
const CHARGE = 'Rolling Charge';

/** Deck start and the battle line it rolls to. */
const DECK_START_Z = -115;
const BATTLE_LINE_Z = -75;
const DECK_ROLL_SPEED = 1.2;
/** Wheel offsets from the deck's centre. */
const WHEEL_OFFSETS: readonly (readonly [number, number])[] = [[5, 4], [-5, 4], [5, -4], [-5, -4]];

/** Phase 1 (Mud). */
const MUD_SECONDS = 90;
const MOTH_EVERY = 12;
const MOTH_LIFE = 6;
const MUD_RING_MIN = 3;
const MUD_RING_SPREAD = 3;
const BARRICADE_HP = 3;
const BARRICADE_REBUILD = 20;
/** A charge lane counts as crossing a barricade within this many metres of its x. */
const BARRICADE_HALF_WIDTH = 1.5;
const BARRICADES: readonly { x: number; z: number }[] = [{ x: -15, z: -20 }, { x: 0, z: -22 }, { x: 15, z: -20 }];
const WHEEL_DIG_HP = 0.75;

/** Phase 2 (Jam). */
const BOGGED_TIMER_FACTOR = 1.5;
const WHEEL_DOWN_TIMER_STEP = 0.15;
const CART_FROM_Z = 60;
const CART_TO_Z = -66;
const CART_SPEED = 3;
const CART_ALLY_BOOST = 2;
const RAMP_BOOST = 1;
const CART_TRIGGER = 0.5;
const LANE_WARN_SECONDS = 1;

/** Phase 3 (Heartspark). */
const HEART_SPAWN = { x: 0, z: -70 };
const ROPE_SPAWN = { x: 6, z: -72 };
const STAKE_DAMAGE = 900;
const STAKE_HIDE_SECONDS = 20;
const ROPE_THRESHOLDS: readonly number[] = [0.7, 0.35];
const ROPE_SECONDS = 30;
const ROPE_PIN_SECONDS = 15;
const ROPE_HEAL = 0.25;
const REVIVE_FRACTION = 0.4;
const STATIC_DECK_SECONDS = 10;

type Phase = 'mud' | 'mud-open' | 'jam-wait' | 'jam' | 'heart' | 'heart-wait' | 'done';

interface Barricade { x: number; z: number; hp: number; max: number; rebuildIn: number }
interface WheelRef { entity: Entity; dx: number; dz: number }
interface Timer { left: number; fn: () => void }

let scene: THREE.Scene | null = null;
/** True from the start of the battle until the Heartspark falls. */
let active = false;
/** The current phase; null before the battle, 'done' after it. Mirrored into the c8-phase flag. */
let phase: Phase | null = null;

let deck: Entity | null = null;
let deckX = 0;
let deckZ = DECK_START_Z;
let wheels: WheelRef[] = [];
let heart: Entity | null = null;
let ropesPulled = 0;
let staticDeck: THREE.Group | null = null;
let cart: THREE.Mesh | null = null;
let cartZ = CART_FROM_Z;
let cartSpeed = CART_SPEED;

let barricades: Barricade[] = [];
let mudElapsed = 0;
let mudSpawnLeft = MOTH_EVERY;
let bogged = false;
let reviveUsed = false;
let doubling = false;
let epilogueShown = false;

/** The deck's boss moves and their base intervals, so the attack timers can be stretched and restored. */
let deckMoves: { move: BossMoveDef; base: number }[] = [];
/** Delayed work (moth despawns, lane warnings, charge impacts, rope timers, the stake's hide). */
const timers: Timer[] = [];

/** True when any ally row with this effect id holds its condition. Effects are read from ALLIES in content.ts. */
export function allyActive(effect: string): boolean {
  return ALLIES.some((a) => a.effect === effect && checkCondition(a.when));
}

/** Keeps the scene the Mower is drawn in and subscribes to the events the fight reacts to. Call once. */
export function initMower(s: THREE.Scene): void {
  scene = s;
  bus.on('interacted', ({ objectId }) => {
    if (objectId === VALVE) openValve();
    else if (objectId === SOCKET) jamBlade();
    else if (objectId === STAKE) driveStake();
  });
  // The start is not an event: canStart() is polled every frame in updateMower, which also covers quest-updated and zone changes.
  bus.on('boss-phase', ({ boss, text }) => onBossMove(boss, text));
  bus.on('hit', (ev) => doubleRain(ev));
  bus.on('player-died', () => onPlayerDied());
  // The cart and the stopped deck live in the scene, not the zone's world group: take them away when the player
  // leaves the Verge. A battle in progress restarts from Mud on return (canStart), which rebuilds them.
  bus.on('zone-changed', ({ zone }) => {
    if (zone === 'verge') return;
    removeCart();
    removeStaticDeck();
  });
}

/** Starts the battle: the deck and its wheels roll out, and the Mud phase begins. Called once, from updateMower. */
export function startMowerBattle(): void {
  if (active) return;
  active = true;
  // A restart (after a reload or a zone respawn) may find the last run's timers, scaled attack timers and props still in place.
  for (const { move, base } of deckMoves) move.every = base;
  deckMoves = [];
  timers.length = 0;
  removeCart();
  removeStaticDeck();
  heart = null;
  doubling = false;
  mudElapsed = 0;
  mudSpawnLeft = MOTH_EVERY;
  bogged = false;
  reviveUsed = false;
  ropesPulled = 0;
  deckX = 0;
  deckZ = DECK_START_Z;

  const barricadeHp = BARRICADE_HP * (allyActive('barricade-hp') ? 2 : 1);
  barricades = BARRICADES.map((b) => ({ x: b.x, z: b.z, hp: barricadeHp, max: barricadeHp, rebuildIn: 0 }));

  setPhase('mud');
  deck = spawnEnemyAt(DECK, deckX, deckZ);
  wheels = [];
  for (const [dx, dz] of WHEEL_OFFSETS) {
    const entity = spawnEnemyAt(WHEEL, deckX + dx, deckZ + dz);
    if (entity) wheels.push({ entity, dx, dz });
  }
  const deckDef: EnemyDef | undefined = ENEMIES[DECK];
  deckMoves = (deckDef?.moves ?? []).map((move) => ({ move, base: move.every }));

  if (allyActive('potions')) {
    addItem('ruby-draught', 2);
    say("Potsworth hands out the treasury's potions. His hands are shaking.", UI.gold);
  }
  say('The Shed door bursts. The Mower rolls out onto the Verge.', UI.bad);
  placeBattle();
}

/** Per-frame mower battle work: starts the fight when its quest stage begins, then runs the current phase. */
export function updateMower(dt: number): void {
  // A zone reload respawns every entity, so a deck that is no longer in the world means the battle's references are stale.
  if (active && deck && !deck.dead && !allEntities().includes(deck)) active = false;
  if (!active && canStart()) startMowerBattle();
  if (active) stepBattle(dt);
  runTimers(dt);
  if (!epilogueShown && !state.flags[EPILOGUE_FLAG] && questStatus(QUEST_ID) === 'done') showEndCard();
}

// ---------------------------------------------------------------- start, phases, timers

/**
 * The fight starts in the Verge while quest stage 1, 2 or 3 is open and the battle is not running. This covers a fresh
 * start (phase unset or 'ready') and a reload mid-fight, which restarts from Mud. The 'done' flag ends it for good.
 */
function canStart(): boolean {
  if (active || phase === 'done') return false;
  if (state.zone !== 'verge') return false;
  if (state.flags[PHASE_FLAG] === 'done') return false;
  const q = state.quests[QUEST_ID];
  return !!q && !q.done && q.stage >= 1 && q.stage <= 3;
}

function is(...phases: Phase[]): boolean {
  return phase !== null && phases.includes(phase);
}

function setPhase(p: Phase): void {
  phase = p;
  setFlag(PHASE_FLAG, p);
}

function stepBattle(dt: number): void {
  if (is('done')) return;
  // The deck may die some other way than the Stone; the Heartspark still comes, so the fight can be finished.
  if (!is('heart', 'heart-wait') && deck?.dead) enterHeart();
  if (is('mud', 'mud-open')) updateMud(dt);
  placeBattle();
  scaleDeckTimers();
  if (is('jam-wait')) updateJam(dt);
  if (is('heart', 'heart-wait')) updateHeart();
}

/** Runs the delayed work; a timer added during a tick runs from the next tick. */
function runTimers(dt: number): void {
  for (let i = timers.length - 1; i >= 0; i--) {
    const t = timers[i];
    t.left -= dt;
    if (t.left > 0) continue;
    timers.splice(i, 1);
    t.fn();
  }
}

// ---------------------------------------------------------------- phase 1: Mud

function updateMud(dt: number): void {
  // The deck rolls south to the battle line and stays there.
  if (deckZ < BATTLE_LINE_Z) deckZ = Math.min(BATTLE_LINE_Z, deckZ + DECK_ROLL_SPEED * dt);

  mudElapsed += dt;
  mudSpawnLeft -= dt;
  if (mudSpawnLeft <= 0) {
    mudSpawnLeft += MOTH_EVERY;
    spawnMudWave();
  }

  // Damage to the wheels does not count before the valve opens.
  for (const w of wheels) if (!w.entity.dead) w.entity.hp = w.entity.maxHp;

  for (const b of barricades) {
    if (b.hp <= 0 && b.rebuildIn > 0) {
      b.rebuildIn -= dt;
      if (b.rebuildIn <= 0) {
        b.hp = b.max;
        b.rebuildIn = 0;
        say('The sappers rebuild a barricade.', UI.good);
      }
    }
  }

  if (barricades.every((b) => b.hp <= 0)) {
    loseLine();
  } else if (is('mud') && mudElapsed >= MUD_SECONDS) {
    setPhase('mud-open');
    say("Ida: The valve's ready! Turn it, now!", UI.quest);
  }
}

/** Two moths and a rust-rat, near the player. With moth-archers, the moths fall after a few seconds. */
function spawnMudWave(): void {
  const archers = allyActive('moth-archers');
  for (let i = 0; i < 2; i++) {
    const at = nearPlayer();
    const moth = spawnEnemyAt('grass-bag-moth', at.x, at.z);
    if (moth && archers) {
      const id = moth.id;
      timers.push({ left: MOTH_LIFE, fn: () => killEntity(id) });
    }
  }
  const rat = nearPlayer();
  spawnEnemyAt('rust-rat', rat.x, rat.z);
}

function nearPlayer(): { x: number; z: number } {
  const a = Math.random() * Math.PI * 2;
  const r = MUD_RING_MIN + Math.random() * MUD_RING_SPREAD;
  return { x: player.position.x + Math.cos(a) * r, z: player.position.z + Math.sin(a) * r };
}

/** All three barricades are down: the Mower is through. They are rebuilt and the 90 s phase timer restarts. */
function loseLine(): void {
  say("It's through the line!", UI.bad);
  for (const b of barricades) {
    b.hp = b.max;
    b.rebuildIn = 0;
  }
  mudElapsed = 0;
  if (is('mud-open')) setPhase('mud');
}

/** A Rolling Charge: the lane is fixed when it fires, and it hits at the end of the telegraph. */
function onBossMove(boss: string, text: string): void {
  if (!active || !deck || deck.dead || boss !== deck.name || text !== CHARGE) return;
  const deckDef: EnemyDef | undefined = ENEMIES[DECK];
  const telegraph = deckDef?.moves?.find((m) => m.name === CHARGE)?.telegraph ?? 3;
  const cx = deckX;
  const cz = deckZ;
  const px = player.position.x;
  const pz = player.position.z;

  if (allyActive('lane-warning')) {
    timers.push({ left: Math.max(0, telegraph - LANE_WARN_SECONDS), fn: () => say('Sedge: Left lane! Now!', UI.bad) });
  }
  timers.push({ left: telegraph, fn: () => chargeLands(cx, cz, px, pz) });
}

function chargeLands(cx: number, cz: number, px: number, pz: number): void {
  if (!active || !is('mud', 'mud-open')) return;
  for (const b of barricades) {
    if (b.hp <= 0 || !laneCrosses(cx, cz, px, pz, b.x, b.z)) continue;
    b.hp -= 1;
    if (b.hp <= 0) {
      say('A barricade splinters and goes down.', UI.bad);
      if (allyActive('sapper-rebuild')) b.rebuildIn = BARRICADE_REBUILD;
    }
  }
}

/**
 * Whether a charge from (cx, cz) toward (px, pz) crosses the barricade at (bx, bz): the barricade's z must lie between
 * the two ends, and the lane's x there must be within the barricade's half-width of bx.
 */
function laneCrosses(cx: number, cz: number, px: number, pz: number, bx: number, bz: number): boolean {
  const dz = pz - cz;
  if (Math.abs(dz) < 1e-3) return false;
  if (bz < Math.min(cz, pz) || bz > Math.max(cz, pz)) return false;
  const t = (bz - cz) / dz;
  const x = cx + t * (px - cx);
  return Math.abs(x - bx) <= BARRICADE_HALF_WIDTH;
}

/** The valve is turned: the Mower bogs down, the wheels take their dig damage, and phase 2 begins waiting for the cart. */
function openValve(): void {
  if (!is('mud-open')) return;
  setPhase('jam');
  say('Water bursts across the Shorn. The Mower bogs down in mud.', UI.quest);
  bogged = true;
  if (allyActive('wheel-dig')) {
    for (const w of wheels) if (!w.entity.dead) w.entity.hp = Math.round(w.entity.maxHp * WHEEL_DIG_HP);
  }
  setPhase('jam-wait');
}

// ---------------------------------------------------------------- phase 2: Jam

function updateJam(dt: number): void {
  if (!cart && deck && !deck.dead && deck.hp <= deck.maxHp * CART_TRIGGER) spawnCart();
  if (!cart) return;
  cartZ -= cartSpeed * dt;
  if (cartZ > CART_TO_Z) {
    placeCart();
    return;
  }
  removeCart();
  setPhase('jam');
}

function spawnCart(): void {
  cartZ = CART_FROM_Z;
  cartSpeed = CART_SPEED + (allyActive('cart-speed') ? CART_ALLY_BOOST : 0) + (allyActive('ramp-faster') ? RAMP_BOOST : 0);
  cart = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.4, 3.2), new THREE.MeshLambertMaterial({ color: 0x8a6a3a }));
  scene?.add(cart);
  placeCart();
}

function placeCart(): void {
  if (!cart) return;
  cart.position.set(0, heightAt(0, cartZ) + 0.7, cartZ);
}

function removeCart(): void {
  if (!cart) return;
  scene?.remove(cart);
  cart.geometry.dispose();
  (cart.material as THREE.Material).dispose();
  cart = null;
}

/** The deck's attack timers: 1.5x while bogged, plus 15% for each wheel that is down. Applied from the next cycle on. */
function scaleDeckTimers(): void {
  if (deckMoves.length === 0) return;
  const down = wheels.filter((w) => w.entity.dead).length;
  const factor = (bogged ? BOGGED_TIMER_FACTOR : 1) * (1 + WHEEL_DOWN_TIMER_STEP * down);
  for (const { move, base } of deckMoves) move.every = base * factor;
}

/** The Stone is put in the blade: the Mower stops, and the Heartspark comes out in front of it. */
function jamBlade(): void {
  if (!is('jam')) return;
  enterHeart();
}

function enterHeart(): void {
  setPhase('heart');
  removeCart();
  const scale = deck ? deck.object.scale.x : 1;
  if (deck && !deck.dead) killEntity(deck.id);
  for (const w of wheels) if (!w.entity.dead) killEntity(w.entity.id);
  say('The Stone catches in the blade. The Turning Blade shudders and stops.', UI.quest);

  removeStaticDeck();
  staticDeck = buildStaticDeck(scale);
  staticDeck.position.set(deckX, heightAt(deckX, deckZ), deckZ);
  scene?.add(staticDeck);

  heart = spawnEnemyAt(HEART, HEART_SPAWN.x, HEART_SPAWN.z);
}

/** A static copy of the deck's mower shape, built from the same parts as the model in models.ts. */
function buildStaticDeck(scale: number): THREE.Group {
  const group = new THREE.Group();
  const red = new THREE.MeshLambertMaterial({ color: 0xb3261e });
  const dark = new THREE.MeshLambertMaterial({ color: 0x222222 });
  const part = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, tiltX = 0): void => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.x = tiltX;
    group.add(m);
  };
  part(new THREE.BoxGeometry(1.2, 0.3, 1.6), red, 0, 0.35, 0);
  for (const x of [-0.6, 0.6]) {
    for (const z of [-0.5, 0.5]) part(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 8).rotateZ(Math.PI / 2), dark, x, 0.2, z);
  }
  for (const x of [-0.25, 0.25]) part(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 5), dark, x, 0.85, -1.0, -0.6);
  part(new THREE.CylinderGeometry(0.05, 0.05, 0.6, 5).rotateZ(Math.PI / 2), dark, 0, 1.35, -1.35);
  group.scale.setScalar(scale);
  return group;
}

function removeStaticDeck(): void {
  if (!staticDeck) return;
  scene?.remove(staticDeck);
  staticDeck.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      (o.material as THREE.Material).dispose();
    }
  });
  staticDeck = null;
}

// ---------------------------------------------------------------- phase 3: Heartspark

function updateHeart(): void {
  const h = heart;
  if (!h) return;
  if (h.dead) {
    finishBattle();
    return;
  }
  const pct = h.hp / h.maxHp;
  if (ropesPulled === 0 && pct <= ROPE_THRESHOLDS[0]) {
    ropesPulled = 1;
    pullRope();
  } else if (ropesPulled === 1 && pct <= ROPE_THRESHOLDS[1]) {
    ropesPulled = 2;
    pullRope();
  }
}

/** Drive the Stake: a huge crush hit, then the Stake is hidden for 20 s. */
function driveStake(): void {
  const h = heart;
  if (!active || !is('heart') || !h || h.dead) return;
  dealDamage(h.id, STAKE_DAMAGE, 'crush', { noRoll: true });
  setPhase('heart-wait');
  timers.push({ left: STAKE_HIDE_SECONDS, fn: () => { if (is('heart-wait')) setPhase('heart'); } });
}

/** Rain on the Heartspark counts double: the same landed damage again, once (the guard stops the second hit re-entering). */
function doubleRain(ev: { target: number; damage: number; damageType?: string; attacker: number }): void {
  const h = heart;
  if (!active || doubling || !h || ev.target !== h.id || ev.damageType !== 'rain') return;
  doubling = true;
  try {
    dealDamage(h.id, ev.damage, 'rain', { noRoll: true, attacker: ev.attacker });
  } finally {
    doubling = false;
  }
}

/** The Rope starts itself. Cut it within the timer or the Heartspark heals. */
function pullRope(): void {
  const rope = spawnEnemyAt(ROPE, ROPE_SPAWN.x, ROPE_SPAWN.z);
  say("The Rope tightens. It's trying to start itself.", UI.bad);
  const pinned = allyActive('rope-pin');
  if (pinned) say('The Gleaner drops out of the sky and pins the Rope!', UI.good);
  timers.push({ left: ROPE_SECONDS + (pinned ? ROPE_PIN_SECONDS : 0), fn: () => ropeRuns(rope) });
}

function ropeRuns(rope: Entity | null): void {
  const h = heart;
  if (!rope || rope.dead || !h || h.dead) return;
  h.hp = Math.min(h.maxHp, h.hp + h.maxHp * ROPE_HEAL);
  say('It coughs. It catches. It ROARS.', UI.bad);
}

function finishBattle(): void {
  setPhase('done');
  active = false;
  say("The Mower falls silent. For the first time in three thousand years, it's quiet.", UI.good);
  for (const { move, base } of deckMoves) move.every = base;
  timers.push({ left: STATIC_DECK_SECONDS, fn: removeStaticDeck });
}

// ---------------------------------------------------------------- the deck's place and the player's second chance

/** Holds the deck and its wheels at the battle positions, so the enemy AI cannot walk them off the line. */
function placeBattle(): void {
  if (!deck || deck.dead) return;
  placeEntity(deck, deckX, deckZ);
  for (const w of wheels) if (!w.entity.dead) placeEntity(w.entity, deckX + w.dx, deckZ + w.dz);
}

function placeEntity(e: Entity, x: number, z: number): void {
  e.position.set(x, heightAt(x, z), z);
  e.home.set(x, e.position.y, z);
}

/** With revive, the first death in the battle is cancelled. It is handled a tick later, after the death message. */
function onPlayerDied(): void {
  if (!active || reviveUsed || !allyActive('revive')) return;
  reviveUsed = true;
  timers.push({
    left: 0,
    fn: () => {
      player.dead = false;
      healPlayer(Math.round(maxHp() * REVIVE_FRACTION));
      say('The Ant Thousand carry you back up the line.', UI.good);
    },
  });
}

function showEndCard(): void {
  epilogueShown = true;
  const root = document.getElementById('ui');
  if (!root || state.flags[EPILOGUE_FLAG]) return;
  setFlag(EPILOGUE_FLAG, 'yes');
  showEpilogue(root);
}
