import { PlayerMode } from './climbing';
import { RemotePlayerState } from './net/protocol';

export interface LobbyActions {
  onPlaySolo: (name: string, seed?: number) => void;
  onHostRoom: (name: string, seed?: number) => void;
  onJoinRoom: (name: string, code: string) => void;
  onQuickJoin: (name: string, seed?: number) => void;
  onRespawn: () => void;
  onBackToMenu: () => void;
  onToggleMute: () => boolean;
}

export class GameUI {
  private readonly root: HTMLDivElement;
  private readonly lobby: HTMLDivElement;
  private readonly hud: HTMLDivElement;
  private readonly lobbyError: HTMLDivElement;

  private readonly altEl: HTMLDivElement;
  private readonly timerEl: HTMLDivElement;
  private readonly roomEl: HTMLDivElement;
  private readonly rosterEl: HTMLDivElement;
  private readonly seedEl: HTMLDivElement;
  private readonly crosshair: HTMLDivElement;
  private readonly promptEl: HTMLDivElement;
  private readonly staminaFill: HTMLDivElement;
  private readonly staminaText: HTMLDivElement;
  private readonly hpFill: HTMLDivElement;
  private readonly pitonEl: HTMLDivElement;
  private readonly toastEl: HTMLDivElement;
  private readonly clickLockHint: HTMLDivElement;
  private readonly muteBtn: HTMLButtonElement;

  private toastTimer = 0;

