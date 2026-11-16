import { GNOME_COLORS, ITEM_CATALOG, PORTALS, SHOP_TOOLS } from './shared/catalog';
import type { ChatMessage, ToolKind, WorldSnapshot } from './shared/types';

export interface UiHandlers {
  onSolo: (name: string, color: string) => void;
  onCreateRoom: (name: string, color: string) => void;
  onJoinRoom: (code: string, name: string, color: string) => void;
  onQuickJoin: (name: string, color: string) => void;
  onBuyTool: (kind: ToolKind) => void;
  onSendChat: (text: string) => void;
  onPullLever: () => void;
  onToggleMute: () => boolean;
}

export interface HudExtraState {
  inBush: boolean;
  crouching: boolean;
  flashlightOn: boolean;
  pointerLocked: boolean;
  localYaw: number;
  localX: number;
  localZ: number;
}

const UI_CSS = `
.gc-root {
  position: absolute;
  inset: 0;
  pointer-events: none;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  color: #f8fafc;
  font-size: 13px;
}
.gc-panel {
  background: rgba(11, 16, 27, 0.82);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
}
.gc-kbd {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 5px;
  background: rgba(30, 41, 59, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.4);
  color: #fde047;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  font-weight: 700;
}
.gc-btn {
  border: none;
  border-radius: 9px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.08s ease, filter 0.12s ease;
}
.gc-btn:hover:not(:disabled) {
  filter: brightness(1.08);
  transform: translateY(-1px);
}
.gc-btn:active:not(:disabled) {
  transform: translateY(0);
}
.gc-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.3px;
}
.gc-bar-track {
  height: 8px;
  background: rgba(30, 41, 59, 0.9);
  border-radius: 999px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.gc-bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.14s ease, background-color 0.2s ease;
}
`;

export class GameUI {
  private root: HTMLDivElement;
  private menuEl: HTMLDivElement;
  private hudEl: HTMLDivElement;
  private shopEl: HTMLDivElement;
  private overlayEl: HTMLDivElement;

  private errorEl!: HTMLDivElement;
  private quotaEl!: HTMLDivElement;
  private quotaBar!: HTMLDivElement;
  private metaEl!: HTMLDivElement;
  private sermonEl!: HTMLDivElement;
  private compassEl!: HTMLSpanElement;
  private dayBarEl!: HTMLDivElement;
  private dayLabelEl!: HTMLSpanElement;
  private promptEl!: HTMLDivElement;
  private crosshairDot!: HTMLDivElement;
  private hpBar!: HTMLDivElement;
  private hpValEl!: HTMLSpanElement;
  private stamBar!: HTMLDivElement;
  private stamValEl!: HTMLSpanElement;
  private stealthPillEl!: HTMLDivElement;
  private blessEl!: HTMLDivElement;
  private heldEl!: HTMLDivElement;
  private heldSubEl!: HTMLDivElement;
  private chatList!: HTMLDivElement;
  private chatInput!: HTMLInputElement;
  private shopBucksEl!: HTMLDivElement;
  private shopItemsEl!: HTMLDivElement;
  private damageFlashEl!: HTMLDivElement;
  private playersListEl!: HTMLDivElement;
  private lockHintEl!: HTMLDivElement;

  private selectedColor = GNOME_COLORS[0];
  private lastSermonSeq = -1;
  private sermonTimer = 0;
  public shopOpen = false;
  public chatFocused = false;

  constructor(private handlers: UiHandlers) {
    if (!document.getElementById('gnome-ui-styles')) {
      const style = document.createElement('style');
      style.id = 'gnome-ui-styles';
      style.textContent = UI_CSS;
      document.head.appendChild(style);
    }

    const parent = document.getElementById('ui')!;
    this.root = document.createElement('div');
    this.root.className = 'gc-root';
    parent.appendChild(this.root);

    this.damageFlashEl = document.createElement('div');
    this.damageFlashEl.style.cssText =
      'position:absolute;inset:0;background:radial-gradient(circle,transparent 38%,rgba(220,38,38,0.68) 100%);opacity:0;transition:opacity 0.15s;pointer-events:none;';
    this.root.appendChild(this.damageFlashEl);

    this.menuEl = this.buildMenu();
    this.hudEl = this.buildHud();
    this.shopEl = this.buildShop();
    this.overlayEl = this.buildOverlay();

    this.hudEl.style.display = 'none';
    this.shopEl.style.display = 'none';
    this.overlayEl.style.display = 'none';

    this.root.append(this.menuEl, this.hudEl, this.shopEl, this.overlayEl);
  }

