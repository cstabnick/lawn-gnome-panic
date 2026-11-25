// Main Gnomelock game loop: solo vs bots or @lawn/mp online 2v2, achievements, audio, and 3D scene.
import { createAchievementTracker } from '@lawn/achievements';
import { prefetchLooks } from '@lawn/gnome';
import { whileHidden } from '@lawn/mp/background';
import { sfx } from './audio';
import { createInputManager } from './input';
import { mountMobileControls } from './mobile';
import { playMusicStinger, startBattleMusic, startLobbyMusic } from './music';
import {
  BOT_DIFFICULTY_SKILL,
  buildRosterSlots,
  DEFAULT_BOT_HEROES,
  type BotDifficulty,
  type MatchCustomConfig,
  type TeamMode,
  type WorldSnapshotMsg,
} from './net/protocol';
import { startOnlineSession, type OnlineSession } from './net/session';
import { GnomelockScene } from './scene';
import { computeBotInput } from './sim/bot';
import type { HeroId, Team } from './sim/config';
import { HERO_LIST, HEROES } from './sim/heroes';
import { createMatchState, teamTotalAcorns, tryBuyItem, type HeroActionInput, type MatchState, stepWorld } from './sim/world';
import { GnomelockUI } from './ui';

export function bootGnomelock(): void {
  const canvas = document.getElementById('game') as HTMLCanvasElement;
  const uiParent = document.getElementById('ui') as HTMLElement;
  const params = new URLSearchParams(location.search);

  const achievements = createAchievementTracker({ ui: uiParent });
  const scene = new GnomelockScene(canvas);
  const input = createInputManager(canvas);

  let state: MatchState | null = null;
  let session: OnlineSession | null = null;
  let localSlot = 0;
  let localHero: HeroId = (params.get('hero') as HeroId) || 'bramble';
  if (!HEROES[localHero]) localHero = 'bramble';
  const defaultMode = (params.get('mode') as TeamMode) || 'versus';
  const defaultDiff = (params.get('difficulty') as BotDifficulty) || 'normal';
  const initSkill = BOT_DIFFICULTY_SKILL[defaultDiff] ?? 1.0;
  let activeConfig: MatchCustomConfig = {
    mode: defaultMode === 'coop' || defaultMode === 'custom' ? defaultMode : 'versus',
    difficulty: BOT_DIFFICULTY_SKILL[defaultDiff] ? defaultDiff : 'normal',
    localSlotPref: 0,
    botHeroes: [...DEFAULT_BOT_HEROES],
    botSkills: [initSkill, initSkill, initSkill, initSkill],
  };
  let matchEnded = false;
  let relicClaimedWhileTrailing = false;
  const guestInputs = new Map<number, HeroActionInput>();

  const ui = new GnomelockUI(uiParent, {
    onPlaySolo(hero, config) {
      localHero = hero;
      activeConfig = config;
      startSoloMatch(hero, config);
    },
    onPlayOnline(hero, roomCode, config) {
      localHero = hero;
      activeConfig = config;
      startOnlineMatch(hero, roomCode, config);
    },
    onBuyItem(itemId) {
      if (!state) return;
      if (!session || session.isHost()) {
        if (tryBuyItem(state, localSlot, itemId)) sfx.buy();
      } else {
        session.sendBuy(itemId);
        sfx.buy();
      }
    },
    onShopToggle(open) {
      input.setModalOpen(open);
    },
    onPlayAgain() {
      session?.close();
      session = null;
      state = null;
      matchEnded = false;
      ui.showLobby(true);
      input.setModalOpen(true);
      startLobbyMusic();
    },
  });

  const mobile = mountMobileControls(uiParent, input.mobile, () => {
    ui.toggleShop();
  });
  if (params.has('nohud')) {
    ui.root.style.display = 'none';
    mobile.setVisible(false);
  }

  input.setHandlers(
    () => {
      if (state && !matchEnded) ui.toggleShop();
    },
    (open) => ui.setScoreboardVisible(open, state),
  );

  function startSoloMatch(hero: HeroId, config: MatchCustomConfig = activeConfig): void {
    matchEnded = false;
    relicClaimedWhileTrailing = false;
    localSlot = config.mode === 'custom' ? config.localSlotPref : 0;
    const slots = [0, 1, 2, 3].map((slot) => {
      if (slot === localSlot) {
        return { heroId: hero, name: 'You', isBot: false };
      }
      const bh = config.botHeroes[slot] ?? DEFAULT_BOT_HEROES[slot];
      return { heroId: bh, name: `${HEROES[bh].name} Bot`, isBot: true };
    });
    state = createMatchState(slots);
    input.setYaw(state.heroes[localSlot].yaw);
    input.setModalOpen(false);
    ui.showLobby(false);
    mobile.setHeroIcons(hero);
    beginBattleMusic();
  }

  function beginBattleMusic(): void {
    startBattleMusic({
      lead: () => {
        if (!state) return null;
        const a0 = teamTotalAcorns(state, 0);
        const a1 = teamTotalAcorns(state, 1);
        if (Math.abs(a0 - a1) < 150) return null;
        return a0 > a1 ? 0 : 1;
      },
      intensity: () => {
        if (!state) return 0.2;
        const h = state.heroes[localSlot];
        if (!h) return 0.2;
        let v = 0.22 + h.move.flowTier * 0.14;
        if (h.move.outOfCombatTimer < 3.5) v += 0.35;
        if (state.relic.alive) v += 0.25;
        return Math.min(1, v);
      },
      combine: () => Boolean(state && (state.relic.alive || state.timeS >= 480)),
    });
  }

  function startOnlineMatch(hero: HeroId, roomCode: string | null, config: MatchCustomConfig = activeConfig): void {
    ui.setStatus('Connecting...');
    session?.close();
    session = startOnlineSession(roomCode, hero, config, params.get('mp') ?? undefined, {
      onStatus: (msg) => ui.setStatus(msg),
      onMatchReady: (isHost, players) => {
        void prefetchLooks(players);
        matchEnded = false;
        relicClaimedWhileTrailing = false;
        const built = buildRosterSlots(players, {
          mode: config.mode,
          picks: session!.picks,
          slotPrefs: session!.slotPrefs,
          botHeroes: config.botHeroes,
          botSkills: config.botSkills,
          localHeroId: localHero,
          localId: session!.myId(),
        });
        localSlot = built.slotForPlayerId.get(session!.myId()) ?? 0;
        if (isHost) {
          state = createMatchState(built.slots);
          input.setYaw(state.heroes[localSlot].yaw);
        }
        input.setModalOpen(false);
        ui.showLobby(false);
        mobile.setHeroIcons(localHero);
        beginBattleMusic();
      },
      onRosterChanged: (players) => {
        void prefetchLooks(players);
      },
      onHostTakeover: () => {
        // Current state continues smoothly if host drops
      },
      onGuestInput: (playerId, inp) => {
        guestInputs.set(playerId, inp);
      },
      onGuestBuy: (playerId, itemId) => {
        if (!state || !session) return;
        const slot = session.slotForPlayerId().get(playerId);
        if (slot !== undefined) tryBuyItem(state, slot, itemId);
      },
      onSnapshot: (snap) => {
        if (session?.isHost()) return;
        applySnapshot(snap);
      },
      onError: (msg) => ui.setStatus(msg),
    });
  }

  function applySnapshot(snap: WorldSnapshotMsg): void {
    if (!state) {
      state = createMatchState(
        snap.heroes.map((h) => ({
          heroId: h.heroId,
          name: h.name,
          isBot: h.isBot,
          userId: h.userId,
          characterCode: h.characterCode,
        })),
      );
    }
    state.timeS = snap.timeS;
    state.winner = snap.winner;
    state.relic.spawned = snap.relicSpawned;
    state.relic.alive = snap.relicAlive;
    state.relic.hp = snap.relicHp;
    state.relic.claimedByTeam = snap.relicClaimedBy;

    for (const sh of snap.heroes) {
      const h = state.heroes[sh.slot];
      if (!h) continue;
      h.userId = sh.userId;
      h.characterCode = sh.characterCode;
      h.move.pos.x = sh.x;
      h.move.pos.y = sh.y;
      h.move.pos.z = sh.z;
      h.move.vel.x = sh.vx;
      h.move.vel.y = sh.vy;
      h.move.vel.z = sh.vz;
      if (sh.slot !== localSlot) {
        h.yaw = sh.yaw;
        h.pitch = sh.pitch;
      }
      h.hp = sh.hp;
      h.maxHp = sh.maxHp;
      h.shield = sh.shield;
      h.alive = sh.alive;
      h.respawnTimer = sh.respawnTimer;
      h.acorns = sh.acorns;
      h.totalAcorns = sh.totalAcorns;
      h.level = sh.level;
      h.kills = sh.kills;
      h.deaths = sh.deaths;
      h.lastHits = sh.lastHits;
      h.orbsConfirmed = sh.orbsConfirmed;
      h.orbsDenied = sh.orbsDenied;
      h.move.stamina = sh.stamina;
      h.move.maxStamina = sh.maxStamina;
      h.move.flowTier = sh.flowTier;
      h.move.sliding = sh.sliding;
      h.move.flipTimer = sh.flipTimer;
      h.ammo = sh.ammo;
      h.cooldowns = { ...sh.cooldowns };
      h.items = [...sh.items];
    }

    state.creeps = snap.creeps.map((c) => ({
      ...c,
      damage: 0,
      range: 0,
      fireCooldown: 0,
      bounty: 0,
      lastDamagedBySlot: -1,
    }));
    state.neutrals = snap.neutrals.map((n) => ({
      ...n,
      homeX: n.x,
      homeZ: n.z,
      damage: 0,
      bounty: 0,
      aggroSlot: -1,
      fireCooldown: 0,
    }));
    state.orbs = snap.orbs.map((o) => ({ ...o, acorns: 0, ttl: 1, ageS: 0 }));
    for (const ss of snap.structures) {
      const st = state.structures.find((x) => x.id === ss.id);
      if (st) {
        st.hp = ss.hp;
        st.invulnerable = ss.invulnerable;
        st.targetId = ss.targetId;
      }
    }
  }

  function processEvents(st: MatchState): void {
    scene.spawnEvents(st.events, st);
    const localTeam: Team = st.heroes[localSlot]?.team ?? 0;

    for (const ev of st.events) {
      if (ev.type === 'shot' && ev.slot === localSlot) {
        sfx.shoot(st.heroes[localSlot].heroId, st.heroes[localSlot].infiniteAmmoTimer > 0);
        ui.triggerCrosshairBloom();
        if (ev.hitKind === 'body') ui.flashHitmarker('#ffffff');
        else if (ev.hitKind === 'orb-confirm') ui.flashHitmarker('#ffd54f', true);
        else if (ev.hitKind === 'orb-deny') ui.flashHitmarker('#ff4d6d', true);
      } else if (ev.type === 'lastHit' && ev.slot === localSlot) {
        sfx.lastHit();
        ui.flashHitmarker('#ffd54f', true);
        ui.spawnPopup(`LAST HIT +${ev.acorns}g`, ev.x, ev.y + 0.55, ev.z, '#ffd54f', { big: true });
      } else if (ev.type === 'orbConfirm' && ev.slot === localSlot) {
        sfx.orbConfirm();
        ui.spawnPopup(`+${ev.acorns} SECURED!`, ev.x, ev.y, ev.z, '#ffd54f', { big: true });
        void achievements.increment('gnomelock-orb-snatcher');
      } else if (ev.type === 'orbDeny' && ev.slot === localSlot) {
        sfx.orbDeny();
        ui.spawnPopup(`+${ev.acorns} DENIED!`, ev.x, ev.y, ev.z, '#ff4d6d', { big: true });
        void achievements.increment('gnomelock-orb-snatcher');
      } else if (ev.type === 'damage' && ev.sourceSlot === localSlot) {
        if (ev.targetKind === 'hero') sfx.hitBody();
        ui.spawnPopup(`${ev.amount}`, ev.x, ev.y, ev.z, '#ffffff');
      } else if (ev.type === 'flowTier3' && ev.slot === localSlot) {
        sfx.flowTier3();
        ui.pushFeed('FLOW TIER 3 — +25% DMG / +20% RATE!', '#74b9ff');
        void achievements.unlock('gnomelock-flow-state');
      } else if (ev.type === 'dashJump' && ev.slot === localSlot) {
        sfx.dashJump();
        ui.pushFeed('DASH-JUMP! (+Stamina)', '#74b9ff');
      } else if (ev.type === 'moveTech' && ev.slot === localSlot) {
        if (ev.kind === 'jump') sfx.jump();
        else if (ev.kind === 'doubleJump') sfx.doubleJump();
        else if (ev.kind === 'wallJump') {
          sfx.wallJump();
          ui.pushFeed('WALL JUMP! (2x Jump Reset)', '#8ce99a');
        } else if (ev.kind === 'dash') sfx.dash();
        else if (ev.kind === 'slide') sfx.slide();
      } else if (ev.type === 'ability' && ev.slot === localSlot) {
        sfx.ability(st.heroes[localSlot].heroId, ev.ability);
      } else if (ev.type === 'heroKill') {
        if (ev.killerSlot === localSlot) {
          sfx.kill();
          playMusicStinger(true);
          ui.spawnPopup('SHATTERED!', ev.x, ev.y + 1.1, ev.z, '#ffd54f', { big: true });
        } else if (ev.victimSlot === localSlot) {
          playMusicStinger(false);
        }
        const kName = ev.killerSlot >= 0 ? st.heroes[ev.killerSlot]?.name : 'Tower';
        const vName = st.heroes[ev.victimSlot]?.name ?? 'Gnome';
        ui.pushFeed(`${kName} shattered ${vName}`, '#ffd54f');
      } else if (ev.type === 'towerDown') {
        sfx.towerDown();
        playMusicStinger(ev.team !== localTeam);
        ui.pushFeed(`${ev.team === 0 ? 'Amber' : 'Sapphire'} T${ev.tier} Tower fell!`, '#ffa94d');
        if (ev.killerSlot === localSlot) void achievements.increment('gnomelock-tower-breaker');
      } else if (ev.type === 'relicSpawn') {
        sfx.relicSpawn();
        ui.pushFeed('5:00 GILDED RELIC SPAWNED IN COURTYARD!', '#ffd54f');
      } else if (ev.type === 'relicClaimed') {
        sfx.relicSpawn();
        playMusicStinger(ev.team === localTeam);
        ui.pushFeed(`${ev.team === 0 ? 'Amber' : 'Sapphire'} claimed the Gilded Relic!`, '#ffd54f');
        if (ev.team === localTeam) {
          const otherTeam: Team = localTeam === 0 ? 1 : 0;
          if (teamTotalAcorns(st, localTeam) < teamTotalAcorns(st, otherTeam)) {
            relicClaimedWhileTrailing = true;
          }
        }
      }
    }
  }

  let netSendAccum = 0;
  function stepSim(dt: number): void {
    if (!state || matchEnded) return;
    const localInp = input.sample();

    if (session && !session.isHost()) {
      netSendAccum += dt;
      if (netSendAccum >= 1 / 15) {
        netSendAccum = 0;
        session.sendInput(localInp);
      }
      return;
    }

    const slotMap = session?.slotForPlayerId();
    const actions: HeroActionInput[] = state.heroes.map((h, idx) => {
      const botSkill = activeConfig.botSkills[idx] ?? 1.0;
      if (idx === localSlot) return localInp;
      if (h.isBot) return computeBotInput(state!, idx, { skill: botSkill });
      if (slotMap) {
        for (const [pid, sIdx] of slotMap) {
          if (sIdx === idx) {
            return guestInputs.get(pid) ?? computeBotInput(state!, idx, { skill: botSkill });
          }
        }
      }
      return computeBotInput(state!, idx, { skill: botSkill });
    });

    stepWorld(state, actions, dt);
    processEvents(state);

    if (session && session.isHost()) {
      netSendAccum += dt;
      if (netSendAccum >= 1 / 15) {
        netSendAccum = 0;
        session.broadcastSnapshot(state);
      }
    }

    if (state.winner !== null && !matchEnded) {
      matchEnded = true;
      const localTeam = state.heroes[localSlot].team;
      sfx.win(state.winner === localTeam);
      ui.showEndScreen(state.winner, localTeam, state);
      input.setModalOpen(true);
      if (state.winner === localTeam) {
        void achievements.unlock('gnomelock-first-win');
        if (relicClaimedWhileTrailing) void achievements.unlock('gnomelock-comeback');
      }
    }
  }

  whileHidden((dt) => {
    stepSim(dt);
  });

  if (params.get('autostart') === 'solo') {
    startSoloMatch(localHero);
  } else {
    input.setModalOpen(true);
    startLobbyMusic();
  }

  let lastTs = performance.now();
  function frame(now: number): void {
    const dt = Math.min(0.05, (now - lastTs) / 1000);
    lastTs = now;
    stepSim(dt);
    if (state) {
      scene.sync(state, localSlot, input.isAds(), dt);
      ui.setAds(input.isAds());
      ui.update(state, localSlot, (x, y, z) => scene.projectToScreen(x, y, z), dt);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
