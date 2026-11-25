// Dark-fantasy Souls HUD, Boss Health Bar, Co-op Party Bars, Banners & Lobby Overlay.
import { createVolumeButton } from '@arcade/volume';
import { volumeStore } from './audio';
import { BOSS, WORLD } from './sim/config';
import type { WorldState } from './sim/types';

export interface SoulsCallbacks {
  onPlaySolo: () => void;
  onPlayOnline: (roomCode: string | null) => void;
  onRespawn: () => void;
}

export class SoulsUI {
  readonly root: HTMLDivElement;
  private lobbyEl: HTMLDivElement;
  private statusEl: HTMLDivElement;
  private hpFill: HTMLDivElement;
  private stamFill: HTMLDivElement;
  private flaskEl: HTMLDivElement;
  private bossBarWrap: HTMLDivElement;
  private bossFill: HTMLDivElement;
  private bossTrail: HTMLDivElement;
  private partyEl: HTMLDivElement;
  private promptEl: HTMLDivElement;
  private bannerEl: HTMLDivElement;
  private lockEl: HTMLDivElement;
  private bannerTimer = 0;
  private trailPct = 100;

  constructor(uiParent: HTMLElement, cb: SoulsCallbacks) {
    this.root = document.createElement('div');
    this.root.id = 'gs-ui';
    this.root.style.cssText = 'position:fixed;inset:0;pointer-events:none;font-family:Georgia,"Times New Roman",serif;';
    uiParent.appendChild(this.root);

    // Top-left Player Vitals + Flask + Co-op Party
    const vitals = document.createElement('div');
    vitals.style.cssText = 'position:absolute;top:16px;left:16px;width:240px;max-width:56vw;';
    vitals.innerHTML = `
      <div style="height:14px;background:rgba(12,10,12,0.86);border:1px solid #5c4b37;margin-bottom:5px;overflow:hidden;">
        <div id="gs-hp" style="height:100%;width:100%;background:linear-gradient(90deg,#7a1616,#b82929);transition:width 0.08s;"></div>
      </div>
      <div style="height:10px;background:rgba(12,10,12,0.86);border:1px solid #494132;margin-bottom:8px;overflow:hidden;">
        <div id="gs-stam" style="height:100%;width:100%;background:linear-gradient(90deg,#25632f,#45a851);"></div>
      </div>
      <div id="gs-flask" style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;background:rgba(16,14,18,0.82);border:1px solid #755b38;color:#f5c878;font-size:13px;letter-spacing:0.5px;">
        Glaze Flask: <strong id="gs-flask-n">3</strong>
      </div>
      <div id="gs-party" style="margin-top:8px;display:flex;flex-direction:column;gap:4px;"></div>
    `;
    this.root.appendChild(vitals);
    this.hpFill = vitals.querySelector('#gs-hp')!;
    this.stamFill = vitals.querySelector('#gs-stam')!;
    this.flaskEl = vitals.querySelector('#gs-flask-n')!;
    this.partyEl = vitals.querySelector('#gs-party')!;

    // Bottom-center Boss Health Bar
    this.bossBarWrap = document.createElement('div');
    this.bossBarWrap.style.cssText = 'position:absolute;bottom:24px;left:50%;transform:translateX(-50%);width:min(680px,88vw);display:none;';
    this.bossBarWrap.innerHTML = `
      <div style="font-size:14px;letter-spacing:2px;color:#e8dcc2;text-shadow:0 2px 4px #000;margin-bottom:5px;">${BOSS.name}</div>
      <div style="position:relative;height:14px;background:rgba(12,10,12,0.88);border:1px solid #6e5a3d;overflow:hidden;">
        <div id="gs-boss-trail" style="position:absolute;inset:0;width:100%;background:#d4a33b;transition:width 0.25s;"></div>
        <div id="gs-boss-fill" style="position:relative;height:100%;width:100%;background:linear-gradient(90deg,#6e1111,#b31d1d);"></div>
      </div>
    `;
    this.root.appendChild(this.bossBarWrap);
    this.bossFill = this.bossBarWrap.querySelector('#gs-boss-fill')!;
    this.bossTrail = this.bossBarWrap.querySelector('#gs-boss-trail')!;

    // Center Interaction Prompt
    this.promptEl = document.createElement('div');
    this.promptEl.style.cssText = 'position:absolute;bottom:108px;left:50%;transform:translateX(-50%);padding:7px 16px;background:rgba(10,12,16,0.85);border:1px solid #8a7350;color:#efe5cf;font-size:14px;letter-spacing:0.6px;display:none;';
    this.root.appendChild(this.promptEl);

    // Souls Banner ("SHATTERED", "SPIGOT SEALED", "KILN RESTORED")
    this.bannerEl = document.createElement('div');
    this.bannerEl.style.cssText = `
      position:absolute;left:0;right:0;top:36%;padding:18px 0;text-align:center;
      background:linear-gradient(90deg,transparent,rgba(8,8,10,0.86) 25%,rgba(8,8,10,0.86) 75%,transparent);
      font-size:clamp(26px,5vw,48px);letter-spacing:6px;text-transform:uppercase;
      display:none;text-shadow:0 3px 12px #000;
    `;
    this.root.appendChild(this.bannerEl);

    // Lock-on reticle
    this.lockEl = document.createElement('div');
    this.lockEl.style.cssText = 'position:fixed;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;border:2px solid #f7e6c4;box-shadow:0 0 10px #fff;display:none;';
    this.root.appendChild(this.lockEl);

    // Desktop keybind hint (hidden on touch)
    if (!matchMedia('(pointer: coarse)').matches) {
      const hint = document.createElement('div');
      hint.style.cssText = 'position:absolute;bottom:14px;left:16px;font-size:11px;color:rgba(220,210,190,0.6);line-height:1.45;';
      hint.innerHTML = 'WASD Move · Space Roll · Shift Sprint<br>LMB R1 · RMB R2 · F Guard · R Flask · Tab Lock · E Use';
      this.root.appendChild(hint);
    }

    // Lobby / Title Overlay
    this.lobbyEl = document.createElement('div');
    this.lobbyEl.style.cssText = `
      position:fixed;inset:0;display:flex;align-items:center;justify-content:center;
      background:radial-gradient(circle at center,rgba(18,22,32,0.72),rgba(5,6,10,0.94));
      pointer-events:auto;z-index:30;padding:16px;
    `;
    this.lobbyEl.innerHTML = `
      <div style="width:min(420px,92vw);padding:28px 24px;background:rgba(12,14,20,0.94);border:1px solid #6e5a3d;text-align:center;box-shadow:0 16px 48px rgba(0,0,0,0.85);">
        <div style="font-size:34px;letter-spacing:5px;color:#e8dcc2;margin-bottom:4px;">GNOME SOULS</div>
        <div style="font-size:13px;letter-spacing:2px;color:#a88f64;margin-bottom:20px;">THE SUNKEN SPIGOT</div>
        <p style="font-size:13px;color:#b8b0a0;line-height:1.5;margin:0 0 18px;">
          Wield the two-handed Kiln-Breaker Greatsword. Read the hose, roll through the sweep, and seal Slink.
        </p>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <button id="gs-solo" style="padding:12px;background:#6e1d1d;border:1px solid #b55454;color:#f5ebd6;font:700 15px Georgia,serif;cursor:pointer;letter-spacing:1px;">ENTER THE CULVERT (SOLO)</button>
          <button id="gs-pub" style="padding:11px;background:#1e2636;border:1px solid #5d7094;color:#dce4f2;font:700 14px Georgia,serif;cursor:pointer;">CO-OP SUMMON (PUBLIC)</button>
          <div style="display:flex;gap:8px;">
            <input id="gs-code" maxlength="8" placeholder="ROOM CODE" style="flex:1;padding:10px;background:#0b0d12;border:1px solid #4a4032;color:#f0e6d2;font:14px Georgia,serif;text-transform:uppercase;" />
            <button id="gs-join" style="padding:10px 14px;background:#2e2519;border:1px solid #8a7048;color:#f0dcb4;font:700 13px Georgia,serif;cursor:pointer;">JOIN</button>
          </div>
          <div id="gs-status" style="min-height:18px;font-size:12px;color:#d6b26f;"></div>
        </div>
        <div id="gs-vol" style="margin-top:14px;display:flex;justify-content:center;"></div>
      </div>
    `;
    this.root.appendChild(this.lobbyEl);
    this.statusEl = this.lobbyEl.querySelector('#gs-status')!;

    createVolumeButton(this.lobbyEl.querySelector('#gs-vol')!, volumeStore);

    this.lobbyEl.querySelector('#gs-solo')!.addEventListener('click', () => cb.onPlaySolo());
    this.lobbyEl.querySelector('#gs-pub')!.addEventListener('click', () => cb.onPlayOnline(null));
    this.lobbyEl.querySelector('#gs-join')!.addEventListener('click', () => {
      const code = (this.lobbyEl.querySelector('#gs-code') as HTMLInputElement).value.trim().toUpperCase();
      cb.onPlayOnline(code || 'SPIGOT');
    });
  }

