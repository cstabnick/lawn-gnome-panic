import { GNOME_COLORS, ITEM_CATALOG, SHOP_TOOLS } from './shared/catalog';
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

export class GameUI {
  private root: HTMLDivElement;
  private menuEl: HTMLDivElement;
  private hudEl: HTMLDivElement;
  private shopEl: HTMLDivElement;
  private overlayEl: HTMLDivElement;
  // What the overlay currently shows. update() runs every frame, so the overlay is
  // only rebuilt when this changes; rebuilding each frame made its button unclickable.
  private overlayKey = '';

  private errorEl!: HTMLDivElement;
  private quotaEl!: HTMLDivElement;
  private metaEl!: HTMLDivElement;
  private sermonEl!: HTMLDivElement;
  private promptEl!: HTMLDivElement;
  private hpBar!: HTMLDivElement;
  private stamBar!: HTMLDivElement;
  private blessEl!: HTMLDivElement;
  private heldEl!: HTMLDivElement;
  private chatList!: HTMLDivElement;
  private chatInput!: HTMLInputElement;
  private shopBucksEl!: HTMLDivElement;
  private shopItemsEl!: HTMLDivElement;
  private damageFlashEl!: HTMLDivElement;
  private playersListEl!: HTMLDivElement;

  private selectedColor = GNOME_COLORS[0];
  public shopOpen = false;
  public chatFocused = false;