  private buildMenu(): HTMLDivElement {
    const el = document.createElement('div');
    el.id = 'gnome-menu';
    el.style.cssText =
      'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 15%,rgba(234,179,8,0.22),rgba(7,10,18,0.96) 68%);pointer-events:auto;padding:16px;';

    const card = document.createElement('div');
    card.style.cssText =
      'width:min(500px,94vw);background:rgba(15,23,42,0.94);backdrop-filter:blur(12px);border:2px solid rgba(234,179,8,0.75);border-radius:18px;padding:26px 26px 22px;box-shadow:0 24px 70px rgba(0,0,0,0.75);text-align:center;';

    card.innerHTML = `
      <div style="display:inline-block;padding:3px 12px;border-radius:999px;background:rgba(234,179,8,0.14);border:1px solid rgba(234,179,8,0.4);font-size:11px;letter-spacing:1.8px;color:#fde047;text-transform:uppercase;margin-bottom:8px;">✝ Lethal Suburban Scavenging ✝</div>
      <h1 style="margin:0 0 4px;font-size:32px;letter-spacing:1px;color:#fff;text-shadow:0 2px 12px rgba(234,179,8,0.25);">GNOME COMPANY</h1>
      <div style="font-size:13px;color:#cbd5e1;margin-bottom:14px;">The Chapel of Mulch · Serve Omnipresent Gnome Jesus</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px;text-align:left;">
        <div style="background:rgba(30,41,59,0.65);border:1px solid rgba(148,163,184,0.2);border-radius:9px;padding:8px 10px;">
          <div style="font-size:11px;font-weight:800;color:#fde047;">1. GEAR UP</div>
          <div style="font-size:11px;color:#cbd5e1;margin-top:2px;">Grab tools & pull the Shed lever.</div>
        </div>
        <div style="background:rgba(30,41,59,0.65);border:1px solid rgba(148,163,184,0.2);border-radius:9px;padding:8px 10px;">
          <div style="font-size:11px;font-weight:800;color:#4ade80;">2. SNEAK & LOOT</div>
          <div style="font-size:11px;color:#cbd5e1;margin-top:2px;">Use bushes & hedges to evade patrols.</div>
        </div>
        <div style="background:rgba(30,41,59,0.65);border:1px solid rgba(148,163,184,0.2);border-radius:9px;padding:8px 10px;">
          <div style="font-size:11px;font-weight:800;color:#38bdf8;">3. TITHE</div>
          <div style="font-size:11px;color:#cbd5e1;margin-top:2px;">Return to Shed & meet 3-day quota.</div>
        </div>
      </div>
    `;

    const nameInput = document.createElement('input');
    nameInput.placeholder = 'Your Gnome Name (e.g. Brother Sprout)';
    nameInput.value = `Sprout${Math.floor(10 + Math.random() * 89)}`;
    nameInput.maxLength = 16;
    nameInput.style.cssText =
      'width:100%;box-sizing:border-box;padding:11px 14px;border-radius:10px;border:1px solid #475569;background:#0b1120;color:#fff;font-size:14px;font-weight:600;margin-bottom:12px;outline:none;';
    card.appendChild(nameInput);

    // Hat color picker
    const colorWrap = document.createElement('div');
    colorWrap.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:16px;';
    const colorLbl = document.createElement('span');
    colorLbl.textContent = 'Hat Color:';
    colorLbl.style.cssText = 'font-size:12px;color:#94a3b8;font-weight:600;';
    colorWrap.appendChild(colorLbl);

    const colorRow = document.createElement('div');
    colorRow.style.cssText = 'display:flex;gap:8px;';
    GNOME_COLORS.forEach((c, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.style.cssText = `width:26px;height:26px;border-radius:50%;background:${c};border:3px solid ${idx === 0 ? '#fff' : 'transparent'};box-shadow:${idx === 0 ? `0 0 10px ${c}` : 'none'};cursor:pointer;transition:transform 0.1s;`;
      btn.onclick = () => {
        this.selectedColor = c;
        Array.from(colorRow.children).forEach((ch) => {
          (ch as HTMLElement).style.borderColor = 'transparent';
          (ch as HTMLElement).style.boxShadow = 'none';
        });
        btn.style.borderColor = '#fff';
        btn.style.boxShadow = `0 0 10px ${c}`;
      };
      colorRow.appendChild(btn);
    });
    colorWrap.appendChild(colorRow);
    card.appendChild(colorWrap);

    const btnStyle = 'width:100%;padding:12px;font-size:14px;margin-bottom:8px;';

    const soloBtn = document.createElement('button');
    soloBtn.className = 'gc-btn';
    soloBtn.textContent = 'Play Solo (Offline Pilgrimage)';
    soloBtn.style.cssText = btnStyle + 'background:linear-gradient(135deg,#facc15,#eab308);color:#111827;';
    soloBtn.onclick = () => this.handlers.onSolo(nameInput.value, this.selectedColor);
    card.appendChild(soloBtn);

    const mpRow = document.createElement('div');
    mpRow.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;';
    const hostBtn = document.createElement('button');
    hostBtn.className = 'gc-btn';
    hostBtn.textContent = 'Host Shed';
    hostBtn.style.cssText = 'padding:11px;font-size:13px;background:#22c55e;color:#052e16;';
    hostBtn.onclick = () => this.handlers.onCreateRoom(nameInput.value, this.selectedColor);

    const quickBtn = document.createElement('button');
    quickBtn.className = 'gc-btn';
    quickBtn.textContent = 'Quick Join';
    quickBtn.style.cssText = 'padding:11px;font-size:13px;background:#3b82f6;color:#fff;';
    quickBtn.onclick = () => this.handlers.onQuickJoin(nameInput.value, this.selectedColor);
    mpRow.append(hostBtn, quickBtn);
    card.appendChild(mpRow);

    const joinRow = document.createElement('div');
    joinRow.style.cssText = 'display:flex;gap:8px;';
    const codeInput = document.createElement('input');
    codeInput.placeholder = 'SHED CODE';
    codeInput.maxLength = 4;
    codeInput.style.cssText =
      'flex:1;padding:10px;border-radius:9px;border:1px solid #475569;background:#0b1120;color:#fff;text-transform:uppercase;text-align:center;font-weight:700;letter-spacing:2px;';
    const joinBtn = document.createElement('button');
    joinBtn.className = 'gc-btn';
    joinBtn.textContent = 'Join Code';
    joinBtn.style.cssText = 'padding:10px 18px;background:#a855f7;color:#fff;';
    joinBtn.onclick = () =>
      this.handlers.onJoinRoom(codeInput.value, nameInput.value, this.selectedColor);
    joinRow.append(codeInput, joinBtn);
    card.appendChild(joinRow);

    this.errorEl = document.createElement('div');
    this.errorEl.style.cssText = 'color:#f87171;font-size:12px;margin-top:10px;min-height:16px;font-weight:600;';
    card.appendChild(this.errorEl);

    const hint = document.createElement('div');
    hint.style.cssText =
      'font-size:11px;color:#94a3b8;margin-top:8px;padding-top:10px;border-top:1px solid rgba(148,163,184,0.16);line-height:1.7;';
    hint.innerHTML =
      '<span class="gc-kbd">WASD</span> Move · <span class="gc-kbd">Shift</span> Sprint · <span class="gc-kbd">C</span> Crouch/Hide · <span class="gc-kbd">E</span> Interact · <span class="gc-kbd">F</span> Light · <span class="gc-kbd">LMB</span> Use · <span class="gc-kbd">G</span> Drop';
    card.appendChild(hint);

    el.appendChild(card);
    return el;
  }

