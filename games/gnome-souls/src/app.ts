// Main Gnome Souls loop: solo or @lawn/mp co-op, achievements, audio, 3D scene, and mobile controls.
import { createAchievementTracker } from '@lawn/achievements';
import { getMyGnome, onLooksChanged, prefetchLooks } from '@lawn/gnome';
import { whileHidden } from '@lawn/mp/background';
import { sfx } from './audio';
import { createInputManager } from './input';
import { mountMobileControls } from './mobile';
import { startOnlineSession, type OnlineSession } from './net/session';
import { SoulsScene } from './scene';
import { EMPTY_INPUT, type PlayerActionInput, type WorldState } from './sim/types';
import { createWorldState, stepWorld } from './sim/world';
import { SoulsUI } from './ui';

export function bootGnomeSouls(): void {
  const canvas = document.getElementById('game') as HTMLCanvasElement;
  const uiParent = document.getElementById('ui') as HTMLElement;
  const params = new URLSearchParams(location.search);

  const achievements = createAchievementTracker({ ui: uiParent });
  const scene = new SoulsScene(canvas);
  const input = createInputManager(canvas);

  let state: WorldState | null = null;
  let session: OnlineSession | null = null;
  let localId = 1;
  let netAccum = 0;
  let victoryDone = false;
  const guestInputs = new Map<number, PlayerActionInput>();
  const startInBoss = params.get('boss') === '1';

  const ui = new SoulsUI(uiParent, {
    onPlaySolo() {
      sfx.unlock();
      startSolo();
    },
    onPlayOnline(roomCode) {
      sfx.unlock();
      startOnline(roomCode);
    },
    onRespawn() {
      // handled automatically in sim
    },
  });

  const mobile = mountMobileControls(uiParent, input.mobile);
  if (params.has('nohud')) {
    ui.root.style.display = 'none';
    mobile.setVisible(false);
  }

  onLooksChanged(() => scene.rebuildPlayerLooks());

  function startSolo(): void {
    const mine = getMyGnome();
    localId = 1;
    victoryDone = false;
    state = createWorldState(
      [{ id: 1, name: mine?.name ?? 'Ashen Gnome', character: mine?.code ?? 'gnorman', color: 0xd93636, userId: mine?.userId }],
      { startInBoss },
    );
    ui.showLobby(false);
    input.setModalOpen(false);
    if (startInBoss) sfx.setBossPhase(1);
  }

  function startOnline(roomCode: string | null): void {
    ui.setStatus('Connecting to culvert relay...');
    session = startOnlineSession(roomCode, {
      onStatus(msg) {
        ui.setStatus(msg);
      },
      onMatchReady(isHost, myId, roster) {
        localId = myId;
        victoryDone = false;
        void prefetchLooks(roster);
        if (isHost) {
          state = createWorldState(
            roster.map((r) => ({ id: r.id, name: r.name, character: r.character, color: r.color, userId: r.userId })),
            { startInBoss },
          );
        } else {
          state = createWorldState(
            roster.map((r) => ({ id: r.id, name: r.name, character: r.character, color: r.color, userId: r.userId })),
            { startInBoss },
          );
        }
        ui.showLobby(false);
        input.setModalOpen(false);
      },
      onRosterChanged(roster) {
        void prefetchLooks(roster);
      },
      onHostTakeover() {
        ui.showBanner('HOST MIGRATED', '#d4b468', 1.8);
      },
      onGuestInput(pid, inp) {
        guestInputs.set(pid, inp);
      },
      onSnapshot(snap) {
        if (!state || session?.isHost()) return;
        state.tick = snap.tick;
        state.time = snap.time;
        state.fogOpen = snap.fogOpen;
        state.victory = snap.victory;
        // Apply player, enemy, and boss snapshots smoothly
        state.players = snap.players.map((sp) => ({
          id: sp.id, name: sp.name, character: sp.character, color: sp.color, userId: sp.userId,
          x: sp.x, y: 0, z: sp.z, vx: 0, vz: 0, facing: sp.facing,
          hp: sp.hp, maxHp: sp.maxHp, stamina: sp.stamina, maxStamina: sp.maxStamina,
          staminaDelay: 0, flasks: sp.flasks, flasksUsed: 0, action: sp.action, actionTimer: sp.actionTimer,
          attackId: sp.attackId, hitIds: [], rollDirX: 0, rollDirZ: -1, sprinting: false,
          guarding: sp.action === 'guard', buffered: null, bufferTimer: 0, respawnTimer: 0,
          deaths: 0, shrineRested: false,
        }));
        for (const se of snap.enemies) {
          const e = state.enemies.find((x) => x.id === se.id);
          if (e) {
            e.x = se.x; e.z = se.z; e.facing = se.facing; e.hp = se.hp; e.state = se.state; e.timer = se.timer;
          }
        }
        state.boss.active = snap.boss.active;
        state.boss.alive = snap.boss.alive;
        state.boss.hp = snap.boss.hp;
        state.boss.maxHp = snap.boss.maxHp;
        state.boss.phase = snap.boss.phase;
        state.boss.attack = snap.boss.attack;
        state.boss.timer = snap.boss.timer;
        state.boss.aimAngle = snap.boss.aimAngle;
        state.boss.segments = snap.boss.segments;
        state.boss.telegraph = snap.boss.telegraph;
      },
      onError(msg) {
        ui.setStatus(msg);
      },
    });
  }

  function processEvents(w: WorldState): void {
    for (const ev of w.events) {
      if (ev.kind === 'swing') sfx.swing();
      else if (ev.kind === 'hit_enemy' || ev.kind === 'hit_boss') {
        sfx.hit();
        scene.addShake(0.14, 0.12);
        scene.addHitstop(0.055);
      } else if (ev.kind === 'poise_break') {
        sfx.poiseBreak();
        scene.addShake(0.28, 0.25);
        scene.addHitstop(0.095);
      } else if (ev.kind === 'roll') sfx.roll();
      else if (ev.kind === 'guard') {
        sfx.guard();
        scene.addShake(0.12, 0.1);
      } else if (ev.kind === 'flask') sfx.flask();
      else if (ev.kind === 'shrine_rest') {
        sfx.shrine();
        ui.showBanner('KILN RESTORED', '#f5b858', 2.2);
        void achievements.unlock('gnome-souls-first-ember');
      } else if (ev.kind === 'fog_gate') {
        sfx.banner();
        sfx.setBossPhase(1);
      } else if (ev.kind === 'phase2') {
        sfx.poiseBreak();
        sfx.setBossPhase(2);
        ui.showBanner('THE VALVE OPENS', '#6be0ff', 2.2);
      } else if (ev.kind === 'boss_whip') sfx.bossWhip();
      else if (ev.kind === 'boss_slam') {
        sfx.bossSlam();
        scene.addShake(0.32, 0.24);
      } else if (ev.kind === 'boss_jet') sfx.bossJet();
      else if (ev.kind === 'player_death' && ev.playerId === localId) {
        sfx.banner();
        sfx.setBossPhase(0);
        ui.showBanner('SHATTERED', '#b82525', 3.4);
      } else if (ev.kind === 'boss_death' && !victoryDone) {
        victoryDone = true;
        sfx.banner();
        sfx.setBossPhase(0);
        ui.showBanner('SPIGOT SEALED', '#f0cf7b', 4.5);
        void achievements.unlock('gnome-souls-slay-slink');
        const me = w.players.find((p) => p.id === localId);
        if (me && me.flasksUsed === 0) void achievements.unlock('gnome-souls-no-flask');
        if (w.players.length > 1) void achievements.unlock('gnome-souls-coop-slay');
      }
    }
  }

  function stepSim(dt: number): void {
    if (!state) return;
    if (input.consumeLockToggle()) {
      scene.toggleLockOn(state, localId);
    }
    const localInp = input.sample();

    if (session && !session.isHost()) {
      netAccum += dt;
      if (netAccum >= 1 / 15) {
        netAccum = 0;
        session.sendInput(localInp);
      }
      return;
    }

    const inputs = state.players.map((p) =>
      p.id === localId ? localInp : guestInputs.get(p.id) ?? EMPTY_INPUT,
    );
    stepWorld(state, inputs, dt);
    processEvents(state);
    sfx.stepMusic(dt);

    if (session && session.isHost()) {
      netAccum += dt;
      if (netAccum >= 1 / 15) {
        netAccum = 0;
        session.broadcastSnapshot(state);
      }
    }
  }

  whileHidden((dt) => stepSim(dt));

  if (params.get('autostart') === 'solo') {
    startSolo();
  } else {
    input.setModalOpen(true);
  }

  let lastTs = performance.now();
  function frame(now: number): void {
    const dt = Math.min(0.05, (now - lastTs) / 1000);
    lastTs = now;
    if (!scene.consumeHitstop(dt)) {
      stepSim(dt);
    }
    if (state) {
      scene.sync(state, localId, input.yaw, input.pitch, dt);
      const lockPos = scene.getLockWorldPos(state);
      const lockScreen = lockPos ? scene.projectToScreen(lockPos) : null;
      const interactLabel = ui.update(state, localId, lockScreen, dt);
      mobile.setInteractVisible(Boolean(interactLabel), interactLabel ?? 'USE');
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