  constructor(private handlers: UiHandlers) {
    const parent = document.getElementById('ui')!;
    this.root = document.createElement('div');
    this.root.style.cssText = 'position:absolute;inset:0;pointer-events:none;font-size:14px;';
    parent.appendChild(this.root);

    this.damageFlashEl = document.createElement('div');
    this.damageFlashEl.style.cssText =
      'position:absolute;inset:0;background:radial-gradient(circle,transparent 40%,rgba(220,38,38,0.65) 100%);opacity:0;transition:opacity 0.15s;pointer-events:none;';
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
      'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at top,rgba(250,204,21,0.16),rgba(9,11,16,0.94));pointer-events:auto;';

    const card = document.createElement('div');
    card.style.cssText =
      'width:min(460px,92vw);background:rgba(20,24,33,0.95);border:2px solid #eab308;border-radius:14px;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,0.7);text-align:center;';

    card.innerHTML = `
      <div style="font-size:12px;letter-spacing:2px;color:#fde047;text-transform:uppercase;margin-bottom:4px;">✝ Lethal Suburban Scavenging ✝</div>
      <h1 style="margin:0 0 6px;font-size:28px;color:#fff;">GNOME COMPANY</h1>
      <div style="font-size:13px;color:#cbd5e1;margin-bottom:16px;">The Chapel of Mulch · Serve Omnipresent Gnome Jesus</div>
    `;

    const nameInput = document.createElement('input');
    nameInput.placeholder = 'Your Gnome Name (e.g. Brother Sprout)';
    nameInput.value = `Sprout${Math.floor(10 + Math.random() * 89)}`;
    nameInput.maxLength = 16;
    nameInput.style.cssText =
      'width:100%;box-sizing:border-box;padding:10px 12px;border-radius:8px;border:1px solid #475569;background:#0f172a;color:#fff;font-size:14px;margin-bottom:12px;';
    card.appendChild(nameInput);

    // Hat color picker
    const colorRow = document.createElement('div');
    colorRow.style.cssText = 'display:flex;gap:8px;justify-content:center;margin-bottom:16px;';
    GNOME_COLORS.forEach((c, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.style.cssText = `width:28px;height:28px;border-radius:50%;background:${c};border:3px solid ${idx === 0 ? '#fff' : 'transparent'};cursor:pointer;`;
      btn.onclick = () => {
        this.selectedColor = c;
        Array.from(colorRow.children).forEach((ch) => {
          (ch as HTMLElement).style.borderColor = 'transparent';
        });
        btn.style.borderColor = '#fff';
      };
      colorRow.appendChild(btn);
    });
    card.appendChild(colorRow);

    const btnStyle =
      'width:100%;padding:11px;border-radius:8px;border:none;font-weight:700;font-size:14px;cursor:pointer;margin-bottom:8px;';

    const soloBtn = document.createElement('button');
    soloBtn.textContent = 'Play Solo (Offline Pilgrimage)';
    soloBtn.style.cssText = btnStyle + 'background:#eab308;color:#111827;';
    soloBtn.onclick = () => this.handlers.onSolo(nameInput.value, this.selectedColor);
    card.appendChild(soloBtn);

    const hostBtn = document.createElement('button');
    hostBtn.textContent = 'Host Multiplayer Shed';
    hostBtn.style.cssText = btnStyle + 'background:#22c55e;color:#052e16;';
    hostBtn.onclick = () => this.handlers.onCreateRoom(nameInput.value, this.selectedColor);
    card.appendChild(hostBtn);

    const quickBtn = document.createElement('button');
    quickBtn.textContent = 'Quick Join Multiplayer';
    quickBtn.style.cssText = btnStyle + 'background:#3b82f6;color:#fff;';
    quickBtn.onclick = () => this.handlers.onQuickJoin(nameInput.value, this.selectedColor);
    card.appendChild(quickBtn);

    const joinRow = document.createElement('div');
    joinRow.style.cssText = 'display:flex;gap:8px;margin-top:4px;';
    const codeInput = document.createElement('input');
    codeInput.placeholder = 'SHED CODE';
    codeInput.maxLength = 4;
    codeInput.style.cssText =
      'flex:1;padding:10px;border-radius:8px;border:1px solid #475569;background:#0f172a;color:#fff;text-transform:uppercase;text-align:center;font-weight:700;';
    const joinBtn = document.createElement('button');
    joinBtn.textContent = 'Join Shed';
    joinBtn.style.cssText =
      'padding:10px 16px;border-radius:8px;border:none;background:#a855f7;color:#fff;font-weight:700;cursor:pointer;';
    joinBtn.onclick = () =>
      this.handlers.onJoinRoom(codeInput.value, nameInput.value, this.selectedColor);
    joinRow.append(codeInput, joinBtn);
    card.appendChild(joinRow);

    this.errorEl = document.createElement('div');
    this.errorEl.style.cssText = 'color:#f87171;font-size:13px;margin-top:10px;min-height:18px;';
    card.appendChild(this.errorEl);

    const hint = document.createElement('div');
    hint.style.cssText = 'font-size:12px;color:#94a3b8;margin-top:8px;line-height:1.45;';
    hint.innerHTML =
      '<b>WASD</b> Move · <b>Shift</b> Sprint · <b>E</b> Interact / Enter Tree & House · <b>Click</b> Use Item / Throw Ball · <b>G</b> Drop · <b>P</b> Pray';
    card.appendChild(hint);

    el.appendChild(card);
    return el;
  }