  private buildHud(): HTMLDivElement {
    const el = document.createElement('div');
    el.id = 'gnome-hud';
    el.style.cssText = 'position:absolute;inset:0;pointer-events:none;';

    // Top-left: Quota & Crew card
    const tl = document.createElement('div');
    tl.className = 'gc-panel';
    tl.style.cssText =
      'position:absolute;top:14px;left:14px;padding:11px 14px;min-width:240px;max-width:290px;border-color:rgba(234,179,8,0.45);';

    this.quotaEl = document.createElement('div');
    this.quotaEl.style.cssText = 'font-size:15px;font-weight:800;color:#fde047;display:flex;justify-content:space-between;align-items:center;';

    const qTrack = document.createElement('div');
    qTrack.className = 'gc-bar-track';
    qTrack.style.cssText = 'margin:6px 0 7px;height:7px;';
    this.quotaBar = document.createElement('div');
    this.quotaBar.className = 'gc-bar-fill';
    this.quotaBar.style.cssText = 'width:0%;background:#eab308;';
    qTrack.appendChild(this.quotaBar);

    this.metaEl = document.createElement('div');
    this.metaEl.style.cssText = 'display:flex;flex-wrap:wrap;gap:5px;margin-bottom:6px;';
    this.playersListEl = document.createElement('div');
    this.playersListEl.style.cssText = 'font-size:11px;color:#cbd5e1;line-height:1.45;';
    tl.append(this.quotaEl, qTrack, this.metaEl, this.playersListEl);
    el.appendChild(tl);

    // Top-center: Day Clock + Yard Compass + Sermon Toast
    const tc = document.createElement('div');
    tc.style.cssText =
      'position:absolute;top:14px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:7px;max-width:min(540px,52vw);';

    const clockCard = document.createElement('div');
    clockCard.className = 'gc-panel';
    clockCard.style.cssText = 'padding:6px 14px;display:flex;align-items:center;gap:10px;border-radius:999px;';
    this.dayLabelEl = document.createElement('span');
    this.dayLabelEl.style.cssText = 'font-size:11px;font-weight:800;letter-spacing:0.6px;white-space:nowrap;';
    const dayTrack = document.createElement('div');
    dayTrack.className = 'gc-bar-track';
    dayTrack.style.cssText = 'width:110px;height:6px;';
    this.dayBarEl = document.createElement('div');
    this.dayBarEl.className = 'gc-bar-fill';
    this.dayBarEl.style.cssText = 'width:0%;background:#38bdf8;';
    dayTrack.appendChild(this.dayBarEl);
    this.compassEl = document.createElement('span');
    this.compassEl.style.cssText = 'font-size:11px;color:#cbd5e1;font-weight:600;white-space:nowrap;';
    clockCard.append(this.dayLabelEl, dayTrack, this.compassEl);
    tc.appendChild(clockCard);

    this.sermonEl = document.createElement('div');
    this.sermonEl.className = 'gc-panel';
    this.sermonEl.style.cssText =
      'padding:7px 14px;text-align:center;font-weight:700;font-size:12px;color:#fef08a;border-color:rgba(234,179,8,0.65);transition:opacity 0.4s ease;';
    tc.appendChild(this.sermonEl);
    el.appendChild(tc);

    // Top-right: Sound toggle
    const tr = document.createElement('div');
    tr.style.cssText = 'position:absolute;top:14px;right:14px;display:flex;gap:8px;align-items:center;';
    const muteBtn = document.createElement('button');
    muteBtn.className = 'gc-btn gc-panel';
    muteBtn.textContent = '🔊 Sound';
    muteBtn.style.cssText =
      'pointer-events:auto;color:#e2e8f0;padding:7px 12px;font-size:12px;';
    muteBtn.onclick = () => {
      const m = this.handlers.onToggleMute();
      muteBtn.textContent = m ? '🔇 Muted' : '🔊 Sound';
    };
    tr.appendChild(muteBtn);
    el.appendChild(tr);

    // Center Crosshair + Interact Prompt
    const center = document.createElement('div');
    center.style.cssText =
      'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;';
    this.crosshairDot = document.createElement('div');
    this.crosshairDot.style.cssText =
      'width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,0.88);border:1.5px solid rgba(0,0,0,0.65);margin:0 auto 12px;transition:transform 0.1s,background 0.1s;';
    this.promptEl = document.createElement('div');
    this.promptEl.className = 'gc-panel';
    this.promptEl.style.cssText =
      'color:#fef08a;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:700;display:none;white-space:nowrap;border-color:rgba(250,204,21,0.55);';
    center.append(this.crosshairDot, this.promptEl);
    el.appendChild(center);

    // Bottom-left: Chat + Stealth & Vitals
    const bl = document.createElement('div');
    bl.style.cssText = 'position:absolute;bottom:14px;left:14px;width:280px;';

    this.chatList = document.createElement('div');
    this.chatList.style.cssText =
      'max-height:110px;overflow-y:auto;margin-bottom:8px;font-size:12px;text-shadow:0 1px 3px #000;display:flex;flex-direction:column;gap:3px;';
    bl.appendChild(this.chatList);

    this.chatInput = document.createElement('input');
    this.chatInput.placeholder = 'Type message and press Enter...';
    this.chatInput.style.cssText =
      'width:100%;box-sizing:border-box;padding:7px 10px;border-radius:8px;border:1px solid #475569;background:rgba(11,16,27,0.92);color:#fff;font-size:12px;margin-bottom:8px;display:none;pointer-events:auto;outline:none;';
    this.chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.handlers.onSendChat(this.chatInput.value);
        this.chatInput.value = '';
        this.closeChat();
      } else if (e.key === 'Escape') {
        this.closeChat();
      }
      e.stopPropagation();
    });
    bl.appendChild(this.chatInput);

    const bars = document.createElement('div');
    bars.className = 'gc-panel';
    bars.style.cssText = 'padding:10px 12px;';

    this.stealthPillEl = document.createElement('div');
    this.stealthPillEl.className = 'gc-pill';
    this.stealthPillEl.style.cssText = 'margin-bottom:8px;background:rgba(51,65,85,0.7);color:#cbd5e1;';
    bars.appendChild(this.stealthPillEl);

    const hpHdr = document.createElement('div');
    hpHdr.style.cssText = 'display:flex;justify-content:space-between;font-size:11px;font-weight:700;color:#fca5a5;margin-bottom:3px;';
    hpHdr.innerHTML = '<span>CERAMIC HP</span>';
    this.hpValEl = document.createElement('span');
    this.hpValEl.textContent = '100/100';
    hpHdr.appendChild(this.hpValEl);
    bars.appendChild(hpHdr);

    const hpWrap = document.createElement('div');
    hpWrap.className = 'gc-bar-track';
    hpWrap.style.marginBottom = '7px';
    this.hpBar = document.createElement('div');
    this.hpBar.className = 'gc-bar-fill';
    this.hpBar.style.cssText = 'width:100%;background:linear-gradient(90deg,#dc2626,#ef4444);';
    hpWrap.appendChild(this.hpBar);
    bars.appendChild(hpWrap);

    const stHdr = document.createElement('div');
    stHdr.style.cssText = 'display:flex;justify-content:space-between;font-size:11px;font-weight:700;color:#93c5fd;margin-bottom:3px;';
    stHdr.innerHTML = '<span>STAMINA</span>';
    this.stamValEl = document.createElement('span');
    this.stamValEl.textContent = '100%';
    stHdr.appendChild(this.stamValEl);
    bars.appendChild(stHdr);

    const stWrap = document.createElement('div');
    stWrap.className = 'gc-bar-track';
    this.stamBar = document.createElement('div');
    this.stamBar.className = 'gc-bar-fill';
    this.stamBar.style.cssText = 'width:100%;background:linear-gradient(90deg,#0284c7,#38bdf8);';
    stWrap.appendChild(this.stamBar);
    bars.appendChild(stWrap);

    this.blessEl = document.createElement('div');
    this.blessEl.style.cssText = 'font-size:11px;color:#fde047;margin-top:6px;font-weight:700;display:none;';
    bars.appendChild(this.blessEl);

    bl.appendChild(bars);
    el.appendChild(bl);

    // Bottom-center: Pointer-lock hint
    this.lockHintEl = document.createElement('div');
    this.lockHintEl.className = 'gc-panel';
    this.lockHintEl.style.cssText =
      'position:absolute;bottom:16px;left:50%;transform:translateX(-50%);padding:6px 14px;font-size:12px;color:#fde047;border-color:rgba(250,204,21,0.5);';
    this.lockHintEl.textContent = 'Click game to lock mouse · [ESC] release cursor';
    el.appendChild(this.lockHintEl);

    // Bottom-right: Held Item + Compact Controls
    const br = document.createElement('div');
    br.className = 'gc-panel';
    br.style.cssText =
      'position:absolute;bottom:14px;right:14px;padding:10px 14px;text-align:right;max-width:270px;';
    this.heldEl = document.createElement('div');
    this.heldEl.style.cssText = 'font-size:14px;font-weight:800;color:#fff;margin-bottom:2px;';
    this.heldSubEl = document.createElement('div');
    this.heldSubEl.style.cssText = 'font-size:11px;color:#cbd5e1;margin-bottom:6px;';
    const ctrlHint = document.createElement('div');
    ctrlHint.style.cssText = 'font-size:11px;color:#94a3b8;line-height:1.55;border-top:1px solid rgba(148,163,184,0.16);padding-top:6px;';
    ctrlHint.innerHTML =
      '<span class="gc-kbd">E</span> Interact · <span class="gc-kbd">C</span> Crouch · <span class="gc-kbd">F</span> Light<br><span class="gc-kbd">G</span> Drop · <span class="gc-kbd">P</span> Pray · <span class="gc-kbd">B</span> Shop · <span class="gc-kbd">Enter</span> Chat';
    br.append(this.heldEl, this.heldSubEl, ctrlHint);
    el.appendChild(br);

    return el;
  }

  private buildShop(): HTMLDivElement {
    const el = document.createElement('div');
    el.style.cssText =
      'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(4,7,14,0.72);backdrop-filter:blur(5px);pointer-events:auto;';
    const card = document.createElement('div');
    card.className = 'gc-panel';
    card.style.cssText =
      'width:min(440px,92vw);border:2px solid #38bdf8;border-radius:14px;padding:20px;';
    card.innerHTML = `<h2 style="margin:0 0 4px;color:#38bdf8;font-size:20px;">✝ SHED MIRACLE SHOP ✝</h2><div style="font-size:12px;color:#94a3b8;margin-bottom:10px;">Tools appear on the Shed counter or straight in your hands.</div>`;
    this.shopBucksEl = document.createElement('div');
    this.shopBucksEl.style.cssText = 'color:#fde047;font-weight:800;font-size:14px;margin-bottom:12px;';
    card.appendChild(this.shopBucksEl);

    this.shopItemsEl = document.createElement('div');
    this.shopItemsEl.style.cssText = 'display:flex;flex-direction:column;gap:8px;';
    card.appendChild(this.shopItemsEl);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'gc-btn';
    closeBtn.textContent = 'Close Shop (Esc / B)';
    closeBtn.style.cssText =
      'margin-top:14px;width:100%;padding:10px;background:#334155;color:#fff;';
    closeBtn.onclick = () => this.setShopOpen(false);
    card.appendChild(closeBtn);

    el.appendChild(card);
    return el;
  }

  private buildOverlay(): HTMLDivElement {
    const el = document.createElement('div');
    el.style.cssText =
      'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(5,7,12,0.84);backdrop-filter:blur(6px);pointer-events:auto;';
    return el;
  }

  public showMenu(err = ''): void {
    this.menuEl.style.display = 'flex';
    this.hudEl.style.display = 'none';
    this.errorEl.textContent = err;
  }

  public showError(err: string): void {
    this.errorEl.textContent = err;
  }

  public showGame(): void {
    this.menuEl.style.display = 'none';
    this.hudEl.style.display = 'block';
  }

  public setShopOpen(open: boolean, snap?: WorldSnapshot): void {
    this.shopOpen = open;
    this.shopEl.style.display = open ? 'flex' : 'none';
    if (open) {
      document.exitPointerLock?.();
      if (snap) this.renderShopItems(snap);
    }
  }

  private renderShopItems(snap: WorldSnapshot): void {
    this.shopBucksEl.textContent = `Available Gnome Bucks: $${snap.gnomeBucks}`;
    this.shopItemsEl.innerHTML = '';
    for (const kind of SHOP_TOOLS) {
      const def = ITEM_CATALOG[kind];
      const row = document.createElement('div');
      row.style.cssText =
        'display:flex;align-items:center;justify-content:space-between;background:rgba(30,41,59,0.8);border:1px solid rgba(148,163,184,0.18);padding:10px 12px;border-radius:10px;gap:10px;';
      row.innerHTML = `<div><div style="font-weight:700;color:#fff;">${def.name}</div><div style="font-size:11px;color:#94a3b8;margin-top:2px;">${def.description}</div></div>`;
      const btn = document.createElement('button');
      btn.className = 'gc-btn';
      btn.textContent = `$${def.baseValue}`;
      const canAfford = snap.gnomeBucks >= def.baseValue;
      btn.disabled = !canAfford;
      btn.style.cssText = `padding:8px 14px;min-width:62px;cursor:${canAfford ? 'pointer' : 'not-allowed'};background:${canAfford ? '#eab308' : '#334155'};color:${canAfford ? '#111827' : '#94a3b8'};`;
      btn.onclick = () => this.handlers.onBuyTool(kind);
      row.appendChild(btn);
      this.shopItemsEl.appendChild(row);
    }
  }

  public openChat(): void {
    this.chatFocused = true;
    this.chatInput.style.display = 'block';
    this.chatInput.focus();
    document.exitPointerLock?.();
  }

  public closeChat(): void {
    this.chatFocused = false;
    this.chatInput.style.display = 'none';
    this.chatInput.blur();
  }

  public addChat(msg: ChatMessage): void {
    const line = document.createElement('div');
    line.innerHTML = `<span style="color:${msg.color};font-weight:700;">${msg.sender}:</span> <span>${msg.text.replace(/</g, '&lt;')}</span>`;
    this.chatList.appendChild(line);
    while (this.chatList.children.length > 8) {
      this.chatList.removeChild(this.chatList.firstChild!);
    }
  }

  public setPrompt(text: string | null): void {
    if (!text) {
      this.promptEl.style.display = 'none';
      this.crosshairDot.style.background = 'rgba(255,255,255,0.88)';
      this.crosshairDot.style.transform = 'scale(1)';
    } else {
      this.promptEl.textContent = text;
      this.promptEl.style.display = 'inline-block';
      this.crosshairDot.style.background = '#fde047';
      this.crosshairDot.style.transform = 'scale(1.35)';
    }
  }

  private formatDirection(
    fromX: number,
    fromZ: number,
    yaw: number,
    toX: number,
    toZ: number,
    label: string,
  ): string {
    const dx = toX - fromX;
    const dz = toZ - fromZ;
    const dist = Math.round(Math.hypot(dx, dz));
    // Forward vector in Three.js camera is (-sin(yaw), -cos(yaw))
    const targetAng = Math.atan2(-dx, -dz);
    let rel = (targetAng - yaw) % (Math.PI * 2);
    if (rel > Math.PI) rel -= Math.PI * 2;
    if (rel < -Math.PI) rel += Math.PI * 2;
    const arrow =
      Math.abs(rel) < 0.45
        ? '↑'
        : Math.abs(rel) > 2.65
          ? '↓'
          : rel > 0
            ? '←'
            : '→';
    return `${label} ${arrow}${dist}m`;
  }

  public update(
    snap: WorldSnapshot,
    myId: string,
    localStamina: number,
    extra?: HudExtraState,
  ): void {
    const me = snap.players[myId];
    if (!me) return;

    const pct = Math.min(100, Math.round((snap.quotaProgress / Math.max(1, snap.quotaTarget)) * 100));
    const quotaMet = snap.quotaProgress >= snap.quotaTarget;
    this.quotaEl.innerHTML = `<span>QUOTA: $${snap.quotaProgress} / $${snap.quotaTarget}</span><span style="font-size:11px;color:${quotaMet ? '#4ade80' : '#cbd5e1'};">${pct}%</span>`;
    this.quotaBar.style.width = `${pct}%`;
    this.quotaBar.style.background = quotaMet
      ? 'linear-gradient(90deg,#22c55e,#4ade80)'
      : 'linear-gradient(90deg,#ca8a04,#facc15)';

    const zoneNames = {
      shed: 'Garden Shed',
      yard: 'Suburban Yard',
      deku: 'Great Deku Oak',
      house: 'Cursed House',
    };
    this.metaEl.innerHTML = `
      <span class="gc-pill" style="background:rgba(51,65,85,0.75);color:#e2e8f0;">Day ${snap.day}/3 · Cyc ${snap.cycle}</span>
      <span class="gc-pill" style="background:rgba(234,179,8,0.18);color:#fde047;">$${snap.gnomeBucks}</span>
      <span class="gc-pill" style="background:rgba(56,189,248,0.16);color:#7dd3fc;">${zoneNames[me.zone]}</span>
      ${snap.roomCode !== 'SOLO' ? `<span class="gc-pill" style="background:rgba(168,85,247,0.2);color:#e9d5ff;">${snap.roomCode}</span>` : ''}
    `;

    this.playersListEl.innerHTML = Object.values(snap.players)
      .map(
        (p) =>
          `<span style="color:${p.color};font-weight:700;">●</span> ${p.name} <span style="color:#94a3b8;">${p.alive ? `(${p.zone})` : '💀'}</span>`,
      )
      .join(' · ');

    // Day Clock + Yard Compass
    const timeLabel =
      snap.phase !== 'yard'
        ? 'IN SHED'
        : snap.dayTime < 0.35
          ? 'MORNING'
          : snap.dayTime < 0.62
            ? 'AFTERNOON'
            : snap.dayTime < 0.85
              ? 'DUSK'
              : 'MIDNIGHT!';
    this.dayLabelEl.textContent = timeLabel;
    this.dayLabelEl.style.color =
      snap.dayTime >= 0.85 ? '#f87171' : snap.dayTime >= 0.62 ? '#fbbf24' : '#7dd3fc';
    this.dayBarEl.style.width = `${Math.min(100, Math.round(snap.dayTime * 100))}%`;
    this.dayBarEl.style.background =
      snap.dayTime >= 0.85 ? '#ef4444' : snap.dayTime >= 0.62 ? '#f59e0b' : '#38bdf8';

    if (me.zone === 'yard' && extra) {
      const dShed = this.formatDirection(extra.localX, extra.localZ, extra.localYaw, PORTALS.yardToShed.x, PORTALS.yardToShed.z, 'Shed');
      const dDeku = this.formatDirection(extra.localX, extra.localZ, extra.localYaw, PORTALS.yardToDeku.x, PORTALS.yardToDeku.z, 'Oak');
      const dHouse = this.formatDirection(extra.localX, extra.localZ, extra.localYaw, PORTALS.yardToHouse.x, PORTALS.yardToHouse.z, 'House');
      this.compassEl.textContent = `· ${dShed} · ${dDeku} · ${dHouse}`;
    } else {
      this.compassEl.textContent = '';
    }

    // Sermon banner (bright on new sermon, softens after 6s)
    if (snap.sermon.seq !== this.lastSermonSeq) {
      this.lastSermonSeq = snap.sermon.seq;
      this.sermonTimer = performance.now();
    }
    const sermonAge = (performance.now() - this.sermonTimer) / 1000;
    this.sermonEl.textContent = `✝ GNOME JESUS: "${snap.sermon.text}"`;
    this.sermonEl.style.opacity = sermonAge > 7 ? '0.62' : '1';
    this.sermonEl.style.borderColor =
      snap.sermon.tone === 'angry'
        ? '#ef4444'
        : snap.sermon.tone === 'spooky'
          ? '#a855f7'
          : 'rgba(234,179,8,0.7)';

    // Stealth Pill
    if (extra) {
      if (extra.inBush && extra.crouching) {
        this.stealthPillEl.textContent = '🌿 HIDDEN IN BUSH (STEALTH MAX)';
        this.stealthPillEl.style.background = 'rgba(22,163,74,0.28)';
        this.stealthPillEl.style.color = '#86efac';
      } else if (extra.inBush) {
        this.stealthPillEl.textContent = '🌿 IN BUSH (PRESS C TO CROUCH)';
        this.stealthPillEl.style.background = 'rgba(22,163,74,0.2)';
        this.stealthPillEl.style.color = '#bbf7d0';
      } else if (extra.crouching) {
        this.stealthPillEl.textContent = '🤫 CROUCHING (QUIET & LOW)';
        this.stealthPillEl.style.background = 'rgba(14,165,233,0.22)';
        this.stealthPillEl.style.color = '#7dd3fc';
      } else if (extra.flashlightOn) {
        this.stealthPillEl.textContent = '🔦 FLASHLIGHT ON (HIGH VISIBILITY)';
        this.stealthPillEl.style.background = 'rgba(234,179,8,0.22)';
        this.stealthPillEl.style.color = '#fde047';
      } else {
        this.stealthPillEl.textContent = '👁 STANDING (USE BUSHES & HEDGES)';
        this.stealthPillEl.style.background = 'rgba(51,65,85,0.65)';
        this.stealthPillEl.style.color = '#cbd5e1';
      }
      this.lockHintEl.style.display =
        extra.pointerLocked || this.shopOpen || this.chatFocused ? 'none' : 'block';
    }

    const hpPct = Math.max(0, (me.hp / me.maxHp) * 100);
    this.hpBar.style.width = `${hpPct}%`;
    this.hpValEl.textContent = `${Math.ceil(me.hp)}/${me.maxHp}`;
    const stamPct = Math.max(0, Math.round(localStamina));
    this.stamBar.style.width = `${stamPct}%`;
    this.stamValEl.textContent = `${stamPct}%`;
    this.damageFlashEl.style.opacity = me.damageFlash > 0 ? '1' : '0';

    if (me.blessingTimer > 0) {
      this.blessEl.style.display = 'block';
      this.blessEl.textContent = `✝ HOLY SPEED BLESSING (${Math.ceil(me.blessingTimer)}s)`;
    } else {
      this.blessEl.style.display = 'none';
    }

    if (me.heldItemId && snap.items[me.heldItemId]) {
      const item = snap.items[me.heldItemId];
      this.heldEl.textContent = item.name;
      this.heldEl.style.color = item.cursed ? '#e879f9' : '#fde047';
      this.heldSubEl.textContent =
        item.category === 'loot'
          ? `Loot Value: $${item.value}${item.cursed ? ' · CURSED' : ''} · Tithe in Shed`
          : `Tool · Left Click to Use`;
    } else if (!me.alive) {
      this.heldEl.textContent = 'SHATTERED';
      this.heldEl.style.color = '#f87171';
      this.heldSubEl.textContent = 'Spectating until Day End';
    } else {
      this.heldEl.textContent = 'Hands Empty';
      this.heldEl.style.color = '#cbd5e1';
      this.heldSubEl.textContent = 'Approach loot & press [E] to pick up';
    }

    if (this.shopOpen) {
      this.renderShopItems(snap);
    }

    if (snap.phase === 'day_summary') {
      this.overlayEl.style.display = 'flex';
      this.overlayEl.innerHTML = `<div class="gc-panel" style="text-align:center;max-width:480px;padding:26px;border:2px solid #eab308;"><h2 style="color:#fde047;margin:0 0 8px;">DAY ${snap.day}/3 COMPLETE</h2><p style="color:#e2e8f0;margin:0 0 10px;">${snap.summaryText}</p><div style="font-size:12px;color:#94a3b8;">Quota Progress: $${snap.quotaProgress} / $${snap.quotaTarget}</div></div>`;
    } else if (snap.phase === 'game_over') {
      this.overlayEl.style.display = 'flex';
      this.overlayEl.innerHTML = '';
      const box = document.createElement('div');
      box.className = 'gc-panel';
      box.style.cssText =
        'text-align:center;max-width:480px;padding:28px;background:rgba(31,16,20,0.94);border:2px solid #ef4444;';
      box.innerHTML = `<h2 style="color:#ef4444;margin:0 0 8px;">INTO THE COMPOST PIT!</h2><p style="color:#fecaca;margin:0 0 18px;">Quota missed ($${snap.quotaProgress} / $${snap.quotaTarget}). Gnome Jesus hath flushed your flock.</p>`;
      const retry = document.createElement('button');
      retry.className = 'gc-btn';
      retry.textContent = 'Reincarnate in Shed';
      retry.style.cssText = 'padding:11px 22px;background:#eab308;color:#111827;font-size:14px;';
      retry.onclick = () => this.handlers.onPullLever();
      box.appendChild(retry);
      this.overlayEl.appendChild(box);
    } else {
      this.overlayEl.style.display = 'none';
    }
  }
}
