// Fishing (docs/roadmaps/gta-fishing.md): the system app.ts talks to. Rod out (X, pad B, the fishing button) on foot by
// the water or in a stopped boat; hold to charge and release to cast; a bite dips the bobber (sound, buzz); press to hook,
// then hold to reel and let go when the line strains. Landed fish are measured, carded and let go (canon: fish are
// never hurt). The Bent Pin on the canal sells rods and bait and buys catch cards; the journal keeps sizes and records.
// Nothing heavy runs while not fishing: a water probe 4 times a second, the hot-spot markers near a spot, the keeper.
// Local to each browser, like the other wildlife: not relayed online.
import * as THREE from 'three';
import type { GnomeModel } from '@lawn/gnome';
import type { Economy } from '../economy';
import { regionAt } from '../levels';
import { play2d, playAt } from '../sound';
import { markTrainerModified } from '../trainer/mark';
import { registerTrainerSection, registerTrainerSpawnable } from '../trainer/registry';
import { button, grid, heading, note, status } from '../trainer/ui';
import type { Blip, Box, Hud, Player, Sfx, World } from '../types';
import { createFishHud, type FishHudState } from './fishHud';
import { createFishInput } from './fishInput';
import { createFishPose } from './fishPose';
import { createFishStore, type FishStore } from './fishSave';
import { createFishView } from './fishView';
import { biteDelay, pickFish, rollSize, spotAt, weatherAt } from './pick';
import { createShop } from './shop';
import { createShopUi } from './shopUi';
import { createFishingState, forceBite, resetFishing, stepFishing } from './sim';
import { registerFishSounds } from './sounds';
import { FISH_SPECIES, catchValue, fishById } from './species';
import { createSpotView } from './spotView';
import { BAITS } from './tackle';
import {
  FISH, FISH_ACHIEVEMENTS, SHOP,
  type FishEvent, type FishPhase, type FishSpecies, type FishWater, type SimEnv, type SimInput, type TimeLabel,
} from './types';
import { ICE_REACH, fishWaterAt, iceHoleNear, nearWater, waterSurface } from './waterKind';

export interface FishingDeps {
  scene: THREE.Scene;
  ui: HTMLElement;
  world: World;
  hud: Hud;
  economy: Economy;
  play(sfx: Sfx): void;
  unlock(id: string): void;
  increment(id: string, by?: number): void;
  /** Storage for the save (tests); default localStorage. */
  storage?: Pick<Storage, 'getItem' | 'setItem'>;
  /** A fish was landed (after the journal recorded it) on `water` (winter/runtime.ts counts 'ice' catches). */
  onCatch?(water: FishWater, speciesId: string): void;
}

/** What app.ts hands fishing each frame. */
export interface FishingFrame {
  dt: number;
  /** Seconds since start. */
  time: number;
  playerX: number;
  playerY: number;
  playerZ: number;
  /** The chase camera's yaw: the cast goes this way. */
  camYaw: number;
  /** On foot and able to act: grounded, not swimming, falling, tumbling or mounting, not cracked. */
  onFoot: boolean;
  /** In a boat (any seat). */
  inBoat: boolean;
  /** |speed| of the vehicle the player is in, 0 on foot. */
  boatSpeed: number;
  /** The game's fire input held this frame (mouse, F, touch fire, pad RT/RB), before app.ts zeroes it. */
  fire: boolean;
  timeLabel: TimeLabel;
  /** A cutscene, shop or menu holds the game: fishing stops and its HUD hides. */
  paused: boolean;
}