  private buildHud(): HTMLDivElement {
    const el = document.createElement('div');
    el.id = 'gnome-hud';
    el.style.cssText = 'position:absolute;inset:0;pointer-events:none;';

    // Top-left panel
    const tl = document.createElement('div');
    tl.style.cssText =
      'position:absolute;top:14px;left:14px;background:rgba(15,23,42,0.78);border:1px solid rgba(250,204,21,0.45);border-radius:10px;padding:10px 14px;min-width:225px;';
    this.quotaEl = document.createElement('div');
    this.quotaEl.style.cssText = 'font-size:16px;font-weight:800;color:#fde047;';
    this.metaEl = document.createElement('div');
    this.metaEl.style.cssText = 'font-size:12px;color:#cbd5e1;margin-top:3px;';
    this.playersListEl = document.createElement('div');
    this.playersListEl.style.cssText = 'font-size:11px;color:#94a3b8;margin-top:6px;line-height:1.4;';
    tl.append(this.quotaEl, this.metaEl, this.playersListEl);
    el.appendChild(tl);

    // Top-right mute button
    const muteBtn = document.createElement('button');
    muteBtn.textContent = '🔊 Sound';
    muteBtn.style.cssText =
      'position:absolute;top:14px;right:14px;pointer-events:auto;background:rgba(15,23,42,0.8);color:#e2e8f0;border:1px solid #475569;border-radius:8px;padding:6px 10px;cursor:pointer;font-size:12px;';
    muteBtn.onclick = () => {
      const m = this.handlers.onToggleMute();
      muteBtn.textContent = m ? '🔇 Muted' : '🔊 Sound';
    };
    el.appendChild(muteBtn);

    // Top-center Gnome Jesus Sermon Banner
    this.sermonEl = document.createElement('div');
    this.sermonEl.style.cssText =
      'position:absolute;top:14px;left:50%;transform:translateX(-50%);max-width:min(580px,54vw);background:rgba(15,23,42,0.86);border:2px solid #eab308;border-radius:10px;padding:8px 16px;text-align:center;font-weight:700;font-size:13px;color:#fef08a;box-shadow:0 6px 24px rgba(0,0,0,0.5);';
    el.appendChild(this.sermonEl);

    // Crosshair + Prompt
    const center = document.createElement('div');
    center.style.cssText =
      'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;';
    const dot = document.createElement('div');
    dot.style.cssText =
      'width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.85);margin:0 auto 10px;box-shadow:0 0 4px #000;';
    this.promptEl = document.createElement('div');
    this.promptEl.style.cssText =
      'background:rgba(0,0,0,0.72);color:#fef08a;padding:4px 10px;border-radius:6px;font-size:13px;font-weight:700;display:none;white-space:nowrap;';
    center.append(dot, this.promptEl);
    el.appendChild(center);

    // Bottom-left: HP, Stamina, Chat
    const bl = document.createElement('div');
    bl.style.cssText = 'position:absolute;bottom:14px;left:14px;width:270px;';

    this.chatList = document.createElement('div');
    this.chatList.style.cssText =
      'max-height:110px;overflow-y:auto;margin-bottom:8px;font-size:12px;text-shadow:0 1px 2px #000;display:flex;flex-direction:column;gap:2px;';
    bl.appendChild(this.chatList);

    this.chatInput = document.createElement('input');
    this.chatInput.placeholder = 'Press Enter to chat...';
    this.chatInput.style.cssText =
      'width:100%;box-sizing:border-box;padding:6px 8px;border-radius:6px;border:1px solid #475569;background:rgba(15,23,42,0.88);color:#fff;font-size:12px;margin-bottom:8px;display:none;pointer-events:auto;';
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
    bars.style.cssText =
      'background:rgba(15,23,42,0.82);border:1px solid #334155;border-radius:8px;padding:8px 10px;';
    bars.innerHTML = `<div style="font-size:11px;color:#fca5a5;margin-bottom:3px;">CERAMIC INTEGRITY (HP)</div>`;
    const hpWrap = document.createElement('div');
    hpWrap.style.cssText = 'height:8px;background:#1e293b;border-radius:4px;overflow:hidden;margin-bottom:6px;';
    this.hpBar = document.createElement('div');
    this.hpBar.style.cssText = 'height:100%;width:100%;background:#ef4444;transition:width 0.1s;';
    hpWrap.appendChild(this.hpBar);
    bars.appendChild(hpWrap);

    const stLabel = document.createElement('div');
    stLabel.style.cssText = 'font-size:11px;color:#93c5fd;margin-bottom:3px;';
    stLabel.textContent = 'STAMINA';
    bars.appendChild(stLabel);
    const stWrap = document.createElement('div');
    stWrap.style.cssText = 'height:6px;background:#1e293b;border-radius:4px;overflow:hidden;';
    this.stamBar = document.createElement('div');
    this.stamBar.style.cssText = 'height:100%;width:100%;background:#38bdf8;';
    stWrap.appendChild(this.stamBar);
    bars.appendChild(stWrap);

    this.blessEl = document.createElement('div');
    this.blessEl.style.cssText = 'font-size:11px;color:#fde047;margin-top:4px;font-weight:700;display:none;';
    bars.appendChild(this.blessEl);

    bl.appendChild(bars);
    el.appendChild(bl);

    // Bottom-right: Held Item + Controls
    const br = document.createElement('div');
    br.style.cssText =
      'position:absolute;bottom:14px;right:14px;background:rgba(15,23,42,0.82);border:1px solid #334155;border-radius:10px;padding:10px 14px;text-align:right;max-width:250px;';
    this.heldEl = document.createElement('div');
    this.heldEl.style.cssText = 'font-size:14px;font-weight:700;color:#fff;margin-bottom:4px;';
    const ctrlHint = document.createElement('div');
    ctrlHint.style.cssText = 'font-size:11px;color:#94a3b8;line-height:1.4;';
    ctrlHint.innerHTML =
      'Click game to lock mouse · <b>E</b> Interact<br><b>Left Click</b> Use · <b>G</b> Drop · <b>P</b> Pray · <b>B</b> Shop';
    br.append(this.heldEl, ctrlHint);
    el.appendChild(br);

    return el;
  }

