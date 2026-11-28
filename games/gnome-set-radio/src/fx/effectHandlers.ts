import type { GsrSfx } from '../audio/sfx';
import type { SkaterState, TrickAnimKind } from '../sim/skater';
import type { HudHandle } from '../ui/hud';
import type { ChaseCamera } from '../view/camera';
import type { GsrFx } from '../view/fx';
import type { RiderView } from '../view/rider';

export type GameEffectEvent =
  | { type: 'jump' }
  | { type: 'airJump'; x: number; y: number; z: number }
  | { type: 'airDash'; x: number; y: number; z: number }
  | { type: 'wallKick'; x: number; y: number; z: number }
  | { type: 'onBeat' }
  | { type: 'land'; x: number; y: number; z: number; impact: number }
  | { type: 'grindStart' }
  | { type: 'wallRideStart' }
  | { type: 'boostStart' }
  | { type: 'bump' }
  | { type: 'trick'; name: string; anim: TrickAnimKind | null; mult: number; x: number; y: number; z: number; color: string; skipAnim?: boolean; onBeat?: boolean }
  | { type: 'bankScore'; points: number }
  | { type: 'spray'; isTarget: boolean; x: number; y: number; z: number; color: string; count?: number; celebrate?: boolean; shake?: number; shakeDur?: number }
  | { type: 'tagSwitch' }
  | { type: 'bounce'; kind: 'bongo-pad' | 'updraft-vent' | 'hydrant'; x: number; y: number; z: number; color: string }
  | { type: 'pickup'; kind: 'spray-pickup' | 'tempo-acorn' | 'aerial-ring' }
  | { type: 'eventComplete' }
  | { type: 'bossUnlock' }
  | { type: 'bossHit'; x: number; y: number; z: number }
  | { type: 'levelClear' };

export interface GameEffectTickState {
  skater: SkaterState;
  beatPulse: number;
  playing: boolean;
}

export interface TimedGameEffect {
  id: string;
  duration: number;
  elapsed: number;
  onTick(dt: number, progress: number): void;
  onDone?(): void;
}

export interface GameEffectHandler {
  readonly id: string;
  onEvent?(event: GameEffectEvent): void;
  onTick?(dt: number, state: GameEffectTickState): void;
}

export interface GameEffectDispatcher {
  readonly handlers: readonly GameEffectHandler[];
  emit(event: GameEffectEvent): void;
  schedule(effect: Omit<TimedGameEffect, 'elapsed'>): void;
  tick(dt: number, state: GameEffectTickState): void;
  add(handler: GameEffectHandler): void;
}

export function createGameEffectDispatcher(initial: GameEffectHandler[] = []): GameEffectDispatcher {
  const handlers: GameEffectHandler[] = [...initial];
  const timed: TimedGameEffect[] = [];

  return {
    get handlers() {
      return handlers;
    },
    emit(event) {
      for (const h of handlers) h.onEvent?.(event);
    },
    schedule(effect) {
      timed.push({ ...effect, elapsed: 0 });
    },
    tick(dt, state) {
      for (const h of handlers) h.onTick?.(dt, state);
      for (let i = timed.length - 1; i >= 0; i--) {
        const eff = timed[i]!;
        eff.elapsed += dt;
        const progress = eff.duration > 0 ? Math.min(1, eff.elapsed / eff.duration) : 1;
        eff.onTick(dt, progress);
        if (eff.elapsed >= eff.duration) {
          eff.onDone?.();
          timed.splice(i, 1);
        }
      }
    },
    add(handler) {
      handlers.push(handler);
    },
  };
}

export function createAudioEffectHandler(sfx: GsrSfx): GameEffectHandler {
  return {
    id: 'audio-sfx',
    onTick(dt, state) {
      if (state.playing) sfx.update(state.skater, dt);
      else sfx.silence();
    },
    onEvent(ev) {
      switch (ev.type) {
        case 'jump': sfx.jump(); break;
        case 'airJump': sfx.airJump(); break;
        case 'airDash': sfx.airDash(); break;
        case 'wallKick': sfx.wallKick(); break;
        case 'onBeat': sfx.onBeat(); break;
        case 'land': sfx.land(ev.impact); break;
        case 'grindStart': sfx.grindStart(); break;
        case 'wallRideStart': sfx.wallRideStart(); break;
        case 'boostStart': sfx.boostStart(); break;
        case 'bump': sfx.bump(); break;
        case 'trick': sfx.trick(ev.mult); break;
        case 'bankScore': sfx.bankScore(ev.points); break;
        case 'spray': sfx.spray(ev.isTarget); break;
        case 'tagSwitch': sfx.tagSwitch(); break;
        case 'bounce': sfx.bounce(ev.kind); break;
        case 'pickup': sfx.pickup(ev.kind); break;
        case 'eventComplete': sfx.eventComplete(); break;
        case 'bossUnlock': sfx.bossUnlock(); break;
        case 'bossHit': sfx.bossHit(); break;
        case 'levelClear': sfx.levelClear(); break;
      }
    },
  };
}