export interface Fishing {
  readonly boxes: readonly Box[];
  readonly blips: readonly Blip[];
  readonly species: readonly FishSpecies[];
  /** Rod out: app.ts holds movement, firing and the boat's controls (the camera still turns to aim the cast). */
  active(): boolean;
  /** On foot while fishing: the yaw the gnome should face (the cast direction); null otherwise. */
  facing(): number | null;
  /** The E prompt at Wenna's counter, or null. */
  prompt(player: Player): string | null;
  /** E pressed while prompt() was not null. True when handled. */
  interact(player: Player): boolean;
  /** The Bent Pin sheet is open. */
  isOpen(): boolean;
  close(): void;
  update(f: FishingFrame): void;
  /** Every frame after model.update() and the emote: poses the arms and rod and draws the bobber and line. */
  pose(model: GnomeModel, dt: number): void;
  /** Put the rod away now. */
  stop(): void;
  /** Debug trainer: record a landed `id` (journal + card). False for an unknown id. */
  catchById(id: string, size?: number): boolean;
  /** Debug trainer: while the bobber waits, `id` bites now. False when not waiting or unknown. */
  biteNow(id: string): boolean;
  /** Debug trainer: every rod and plenty of bait. */
  grantAll(): void;
  /** Lend the Bent-Pin Twig Rod for free when the player owns no rod (Pail Pond's shanty). True when one was given. */
  lendRod(): boolean;
  stats(): { phase: FishPhase; species: number; cards: number; derby: boolean; tip: [number, number, number]; bob: [number, number] };
  /** Online (online/actSync.ts): the rod and line as other players should see them, or null while the rod is away. */
  wire(): { rod: string; phase: FishPhase; charge: number; bobber: { x: number; y: number; z: number } | null } | null;
}

const LANDED_LINES = ['Measured, carded and let go.', 'A quick measure, a card, and back it goes.', 'Carded and slipped back in.'];

