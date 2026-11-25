// Main Gnomelock game loop: solo skirmish or @lawn/mp online Lobby Creator, achievements, audio, and 3D scene.
import { createAchievementTracker } from '@lawn/achievements';
import { getMyGnome, prefetchLooks } from '@lawn/gnome';
import { whileHidden } from '@lawn/mp/background';
import { sfx } from './audio';
import { createInputManager } from './input';
import { mountMobileControls } from './mobile';
import { playMusicStinger, startBattleMusic, startLobbyMusic } from './music';
import {
  addHumanToLobby,
  clearAllBots,
  clearSlotBot,
  createLobbyState,
  fillEmptyWithBots,
  generateRoomCode,
  lobbyToMatchSlots,
  moveHumanToSlot,
  removeHumanFromLobby,
  setHumanHero,
  setLobbyDifficulty,
  setSlotBot,
  swapHumanTeam,
  type LobbyState,
} from './net/lobby';
import {
  BOT_DIFFICULTY_SKILL,
  type BotDifficulty,
  type WorldSnapshotMsg,
} from './net/protocol';
import { startOnlineSession, type OnlineSession } from './net/session';
import { GnomelockScene } from './scene';
import { computeBotInput } from './sim/bot';
import type { HeroId, Team } from './sim/config';
import { HEROES } from './sim/heroes';
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
  let lobby: LobbyState | null = null;
  let localSlot = 0;
  let localPlayerId = 0;
  let localHero: HeroId = (params.get('hero') as HeroId) || 'bramble';
  if (!HEROES[localHero]) localHero = 'bramble';
  const rawDiff = (params.get('difficulty') as BotDifficulty) || 'normal';
  const defaultDiff: BotDifficulty = BOT_DIFFICULTY_SKILL[rawDiff] ? rawDiff : 'normal';
  const initSkill = BOT_DIFFICULTY_SKILL[defaultDiff];
  let activeBotSkills: [number, number, number, number] = [initSkill, initSkill, initSkill, initSkill];
  let activeSlotForPlayerId = new Map<number, number>();
  let matchEnded = false;
  let relicClaimedWhileTrailing = false;
  const guestInputs = new Map<number, HeroActionInput>();

  function isHostOrOffline(): boolean {
    return !lobby || !lobby.isOnline || lobby.hostId === localPlayerId;
  }

  function syncLobbyBroadcast(statusMsg?: string): void {
    if (lobby && lobby.isOnline && session?.isHost()) {
      session.sendLobbyState(lobby);
    }
    ui.renderLobby(lobby, localPlayerId, localHero, statusMsg);
  }

  function leaveToTitle(): void {
    session?.close();
    session = null;
    lobby = null;
    state = null;
    matchEnded = false;
    guestInputs.clear();
    activeSlotForPlayerId.clear();
    ui.setStatus('');
    ui.showScreen('title');
    input.setModalOpen(true);
    startLobbyMusic();
  }

  function openSoloLobby(): void {
    session?.close();
    session = null;
    guestInputs.clear();
    const mine = getMyGnome();
    localPlayerId = 0;
    lobby = createLobbyState({
      isOnline: false,
      roomCode: null,
      hostPlayer: {
        id: 0,
        name: mine?.name ?? 'You',
        character: mine?.code ?? 'gnorman',
        color: 0xffd54f,
        userId: mine?.userId,
      },
      hostHero: localHero,
      difficulty: defaultDiff,
      fillBots: true,
    });
    ui.showScreen('lobby');
    ui.renderLobby(lobby, localPlayerId, localHero, '');
  }

  function openOnlineLobby(roomCode: string | null): void {
    session?.close();
    lobby = null;
    state = null;
    matchEnded = false;
    localPlayerId = -1;
    guestInputs.clear();
    ui.setStatus(roomCode ? `Connecting to room ${roomCode}...` : 'Connecting to public lobby...');

    session = startOnlineSession(roomCode, params.get('mp') ?? undefined, {
      onStatus: (msg) => ui.setStatus(msg),
      onMatchReady: (isHost, players) => {
        void prefetchLooks(players);
        localPlayerId = session!.myId();
        matchEnded = false;
        relicClaimedWhileTrailing = false;
        if (isHost) {
          const hostPlayer = players.find((p) => p.id === localPlayerId) ?? players[0];
          lobby = createLobbyState({
            isOnline: true,
            roomCode,
            hostPlayer,
            hostHero: localHero,
            difficulty: defaultDiff,
            fillBots: false,
          });
          for (const p of players) {
            if (p.id !== hostPlayer.id) addHumanToLobby(lobby, p);
          }
          ui.showScreen('lobby');
          syncLobbyBroadcast('');
        } else {
          ui.showScreen('lobby');
          ui.renderLobby(null, localPlayerId, localHero, 'Syncing lobby from host...');
          session!.sendPick(localHero);
        }
      },
      onPlayerJoined: (player) => {
        void prefetchLooks([player]);
        if (!session?.isHost() || !lobby) return;
        const assignedSlot = addHumanToLobby(lobby, player);
        if (lobby.started && state && assignedSlot >= 0) {
          const h = state.heroes[assignedSlot];
          const s = lobby.slots[assignedSlot];
          if (h && s) {
            h.isBot = false;
            h.name = player.name;
            h.userId = player.userId;
            h.characterCode = player.character;
            h.heroId = s.heroId;
            activeSlotForPlayerId.set(player.id, assignedSlot);
          }
          const built = lobbyToMatchSlots(lobby);
          session.sendLobbyState(lobby);
          session.sendStartMatch(built.slots, built.botSkills, [...built.slotForPlayerId.entries()]);
        } else {
          syncLobbyBroadcast();
        }
      },
      onPlayerLeft: (playerId) => {
        if (!session?.isHost() || !lobby) return;
        const freedSlot = removeHumanFromLobby(lobby, playerId);
        activeSlotForPlayerId.delete(playerId);
        guestInputs.delete(playerId);
        if (lobby.started && state && freedSlot >= 0 && state.heroes[freedSlot]) {
          state.heroes[freedSlot].isBot = true;
        }
        session.sendLobbyState(lobby);
        if (!lobby.started) {
          ui.renderLobby(lobby, localPlayerId, localHero);
        }
      },
      onHostTakeover: (newHostId) => {
        if (session?.isHost() && lobby) {
          lobby.hostId = newHostId;
          syncLobbyBroadcast('You are now the host');
        }
      },
      onHeroPick: (playerId, heroId) => {
        if (!session?.isHost() || !lobby) return;
        if (setHumanHero(lobby, playerId, heroId)) {
          session.sendLobbyState(lobby);
          if (!lobby.started) ui.renderLobby(lobby, localPlayerId, localHero);
        }
      },
      onClaimSlot: (playerId, slot) => {
        if (!session?.isHost() || !lobby) return;
        if (moveHumanToSlot(lobby, playerId, slot)) {
          session.sendLobbyState(lobby);
          if (!lobby.started) ui.renderLobby(lobby, localPlayerId, localHero);
        }
      },
      onLobbyState: (nextLobby) => {
        if (session?.isHost()) return;
        lobby = nextLobby;
        if (!nextLobby.started && state) {
          state = null;
          matchEnded = false;
          ui.showScreen('lobby');
          input.setModalOpen(true);
          startLobbyMusic();
        }
        if (!nextLobby.started) {
          ui.renderLobby(lobby, localPlayerId, localHero, '');
        }
      },
      onStartMatch: (msg) => {
        if (session?.isHost()) return;
        matchEnded = false;
        relicClaimedWhileTrailing = false;
        activeBotSkills = msg.botSkills;
        activeSlotForPlayerId = new Map(msg.slotForPlayerId);
        localSlot = activeSlotForPlayerId.get(session!.myId()) ?? 0;
        state = createMatchState(msg.slots);
        input.setYaw(state.heroes[localSlot].yaw);
        input.setModalOpen(false);
        ui.showScreen('hud');
        mobile.setHeroIcons(state.heroes[localSlot].heroId);
        beginBattleMusic();
      },
      onGuestInput: (playerId, inp) => {
        guestInputs.set(playerId, inp);
      },
      onGuestBuy: (playerId, itemId) => {
        if (!state || !session) return;
        const slot = activeSlotForPlayerId.get(playerId);
        if (slot !== undefined) tryBuyItem(state, slot, itemId);
      },
      onSnapshot: (snap) => {
        if (session?.isHost()) return;
        applySnapshot(snap);
      },
      onError: (msg) => ui.setStatus(msg),
    });
  }

  function launchFromLobby(): void {
    if (!lobby) return;
    const built = lobbyToMatchSlots(lobby);
    lobby.started = true;
    matchEnded = false;
    relicClaimedWhileTrailing = false;
    activeBotSkills = built.botSkills;
    activeSlotForPlayerId = built.slotForPlayerId;
    localSlot = activeSlotForPlayerId.get(localPlayerId) ?? 0;
    state = createMatchState(built.slots);
    input.setYaw(state.heroes[localSlot].yaw);
    input.setModalOpen(false);
    ui.showScreen('hud');
    mobile.setHeroIcons(state.heroes[localSlot].heroId);
    if (session && session.isHost()) {
      session.sendLobbyState(lobby);
      session.sendStartMatch(built.slots, built.botSkills, [...built.slotForPlayerId.entries()]);
    }
    beginBattleMusic();
  }

  const ui = new GnomelockUI(uiParent, {
    onCreatePrivateLobby() {
      openOnlineLobby(generateRoomCode());
    },
    onQuickPlayOnline() {
      openOnlineLobby(null);
    },
    onJoinCode(roomCode) {
      openOnlineLobby(roomCode);
    },
    onOpenSoloLobby() {
      openSoloLobby();
    },
    onLeaveLobby() {
      leaveToTitle();
    },
    onPickHero(heroId) {
      localHero = heroId;
      if (lobby && isHostOrOffline()) {
        setHumanHero(lobby, localPlayerId, heroId);
        syncLobbyBroadcast();
      } else if (session) {
        session.sendPick(heroId);
        ui.renderLobby(lobby, localPlayerId, localHero);
      }
    },
    onClaimSlot(slot) {
      if (lobby && isHostOrOffline()) {
        moveHumanToSlot(lobby, localPlayerId, slot);
        syncLobbyBroadcast();
      } else if (session) {
        session.sendClaimSlot(slot);
      }
    },
    onSwapTeam() {
      if (lobby && isHostOrOffline()) {
        swapHumanTeam(lobby, localPlayerId);
        syncLobbyBroadcast();
      } else if (session && lobby) {
        const cur = lobby.slots.find((s) => s.kind === 'human' && s.playerId === localPlayerId);
        if (!cur) return;
        const targets = cur.team === 0 ? [2, 3] : [0, 1];
        const dest = targets.find((i) => lobby!.slots[i].kind !== 'human');
        if (dest !== undefined) session.sendClaimSlot(dest);
      }
    },
    onAddBot(slot) {
      if (!lobby || !isHostOrOffline()) return;
      setSlotBot(lobby, slot);
      syncLobbyBroadcast();
    },
    onRemoveBot(slot) {
      if (!lobby || !isHostOrOffline()) return;
      clearSlotBot(lobby, slot);
      syncLobbyBroadcast();
    },
    onSetBotHero(slot, heroId) {
      if (!lobby || !isHostOrOffline()) return;
      setSlotBot(lobby, slot, heroId);
      syncLobbyBroadcast();
    },
    onSetBotSkill(slot, skill) {
      if (!lobby || !isHostOrOffline()) return;
      setSlotBot(lobby, slot, undefined, skill);
      syncLobbyBroadcast();
    },
    onFillBots() {
      if (!lobby || !isHostOrOffline()) return;
      fillEmptyWithBots(lobby);
      syncLobbyBroadcast();
    },
    onClearBots() {
      if (!lobby || !isHostOrOffline()) return;
      clearAllBots(lobby);
      syncLobbyBroadcast();
    },
    onSetDifficulty(difficulty) {
      if (!lobby || !isHostOrOffline()) return;
      setLobbyDifficulty(lobby, difficulty);
      syncLobbyBroadcast();
    },
    onStartMatch() {
      if (!lobby || !isHostOrOffline()) return;
      launchFromLobby();
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
    onReturnToLobby() {
      if (!lobby) {
        leaveToTitle();
        return;
      }
      if (isHostOrOffline()) {
        lobby.started = false;
        state = null;
        matchEnded = false;
        ui.showScreen('lobby');
        input.setModalOpen(true);
        syncLobbyBroadcast('');
        startLobbyMusic();
      } else {
        // Guests wait for host or can click Leave on lobby/title
        leaveToTitle();
      }
    },
    onPlayAgain() {
      leaveToTitle();
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

    const actions: HeroActionInput[] = state.heroes.map((h, idx) => {
      const botSkill = activeBotSkills[idx] ?? 1.0;
      if (idx === localSlot) return localInp;
      if (h.isBot) return computeBotInput(state!, idx, { skill: botSkill });
      for (const [pid, sIdx] of activeSlotForPlayerId) {
        if (sIdx === idx) {
          return guestInputs.get(pid) ?? computeBotInput(state!, idx, { skill: botSkill });
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
    openSoloLobby();
    launchFromLobby();
  } else if (params.get('room')) {
    openOnlineLobby(params.get('room')!.trim().toUpperCase());
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