  showLobby(v: boolean): void {
    this.lobbyEl.style.display = v ? 'flex' : 'none';
  }

  setStatus(msg: string): void {
    this.statusEl.textContent = msg;
  }

  showBanner(text: string, color: string, duration = 2.6): void {
    this.bannerEl.textContent = text;
    this.bannerEl.style.color = color;
    this.bannerEl.style.display = 'block';
    this.bannerTimer = duration;
  }

  update(
    state: WorldState,
    localId: number,
    lockScreen: { x: number; y: number; visible: boolean } | null,
    dt: number,
  ): string | null {
    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      if (this.bannerTimer <= 0) this.bannerEl.style.display = 'none';
    }

    const me = state.players.find((p) => p.id === localId);
    if (me) {
      this.hpFill.style.width = `${Math.max(0, (me.hp / me.maxHp) * 100)}%`;
      this.stamFill.style.width = `${Math.max(0, (me.stamina / me.maxStamina) * 100)}%`;
      this.flaskEl.textContent = String(me.flasks);
    }

    // Co-op teammates
    const others = state.players.filter((p) => p.id !== localId);
    this.partyEl.innerHTML = others
      .map(
        (o) =>
          `<div style="font-size:11px;color:#d6cbb8;">${o.name} <div style="height:5px;width:130px;background:#141216;border:1px solid #493f32;"><div style="height:100%;width:${Math.max(0, (o.hp / o.maxHp) * 100)}%;background:#9b2828;"></div></div></div>`,
      )
      .join('');

