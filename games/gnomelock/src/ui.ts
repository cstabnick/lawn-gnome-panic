// Gnomelock Title Screen, Interactive Lobby Creator, HUD, Shop, Minimap, Scoreboard, and End Screen.
import { createVolumeButton } from '@arcade/volume';
import { prefabIconElement } from '@lawn/prefabs';
import { volumeStore } from './audio';
import type { LobbySlot, LobbyState } from './net/lobby';
import {
  BOT_DIFFICULTY_SKILL,
  type BotDifficulty,
} from './net/protocol';
import { MATCH_CONFIG, TEAM_NAMES, type AbilitySlot, type HeroId, type Team } from './sim/config';
import { HERO_LIST, HEROES } from './sim/heroes';
import { ITEMS, type ItemCategory } from './sim/items';
import { isNearShop, MAP_BOUNDS, RELIC_ALTAR, SHOPS } from './sim/map';
import { teamTotalAcorns, type MatchState } from './sim/world';
import { spellIconSvg } from './spellIcons';

export interface GnomelockUICallbacks {
  onCreatePrivateLobby: () => void;
  onQuickPlayOnline: () => void;
  onJoinCode: (roomCode: string) => void;
  onOpenSoloLobby: () => void;
  onLeaveLobby: () => void;
  onPickHero: (heroId: HeroId) => void;
  onClaimSlot: (slot: number) => void;
  onSwapTeam: () => void;
  onAddBot: (slot: number) => void;
  onRemoveBot: (slot: number) => void;
  onSetBotHero: (slot: number, heroId: HeroId) => void;
  onSetBotSkill: (slot: number, skill: number) => void;
  onFillBots: () => void;
  onClearBots: () => void;
  onSetDifficulty: (difficulty: BotDifficulty) => void;
  onStartMatch: () => void;
  onBuyItem: (itemId: string) => void;
  onShopToggle: (open: boolean) => void;
  onReturnToLobby: () => void;
  onPlayAgain: () => void;
}

interface FloatingText {
  el: HTMLDivElement;
  x: number;
  y: number;
  z: number;
  ttl: number;
  maxTtl: number;
  big: boolean;
}

export class GnomelockUI {
  readonly root: HTMLDivElement;
  private titleEl: HTMLDivElement;
  private lobbyEl: HTMLDivElement;
  private hudEl: HTMLDivElement;
  private shopEl: HTMLDivElement;
  private scoreEl: HTMLDivElement;
  private endEl: HTMLDivElement;

  private shopOpen = false;
  private shopTab: ItemCategory = 'weapon';
  private floating: FloatingText[] = [];

  // Title & Lobby dynamic refs
  private statusEl!: HTMLDivElement;
  private lobbyStatusEl!: HTMLDivElement;
  private lobbyRoomBadgeEl!: HTMLDivElement;
  private lobbyRolePillEl!: HTMLDivElement;
  private lobbyCopyBtn!: HTMLButtonElement;
  private lobbyTeamsEl!: HTMLDivElement;
  private lobbyToolbarEl!: HTMLDivElement;
  private lobbyHeroGridEl!: HTMLDivElement;
  private lobbyHeroInfoEl!: HTMLDivElement;
  private lobbyFooterEl!: HTMLDivElement;
  private currentRoomCode: string | null = null;

  // HUD refs
  private clockEl!: HTMLDivElement;
  private scoreAmberEl!: HTMLDivElement;
  private scoreSapphireEl!: HTMLDivElement;
  private relicBannerEl!: HTMLDivElement;
  private hpFillEl!: HTMLDivElement;
  private hpTrailEl!: HTMLDivElement;
  private shieldFillEl!: HTMLDivElement;
  private hpTextEl!: HTMLDivElement;
  private hpTrailPct = 100;
  private acornEl!: HTMLDivElement;
  private levelEl!: HTMLDivElement;
  private ammoEl!: HTMLDivElement;
  private reticleAmmoEl!: HTMLDivElement;
  private staminaWrapEl!: HTMLDivElement;
  private flowBadgeEl!: HTMLDivElement;
  private flowBarFillEl!: HTMLDivElement;
  private hitmarkerEl!: HTMLDivElement;
  private crosshairTicks: HTMLDivElement[] = [];
  private crosshairBloom = 0;
  private isAdsState = false;
  private speedVignetteEl!: HTMLDivElement;
  private abilityEls = new Map<AbilitySlot, { el: HTMLDivElement; icon: HTMLDivElement; cd: HTMLDivElement; dim: HTMLDivElement }>();
  private lastHudHeroId: HeroId | null = null;
  private ownedItemsEl!: HTMLDivElement;
  private shopHintEl!: HTMLDivElement;
  private minimapCanvas!: HTMLCanvasElement;
  private minimapCtx!: CanvasRenderingContext2D;
  private feedEl!: HTMLDivElement;

  private callbacks: GnomelockUICallbacks;

  constructor(uiParent: HTMLElement, callbacks: GnomelockUICallbacks) {
    this.callbacks = callbacks;
    this.root = document.createElement('div');
    this.root.id = 'gnomelock-root';
    this.root.style.cssText = 'position:fixed;inset:0;pointer-events:none;font-family:system-ui,-apple-system,sans-serif;';
    uiParent.appendChild(this.root);

    this.titleEl = this.buildTitleScreen();
    this.lobbyEl = this.buildLobbyScreen();
    this.hudEl = this.buildHud();
    this.shopEl = this.buildShop();
    this.scoreEl = this.buildScoreboard();
    this.endEl = this.buildEndScreen();

    this.root.append(this.titleEl, this.lobbyEl, this.hudEl, this.shopEl, this.scoreEl, this.endEl);
  }