export function createCameraEffectHandler(chaseCam: ChaseCamera): GameEffectHandler {
  return {
    id: 'camera-juice',
    onEvent(ev) {
      switch (ev.type) {
        case 'airJump':
          chaseCam.shake(0.14, 0.14);
          chaseCam.fovPunch(2.5);
          break;
        case 'airDash':
          chaseCam.shake(0.18, 0.16);
          chaseCam.fovPunch(4.5);
          break;
        case 'wallKick':
          chaseCam.shake(0.16, 0.14);
          chaseCam.fovPunch(3.0);
          break;
        case 'land':
          chaseCam.shake(Math.min(0.32, ev.impact * 0.015), 0.16);
          break;
        case 'grindStart':
          chaseCam.shake(0.16, 0.14);
          break;
        case 'boostStart':
          chaseCam.fovPunch(3.5);
          break;
        case 'bump':
          chaseCam.shake(0.18, 0.16);
          break;
        case 'trick':
          chaseCam.shake(0.1, 0.12);
          break;
        case 'bankScore':
          if (ev.points >= 1200) chaseCam.shake(0.26, 0.25);
          break;
        case 'spray':
          chaseCam.shake(ev.shake ?? (ev.isTarget ? 0.22 : 0.08), ev.shakeDur ?? (ev.isTarget ? 0.2 : 0.1));
          break;
        case 'bounce':
          chaseCam.shake(0.2, 0.18);
          chaseCam.fovPunch(3);
          break;
        case 'pickup':
          if (ev.kind === 'aerial-ring') chaseCam.fovPunch(2.5);
          break;
        case 'bossUnlock':
          chaseCam.shake(0.35, 0.3);
          chaseCam.fovPunch(4);
          break;
        case 'bossHit':
          chaseCam.shake(0.32, 0.24);
          chaseCam.fovPunch(3.5);
          break;
        case 'levelClear':
          chaseCam.shake(0.4, 0.35);
          break;
      }
    },
  };
}

export function createVisualFxEffectHandler(fx: GsrFx): GameEffectHandler {
  return {
    id: 'visual-fx',
    onEvent(ev) {
      switch (ev.type) {
        case 'airJump':
          fx.burst(ev.x, ev.y, ev.z, '#00e5ff', 18);
          fx.ring(ev.x, ev.y, ev.z, '#ff4ecd');
          break;
        case 'airDash': {
          const dashCol = fx.getTrailColor?.() ?? '#ff4ecd';
          fx.burst(ev.x, ev.y, ev.z, dashCol, 22);
          fx.ring(ev.x, ev.y, ev.z, '#00e5ff');
          break;
        }
        case 'wallKick':
          fx.burst(ev.x, ev.y, ev.z, '#69f0ae', 16);
          fx.ring(ev.x, ev.y, ev.z, '#00e5ff');
          break;
        case 'bossHit':
          fx.burst(ev.x, ev.y, ev.z, '#ffd740', 30);
          fx.ring(ev.x, ev.y, ev.z, '#ff4ecd');
          fx.flash('#ffd740', 0.24, 0.22);
          break;
        case 'land':
          fx.ring(ev.x, ev.y, ev.z, '#69f0ae');
          break;
        case 'trick':
          fx.ring(ev.x, ev.y, ev.z, ev.color);
          break;
        case 'bankScore':
          if (ev.points >= 1200) fx.flash('#ffd740', 0.22, 0.2);
          break;
        case 'spray':
          fx.burst(ev.x, ev.y, ev.z, ev.color, ev.count ?? 14);
          break;
        case 'bounce':
          fx.ring(ev.x, ev.y, ev.z, ev.color);
          break;
        case 'bossUnlock':
          fx.flash('#ff4ecd', 0.25, 0.25);
          break;
      }
    },
  };
}

export function createRiderAnimEffectHandler(getRider: () => RiderView | null): GameEffectHandler {
  return {
    id: 'rider-anim',
    onEvent(ev) {
      const r = getRider();
      if (!r) return;
      switch (ev.type) {
        case 'airJump':
          r.triggerAirJump();
          break;
        case 'trick':
          if (ev.anim && !ev.skipAnim) r.triggerTrick(ev.anim);
          break;
        case 'spray':
          r.triggerSpray(ev.color);
          if (ev.celebrate) r.triggerCelebrate();
          break;
        case 'pickup':
          if (ev.kind === 'spray-pickup' || ev.kind === 'tempo-acorn') r.triggerSpray('#ffd740');
          break;
        case 'eventComplete':
        case 'bossUnlock':
        case 'levelClear':
          r.triggerCelebrate();
          break;
      }
    },
  };
}

export function createHudEffectHandler(hud: HudHandle): GameEffectHandler {
  return {
    id: 'hud-slam',
    onEvent(ev) {
      if (ev.type === 'trick') hud.slamTrick(ev.name, ev.mult, ev.onBeat);
      else if (ev.type === 'bankScore') hud.slamBank(ev.points);
    },
  };
}