  constructor(parent: HTMLElement, private readonly actions: LobbyActions) {
    this.root = document.createElement('div');
    this.root.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
    parent.appendChild(this.root);

    // --- LOBBY ---
    this.lobby = document.createElement('div');
    this.lobby.id = 'peak-lobby';
    this.lobby.style.cssText = `
      position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
      background:linear-gradient(180deg, rgba(16,32,56,0.72), rgba(10,18,32,0.86));
      backdrop-filter:blur(6px);pointer-events:auto;
    `;
    this.lobby.innerHTML = `
      <div style="width:min(440px,92vw);background:rgba(17,24,39,0.92);border:1px solid rgba(255,255,255,0.16);border-radius:16px;padding:24px;box-shadow:0 20px 50px rgba(0,0,0,0.45);">
        <div style="font-size:32px;font-weight:800;letter-spacing:1.5px;color:#ffd166;text-align:center;">PEAK CLIMB</div>
        <div style="font-size:13px;color:#cbd5e1;text-align:center;margin-bottom:18px;">Procedural Co-op Mountain Climbing</div>

        <div style="display:flex;gap:8px;margin-bottom:10px;">
          <input id="peak-name" type="text" maxlength="16" placeholder="Climber Name" value="Climber"
            style="flex:1;padding:10px 12px;border-radius:8px;border:1px solid #475569;background:#0f172a;color:#fff;font-size:14px;" />
          <input id="peak-seed" type="number" placeholder="Seed (auto)"
            style="width:120px;padding:10px 12px;border-radius:8px;border:1px solid #475569;background:#0f172a;color:#fff;font-size:14px;" />
        </div>

        <div style="display:flex;gap:8px;margin-bottom:10px;">
          <button id="peak-play-solo" style="flex:1;padding:11px;border:none;border-radius:8px;background:#2ec4b6;color:#082026;font-weight:700;cursor:pointer;font-size:14px;">Play Solo</button>
          <button id="peak-host" style="flex:1;padding:11px;border:none;border-radius:8px;background:#ffd166;color:#1e293b;font-weight:700;cursor:pointer;font-size:14px;">Host Room</button>
        </div>

        <div style="display:flex;gap:8px;margin-bottom:12px;">
          <input id="peak-code" type="text" maxlength="4" placeholder="ROOM CODE"
            style="width:120px;padding:10px;border-radius:8px;border:1px solid #475569;background:#0f172a;color:#fff;font-size:14px;text-transform:uppercase;text-align:center;letter-spacing:2px;" />
          <button id="peak-join" style="flex:1;padding:10px;border:1px solid #64748b;border-radius:8px;background:#1e293b;color:#fff;font-weight:600;cursor:pointer;">Join Code</button>
          <button id="peak-quick" style="flex:1;padding:10px;border:1px solid #64748b;border-radius:8px;background:#334155;color:#fff;font-weight:600;cursor:pointer;">Quick Join</button>
        </div>

        <div id="peak-lobby-error" style="min-height:18px;font-size:12px;color:#fda4af;margin-bottom:8px;text-align:center;"></div>

        <div style="background:rgba(15,23,42,0.75);border-radius:10px;padding:12px;font-size:12px;line-height:1.6;color:#cbd5e1;">
          <div><b style="color:#fff;">WASD</b> Walk / Climb &nbsp;·&nbsp; <b style="color:#fff;">Hold Left Click / E</b> Grab Rock</div>
          <div><b style="color:#fff;">Space</b> Jump / Wall Lunge &nbsp;·&nbsp; <b style="color:#fff;">Shift</b> Sprint</div>
          <div><b style="color:#fff;">Q</b> Ping &nbsp;·&nbsp; <b style="color:#fff;">R</b> Piton &nbsp;·&nbsp; <b style="color:#fff;">F</b> Revive &nbsp;·&nbsp; <b style="color:#fff;">G</b> Dance &nbsp;·&nbsp; <b style="color:#fff;">H</b> Wave</div>
        </div>
      </div>
    `;
    this.root.appendChild(this.lobby);

    this.lobbyError = this.lobby.querySelector('#peak-lobby-error')!;
    const nameInput = this.lobby.querySelector<HTMLInputElement>('#peak-name')!;
    const seedInput = this.lobby.querySelector<HTMLInputElement>('#peak-seed')!;
    const codeInput = this.lobby.querySelector<HTMLInputElement>('#peak-code')!;

    const getSeed = (): number | undefined => {
      const v = Number(seedInput.value);
      return seedInput.value.trim() && Number.isFinite(v) ? Math.floor(v) : undefined;
    };

    this.lobby.querySelector('#peak-play-solo')!.addEventListener('click', () => {
      this.lobbyError.textContent = '';
      this.actions.onPlaySolo(nameInput.value.trim() || 'Climber', getSeed());
    });
    this.lobby.querySelector('#peak-host')!.addEventListener('click', () => {
      this.lobbyError.textContent = '';
      this.actions.onHostRoom(nameInput.value.trim() || 'Climber', getSeed());
    });
    this.lobby.querySelector('#peak-join')!.addEventListener('click', () => {
      this.lobbyError.textContent = '';
      const code = codeInput.value.trim().toUpperCase();
      if (code.length < 4) {
        this.lobbyError.textContent = 'Enter a 4-letter room code.';
        return;
      }
      this.actions.onJoinRoom(nameInput.value.trim() || 'Climber', code);
    });
    this.lobby.querySelector('#peak-quick')!.addEventListener('click', () => {
      this.lobbyError.textContent = '';
      this.actions.onQuickJoin(nameInput.value.trim() || 'Climber', getSeed());
    });

    // --- HUD ---
    this.hud = document.createElement('div');
    this.hud.id = 'peak-hud';
    this.hud.style.cssText = 'position:absolute;inset:0;display:none;pointer-events:none;';
    this.hud.innerHTML = `
      <div style="position:absolute;top:14px;left:16px;background:rgba(15,23,42,0.68);padding:10px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.12);min-width:170px;">
        <div id="hud-alt" style="font-size:20px;font-weight:800;color:#ffd166;">0m / 145m</div>
        <div id="hud-timer" style="font-size:12px;color:#cbd5e1;">0:00</div>
        <div id="hud-room" style="font-size:12px;color:#7dd3fc;margin-top:4px;font-weight:700;">SOLO</div>
        <div id="hud-roster" style="font-size:12px;color:#e2e8f0;margin-top:6px;line-height:1.4;"></div>
      </div>

      <div style="position:absolute;top:14px;right:16px;display:flex;gap:8px;align-items:center;pointer-events:auto;">
        <div id="hud-seed" style="background:rgba(15,23,42,0.68);padding:7px 10px;border-radius:8px;font-size:12px;color:#cbd5e1;">Seed: -</div>
        <button id="hud-respawn" style="padding:7px 10px;border-radius:8px;border:1px solid rgba(255,255,255,0.2);background:rgba(15,23,42,0.78);color:#fff;cursor:pointer;font-size:12px;">Checkpoint (C)</button>
        <button id="hud-mute" style="padding:7px 10px;border-radius:8px;border:1px solid rgba(255,255,255,0.2);background:rgba(15,23,42,0.78);color:#fff;cursor:pointer;font-size:12px;">Audio: ON</button>
        <button id="hud-menu" style="padding:7px 10px;border-radius:8px;border:1px solid rgba(255,255,255,0.2);background:rgba(127,29,29,0.78);color:#fff;cursor:pointer;font-size:12px;">Menu</button>
      </div>

      <div id="hud-crosshair" style="position:absolute;left:50%;top:50%;width:10px;height:10px;margin:-5px 0 0 -5px;border-radius:50%;border:2px solid rgba(255,255,255,0.75);transition:transform 0.08s, border-color 0.08s;"></div>
      <div id="hud-prompt" style="position:absolute;left:50%;top:54%;transform:translateX(-50%);font-size:13px;font-weight:700;text-shadow:0 2px 6px rgba(0,0,0,0.85);color:#fff;"></div>
      <div id="hud-lock-hint" style="position:absolute;left:50%;top:22%;transform:translateX(-50%);background:rgba(15,23,42,0.82);padding:8px 16px;border-radius:999px;font-size:13px;border:1px solid rgba(255,255,255,0.2);">Click anywhere to lock mouse &amp; climb</div>
      <div id="hud-toast" style="position:absolute;left:50%;top:13%;transform:translateX(-50%);background:rgba(15,23,42,0.88);padding:8px 16px;border-radius:10px;font-size:14px;font-weight:700;color:#ffd166;opacity:0;transition:opacity 0.2s;"></div>

      <div style="position:absolute;left:50%;bottom:20px;transform:translateX(-50%);width:min(320px,46vw);background:rgba(15,23,42,0.72);padding:10px 14px;border-radius:12px;border:1px solid rgba(255,255,255,0.14);">
        <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700;margin-bottom:4px;">
          <span>STAMINA</span>
          <span id="hud-stamina-text">100%</span>
        </div>
        <div style="height:10px;background:rgba(255,255,255,0.15);border-radius:999px;overflow:hidden;margin-bottom:8px;">
          <div id="hud-stamina-fill" style="height:100%;width:100%;background:#2ec4b6;transition:width 0.06s, background 0.15s;"></div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;font-size:11px;color:#cbd5e1;">
          <span>HP</span>
          <div style="flex:1;height:6px;background:rgba(255,255,255,0.15);border-radius:999px;overflow:hidden;">
            <div id="hud-hp-fill" style="height:100%;width:100%;background:#ff6b6b;"></div>
          </div>
          <span id="hud-pitons" style="font-weight:700;color:#ffe66d;">Pitons: 2</span>
        </div>
      </div>
    `;
    this.root.appendChild(this.hud);

    this.altEl = this.hud.querySelector('#hud-alt')!;
    this.timerEl = this.hud.querySelector('#hud-timer')!;
    this.roomEl = this.hud.querySelector('#hud-room')!;
    this.rosterEl = this.hud.querySelector('#hud-roster')!;
    this.seedEl = this.hud.querySelector('#hud-seed')!;
    this.crosshair = this.hud.querySelector('#hud-crosshair')!;
    this.promptEl = this.hud.querySelector('#hud-prompt')!;
    this.staminaFill = this.hud.querySelector('#hud-stamina-fill')!;
    this.staminaText = this.hud.querySelector('#hud-stamina-text')!;
    this.hpFill = this.hud.querySelector('#hud-hp-fill')!;
    this.pitonEl = this.hud.querySelector('#hud-pitons')!;
    this.toastEl = this.hud.querySelector('#hud-toast')!;
    this.clickLockHint = this.hud.querySelector('#hud-lock-hint')!;
    this.muteBtn = this.hud.querySelector<HTMLButtonElement>('#hud-mute')!;

    this.hud.querySelector('#hud-respawn')!.addEventListener('click', (e) => {
      e.stopPropagation();
      this.actions.onRespawn();
    });
    this.hud.querySelector('#hud-menu')!.addEventListener('click', (e) => {
      e.stopPropagation();
      this.actions.onBackToMenu();
    });
    this.muteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const muted = this.actions.onToggleMute();
      this.muteBtn.textContent = muted ? 'Audio: OFF' : 'Audio: ON';
    });
  }

  showLobby(errorMsg?: string): void {
    this.lobby.style.display = 'flex';
    this.hud.style.display = 'none';
    if (errorMsg) this.lobbyError.textContent = errorMsg;
  }

  setLobbyError(msg: string): void {
    this.lobbyError.textContent = msg;
  }

  showHud(seed: number, roomCode: string | null): void {
    this.lobby.style.display = 'none';
    this.hud.style.display = 'block';
    this.seedEl.textContent = `Seed: ${seed}`;
    this.roomEl.textContent = roomCode ? `ROOM: ${roomCode}` : 'SOLO MODE';
  }

  showToast(text: string, duration = 2.6): void {
    this.toastEl.textContent = text;
    this.toastEl.style.opacity = '1';
    this.toastTimer = duration;
  }

  update(
    dt: number,
    data: {
      altitude: number;
      timeSec: number;
      stamina: number;
      hp: number;
      pitonsLeft: number;
      mode: PlayerMode;
      canGrab: boolean;
      nearPiton: boolean;
      nearCampfire: boolean;
      reviveTargetName: string | null;
      pointerLocked: boolean;
      isTouchDevice: boolean;
      remotePlayers: RemotePlayerState[];
    }
  ): void {
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) this.toastEl.style.opacity = '0';
    }

    const alt = Math.max(0, Math.round(data.altitude));
    this.altEl.textContent = `${alt}m / 145m`;
    const mins = Math.floor(data.timeSec / 60);
    const secs = Math.floor(data.timeSec % 60);
    this.timerEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

    this.staminaFill.style.width = `${Math.max(0, Math.min(100, data.stamina))}%`;
    this.staminaFill.style.background =
      data.stamina < 25 ? '#ff595e' : data.nearPiton || data.nearCampfire ? '#ffe66d' : '#2ec4b6';
    this.staminaText.textContent = `${Math.round(data.stamina)}%${data.nearPiton ? ' (PITON)' : data.nearCampfire ? ' (FIRE)' : ''}`;

    this.hpFill.style.width = `${Math.max(0, Math.min(100, data.hp))}%`;
    this.pitonEl.textContent = `Pitons: ${data.pitonsLeft} (R)`;

    this.clickLockHint.style.display = data.pointerLocked || data.isTouchDevice ? 'none' : 'block';

    // Crosshair & prompt
    if (data.mode === 'downed') {
      this.crosshair.style.borderColor = '#ff595e';
      this.crosshair.style.transform = 'scale(1)';
      this.promptEl.textContent = 'DOWNED! Press C to respawn at checkpoint (or wait for teammate F)';
    } else if (data.mode === 'dancing') {
      this.crosshair.style.borderColor = '#a78bfa';
      this.crosshair.style.transform = 'scale(1.1)';
      this.promptEl.textContent = 'Dancing! (Press G or move to stop)';
    } else if (data.mode === 'waving') {
      this.crosshair.style.borderColor = '#60a5fa';
      this.crosshair.style.transform = 'scale(1.1)';
      this.promptEl.textContent = 'Waving! (Press H or move to stop)';
    } else if (data.reviveTargetName) {
      this.crosshair.style.borderColor = '#55efc4';
      this.crosshair.style.transform = 'scale(1.4)';
      this.promptEl.textContent = `[F] Revive ${data.reviveTargetName}`;
    } else if (data.mode === 'climbing') {
      this.crosshair.style.borderColor = '#ffd166';
      this.crosshair.style.transform = 'scale(1.3)';
      this.promptEl.textContent = 'Climbing — [Space] Wall Lunge';
    } else if (data.canGrab) {
      this.crosshair.style.borderColor = '#2ec4b6';
      this.crosshair.style.transform = 'scale(1.25)';
      this.promptEl.textContent = '[Hold Left Click / E] Grab Rock';
    } else {
      this.crosshair.style.borderColor = 'rgba(255,255,255,0.7)';
      this.crosshair.style.transform = 'scale(1)';
      this.promptEl.textContent = '';
    }

    // Remote roster
    if (data.remotePlayers.length > 0) {
      this.rosterEl.innerHTML = data.remotePlayers
        .map((p) => {
          const pAlt = Math.max(0, Math.round(p.y));
          const badge = p.mode === 'downed' ? ' [DOWN]' : p.mode === 'summited' ? ' [PEAK]' : '';
          return `<div><span style="color:${p.color};">●</span> ${p.name}: ${pAlt}m${badge}</div>`;
        })
        .join('');
    } else {
      this.rosterEl.innerHTML = '';
    }
  }
}