    // Boss bar
    if (state.boss.active && state.boss.alive) {
      this.bossBarWrap.style.display = 'block';
      const pct = Math.max(0, (state.boss.hp / state.boss.maxHp) * 100);
      this.bossFill.style.width = `${pct}%`;
      this.trailPct += (pct - this.trailPct) * Math.min(1, dt * 2.5);
      this.bossTrail.style.width = `${Math.max(pct, this.trailPct)}%`;
    } else {
      this.bossBarWrap.style.display = 'none';
    }

    // Lock-on reticle
    if (lockScreen && lockScreen.visible) {
      this.lockEl.style.display = 'block';
      this.lockEl.style.left = `${lockScreen.x}px`;
      this.lockEl.style.top = `${lockScreen.y}px`;
    } else {
      this.lockEl.style.display = 'none';
    }

    // Contextual interact prompt
    let interactLabel: string | null = null;
    if (me && me.action !== 'dead') {
      if (Math.hypot(me.x - WORLD.shrinePos.x, me.z - WORLD.shrinePos.z) <= 2.7) {
        this.promptEl.textContent = '[E] Rest at Kiln-Ember Shrine';
        this.promptEl.style.display = 'block';
        interactLabel = 'REST';
      } else if (!state.fogOpen && Math.abs(me.x) <= 2.6 && Math.abs(me.z - WORLD.fogGateZ) <= 2.2) {
        this.promptEl.textContent = '[E] Traverse the Mist';
        this.promptEl.style.display = 'block';
        interactLabel = 'MIST';
      } else {
        this.promptEl.style.display = 'none';
      }
    } else {
      this.promptEl.style.display = 'none';
    }
    return interactLabel;
  }
}