  private buildShop(): HTMLDivElement {
    const el = document.createElement('div');
    el.style.cssText =
      'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.65);pointer-events:auto;';
    const card = document.createElement('div');
    card.style.cssText =
      'width:min(420px,90vw);background:#111827;border:2px solid #38bdf8;border-radius:12px;padding:20px;';
    card.innerHTML = `<h2 style="margin:0 0 6px;color:#38bdf8;">✝ SHED MIRACLE SHOP ✝</h2>`;
    this.shopBucksEl = document.createElement('div');
    this.shopBucksEl.style.cssText = 'color:#fde047;font-weight:700;margin-bottom:12px;';
    card.appendChild(this.shopBucksEl);

    this.shopItemsEl = document.createElement('div');
    this.shopItemsEl.style.cssText = 'display:flex;flex-direction:column;gap:8px;';
    card.appendChild(this.shopItemsEl);

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close (Esc / B)';
    closeBtn.style.cssText =
      'margin-top:12px;width:100%;padding:9px;border:none;border-radius:8px;background:#334155;color:#fff;cursor:pointer;font-weight:700;';
    closeBtn.onclick = () => this.setShopOpen(false);
    card.appendChild(closeBtn);

    el.appendChild(card);
    return el;
  }

  private buildOverlay(): HTMLDivElement {
    const el = document.createElement('div');
    el.style.cssText =
      'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(5,5,10,0.82);pointer-events:auto;';
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
    this.shopBucksEl.textContent = `Gnome Bucks: $${snap.gnomeBucks}`;
    this.shopItemsEl.innerHTML = '';
    for (const kind of SHOP_TOOLS) {
      const def = ITEM_CATALOG[kind];
      const row = document.createElement('div');
      row.style.cssText =
        'display:flex;align-items:center;justify-content:space-between;background:#1e293b;padding:8px 10px;border-radius:8px;gap:8px;';
      row.innerHTML = `<div><div style="font-weight:700;color:#fff;">${def.name}</div><div style="font-size:11px;color:#94a3b8;">${def.description}</div></div>`;
      const btn = document.createElement('button');
      btn.textContent = `$${def.baseValue}`;
      const canAfford = snap.gnomeBucks >= def.baseValue;
      btn.disabled = !canAfford;
      btn.style.cssText = `padding:7px 12px;border:none;border-radius:6px;font-weight:700;cursor:${canAfford ? 'pointer' : 'not-allowed'};background:${canAfford ? '#eab308' : '#475569'};color:#111827;`;
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
    } else {
      this.promptEl.textContent = text;
      this.promptEl.style.display = 'inline-block';
    }
  }