  private buildTitleScreen(): HTMLDivElement {
    const el = document.createElement('div');
    el.id = 'gnomelock-title';
    el.style.cssText = `
      position:fixed;inset:0;pointer-events:auto;overflow-y:auto;
      background:radial-gradient(circle at 50% 25%, rgba(44,58,92,0.92), rgba(16,20,32,0.97));
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      padding:max(20px,env(safe-area-inset-top)) max(18px,env(safe-area-inset-right)) max(20px,env(safe-area-inset-bottom)) max(18px,env(safe-area-inset-left));
      gap:16px;
    `;

    const volBtn = createVolumeButton(el, volumeStore);
    volBtn.element.style.cssText = 'position:fixed;top:max(14px,env(safe-area-inset-top));right:max(14px,env(safe-area-inset-right));z-index:5;';

    const title = document.createElement('h1');
    title.textContent = 'GNOMELOCK';
    title.style.cssText = 'margin:0;font-size:clamp(32px,6vw,52px);letter-spacing:4px;color:#ffd54f;text-shadow:0 3px 14px rgba(0,0,0,0.65);text-align:center;';

    const sub = document.createElement('div');
    sub.textContent = '2v2 Bramble District MOBA • Last-Hit Soul Acorns • Dash-Jump & Slide';
    sub.style.cssText = 'font-size:13px;color:#cbd5e1;text-align:center;max-width:480px;';

    const card = document.createElement('div');
    card.style.cssText = `
      width:min(460px,100%);padding:18px;border-radius:14px;
      background:rgba(12,16,28,0.72);border:1px solid rgba(255,255,255,0.16);
      box-shadow:0 12px 32px rgba(0,0,0,0.45);
      display:flex;flex-direction:column;gap:12px;
    `;

    const createBtn = document.createElement('button');
    createBtn.type = 'button';
    createBtn.textContent = 'Create Private Lobby';
    createBtn.style.cssText = `
      min-height:48px;padding:12px 18px;border-radius:10px;border:none;
      background:linear-gradient(135deg,#f59f00,#e67e22);color:#fff;
      font-weight:800;font-size:15px;cursor:pointer;box-shadow:0 4px 12px rgba(230,126,34,0.35);
    `;
    createBtn.onclick = () => this.callbacks.onCreatePrivateLobby();

    const quickBtn = document.createElement('button');
    quickBtn.type = 'button';
    quickBtn.textContent = 'Quick Play (Public Lobby)';
    quickBtn.style.cssText = `
      min-height:46px;padding:12px 18px;border-radius:10px;border:1px solid rgba(116,185,255,0.4);
      background:#2f64c9;color:#fff;font-weight:800;font-size:15px;cursor:pointer;
    `;
    quickBtn.onclick = () => this.callbacks.onQuickPlayOnline();

    const joinRow = document.createElement('div');
    joinRow.style.cssText = 'display:flex;gap:8px;align-items:stretch;';
    const codeInput = document.createElement('input');
    codeInput.placeholder = 'ROOM CODE';
    codeInput.maxLength = 8;
    codeInput.style.cssText = `
      flex:1;min-width:0;min-height:44px;padding:10px 12px;border-radius:10px;
      border:1px solid rgba(255,255,255,0.24);background:rgba(0,0,0,0.42);
      color:#fff;text-transform:uppercase;font-weight:800;font-size:14px;letter-spacing:1.5px;
    `;
    const joinBtn = document.createElement('button');
    joinBtn.type = 'button';
    joinBtn.textContent = 'Join';
    joinBtn.style.cssText = `
      min-height:44px;min-width:86px;padding:10px 16px;border-radius:10px;
      border:1px solid rgba(255,255,255,0.26);background:rgba(255,255,255,0.14);
      color:#fff;font-weight:800;font-size:14px;cursor:pointer;
    `;
    const submitJoin = () => {
      const c = codeInput.value.trim().toUpperCase();
      this.callbacks.onJoinCode(c || 'BRAMBLE');
    };
    joinBtn.onclick = submitJoin;
    codeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitJoin();
    });
    joinRow.append(codeInput, joinBtn);

    const divider = document.createElement('div');
    divider.style.cssText = 'height:1px;background:rgba(255,255,255,0.12);margin:2px 0;';

    const soloBtn = document.createElement('button');
    soloBtn.type = 'button';
    soloBtn.textContent = 'Solo Skirmish (vs Bots)';
    soloBtn.style.cssText = `
      min-height:44px;padding:10px 16px;border-radius:10px;
      border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.08);
      color:#e2e8f0;font-weight:700;font-size:14px;cursor:pointer;
    `;
    soloBtn.onclick = () => this.callbacks.onOpenSoloLobby();

    this.statusEl = document.createElement('div');
    this.statusEl.id = 'gnomelock-status';
    this.statusEl.style.cssText = 'font-size:13px;color:#ffd54f;min-height:18px;text-align:center;font-weight:600;';

    card.append(createBtn, quickBtn, joinRow, divider, soloBtn);
    el.append(title, sub, card, this.statusEl);
    return el;
  }

  private buildLobbyScreen(): HTMLDivElement {
    const el = document.createElement('div');
    el.id = 'gnomelock-lobby';
    el.style.cssText = `
      position:fixed;inset:0;pointer-events:auto;overflow-y:auto;
      background:radial-gradient(circle at 50% 20%, rgba(44,58,92,0.94), rgba(14,18,28,0.98));
      display:none;flex-direction:column;align-items:center;
      padding:max(14px,env(safe-area-inset-top)) max(14px,env(safe-area-inset-right)) max(20px,env(safe-area-inset-bottom)) max(14px,env(safe-area-inset-left));
      gap:12px;
    `;

    const wrap = document.createElement('div');
    wrap.style.cssText = 'width:min(900px,100%);display:flex;flex-direction:column;gap:12px;margin:auto 0;';

    // Header bar
    const header = document.createElement('div');
    header.style.cssText = `
      display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;
      padding:10px 12px;border-radius:12px;background:rgba(12,16,28,0.78);
      border:1px solid rgba(255,255,255,0.14);
    `;

    const leaveBtn = document.createElement('button');
    leaveBtn.type = 'button';
    leaveBtn.textContent = '← Leave';
    leaveBtn.style.cssText = `
      min-height:44px;padding:8px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.22);
      background:rgba(255,255,255,0.1);color:#fff;font-weight:700;font-size:13px;cursor:pointer;
    `;
    leaveBtn.onclick = () => this.callbacks.onLeaveLobby();

    const roomGroup = document.createElement('div');
    roomGroup.style.cssText = 'display:flex;flex-wrap:wrap;align-items:center;gap:8px;';

    this.lobbyRoomBadgeEl = document.createElement('div');
    this.lobbyRoomBadgeEl.style.cssText = 'font-size:14px;font-weight:800;letter-spacing:1px;color:#ffd54f;';

    this.lobbyCopyBtn = document.createElement('button');
    this.lobbyCopyBtn.type = 'button';
    this.lobbyCopyBtn.textContent = 'Copy Link';
    this.lobbyCopyBtn.style.cssText = `
      min-height:44px;padding:6px 12px;border-radius:8px;border:1px solid rgba(255,213,79,0.45);
      background:rgba(255,213,79,0.14);color:#ffd54f;font-weight:700;font-size:12px;cursor:pointer;
    `;
    this.lobbyCopyBtn.onclick = () => {
      if (!this.currentRoomCode) return;
      const url = `${location.origin}${location.pathname}?room=${this.currentRoomCode}`;
      void navigator.clipboard?.writeText(url).then(() => {
        this.lobbyCopyBtn.textContent = 'Copied!';
        window.setTimeout(() => {
          this.lobbyCopyBtn.textContent = 'Copy Link';
        }, 1500);
      });
    };

    this.lobbyRolePillEl = document.createElement('div');
    this.lobbyRolePillEl.style.cssText = 'padding:4px 10px;border-radius:99px;font-size:11px;font-weight:800;';

    roomGroup.append(this.lobbyRoomBadgeEl, this.lobbyCopyBtn, this.lobbyRolePillEl);
    const headerVol = createVolumeButton(header, volumeStore);
    headerVol.element.style.cssText = 'position:relative;';

    header.append(leaveBtn, roomGroup, headerVol.element);

    this.lobbyStatusEl = document.createElement('div');
    this.lobbyStatusEl.style.cssText = 'font-size:12px;color:#93c5fd;text-align:center;min-height:16px;';

    // Team Arena (Amber vs Sapphire)
    this.lobbyTeamsEl = document.createElement('div');
    this.lobbyTeamsEl.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;';

    // Controls Toolbar
    this.lobbyToolbarEl = document.createElement('div');
    this.lobbyToolbarEl.style.cssText = `
      display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;
      padding:10px 12px;border-radius:10px;background:rgba(12,16,28,0.65);
      border:1px solid rgba(255,255,255,0.12);
    `;

    // Compact Hero Picker
    const heroBox = document.createElement('div');
    heroBox.style.cssText = `
      padding:10px 12px;border-radius:10px;background:rgba(12,16,28,0.65);
      border:1px solid rgba(255,255,255,0.12);display:flex;flex-direction:column;gap:8px;
    `;
    const heroHeading = document.createElement('div');
    heroHeading.textContent = 'Choose Your Hero';
    heroHeading.style.cssText = 'font-size:12px;font-weight:800;color:#cbd5e1;text-transform:uppercase;letter-spacing:0.8px;';

    this.lobbyHeroGridEl = document.createElement('div');
    this.lobbyHeroGridEl.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(108px,1fr));gap:6px;';

    this.lobbyHeroInfoEl = document.createElement('div');
    this.lobbyHeroInfoEl.style.cssText = 'font-size:12px;color:#94a3b8;line-height:1.35;';

    heroBox.append(heroHeading, this.lobbyHeroGridEl, this.lobbyHeroInfoEl);

    // Footer CTA
    this.lobbyFooterEl = document.createElement('div');
    this.lobbyFooterEl.style.cssText = 'display:flex;justify-content:center;align-items:center;';

    wrap.append(
      header,
      this.lobbyStatusEl,
      this.lobbyTeamsEl,
      this.lobbyToolbarEl,
      heroBox,
      this.lobbyFooterEl,
    );
    el.appendChild(wrap);
    return el;
  }

  private renderLobbySlotCard(
    slot: LobbySlot,
    myId: number,
    hostId: number,
    canEdit: boolean,
  ): HTMLDivElement {
    const isAmber = slot.team === 0;
    const isMe = slot.kind === 'human' && slot.playerId === myId;
    const isHost = slot.kind === 'human' && slot.playerId === hostId;

    const card = document.createElement('div');
    card.style.cssText = `
      padding:10px;border-radius:10px;display:flex;flex-direction:column;gap:8px;
      background:${isAmber ? 'rgba(217,54,54,0.12)' : 'rgba(47,100,201,0.12)'};
      border:1.5px solid ${isMe ? '#ffd54f' : isAmber ? 'rgba(255,118,117,0.35)' : 'rgba(116,185,255,0.35)'};
    `;

    if (slot.kind === 'human') {
      const top = document.createElement('div');
      top.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:6px;';
      const nameEl = document.createElement('div');
      nameEl.style.cssText = 'font-weight:800;font-size:14px;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
      nameEl.textContent = slot.name;

      const badges = document.createElement('div');
      badges.style.cssText = 'display:flex;gap:4px;flex-shrink:0;';
      if (isMe) {
        const b = document.createElement('span');
        b.textContent = 'YOU';
        b.style.cssText = 'padding:2px 6px;border-radius:4px;background:#ffd54f;color:#111827;font-size:10px;font-weight:900;';
        badges.appendChild(b);
      }
      if (isHost) {
        const b = document.createElement('span');
        b.textContent = 'HOST';
        b.style.cssText = 'padding:2px 6px;border-radius:4px;background:rgba(230,126,34,0.35);border:1px solid #f59f00;color:#ffd54f;font-size:10px;font-weight:800;';
        badges.appendChild(b);
      }
      top.append(nameEl, badges);

      const hero = HEROES[slot.heroId];
      const sub = document.createElement('div');
      sub.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:8px;';
      const heroTxt = document.createElement('div');
      heroTxt.style.cssText = 'font-size:12px;color:#cbd5e1;font-weight:700;';
      heroTxt.textContent = `${hero.name} • ${hero.role}`;
      const icons = document.createElement('div');
      icons.style.cssText = 'display:flex;gap:4px;';
      for (const ab of ['Q', 'E', 'F', 'X'] as const) {
        const ic = spellIconSvg(slot.heroId, ab);
        const sp = document.createElement('span');
        sp.style.cssText = `display:inline-flex;width:15px;height:15px;color:${ic.color};`;
        sp.innerHTML = ic.svg;
        icons.appendChild(sp);
      }
      sub.append(heroTxt, icons);
      card.append(top, sub);
      return card;
    }

    if (slot.kind === 'bot') {
      const top = document.createElement('div');
      top.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:6px;';
      const title = document.createElement('div');
      title.style.cssText = 'font-weight:800;font-size:13px;color:#e2e8f0;';
      title.textContent = `🤖 ${HEROES[slot.heroId].name} Bot`;

      top.appendChild(title);
      if (canEdit) {
        const rmBtn = document.createElement('button');
        rmBtn.type = 'button';
        rmBtn.textContent = '×';
        rmBtn.title = 'Remove Bot';
        rmBtn.style.cssText = `
          min-width:44px;min-height:44px;border-radius:8px;border:1px solid rgba(255,255,255,0.2);
          background:rgba(255,255,255,0.08);color:#ff7675;font-size:18px;font-weight:800;cursor:pointer;
        `;
        rmBtn.onclick = () => this.callbacks.onRemoveBot(slot.slot);
        top.appendChild(rmBtn);
      }
      card.appendChild(top);

      if (canEdit) {
        const selects = document.createElement('div');
        selects.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;';

        const heroSel = document.createElement('select');
        heroSel.style.cssText = 'flex:1;min-width:110px;min-height:44px;padding:6px 8px;border-radius:8px;background:#131826;color:#fff;border:1px solid rgba(255,255,255,0.2);font-size:12px;';
        for (const h of HERO_LIST) {
          const opt = document.createElement('option');
          opt.value = h.id;
          opt.textContent = h.name;
          if (slot.heroId === h.id) opt.selected = true;
          heroSel.appendChild(opt);
        }
        heroSel.onchange = () => this.callbacks.onSetBotHero(slot.slot, heroSel.value as HeroId);

        const skillSel = document.createElement('select');
        skillSel.style.cssText = 'flex:1;min-width:100px;min-height:44px;padding:6px 8px;border-radius:8px;background:#131826;color:#cbd5e1;border:1px solid rgba(255,255,255,0.18);font-size:12px;';
        for (const [val, lbl] of [
          [0.72, 'Easy (0.72x)'],
          [1.0, 'Normal (1.0x)'],
          [1.18, 'Hard (1.18x)'],
          [1.32, 'Pro (1.32x)'],
        ] as const) {
          const opt = document.createElement('option');
          opt.value = String(val);
          opt.textContent = lbl;
          if (Math.abs(slot.botSkill - val) < 0.02) opt.selected = true;
          skillSel.appendChild(opt);
        }
        skillSel.onchange = () => this.callbacks.onSetBotSkill(slot.slot, Number(skillSel.value));

        selects.append(heroSel, skillSel);
        card.appendChild(selects);
      }

      if (myId >= 0) {
        const takeBtn = document.createElement('button');
        takeBtn.type = 'button';
        takeBtn.textContent = isAmber ? 'Take Amber Slot' : 'Take Sapphire Slot';
        takeBtn.style.cssText = `
          min-height:44px;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,0.22);
          background:rgba(255,255,255,0.08);color:#fff;font-size:12px;font-weight:700;cursor:pointer;
        `;
        takeBtn.onclick = () => this.callbacks.onClaimSlot(slot.slot);
        card.appendChild(takeBtn);
      }
      return card;
    }

    // Empty slot
    const openLabel = document.createElement('div');
    openLabel.textContent = 'Open Slot';
    openLabel.style.cssText = 'font-size:12px;font-weight:700;color:#94a3b8;';

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;';

    const joinSlotBtn = document.createElement('button');
    joinSlotBtn.type = 'button';
    joinSlotBtn.textContent = isAmber ? 'Join Amber' : 'Join Sapphire';
    joinSlotBtn.style.cssText = `
      flex:1;min-height:44px;padding:8px 10px;border-radius:8px;border:none;
      background:${isAmber ? 'rgba(217,54,54,0.65)' : 'rgba(47,100,201,0.75)'};
      color:#fff;font-size:12px;font-weight:800;cursor:pointer;
    `;
    joinSlotBtn.onclick = () => this.callbacks.onClaimSlot(slot.slot);
    btnRow.appendChild(joinSlotBtn);

    if (canEdit) {
      const addBotBtn = document.createElement('button');
      addBotBtn.type = 'button';
      addBotBtn.textContent = '+ Add Bot';
      addBotBtn.style.cssText = `
        min-height:44px;padding:8px 12px;border-radius:8px;
        border:1px solid rgba(255,255,255,0.24);background:rgba(255,255,255,0.1);
        color:#e2e8f0;font-size:12px;font-weight:700;cursor:pointer;
      `;
      addBotBtn.onclick = () => this.callbacks.onAddBot(slot.slot);
      btnRow.appendChild(addBotBtn);
    }

    card.append(openLabel, btnRow);
    return card;
  }

  renderLobby(lobby: LobbyState | null, myId: number, selectedHero: HeroId, statusMsg?: string): void {
    if (statusMsg !== undefined) {
      this.lobbyStatusEl.textContent = statusMsg;
    }

    this.currentRoomCode = lobby?.roomCode ?? null;
    if (!lobby) {
      this.lobbyRoomBadgeEl.textContent = 'JOINING LOBBY...';
      this.lobbyCopyBtn.style.display = 'none';
      this.lobbyRolePillEl.textContent = 'GUEST';
      this.lobbyRolePillEl.style.cssText = 'padding:4px 10px;border-radius:99px;font-size:11px;font-weight:800;background:rgba(47,100,201,0.35);color:#74b9ff;';
      this.lobbyTeamsEl.innerHTML = '<div style="padding:20px;text-align:center;color:#94a3b8;font-size:13px;">Syncing lobby from host...</div>';
      this.lobbyToolbarEl.innerHTML = '';
      this.lobbyFooterEl.innerHTML = '';
    } else {
      const isHost = !lobby.isOnline || lobby.hostId === myId;
      if (!lobby.isOnline) {
        this.lobbyRoomBadgeEl.textContent = 'SOLO SKIRMISH';
        this.lobbyCopyBtn.style.display = 'none';
      } else if (lobby.roomCode) {
        this.lobbyRoomBadgeEl.textContent = `ROOM: ${lobby.roomCode}`;
        this.lobbyCopyBtn.style.display = 'inline-flex';
        this.lobbyCopyBtn.style.alignItems = 'center';
      } else {
        this.lobbyRoomBadgeEl.textContent = 'PUBLIC LOBBY';
        this.lobbyCopyBtn.style.display = 'none';
      }

      this.lobbyRolePillEl.textContent = isHost ? 'HOST' : 'GUEST';
      this.lobbyRolePillEl.style.cssText = isHost
        ? 'padding:4px 10px;border-radius:99px;font-size:11px;font-weight:800;background:rgba(245,159,0,0.22);border:1px solid #f59f00;color:#ffd54f;'
        : 'padding:4px 10px;border-radius:99px;font-size:11px;font-weight:800;background:rgba(47,100,201,0.25);border:1px solid #74b9ff;color:#74b9ff;';

      // Render Amber (0, 1) and Sapphire (2, 3) columns
      this.lobbyTeamsEl.innerHTML = '';
      const teams: { team: Team; title: string; color: string; indices: [number, number] }[] = [
        { team: 0, title: 'AMBER TEAM', color: '#ff7675', indices: [0, 1] },
        { team: 1, title: 'SAPPHIRE TEAM', color: '#74b9ff', indices: [2, 3] },
      ];
      for (const t of teams) {
        const col = document.createElement('div');
        col.style.cssText = `
          padding:12px;border-radius:12px;background:rgba(12,16,28,0.72);
          border:1px solid rgba(255,255,255,0.12);display:flex;flex-direction:column;gap:8px;
        `;
        const colHead = document.createElement('div');
        colHead.textContent = t.title;
        colHead.style.cssText = `font-size:13px;font-weight:900;letter-spacing:1px;color:${t.color};`;
        col.appendChild(colHead);
        for (const idx of t.indices) {
          col.appendChild(this.renderLobbySlotCard(lobby.slots[idx], myId, lobby.hostId, isHost));
        }
        this.lobbyTeamsEl.appendChild(col);
      }

      // Render Toolbar
      this.lobbyToolbarEl.innerHTML = '';
      const leftTools = document.createElement('div');
      leftTools.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;align-items:center;';

      const swapBtn = document.createElement('button');
      swapBtn.type = 'button';
      swapBtn.textContent = '⇄ Swap Team';
      swapBtn.style.cssText = `
        min-height:44px;padding:8px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.24);
        background:rgba(255,255,255,0.1);color:#fff;font-size:12px;font-weight:800;cursor:pointer;
      `;
      swapBtn.onclick = () => this.callbacks.onSwapTeam();
      leftTools.appendChild(swapBtn);

      if (isHost) {
        const fillBtn = document.createElement('button');
        fillBtn.type = 'button';
        fillBtn.textContent = 'Fill with Bots';
        fillBtn.style.cssText = `
          min-height:44px;padding:8px 14px;border-radius:8px;border:none;
          background:#2f64c9;color:#fff;font-size:12px;font-weight:800;cursor:pointer;
        `;
        fillBtn.onclick = () => this.callbacks.onFillBots();

        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.textContent = 'Clear Bots';
        clearBtn.style.cssText = `
          min-height:44px;padding:8px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.22);
          background:rgba(255,255,255,0.08);color:#cbd5e1;font-size:12px;font-weight:700;cursor:pointer;
        `;
        clearBtn.onclick = () => this.callbacks.onClearBots();
        leftTools.append(fillBtn, clearBtn);
      }
      this.lobbyToolbarEl.appendChild(leftTools);

      if (isHost) {
        const diffGroup = document.createElement('div');
        diffGroup.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;align-items:center;';
        const diffLbl = document.createElement('span');
        diffLbl.textContent = 'Bots:';
        diffLbl.style.cssText = 'font-size:12px;font-weight:700;color:#94a3b8;';
        diffGroup.appendChild(diffLbl);
        for (const [diff, lbl] of [
          ['easy', 'Easy'],
          ['normal', 'Normal'],
          ['hard', 'Hard'],
          ['pro', 'Pro'],
        ] as const) {
          const b = document.createElement('button');
          b.type = 'button';
          b.textContent = lbl;
          const active = lobby.difficulty === diff;
          b.style.cssText = `
            min-height:44px;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;
            border:1px solid ${active ? '#74b9ff' : 'rgba(255,255,255,0.2)'};
            background:${active ? '#2f64c9' : 'rgba(255,255,255,0.08)'};color:#fff;
          `;
          b.onclick = () => this.callbacks.onSetDifficulty(diff);
          diffGroup.appendChild(b);
        }
        this.lobbyToolbarEl.appendChild(diffGroup);
      }

      // Footer CTA
      this.lobbyFooterEl.innerHTML = '';
      if (isHost) {
        const emptyCount = lobby.slots.filter((s) => s.kind === 'empty').length;
        const startBtn = document.createElement('button');
        startBtn.type = 'button';
        startBtn.textContent =
          emptyCount === 0
            ? 'Start Match (2v2 Ready)'
            : `Start Match (Auto-fill ${emptyCount} Bot${emptyCount > 1 ? 's' : ''})`;
        startBtn.style.cssText = `
          width:min(360px,100%);min-height:48px;padding:12px 24px;border-radius:10px;border:none;
          background:linear-gradient(135deg,#f59f00,#e67e22);color:#fff;
          font-weight:900;font-size:16px;cursor:pointer;box-shadow:0 4px 16px rgba(230,126,34,0.4);
        `;
        startBtn.onclick = () => this.callbacks.onStartMatch();
        this.lobbyFooterEl.appendChild(startBtn);
      } else {
        const waitBanner = document.createElement('div');
        waitBanner.textContent = 'Waiting for Host to start the match...';
        waitBanner.style.cssText = `
          padding:12px 20px;border-radius:10px;background:rgba(255,255,255,0.08);
          border:1px solid rgba(255,255,255,0.16);color:#cbd5e1;font-size:14px;font-weight:700;
        `;
        this.lobbyFooterEl.appendChild(waitBanner);
      }
    }

    // Compact Hero Picker
    this.lobbyHeroGridEl.innerHTML = '';
    for (const h of HERO_LIST) {
      const active = h.id === selectedHero;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.style.cssText = `
        min-height:44px;padding:8px;border-radius:8px;text-align:left;cursor:pointer;color:#fff;
        background:${active ? 'rgba(255,213,79,0.16)' : 'rgba(255,255,255,0.06)'};
        border:1.5px solid ${active ? '#ffd54f' : 'rgba(255,255,255,0.16)'};
        display:flex;flex-direction:column;gap:4px;
      `;
      const miniIcons = (['Q', 'E', 'F', 'X'] as const)
        .map((s) => {
          const ic = spellIconSvg(h.id, s);
          return `<span style="display:inline-flex;width:13px;height:13px;color:${ic.color}">${ic.svg}</span>`;
        })
        .join('');
      btn.innerHTML = `
        <div style="font-weight:800;font-size:13px;color:${active ? '#ffd54f' : '#fff'}">${h.name}</div>
        <div style="font-size:10px;color:#93c5fd">${h.role.split(' ')[0]} • ${h.baseHp}HP</div>
        <div style="display:flex;gap:3px">${miniIcons}</div>
      `;
      btn.onclick = () => this.callbacks.onPickHero(h.id);
      this.lobbyHeroGridEl.appendChild(btn);
    }

    const cur = HEROES[selectedHero];
    this.lobbyHeroInfoEl.textContent = `${cur.name} (${cur.title}) — ${cur.weapon.name} • Q: ${cur.abilities.Q.name} • E: ${cur.abilities.E.name} • F: ${cur.abilities.F.name} • X: ${cur.abilities.X.name}`;
  }

  private buildHud(): HTMLDivElement {
    const el = document.createElement('div');
    el.id = 'hud-root';
    el.style.cssText = 'position:fixed;inset:0;pointer-events:none;display:none;';

    // Speedlines vignette
    this.speedVignetteEl = document.createElement('div');
    this.speedVignetteEl.style.cssText = `
      position:fixed;inset:0;pointer-events:none;opacity:0;transition:opacity 0.15s;
      background:radial-gradient(circle, transparent 58%, rgba(120,210,255,0.28) 100%);
    `;
    el.appendChild(this.speedVignetteEl);

    // Top bar
    const topBar = document.createElement('div');
    topBar.style.cssText = `
      position:fixed;top:max(8px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);
      display:flex;align-items:center;gap:12px;padding:6px 14px;border-radius:10px;
      background:rgba(12,16,26,0.78);border:1px solid rgba(255,255,255,0.14);font-size:13px;font-weight:700;
    `;
    this.scoreAmberEl = document.createElement('div');
    this.scoreAmberEl.style.color = '#ff7675';
    this.clockEl = document.createElement('div');
    this.clockEl.style.cssText = 'font-size:16px;color:#ffd54f;min-width:54px;text-align:center;';
    this.scoreSapphireEl = document.createElement('div');
    this.scoreSapphireEl.style.color = '#74b9ff';
    topBar.append(this.scoreAmberEl, this.clockEl, this.scoreSapphireEl);
    el.appendChild(topBar);

    this.relicBannerEl = document.createElement('div');
    this.relicBannerEl.style.cssText = `
      position:fixed;top:52px;left:50%;transform:translateX(-50%);
      padding:4px 12px;border-radius:99px;background:rgba(20,24,38,0.82);
      border:1px solid rgba(255,213,79,0.4);font-size:11px;font-weight:700;color:#ffd54f;
    `;
    el.appendChild(this.relicBannerEl);

    // Center reticle + dynamic ticks + X hitmarker + stamina + reticle ammo + flow badge
    const center = document.createElement('div');
    center.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);pointer-events:none;';
    const dot = document.createElement('div');
    dot.style.cssText = 'width:4px;height:4px;background:rgba(255,255,255,0.95);border-radius:50%;box-shadow:0 0 4px #000;';
    center.appendChild(dot);

    // 4 dynamic crosshair ticks (top, right, bottom, left)
    this.crosshairTicks = [];
    for (let i = 0; i < 4; i++) {
      const tick = document.createElement('div');
      const isVert = i === 0 || i === 2;
      tick.style.cssText = `
        position:absolute;left:50%;top:50%;
        width:${isVert ? 2 : 7}px;height:${isVert ? 7 : 2}px;
        background:rgba(255,255,255,0.9);box-shadow:0 0 3px rgba(0,0,0,0.85);
        border-radius:1px;transition:transform 0.04s linear;
      `;
      center.appendChild(tick);
      this.crosshairTicks.push(tick);
    }

    // Crisp X hitmarker (4 diagonal ticks)
    this.hitmarkerEl = document.createElement('div');
    this.hitmarkerEl.style.cssText = 'position:absolute;left:50%;top:50%;width:24px;height:24px;transform:translate(-50%,-50%) scale(0.9);opacity:0;transition:opacity 0.08s,transform 0.08s;';
    for (const ang of [45, 135, 225, 315]) {
      const bar = document.createElement('div');
      bar.style.cssText = `
        position:absolute;left:50%;top:50%;width:8px;height:2px;background:currentColor;
        transform-origin:left center;transform:rotate(${ang}deg) translateX(5px);
        box-shadow:0 0 3px rgba(0,0,0,0.8);
      `;
      this.hitmarkerEl.appendChild(bar);
    }
    this.hitmarkerEl.style.color = '#fff';
    center.appendChild(this.hitmarkerEl);

    this.staminaWrapEl = document.createElement('div');
    this.staminaWrapEl.style.cssText = 'position:absolute;left:22px;top:-16px;display:flex;flex-direction:column;gap:3px;';
    center.appendChild(this.staminaWrapEl);

    this.reticleAmmoEl = document.createElement('div');
    this.reticleAmmoEl.style.cssText = 'position:absolute;left:22px;top:12px;font-size:10px;font-weight:800;color:#93c5fd;text-shadow:0 1px 3px #000;white-space:nowrap;';
    center.appendChild(this.reticleAmmoEl);

    this.flowBadgeEl = document.createElement('div');
    this.flowBadgeEl.style.cssText = 'position:absolute;left:-44px;top:24px;width:92px;text-align:center;font-size:11px;font-weight:800;color:#74b9ff;text-shadow:0 1px 4px #000;';
    const flowBarBg = document.createElement('div');
    flowBarBg.style.cssText = 'position:absolute;left:-30px;top:39px;width:64px;height:4px;border-radius:2px;background:rgba(255,255,255,0.16);overflow:hidden;';
    this.flowBarFillEl = document.createElement('div');
    this.flowBarFillEl.style.cssText = 'height:100%;width:0%;background:linear-gradient(90deg,#4fd8ff,#ffd54f);transition:width 0.08s;';
    flowBarBg.appendChild(this.flowBarFillEl);
    center.append(this.flowBadgeEl, flowBarBg);
    el.appendChild(center);

    // Bottom-left: compact Owned Items + Shop Hint
    const bl = document.createElement('div');
    bl.style.cssText = `
      position:fixed;left:max(12px,env(safe-area-inset-left));bottom:max(12px,env(safe-area-inset-bottom));
      max-width:min(210px,34vw);padding:8px 10px;border-radius:10px;
      background:rgba(12,16,26,0.72);border:1px solid rgba(255,255,255,0.12);
    `;
    this.ownedItemsEl = document.createElement('div');
    this.ownedItemsEl.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;';
    this.shopHintEl = document.createElement('div');
    this.shopHintEl.style.cssText = 'margin-top:4px;font-size:10px;color:#ffd54f;font-weight:700;';
    bl.append(this.ownedItemsEl, this.shopHintEl);
    el.appendChild(bl);

    // Unified Bottom-Center Combat Cluster: Meta Strip + Wide Health/Shield Bar + 4 Abilities
    const centerCluster = document.createElement('div');
    centerCluster.style.cssText = `
      position:fixed;left:50%;bottom:max(12px,env(safe-area-inset-bottom));transform:translateX(-50%);
      width:min(360px,92vw);display:flex;flex-direction:column;gap:7px;align-items:center;
    `;

    const metaRow = document.createElement('div');
    metaRow.style.cssText = 'width:100%;display:flex;justify-content:space-between;align-items:center;padding:0 4px;font-size:12px;font-weight:800;text-shadow:0 1px 3px #000;';
    const leftMeta = document.createElement('div');
    leftMeta.style.cssText = 'display:flex;gap:10px;align-items:center;';
    this.levelEl = document.createElement('div');
    this.levelEl.style.color = '#e2e8f0';
    this.acornEl = document.createElement('div');
    this.acornEl.style.color = '#ffd54f';
    leftMeta.append(this.levelEl, this.acornEl);

    this.ammoEl = document.createElement('div');
    this.ammoEl.style.cssText = 'color:#93c5fd;font-size:13px;font-weight:900;';
    metaRow.append(leftMeta, this.ammoEl);

    const hpBg = document.createElement('div');
    hpBg.style.cssText = `
      width:100%;height:20px;background:rgba(10,14,22,0.86);border-radius:8px;overflow:hidden;position:relative;
      border:1.5px solid rgba(255,255,255,0.22);box-shadow:0 2px 10px rgba(0,0,0,0.55);
    `;
    this.hpTrailEl = document.createElement('div');
    this.hpTrailEl.style.cssText = 'position:absolute;left:0;top:0;height:100%;width:100%;background:rgba(255,90,95,0.75);';
    this.hpFillEl = document.createElement('div');
    this.hpFillEl.style.cssText = 'position:absolute;left:0;top:0;height:100%;width:100%;background:linear-gradient(90deg,#2ecc71,#27ae60);transition:width 0.06s;';
    this.shieldFillEl = document.createElement('div');
    this.shieldFillEl.style.cssText = 'position:absolute;left:0;bottom:0;height:4px;width:0%;background:#ffd54f;transition:width 0.06s;';
    this.hpTextEl = document.createElement('div');
    this.hpTextEl.style.cssText = 'position:absolute;inset:0;font-size:12px;font-weight:900;color:#fff;text-align:center;line-height:18px;text-shadow:0 1px 3px #000;';
    hpBg.append(this.hpTrailEl, this.hpFillEl, this.shieldFillEl, this.hpTextEl);

    const abBar = document.createElement('div');
    abBar.style.cssText = 'display:flex;gap:8px;justify-content:center;';
    for (const slot of ['Q', 'E', 'F', 'X'] as const) {
      const box = document.createElement('div');
      box.style.cssText = `
        width:52px;height:52px;border-radius:10px;position:relative;overflow:hidden;
        background:rgba(12,16,26,0.88);border:1.5px solid rgba(255,255,255,0.24);
        display:flex;align-items:center;justify-content:center;font-weight:800;
      `;
      const icon = document.createElement('div');
      icon.style.cssText = 'width:28px;height:28px;display:flex;align-items:center;justify-content:center;';
      const dim = document.createElement('div');
      dim.style.cssText = 'position:absolute;inset:0;background:rgba(8,10,18,0.68);display:none;';
      const keyBadge = document.createElement('div');
      keyBadge.textContent = slot;
      keyBadge.style.cssText = 'position:absolute;top:2px;left:4px;font-size:9px;color:#cbd5e1;font-weight:800;';
      const cd = document.createElement('div');
      cd.style.cssText = 'position:absolute;bottom:2px;right:4px;font-size:10px;color:#ffd54f;text-shadow:0 1px 2px #000;';
      box.append(icon, dim, keyBadge, cd);
      abBar.appendChild(box);
      this.abilityEls.set(slot, { el: box, icon, cd, dim });
    }
    centerCluster.append(metaRow, hpBg, abBar);
    el.appendChild(centerCluster);

    // Bottom-right minimap
    const mmWrap = document.createElement('div');
    mmWrap.style.cssText = `
      position:fixed;right:max(12px,env(safe-area-inset-right));bottom:max(12px,env(safe-area-inset-bottom));
      padding:4px;border-radius:8px;background:rgba(12,16,26,0.82);border:1px solid rgba(255,255,255,0.18);
    `;
    this.minimapCanvas = document.createElement('canvas');
    this.minimapCanvas.width = 90;
    this.minimapCanvas.height = 150;
    this.minimapCtx = this.minimapCanvas.getContext('2d')!;
    mmWrap.appendChild(this.minimapCanvas);
    el.appendChild(mmWrap);

    const hudVolBtn = createVolumeButton(el, volumeStore);
    hudVolBtn.element.style.cssText = 'position:fixed;top:max(8px,env(safe-area-inset-top));left:max(12px,env(safe-area-inset-left));z-index:15;pointer-events:auto;';

    // Top-right event feed
    this.feedEl = document.createElement('div');
    this.feedEl.style.cssText = 'position:fixed;top:52px;right:12px;display:flex;flex-direction:column;gap:4px;align-items:flex-end;font-size:11px;font-weight:700;';
    el.appendChild(this.feedEl);

    return el;
  }

  private buildShop(): HTMLDivElement {
    const el = document.createElement('div');
    el.style.cssText = `
      position:fixed;inset:0;display:none;align-items:center;justify-content:center;
      background:rgba(10,14,24,0.82);pointer-events:auto;z-index:30;padding:16px;
    `;
    const panel = document.createElement('div');
    panel.style.cssText = `
      width:min(640px,96vw);max-height:85vh;overflow-y:auto;padding:16px;border-radius:12px;
      background:#1b2236;border:1px solid rgba(255,213,79,0.4);
    `;
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;';
    header.innerHTML = `<strong style="font-size:18px;color:#ffd54f">Bramble Garden Shop</strong>`;
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close (B)';
    closeBtn.style.cssText = 'padding:6px 12px;border-radius:6px;border:none;background:rgba(255,255,255,0.15);color:#fff;cursor:pointer;';
    closeBtn.onclick = () => this.toggleShop(false);
    header.appendChild(closeBtn);

    const tabs = document.createElement('div');
    tabs.style.cssText = 'display:flex;gap:8px;margin-bottom:12px;';
    const grid = document.createElement('div');
    grid.id = 'shop-grid';
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(175px,1fr));gap:8px;';

    const renderGrid = () => {
      grid.innerHTML = '';
      for (const item of ITEMS.filter((i) => i.category === this.shopTab)) {
        const card = document.createElement('button');
        card.type = 'button';
        card.style.cssText = `
          display:flex;flex-direction:column;gap:4px;padding:10px;border-radius:8px;text-align:left;
          background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.16);color:#fff;cursor:pointer;
        `;
        const top = document.createElement('div');
        top.style.cssText = 'display:flex;align-items:center;gap:8px;';
        top.appendChild(prefabIconElement(item.prefabId, '🌿', 28));
        const title = document.createElement('div');
        title.innerHTML = `<div style="font-weight:800;font-size:13px">${item.name}</div><div style="font-size:11px;color:#ffd54f">${item.cost} Acorns • T${item.tier}</div>`;
        top.appendChild(title);
        const desc = document.createElement('div');
        desc.style.cssText = 'font-size:11px;color:#cbd5e1;';
        desc.textContent = item.desc;
        card.append(top, desc);
        card.onclick = () => this.callbacks.onBuyItem(item.id);
        grid.appendChild(card);
      }
    };

    for (const cat of ['weapon', 'vitality', 'spirit'] as const) {
      const b = document.createElement('button');
      b.textContent = cat.toUpperCase();
      b.style.cssText = 'padding:7px 14px;border-radius:6px;border:none;background:rgba(255,255,255,0.12);color:#fff;font-weight:700;cursor:pointer;';
      b.onclick = () => {
        this.shopTab = cat;
        renderGrid();
      };
      tabs.appendChild(b);
    }

    renderGrid();
    panel.append(header, tabs, grid);
    el.appendChild(panel);
    return el;
  }

  private buildScoreboard(): HTMLDivElement {
    const el = document.createElement('div');
    el.style.cssText = `
      position:fixed;inset:0;display:none;align-items:center;justify-content:center;
      background:rgba(10,14,24,0.72);pointer-events:none;z-index:25;
    `;
    return el;
  }

  private buildEndScreen(): HTMLDivElement {
    const el = document.createElement('div');
    el.style.cssText = `
      position:fixed;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:14px;
      background:rgba(10,14,24,0.9);pointer-events:auto;z-index:40;padding:20px;
    `;
    return el;
  }

  setStatus(msg: string): void {
    this.statusEl.textContent = msg;
    if (this.lobbyStatusEl) {
      this.lobbyStatusEl.textContent = msg;
    }
  }

  showScreen(screen: 'title' | 'lobby' | 'hud'): void {
    this.titleEl.style.display = screen === 'title' ? 'flex' : 'none';
    this.lobbyEl.style.display = screen === 'lobby' ? 'flex' : 'none';
    this.hudEl.style.display = screen === 'hud' ? 'block' : 'none';
    if (screen !== 'hud') {
      this.endEl.style.display = 'none';
      this.shopEl.style.display = 'none';
      this.shopOpen = false;
    }
  }

  showLobby(show: boolean): void {
    this.showScreen(show ? 'title' : 'hud');
  }

  toggleShop(force?: boolean): boolean {
    this.shopOpen = force ?? !this.shopOpen;
    this.shopEl.style.display = this.shopOpen ? 'flex' : 'none';
    this.callbacks.onShopToggle(this.shopOpen);
    return this.shopOpen;
  }

  setScoreboardVisible(open: boolean, state: MatchState | null): void {
    this.scoreEl.style.display = open && state ? 'flex' : 'none';
    if (open && state) {
      this.scoreEl.innerHTML = `
        <div style="width:min(620px,94vw);background:#1b2236;border-radius:12px;padding:16px;border:1px solid rgba(255,255,255,0.2)">
          <div style="font-weight:800;font-size:16px;color:#ffd54f;margin-bottom:8px">Bramble District Scoreboard</div>
          <table style="width:100%;border-collapse:collapse;font-size:12px">
            <tr style="color:#94a3b8;text-align:left"><th>Gnome</th><th>Hero</th><th>K/D</th><th>LH / Orbs</th><th>Acorns</th></tr>
            ${state.heroes
              .map(
                (h) => `<tr style="border-top:1px solid rgba(255,255,255,0.08)">
                  <td style="padding:6px 0;color:${h.team === 0 ? '#ff7675' : '#74b9ff'};font-weight:700">${h.name}</td>
                  <td>${HEROES[h.heroId].name}</td>
                  <td>${h.kills}/${h.deaths}</td>
                  <td>${h.lastHits} / ${h.orbsConfirmed + h.orbsDenied}</td>
                  <td style="color:#ffd54f">${Math.round(h.totalAcorns)}</td>
                </tr>`,
              )
              .join('')}
          </table>
        </div>
      `;
    }
  }

  showEndScreen(winner: Team, localTeam: Team, state: MatchState): void {
    this.endEl.style.display = 'flex';
    const victory = winner === localTeam;
    this.endEl.innerHTML = `
      <h1 style="margin:0;font-size:40px;color:${victory ? '#ffd54f' : '#ff7675'}">${victory ? 'VICTORY!' : 'DEFEAT'}</h1>
      <div style="font-size:15px;color:#cbd5e1">${TEAM_NAMES[winner]} shattered the enemy Ceramic Patron in ${(state.timeS / 60).toFixed(1)} min</div>
      <div style="width:min(560px,94vw);background:#1b2236;border-radius:10px;padding:12px;font-size:12px">
        ${state.heroes
          .map(
            (h) => `<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.07)">
              <span style="color:${h.team === 0 ? '#ff7675' : '#74b9ff'};font-weight:700">${h.name} (${HEROES[h.heroId].name})</span>
              <span>${h.kills}K / ${h.deaths}D • LH ${h.lastHits} • Orbs ${h.orbsConfirmed + h.orbsDenied} • ${Math.round(h.totalAcorns)}g</span>
            </div>`,
          )
          .join('')}
      </div>
    `;
    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;justify-content:center;';
    const lobbyBtn = document.createElement('button');
    lobbyBtn.textContent = 'Return to Lobby';
    lobbyBtn.style.cssText = 'min-height:44px;padding:12px 22px;border-radius:8px;border:none;background:#e67e22;color:#fff;font-weight:800;font-size:15px;cursor:pointer;';
    lobbyBtn.onclick = () => this.callbacks.onReturnToLobby();

    const titleBtn = document.createElement('button');
    titleBtn.textContent = 'Back to Title';
    titleBtn.style.cssText = 'min-height:44px;padding:12px 22px;border-radius:8px;border:1px solid rgba(255,255,255,0.25);background:rgba(255,255,255,0.1);color:#fff;font-weight:700;font-size:15px;cursor:pointer;';
    titleBtn.onclick = () => this.callbacks.onPlayAgain();
    btnRow.append(lobbyBtn, titleBtn);
    this.endEl.appendChild(btnRow);
  }

  setAds(ads: boolean): void {
    this.isAdsState = ads;
  }

  triggerCrosshairBloom(): void {
    this.crosshairBloom = Math.min(10, this.crosshairBloom + 5.5);
  }

  flashHitmarker(color: string, big = false): void {
    this.hitmarkerEl.style.color = color;
    this.hitmarkerEl.style.opacity = '1';
    this.hitmarkerEl.style.transform = `translate(-50%,-50%) scale(${big ? 1.35 : 1.05})`;
    window.setTimeout(() => {
      this.hitmarkerEl.style.opacity = '0';
      this.hitmarkerEl.style.transform = 'translate(-50%,-50%) scale(0.85)';
    }, big ? 140 : 95);
  }

  pushFeed(text: string, color = '#fff'): void {
    const row = document.createElement('div');
    row.textContent = text;
    row.style.cssText = `padding:4px 8px;border-radius:6px;background:rgba(12,16,26,0.78);color:${color};`;
    this.feedEl.prepend(row);
    while (this.feedEl.children.length > 4) {
      this.feedEl.lastChild?.remove();
    }
    window.setTimeout(() => row.remove(), 4000);
  }

  spawnPopup(text: string, x: number, y: number, z: number, color: string, opts?: { big?: boolean }): void {
    const big = Boolean(opts?.big);
    const maxTtl = big ? 1.15 : 0.9;
    const el = document.createElement('div');
    el.textContent = text;
    el.style.cssText = big
      ? `position:fixed;font-size:16px;font-weight:900;color:${color};text-shadow:0 2px 6px rgba(0,0,0,0.95),0 0 10px ${color};pointer-events:none;transform:translate(-50%,-50%) scale(1.35);white-space:nowrap;`
      : `position:fixed;font-size:13px;font-weight:900;color:${color};text-shadow:0 1px 4px #000;pointer-events:none;transform:translate(-50%,-50%);white-space:nowrap;`;
    this.hudEl.appendChild(el);
    this.floating.push({ el, x, y, z, ttl: maxTtl, maxTtl, big });
  }

  update(
    state: MatchState,
    localSlot: number,
    project: (x: number, y: number, z: number) => { sx: number; sy: number; visible: boolean },
    dt: number,
  ): void {
    const local = state.heroes[localSlot];
    if (!local) return;

    const mins = Math.floor(state.timeS / 60);
    const secs = Math.floor(state.timeS % 60);
    this.clockEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

    const a0 = Math.round(teamTotalAcorns(state, 0));
    const a1 = Math.round(teamTotalAcorns(state, 1));
    const t0 = state.structures.filter((s) => s.team === 0 && s.hp > 0).length;
    const t1 = state.structures.filter((s) => s.team === 1 && s.hp > 0).length;
    this.scoreAmberEl.textContent = `AMBER ${a0}g (${t0}T)`;
    this.scoreSapphireEl.textContent = `(${t1}T) ${a1}g SAPPHIRE`;

    if (!state.relic.spawned) {
      const rem = Math.max(0, Math.ceil(MATCH_CONFIG.relicSpawnS - state.timeS));
      const leadTxt =
        a0 === a1 ? 'TIED' : a0 > a1 ? 'AMBER LEADS' : 'SAPPHIRE LEADS';
      this.relicBannerEl.textContent = `${leadTxt} • Gilded Relic in ${Math.floor(rem / 60)}:${(rem % 60).toString().padStart(2, '0')}`;
    } else if (state.relic.alive) {
      this.relicBannerEl.textContent = `GILDED RELIC LIVE (${Math.round(state.relic.hp)} HP) — ONE CHANCE!`;
    } else if (state.relic.claimedByTeam !== null) {
      this.relicBannerEl.textContent = `${TEAM_NAMES[state.relic.claimedByTeam].toUpperCase()} CLAIMED RELIC`;
    }

    // Local stats
    const hpPct = Math.max(0, Math.min(100, (local.hp / local.maxHp) * 100));
    this.hpTrailPct = hpPct > this.hpTrailPct ? hpPct : this.hpTrailPct + (hpPct - this.hpTrailPct) * Math.min(1, 5 * dt);
    this.hpFillEl.style.width = `${hpPct}%`;
    this.hpTrailEl.style.width = `${this.hpTrailPct}%`;
    this.shieldFillEl.style.width = `${Math.min(100, (local.shield / local.maxHp) * 100)}%`;
    this.hpTextEl.textContent = local.alive
      ? `${Math.round(local.hp)}/${local.maxHp}${local.shield > 0 ? ` +${Math.round(local.shield)}` : ''}`
      : `RESPAWN ${local.respawnTimer.toFixed(1)}s`;
    this.acornEl.textContent = `${Math.round(local.acorns)}g`;
    this.levelEl.textContent = `Lv.${local.level}`;
    const ammoTxt = local.infiniteAmmoTimer > 0
      ? 'OVERDRIVE ∞'
      : local.move.sliding
        ? 'SLIDE ∞'
        : local.reloadTimer > 0
          ? 'RELOAD'
          : `${local.ammo}/${local.stats.magSize}`;
    this.ammoEl.textContent = ammoTxt;
    this.reticleAmmoEl.textContent = ammoTxt;

    // Dynamic crosshair bloom & ADS tightening
    this.crosshairBloom = Math.max(0, this.crosshairBloom - dt * 28);
    const gap = (this.isAdsState ? 5 : 9) + this.crosshairBloom;
    if (this.crosshairTicks.length === 4) {
      this.crosshairTicks[0].style.transform = `translate(-50%, calc(-100% - ${gap}px))`;
      this.crosshairTicks[1].style.transform = `translate(${gap}px, -50%)`;
      this.crosshairTicks[2].style.transform = `translate(-50%, ${gap}px)`;
      this.crosshairTicks[3].style.transform = `translate(calc(-100% - ${gap}px), -50%)`;
    }

    // Stamina pips
    this.staminaWrapEl.innerHTML = '';
    for (let i = 0; i < local.move.maxStamina; i++) {
      const fill = Math.max(0, Math.min(1, local.move.stamina - i));
      const bar = document.createElement('div');
      bar.style.cssText = 'width:22px;height:4px;background:rgba(255,255,255,0.2);border-radius:2px;overflow:hidden;';
      const inner = document.createElement('div');
      inner.style.cssText = `height:100%;width:${fill * 100}%;background:#74b9ff;`;
      bar.appendChild(inner);
      this.staminaWrapEl.appendChild(bar);
    }

    // Flow State badge, meter & speed vignette
    this.flowBadgeEl.textContent = local.move.flowTier > 0 ? `FLOW T${local.move.flowTier}` : '';
    this.flowBarFillEl.style.width = `${Math.min(100, Math.round(local.move.flowScore))}%`;
    const spd = Math.hypot(local.move.vel.x, local.move.vel.z);
    this.speedVignetteEl.style.opacity = spd > 13.0 ? '1' : '0';

    // Abilities (refresh SVG icons when local hero changes)
    if (this.lastHudHeroId !== local.heroId) {
      this.lastHudHeroId = local.heroId;
      for (const slot of ['Q', 'E', 'F', 'X'] as const) {
        const ref = this.abilityEls.get(slot);
        if (!ref) continue;
        const ic = spellIconSvg(local.heroId, slot);
        ref.icon.innerHTML = ic.svg;
        ref.icon.style.color = ic.color;
        ref.el.title = HEROES[local.heroId].abilities[slot].name;
      }
    }
    for (const slot of ['Q', 'E', 'F', 'X'] as const) {
      const ref = this.abilityEls.get(slot);
      if (!ref) continue;
      const cd = local.cooldowns[slot];
      const onCd = cd > 0.1;
      ref.cd.textContent = onCd ? `${cd.toFixed(1)}` : '';
      ref.dim.style.display = onCd ? 'block' : 'none';
      ref.el.style.borderColor = onCd ? 'rgba(255,255,255,0.12)' : spellIconSvg(local.heroId, slot).color;
    }

    // Shop hint
    const nearShop = isNearShop(local.move.pos.x, local.move.pos.z, local.team);
    this.shopHintEl.textContent = nearShop ? 'AT SHOP — Press [B] to buy items!' : 'Return to Base or Mid Shed for Shop [B]';

    // Owned items strip
    if (this.ownedItemsEl.childElementCount !== local.items.length) {
      this.ownedItemsEl.innerHTML = '';
      for (const id of local.items) {
        const it = ITEMS.find((x) => x.id === id);
        if (it) this.ownedItemsEl.appendChild(prefabIconElement(it.prefabId, '🌿', 22));
      }
    }

    // Floating popups
    for (let i = this.floating.length - 1; i >= 0; i--) {
      const f = this.floating[i];
      f.ttl -= dt;
      f.y += 1.4 * dt;
      if (f.ttl <= 0) {
        f.el.remove();
        this.floating.splice(i, 1);
        continue;
      }
      const p = project(f.x, f.y, f.z);
      f.el.style.display = p.visible ? 'block' : 'none';
      f.el.style.left = `${p.sx}px`;
      f.el.style.top = `${p.sy}px`;
      f.el.style.opacity = `${Math.min(1, f.ttl * 2)}`;
      if (f.big) {
        const age = f.maxTtl - f.ttl;
        const sc = age < 0.15 ? 1.35 - (age / 0.15) * 0.35 : 1.0;
        f.el.style.transform = `translate(-50%,-50%) scale(${sc.toFixed(2)})`;
      }
    }

    this.drawMinimap(state, localSlot);
  }

  private drawMinimap(state: MatchState, localSlot: number): void {
    const ctx = this.minimapCtx;
    const W = this.minimapCanvas.width;
    const H = this.minimapCanvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#182232';
    ctx.fillRect(0, 0, W, H);

    const toMx = (x: number) => ((x - MAP_BOUNDS.minX) / (MAP_BOUNDS.maxX - MAP_BOUNDS.minX)) * W;
    const toMy = (z: number) => ((z - MAP_BOUNDS.minZ) / (MAP_BOUNDS.maxZ - MAP_BOUNDS.minZ)) * H;

    // Lane
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(toMx(-7), 0, toMx(7) - toMx(-7), H);

    // Shops
    ctx.fillStyle = '#ffd54f';
    for (const s of SHOPS) {
      ctx.fillRect(toMx(s.x) - 2, toMy(s.z) - 2, 4, 4);
    }

    // Structures
    for (const st of state.structures) {
      if (st.hp <= 0) continue;
      ctx.fillStyle = st.team === 0 ? '#ff6b6b' : '#4dabf7';
      const sz = st.tier === 4 ? 7 : 5;
      ctx.fillRect(toMx(st.x) - sz / 2, toMy(st.z) - sz / 2, sz, sz);
    }

    // Relic
    if (state.relic.alive) {
      ctx.fillStyle = '#ffd54f';
      ctx.beginPath();
      ctx.arc(toMx(RELIC_ALTAR.x), toMy(RELIC_ALTAR.z), 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Creeps
    for (const cr of state.creeps) {
      ctx.fillStyle = cr.team === 0 ? '#ffa8a8' : '#a5d8ff';
      ctx.fillRect(toMx(cr.x) - 1, toMy(cr.z) - 1, 2, 2);
    }

    // Jungle Neutrals
    for (const n of state.neutrals) {
      ctx.fillStyle = n.kind === 'golem' ? '#a9e34b' : '#ffd43b';
      ctx.fillRect(toMx(n.x) - 2, toMy(n.z) - 2, 4, 4);
    }

    // Heroes
    for (const h of state.heroes) {
      if (!h.alive) continue;
      ctx.fillStyle = h.slot === localSlot ? '#ffffff' : h.team === 0 ? '#ff3b3b' : '#339af0';
      ctx.beginPath();
      ctx.arc(toMx(h.move.pos.x), toMy(h.move.pos.z), h.slot === localSlot ? 4 : 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