export function createFishing(deps: FishingDeps): Fishing {
  registerFishSounds();
  const store: FishStore = createFishStore(deps.storage);
  const shop = createShop(deps.scene);
  const view = createFishView(deps.scene);
  const spots = createSpotView(deps.scene);
  const pose = createFishPose();
  const input = createFishInput();
  const s = createFishingState();

  let seed = 1357911;
  const rnd = (): number => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  let active = false;
  let canFish = false;
  let probeT = 0;
  let toldNoRod = false;
  let px = 0, py = 0, pz = 0;
  let camYaw = 0;
  let onFoot = false;
  let timeLabel: TimeLabel = 'Noon';
  let time = 0;
  let wasHold = false;
  let shownT = 0; // seconds a landed/lost result has been shown
  let released = false; // the landed fish has been let go (splash played)
  let castYaw = 0;
  let derby: { t: number; total: number } | null = null;
  let hint: string | null = null;
  let hintT = 0;
  const tip = new THREE.Vector3();

  const simIn: SimInput = { hold: false, pressed: false, released: false };
  const env: SimEnv = {
    rod: { id: '', name: '', tier: 0, price: 0, prefab: 'fishing-rod', tip: [0, 0.83, -0.068], castRange: 9, strength: 1, reelSpeed: 2.4, blurb: '' },
    bait: BAITS[0],
    origin: { x: 0, y: 0, z: 0, yaw: 0 },
    water: waterSurface,
    snap: () => {
      const h = iceHoleNear(px, pz, ICE_REACH);
      return h ? { x: h.x, z: h.z, surface: h.y } : null;
    },
    biteDelay: () => biteDelay(env.bait, spotAt(s.bobX, s.bobZ) !== null, rnd),
    pick() {
      const water = fishWaterAt(s.bobX, s.bobZ);
      if (!water) return null;
      const region = regionAt(s.bobX, s.bobZ);
      const fish = pickFish({
        water, region, time: timeLabel, weather: weatherAt(region, timeLabel), bait: env.bait, rodTier: env.rod.tier,
        spot: spotAt(s.bobX, s.bobZ),
      }, rnd);
      return fish ? { fish, size: rollSize(fish, rnd) } : null;
    },
    rnd,
  };

  const shopUi = createShopUi(deps.ui, {
    store,
    acorns: () => deps.economy.state().acorns,
    spend: (n, reason) => deps.economy.spend(n, reason),
    earn: (n, reason) => deps.economy.earn(n, reason),
    onSold(count, acorns) {
      play2d('fish-sell');
      deps.hud.toast(`${SHOP.keeper} pays ${acorns} Acorns for ${count} catch card${count === 1 ? '' : 's'}.`, 3500);
      if (count > 0) deps.increment(FISH_ACHIEVEMENTS.cardSharp, count);
    },
    onBought(name) {
      deps.play('shutter');
      deps.hud.toast(`Bought: ${name}. Use {fish} by the water to fish.`, 4500);
    },
    startDerby() {
      if (derby) return false;
      if (!deps.economy.spend(FISH.derbyFee, 'Bent Pin Derby')) return false;
      derby = { t: FISH.derbySeconds, total: 0 };
      deps.hud.callout?.('THE BENT PIN DERBY', `Land ${FISH.derbyTarget} cm of fish in ${FISH.derbySeconds / 60} minutes`);
      return true;
    },
    derbyText: () => derbyLine(),
    play: deps.play,
  });

  const hud = createFishHud(deps.ui, input, () => {
    if (shopUi.isOpen()) shopUi.close();
    else shopUi.open('journal', false);
  });

  function derbyLine(): string | null {
    if (!derby) return null;
    const m = Math.floor(derby.t / 60);
    const sec = Math.floor(derby.t % 60);
    return `Derby ${m}:${sec < 10 ? '0' : ''}${sec} · ${derby.total} / ${FISH.derbyTarget} cm`;
  }

  function say(text: string, seconds = 2.5): void {
    hint = text;
    hintT = seconds;
  }

  function start(): void {
    const rod = store.rod();
    if (!rod) return;
    active = true;
    env.rod = rod;
    env.bait = store.bait();
    pose.setRod(rod);
    resetFishing(s);
    say('Hold to cast, let go to throw. Turn the camera to aim.', 4);
  }

  function stop(): void {
    if (!active) return;
    active = false;
    resetFishing(s);
    view.update(s, 0, 0, 0, false, time, 0);
    view.showCatch(null, 0, 0, 0, 0, 0);
    stopPose = true;
  }
  let stopPose = false;

  function land(fish: FishSpecies, size: number): void {
    const res = store.recordCatch(fish, size);
    const water = fishWaterAt(s.bobX, s.bobZ);
    if (water) deps.onCatch?.(water, fish.id);
    store.useBait();
    env.bait = store.bait();
    deps.unlock(FISH_ACHIEVEMENTS.firstBite);
    if (fish.id === 'fish-old-mossjaw') deps.unlock(FISH_ACHIEVEMENTS.mossjaw);
    if (store.speciesCaught() >= FISH_SPECIES.length) deps.unlock(FISH_ACHIEVEMENTS.everyFin);
    if (res.first) deps.hud.callout?.('NEW IN THE FISHING JOURNAL', fish.name);
    const extra = res.record && !res.first ? ' A new record!' : '';
    const card = res.card ? '' : ` No room for the card (${FISH.cardCap}): sell at ${SHOP.name}.`;
    deps.hud.toast(`${fish.name}, ${size} cm (${catchValue(fish, size)} Acorns a card).${extra} ${LANDED_LINES[Math.floor(rnd() * LANDED_LINES.length)]}${card}`, 4500);
    if (derby) derby.total += size;
    shopUi.refresh();
  }

  function onEvent(e: FishEvent): void {
    const at = { x: s.bobX, z: s.bobZ };
    switch (e) {
      case 'cast': play2d('fish-cast'); break;
      case 'dry': say('Cast onto the water.'); break;
      case 'plop': playAt('fish-plop', at); view.splash(s.bobX, s.surface, s.bobZ, false); break;
      case 'nibble': playAt('fish-nibble', at, { maxDist: 30 }); break;
      case 'bite': playAt('fish-bite', at, { maxDist: 40 }); input.buzz('bite'); say('A bite! Press now!', 1.2); break;
      case 'hooked': play2d('fish-reel'); say('Hold to reel. Let go when the line strains.', 3); break;
      case 'early': say('Nothing on the line yet. Wait for the bobber to dip.'); break;
      case 'missed': say('Missed the bite. Wait for the next one.'); break;
      case 'burst': input.buzz('burst'); playAt('fish-splash', at, { gain: 0.5 }); break;
      case 'landed':
        play2d('fish-land');
        input.buzz('land');
        if (s.fish) land(s.fish, s.size);
        break;
      case 'snapped':
        play2d('fish-snap');
        input.buzz('snap');
        store.useBait();
        env.bait = store.bait();
        say('The clip popped off. The fish swims away, none the worse.', 3);
        break;
      case 'slipped': playAt('fish-splash', at); say('It slipped the clip and swam off.', 3); break;
    }
  }

  function label(phase: FishPhase): string {
    switch (phase) {
      case 'idle': return 'Hold to cast';
      case 'charge': return 'Let go to cast';
      case 'flight': return '...';
      case 'wait': return 'Wait...';
      case 'bite': return 'HOOK!';
      case 'reel': return 'Hold to reel';
      case 'landed': return 'Landed!';
      case 'lost': return 'Lost';
    }
  }

  const hudState: FishHudState = {
    canFish: false, fishing: false, phase: 'idle', charge: 0, tension: 0, progress: 0, label: 'Hold to cast',
    baitName: BAITS[0].name, baitPrefab: BAITS[0].prefab, baitEmoji: BAITS[0].emoji, baitCount: null, hint: null, derby: null,
  };

  function updateHud(paused: boolean): void {
    hud.setHidden(paused);
    const b = store.bait();
    const n = store.baitCount(b.id);
    hudState.canFish = !active && canFish;
    hudState.fishing = active;
    hudState.phase = s.phase;
    hudState.charge = s.charge;
    hudState.tension = s.tension;
    hudState.progress = s.startLine > 0 ? Math.max(0, Math.min(1, 1 - s.line / s.startLine)) : 0;
    hudState.label = label(s.phase);
    hudState.baitName = b.name;
    hudState.baitPrefab = b.prefab;
    hudState.baitEmoji = b.emoji;
    hudState.baitCount = Number.isFinite(n) && b.consumed ? n : null;
    hudState.hint = hintT > 0 ? hint : null;
    hudState.derby = derbyLine();
    hud.update(hudState);
  }

  function stepDerby(dt: number): void {
    if (!derby) return;
    derby.t -= dt;
    if (derby.t > 0) return;
    const total = derby.total;
    derby = null;
    const best = store.recordDerby(total);
    if (total >= FISH.derbyTarget) {
      deps.economy.earn(FISH.derbyPrize, 'Bent Pin Derby');
      deps.unlock(FISH_ACHIEVEMENTS.derby);
      deps.hud.callout?.('DERBY WON', `${total} cm: ${FISH.derbyPrize} Acorns from ${SHOP.keeper}`);
    } else {
      deps.hud.toast(`The derby is over: ${total} of ${FISH.derbyTarget} cm.${best ? ' Your best yet.' : ''} Try again at ${SHOP.name}.`, 5000);
    }
  }

  // Debug trainer: a Fish group on the Spawn tab (bites now while waiting, else records a catch) and a Fishing tab.
  const api: Fishing = {
    boxes: shop.boxes,
    blips: [shop.blip],
    species: FISH_SPECIES,
    active: () => active,
    facing: () => (active && onFoot && (s.phase === 'idle' || s.phase === 'charge') ? camYaw : active && onFoot ? castYaw : null),
    prompt(player) {
      if (player.vehicle || player.airborne || active) return null;
      return shop.nearCounter(player.x, player.z) ? `Talk to ${SHOP.keeper} (${SHOP.name})` : null;
    },
    interact(player) {
      if (player.vehicle || player.airborne || active) return false;
      if (!shop.nearCounter(player.x, player.z)) return false;
      shopUi.open('shop', true);
      return true;
    },
    isOpen: () => shopUi.isOpen(),
    close: () => shopUi.close(),
    stop,
    update(f) {
      time = f.time;
      px = f.playerX; py = f.playerY; pz = f.playerZ;
      camYaw = f.camYaw;
      onFoot = f.onFoot;
      timeLabel = f.timeLabel;
      hintT -= f.dt;
      shop.update(f.dt, px, pz);
      spots.update(px, pz, f.time);
      stepDerby(f.dt);

      const intent = input.read(active);
      // Can fish here? (cheap probe, 4 times a second)
      probeT -= f.dt;
      if (probeT <= 0) {
        probeT = FISH.probeEvery;
        const place = f.inBoat ? f.boatSpeed < FISH.boatMaxSpeed : f.onFoot && nearWater(px, pz, FISH.nearWater);
        canFish = place && store.hasRod();
        if (place && !store.hasRod() && !toldNoRod && f.onFoot && !f.paused) {
          toldNoRod = true;
          deps.hud.toast(`Fancy a fish? ${SHOP.keeper} sells rods at ${SHOP.name}, on the canal by Old Brick wharf.`, 5000);
        }
      }
      // Lost the footing (a cutscene, a car, deep water, the boat moving off): the rod goes away.
      if (active && (f.paused || (!f.onFoot && !f.inBoat) || (f.inBoat && f.boatSpeed > FISH.boatMaxSpeed * 3))) stop();
      if (f.paused) { updateHud(true); return; }

      if (intent.close && active) stop();
      else if (intent.toggle) {
        if (active) stop();
        else if (canFish) start();
        else if (!store.hasRod()) deps.hud.toast(`You need a rod: ${SHOP.name} on the canal sells them.`, 3500);
        else deps.hud.toast(f.inBoat ? 'Stop the boat to fish.' : 'Get closer to the water to fish.', 2500);
      }
      if (active && intent.bait && (s.phase === 'idle' || s.phase === 'wait')) {
        env.bait = store.cycleBait();
        say(`Bait: ${env.bait.name}`, 1.5);
      }

      if (active) {
        const hold = intent.hold || f.fire;
        simIn.hold = hold;
        simIn.pressed = hold && !wasHold;
        simIn.released = !hold && wasHold;
        wasHold = hold;
        env.origin.x = tip.x || px;
        env.origin.y = tip.y || py + 1.4;
        env.origin.z = tip.z || pz;
        env.origin.yaw = camYaw;
        if (s.phase === 'charge') castYaw = camYaw;
        const e = stepFishing(s, simIn, env, f.dt);
        if (e) onEvent(e);
        if (s.phase === 'landed' || s.phase === 'lost') {
          shownT += f.dt;
          if (s.phase === 'landed' && !released && shownT >= FISH.landedShow) {
            released = true;
            view.showCatch(null, 0, 0, 0, 0, 0);
            view.splash(s.bobX, s.surface, s.bobZ, true);
            playAt('fish-splash', { x: s.bobX, z: s.bobZ });
          }
          if (shownT >= (s.phase === 'landed' ? FISH.landedShow + 0.4 : FISH.lostShow)) resetFishing(s);
        } else {
          shownT = 0;
          released = false;
        }
      } else {
        wasHold = false;
      }
      updateHud(false);
    },
    pose(model, dt) {
      if (stopPose) {
        stopPose = false;
        pose.clear(model);
      }
      if (!active) return;
      pose.apply(model, s.phase, s.t, s.charge, dt);
      pose.tip(model, tip);
      view.update(s, tip.x, tip.y, tip.z, true, time, dt);
      if (s.phase === 'landed' && !released && s.fish) {
        // Held up on the line just in front of the rod tip.
        const len = Math.max(0.12, s.size * FISH.unitsPerCm);
        view.showCatch(s.fish.prefab, tip.x, tip.y - len * 0.6, tip.z, castYaw + Math.PI / 2, len);
      }
    },
    catchById(id, size) {
      const fish = fishById(id);
      if (!fish) return false;
      land(fish, Math.round(size ?? (fish.size[0] + fish.size[1]) / 2));
      return true;
    },
    biteNow(id) {
      const fish = fishById(id);
      if (!fish) return false;
      return forceBite(s, fish, rollSize(fish, rnd));
    },
    grantAll() {
      store.grantAll();
      shopUi.refresh();
    },
    lendRod() {
      if (store.hasRod()) return false;
      const ok = store.buyRod('twig', () => true);
      if (ok) shopUi.refresh();
      return ok;
    },
    stats: () => ({
      phase: s.phase, species: store.speciesCaught(), cards: store.data().cards.length, derby: derby !== null,
      tip: [tip.x, tip.y, tip.z], bob: [s.bobX, s.bobZ],
    }),
    wire: () => active ? {
      rod: env.rod.id, phase: s.phase, charge: s.charge,
      bobber: (s.phase === 'wait' || s.phase === 'bite' || s.phase === 'reel') ? { x: s.bobX, y: s.bobY, z: s.bobZ } : null,
    } : null,
  };

  for (const fish of FISH_SPECIES) {
    registerTrainerSpawnable('Fish', fish.id, fish.name, () =>
      api.biteNow(fish.id) ? `${fish.name} bites` : (api.catchById(fish.id), markTrainerModified('fishing'), `${fish.name} landed (journal + card)`));
  }
  registerTrainerSection({
    id: 'fishing', label: 'Fishing', order: 46,
    build(el) {
      const st = status();
      el.append(
        st.el,
        heading('Fishing'),
        note('Spawn > Fish: a fish bites now while your bobber waits, otherwise it is landed straight into the journal.'),
        grid(
          button('Every rod and bait', () => { markTrainerModified('fishing'); api.grantAll(); st.set('Every rod owned, bait stocked'); }),
          button('Land every species', () => { markTrainerModified('fishing'); for (const f of FISH_SPECIES) api.catchById(f.id); st.set('Every species landed'); }),
        ),
      );
    },
  });

  return api;
}