  public update(snap: WorldSnapshot, myId: string, localStamina: number): void {
    const me = snap.players[myId];
    if (!me) return;

    this.quotaEl.textContent = `QUOTA: $${snap.quotaProgress} / $${snap.quotaTarget}`;
    const timeLabel =
      snap.phase !== 'yard'
        ? 'IN SHED'
        : snap.dayTime < 0.35
          ? 'MORNING'
          : snap.dayTime < 0.62
            ? 'AFTERNOON'
            : snap.dayTime < 0.85
              ? 'DUSK (DANGER)'
              : 'MIDNIGHT!!';
    const zoneNames = {
      shed: 'Garden Shed',
      yard: 'Suburban Yard',
      deku: 'Great Deku Oak',
      house: 'Cursed House',
    };
    this.metaEl.textContent = `Day ${snap.day}/3 · Cycle ${snap.cycle} · ${timeLabel} · Bucks: $${snap.gnomeBucks} · ${zoneNames[me.zone]} · Room: ${snap.roomCode}`;

    this.playersListEl.innerHTML = Object.values(snap.players)
      .map(
        (p) =>
          `<span style="color:${p.color};font-weight:700;">● ${p.name}</span> ${p.alive ? `(${p.zone})` : '💀'}`,
      )
      .join(' · ');

    this.sermonEl.textContent = `✝ GNOME JESUS: "${snap.sermon.text}"`;
    this.sermonEl.style.borderColor =
      snap.sermon.tone === 'angry'
        ? '#ef4444'
        : snap.sermon.tone === 'spooky'
          ? '#a855f7'
          : '#eab308';

    this.hpBar.style.width = `${Math.max(0, (me.hp / me.maxHp) * 100)}%`;
    this.stamBar.style.width = `${Math.max(0, localStamina)}%`;
    this.damageFlashEl.style.opacity = me.damageFlash > 0 ? '1' : '0';

    if (me.blessingTimer > 0) {
      this.blessEl.style.display = 'block';
      this.blessEl.textContent = `✝ HOLY SPEED BLESSING (${Math.ceil(me.blessingTimer)}s)`;
    } else {
      this.blessEl.style.display = 'none';
    }

    if (me.heldItemId && snap.items[me.heldItemId]) {
      const item = snap.items[me.heldItemId];
      this.heldEl.textContent = `${item.name}${item.category === 'loot' ? ` ($${item.value})` : ''}${item.cursed ? ' [CURSED]' : ''}`;
      this.heldEl.style.color = item.cursed ? '#e879f9' : '#fde047';
    } else if (!me.alive) {
      this.heldEl.textContent = 'SHATTERED (Spectating until Day End)';
      this.heldEl.style.color = '#f87171';
    } else {
      this.heldEl.textContent = 'Hands Empty';
      this.heldEl.style.color = '#cbd5e1';
    }

    if (this.shopOpen) {
      this.renderShopItems(snap);
    }

    const overlayKey =
      snap.phase === 'day_summary'
        ? `summary|${snap.day}|${snap.summaryText}`
        : snap.phase === 'game_over'
          ? `over|${snap.quotaProgress}|${snap.quotaTarget}`
          : '';
    if (overlayKey === this.overlayKey) return;
    this.overlayKey = overlayKey;

    if (snap.phase === 'day_summary') {
      this.overlayEl.style.display = 'flex';
      this.overlayEl.innerHTML = `<div style="text-align:center;max-width:480px;padding:24px;background:#111827;border:2px solid #eab308;border-radius:12px;"><h2 style="color:#fde047;margin:0 0 8px;">DAY ${snap.day} COMPLETE</h2><p style="color:#e2e8f0;margin:0;">${snap.summaryText}</p></div>`;
    } else if (snap.phase === 'game_over') {
      this.overlayEl.style.display = 'flex';
      this.overlayEl.innerHTML = '';
      const box = document.createElement('div');
      box.style.cssText =
        'text-align:center;max-width:480px;padding:26px;background:#1f1014;border:2px solid #ef4444;border-radius:12px;';
      box.innerHTML = `<h2 style="color:#ef4444;margin:0 0 8px;">INTO THE COMPOST PIT!</h2><p style="color:#fecaca;margin:0 0 16px;">Quota missed ($${snap.quotaProgress} / $${snap.quotaTarget}). Gnome Jesus hath flushed your flock.</p>`;
      const retry = document.createElement('button');
      retry.textContent = 'Reincarnate in Shed';
      retry.style.cssText =
        'padding:10px 20px;border:none;border-radius:8px;background:#eab308;color:#111827;font-weight:700;cursor:pointer;';
      retry.onclick = () => this.handlers.onPullLever();
      box.appendChild(retry);
      this.overlayEl.appendChild(box);
    } else {
      this.overlayEl.style.display = 'none';
    }
  }
}
