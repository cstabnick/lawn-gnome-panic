// Gnomelock Lobby, HUD, Shop, Minimap, Scoreboard, and End Screen.
import { createVolumeButton } from '@arcade/volume';
import { prefabIconElement } from '@lawn/prefabs';
import { volumeStore } from './audio';
import { DEFAULT_BOT_HEROES, type MatchCustomConfig, type TeamMode } from './net/protocol';
import { MATCH_CONFIG, TEAM_NAMES, type AbilitySlot, type HeroId, type Team } from './sim/config';
import { HERO_LIST, HEROES } from './sim/heroes';
import { ITEMS, type ItemCategory } from './sim/items';
import { isNearShop, MAP_BOUNDS, RELIC_ALTAR, SHOPS } from './sim/map';
import { teamTotalAcorns, type MatchState } from './sim/world';
import { spellIconSvg } from './spellIcons';

interface FloatingText {
  el: HTMLDivElement;
  x: number;
  y: number;
  z: number;
  ttl: number;
}

export class GnomelockUI {
  readonly root: HTMLDivElement;
  private lobbyEl: HTMLDivElement;
  private hudEl: HTMLDivElement;
  private shopEl: HTMLDivElement;
  private scoreEl: HTMLDivElement;
  private endEl: HTMLDivElement;

  private selectedHero: HeroId = 'bramble';
  private customConfig: MatchCustomConfig = {
    mode: 'versus',
    localSlotPref: 0,
    botHeroes: [...DEFAULT_BOT_HEROES],
    botSkills: [1, 1, 1, 1],
  };
  private shopOpen = false;
  private shopTab: ItemCategory = 'weapon';
  private floating: FloatingText[] = [];

  // HUD refs
  private clockEl!: HTMLDivElement;
  private scoreAmberEl!: HTMLDivElement;
  private scoreSapphireEl!: HTMLDivElement;
  private relicBannerEl!: HTMLDivElement;
  private hpFillEl!: HTMLDivElement;
  private hpTextEl!: HTMLDivElement;
  private acornEl!: HTMLDivElement;
  private levelEl!: HTMLDivElement;
  private ammoEl!: HTMLDivElement;
  private staminaWrapEl!: HTMLDivElement;
  private flowBadgeEl!: HTMLDivElement;
  private hitmarkerEl!: HTMLDivElement;
  private speedVignetteEl!: HTMLDivElement;
  private abilityEls = new Map<AbilitySlot, { el: HTMLDivElement; icon: HTMLDivElement; cd: HTMLDivElement; dim: HTMLDivElement }>();
  private lastHudHeroId: HeroId | null = null;
  private ownedItemsEl!: HTMLDivElement;
  private shopHintEl!: HTMLDivElement;
  private minimapCanvas!: HTMLCanvasElement;
  private minimapCtx!: CanvasRenderingContext2D;
  private feedEl!: HTMLDivElement;
  private statusEl!: HTMLDivElement;

  private callbacks: {
    onPlaySolo: (hero: HeroId, config: MatchCustomConfig) => void;
    onPlayOnline: (hero: HeroId, roomCode: string | null, config: MatchCustomConfig) => void;
    onBuyItem: (itemId: string) => void;
    onShopToggle: (open: boolean) => void;
    onPlayAgain: () => void;
  };

  constructor(
    uiParent: HTMLElement,
    callbacks: {
      onPlaySolo: (hero: HeroId, config: MatchCustomConfig) => void;
      onPlayOnline: (hero: HeroId, roomCode: string | null, config: MatchCustomConfig) => void;
      onBuyItem: (itemId: string) => void;
      onShopToggle: (open: boolean) => void;
      onPlayAgain: () => void;
    },
  ) {
    this.callbacks = callbacks;
    this.root = document.createElement('div');
    this.root.id = 'gnomelock-root';
    this.root.style.cssText = 'position:fixed;inset:0;pointer-events:none;font-family:system-ui,-apple-system,sans-serif;';
    uiParent.appendChild(this.root);

    this.lobbyEl = this.buildLobby();
    this.hudEl = this.buildHud();
    this.shopEl = this.buildShop();
    this.scoreEl = this.buildScoreboard();
    this.endEl = this.buildEndScreen();

    this.root.append(this.lobbyEl, this.hudEl, this.shopEl, this.scoreEl, this.endEl);
  }

  private buildLobby(): HTMLDivElement {
    const el = document.createElement('div');
    el.style.cssText = `
      position:fixed;inset:0;pointer-events:auto;overflow-y:auto;
      background:radial-gradient(circle at 50% 25%, rgba(44,58,92,0.92), rgba(16,20,32,0.97));
      display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;gap:14px;
    `;

    const volBtn = createVolumeButton(el, volumeStore);
    volBtn.element.style.cssText = 'position:fixed;top:14px;right:14px;z-index:5;';

    const title = document.createElement('h1');
    title.textContent = 'GNOMELOCK';
    title.style.cssText = 'margin:0;font-size:clamp(28px,5vw,46px);letter-spacing:3px;color:#ffd54f;text-shadow:0 3px 12px rgba(0,0,0,0.6);';

    const sub = document.createElement('div');
    sub.textContent = '2v2 Bramble District MOBA • Last-Hit Soul Acorns • Dash-Jump & Slide';
    sub.style.cssText = 'font-size:13px;color:#cbd5e1;text-align:center;';

    const cards = document.createElement('div');
    cards.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;width:min(820px,100%);';

    const cardEls: HTMLButtonElement[] = [];
    for (const h of HERO_LIST) {
      const card = document.createElement('button');
      card.type = 'button';
      card.style.cssText = `
        text-align:left;padding:12px;border-radius:10px;cursor:pointer;color:#fff;
        background:rgba(255,255,255,0.07);border:2px solid rgba(255,255,255,0.16);
        transition:transform 0.12s,border-color 0.12s;
      `;
      const miniIcons = (['Q', 'E', 'F', 'X'] as const)
        .map((s) => {
          const ic = spellIconSvg(h.id, s);
          return `<span title="${h.abilities[s].name}" style="display:inline-flex;width:16px;height:16px;color:${ic.color}">${ic.svg}</span>`;
        })
        .join('');
      card.innerHTML = `
        <div style="font-weight:800;font-size:16px;color:#ffd54f">${h.name}</div>
        <div style="font-size:11px;color:#93c5fd;margin-bottom:4px">${h.title} • ${h.role}</div>
        <div style="font-size:11px;color:#cbd5e1;line-height:1.3;margin-bottom:6px">${h.weapon.name} • HP ${h.baseHp}</div>
        <div style="display:flex;gap:5px;align-items:center">${miniIcons}</div>
      `;
      card.onclick = () => {
        this.selectedHero = h.id;
        for (const c of cardEls) c.style.borderColor = 'rgba(255,255,255,0.16)';
        card.style.borderColor = '#ffd54f';
      };
      if (h.id === this.selectedHero) card.style.borderColor = '#ffd54f';
      cardEls.push(card);
      cards.appendChild(card);
    }

    // ---- 2v2 Player & Team Setup Panel ----
    const setupBox = document.createElement('div');
    setupBox.id = 'custom-players-panel';
    setupBox.style.cssText = `
      width:min(820px,100%);padding:12px;border-radius:10px;
      background:rgba(0,0,0,0.34);border:1px solid rgba(255,255,255,0.16);
      display:flex;flex-direction:column;gap:10px;
    `;

    const presetRow = document.createElement('div');
    presetRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;';
    const presetLabel = document.createElement('div');
    presetLabel.textContent = '2v2 Team Setup:';
    presetLabel.style.cssText = 'font-size:12px;font-weight:800;color:#ffd54f;';

    const presetBtns = document.createElement('div');
    presetBtns.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;';
    const modeDefs: { mode: TeamMode; label: string }[] = [
      { mode: 'versus', label: '1H+1B vs 1H+1B (Versus)' },
      { mode: 'coop', label: '2H vs 2B (Co-op)' },
      { mode: 'custom', label: 'Custom Slots' },
    ];
    const modeBtnEls = new Map<TeamMode, HTMLButtonElement>();

    const slotsGrid = document.createElement('div');
    slotsGrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(175px,1fr));gap:8px;';

    const renderSetup = () => {
      for (const [m, b] of modeBtnEls) {
        const active = this.customConfig.mode === m;
        b.style.background = active ? '#e67e22' : 'rgba(255,255,255,0.1)';
        b.style.borderColor = active ? '#ffd54f' : 'rgba(255,255,255,0.2)';
      }

      // In versus/coop presets, slot 0 is always P1 unless user switches to custom
      if (this.customConfig.mode !== 'custom') {
        this.customConfig.localSlotPref = 0;
      }

      slotsGrid.innerHTML = '';
      const p2Slot = this.customConfig.mode === 'versus' ? 2 : this.customConfig.mode === 'coop' ? 1 : -1;

      for (let slot = 0; slot < 4; slot++) {
        const isAmber = slot < 2;
        const isLocal = this.customConfig.localSlotPref === slot;
        const isP2Online = slot === p2Slot;

        const cell = document.createElement('div');
        cell.style.cssText = `
          padding:8px;border-radius:8px;display:flex;flex-direction:column;gap:5px;
          background:${isAmber ? 'rgba(217,54,54,0.14)' : 'rgba(47,100,201,0.14)'};
          border:1px solid ${isLocal ? '#ffd54f' : isAmber ? 'rgba(255,118,117,0.35)' : 'rgba(116,185,255,0.35)'};
        `;

        const head = document.createElement('div');
        head.style.cssText = 'display:flex;justify-content:space-between;align-items:center;font-size:11px;font-weight:800;';
        const teamTag = isAmber ? `Amber ${slot + 1}` : `Sapphire ${slot - 1}`;
        const roleTag = isLocal
          ? '<span style="color:#ffd54f">YOU</span>'
          : isP2Online
            ? '<span style="color:#8ce99a">P2 (or Bot)</span>'
            : '<span style="color:#94a3b8">BOT</span>';
        head.innerHTML = `<span style="color:${isAmber ? '#ff7675' : '#74b9ff'}">${teamTag}</span>${roleTag}`;
        cell.appendChild(head);

        if (isLocal) {
          const youInfo = document.createElement('div');
          youInfo.style.cssText = 'font-size:12px;font-weight:700;color:#fff;';
          youInfo.textContent = `${HEROES[this.selectedHero].name} (Player)`;
          cell.appendChild(youInfo);
        } else {
          const heroSel = document.createElement('select');
          heroSel.style.cssText = 'padding:4px 6px;border-radius:5px;background:#131826;color:#fff;border:1px solid rgba(255,255,255,0.2);font-size:11px;';
          for (const h of HERO_LIST) {
            const opt = document.createElement('option');
            opt.value = h.id;
            opt.textContent = `${h.name} (${h.role.split(' ')[0]})`;
            if (this.customConfig.botHeroes[slot] === h.id) opt.selected = true;
            heroSel.appendChild(opt);
          }
          heroSel.onchange = () => {
            this.customConfig.botHeroes[slot] = heroSel.value as HeroId;
          };

          const skillSel = document.createElement('select');
          skillSel.style.cssText = 'padding:4px 6px;border-radius:5px;background:#131826;color:#cbd5e1;border:1px solid rgba(255,255,255,0.16);font-size:11px;';
          for (const [val, lbl] of [
            [0.82, 'Bot: Chill (0.82x)'],
            [1.0, 'Bot: Standard (1.0x)'],
            [1.15, 'Bot: Tryhard (1.15x)'],
          ] as const) {
            const opt = document.createElement('option');
            opt.value = String(val);
            opt.textContent = lbl;
            if (Math.abs(this.customConfig.botSkills[slot] - val) < 0.02) opt.selected = true;
            skillSel.appendChild(opt);
          }
          skillSel.onchange = () => {
            this.customConfig.botSkills[slot] = Number(skillSel.value);
          };

          const playHereBtn = document.createElement('button');
          playHereBtn.type = 'button';
          playHereBtn.textContent = 'Play Here';
          playHereBtn.style.cssText = 'padding:4px 6px;border-radius:5px;border:1px solid rgba(255,255,255,0.22);background:rgba(255,255,255,0.08);color:#fff;font-size:10px;font-weight:700;cursor:pointer;';
          playHereBtn.onclick = () => {
            this.customConfig.mode = 'custom';
            this.customConfig.localSlotPref = slot;
            renderSetup();
          };

          cell.append(heroSel, skillSel, playHereBtn);
        }

        slotsGrid.appendChild(cell);
      }
    };

    for (const def of modeDefs) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = def.label;
      b.style.cssText = 'padding:6px 10px;border-radius:6px;border:1px solid rgba(255,255,255,0.2);color:#fff;font-size:11px;font-weight:700;cursor:pointer;';
      b.onclick = () => {
        this.customConfig.mode = def.mode;
        renderSetup();
      };
      modeBtnEls.set(def.mode, b);
      presetBtns.appendChild(b);
    }

    presetRow.append(presetLabel, presetBtns);
    setupBox.append(presetRow, slotsGrid);
    renderSetup();

    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;justify-content:center;align-items:center;';

    const soloBtn = document.createElement('button');
    soloBtn.type = 'button';
    soloBtn.textContent = 'Play Solo (2v2 Bots)';
    soloBtn.style.cssText = 'padding:12px 22px;border-radius:8px;border:none;background:#e67e22;color:#fff;font-weight:800;font-size:15px;cursor:pointer;';
    soloBtn.onclick = () => this.callbacks.onPlaySolo(this.selectedHero, this.customConfig);

    const onlineBtn = document.createElement('button');
    onlineBtn.type = 'button';
    onlineBtn.textContent = 'Play Online (2v2)';
    onlineBtn.style.cssText = 'padding:12px 20px;border-radius:8px;border:none;background:#2f64c9;color:#fff;font-weight:800;font-size:15px;cursor:pointer;';
    onlineBtn.onclick = () => this.callbacks.onPlayOnline(this.selectedHero, null, this.customConfig);

    const codeInput = document.createElement('input');
    codeInput.placeholder = 'ROOM CODE';
    codeInput.maxLength = 8;
    codeInput.style.cssText = 'padding:11px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.25);background:rgba(0,0,0,0.35);color:#fff;width:110px;text-transform:uppercase;font-weight:700;';

    const joinBtn = document.createElement('button');
    joinBtn.type = 'button';
    joinBtn.textContent = 'Join Code';
    joinBtn.style.cssText = 'padding:12px 16px;border-radius:8px;border:1px solid rgba(255,255,255,0.25);background:rgba(255,255,255,0.12);color:#fff;font-weight:700;cursor:pointer;';
    joinBtn.onclick = () => {
      const c = codeInput.value.trim().toUpperCase();
      this.callbacks.onPlayOnline(this.selectedHero, c || 'BRAMBLE', this.customConfig);
    };

    this.statusEl = document.createElement('div');
    this.statusEl.style.cssText = 'font-size:13px;color:#ffd54f;min-height:18px;';

    actions.append(soloBtn, onlineBtn, codeInput, joinBtn);
    el.append(title, sub, cards, setupBox, actions, this.statusEl);
    return el;
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

    // Center reticle + hitmarker + stamina + flow badge
    const center = document.createElement('div');
    center.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);pointer-events:none;';
    center.innerHTML = `<div style="width:8px;height:8px;border:2px solid rgba(255,255,255,0.9);border-radius:50%;box-shadow:0 0 4px #000"></div>`;

    this.hitmarkerEl = document.createElement('div');
    this.hitmarkerEl.style.cssText = 'position:absolute;left:-10px;top:-10px;width:28px;height:28px;border:2px solid #fff;border-radius:50%;opacity:0;transform:scale(0.8);transition:opacity 0.08s;';
    center.appendChild(this.hitmarkerEl);

    this.staminaWrapEl = document.createElement('div');
    this.staminaWrapEl.style.cssText = 'position:absolute;left:22px;top:-14px;display:flex;flex-direction:column;gap:3px;';
    center.appendChild(this.staminaWrapEl);

    this.flowBadgeEl = document.createElement('div');
    this.flowBadgeEl.style.cssText = 'position:absolute;left:-42px;top:22px;width:92px;text-align:center;font-size:11px;font-weight:800;color:#74b9ff;text-shadow:0 1px 4px #000;';
    center.appendChild(this.flowBadgeEl);
    el.appendChild(center);

    // Bottom-left: HP, Acorns, Level, Ammo, Items
    const bl = document.createElement('div');
    bl.style.cssText = `
      position:fixed;left:max(12px,env(safe-area-inset-left));bottom:max(12px,env(safe-area-inset-bottom));
      width:min(240px,46vw);padding:10px;border-radius:10px;
      background:rgba(12,16,26,0.78);border:1px solid rgba(255,255,255,0.14);
    `;
    const hpBg = document.createElement('div');
    hpBg.style.cssText = 'height:14px;background:rgba(0,0,0,0.5);border-radius:6px;overflow:hidden;position:relative;';
    this.hpFillEl = document.createElement('div');
    this.hpFillEl.style.cssText = 'height:100%;width:100%;background:linear-gradient(90deg,#2ecc71,#27ae60);transition:width 0.08s;';
    this.hpTextEl = document.createElement('div');
    this.hpTextEl.style.cssText = 'position:absolute;inset:0;font-size:10px;font-weight:800;text-align:center;line-height:14px;';
    hpBg.append(this.hpFillEl, this.hpTextEl);

    const metaRow = document.createElement('div');
    metaRow.style.cssText = 'display:flex;justify-content:space-between;margin-top:6px;font-size:12px;font-weight:700;';
    this.acornEl = document.createElement('div');
    this.acornEl.style.color = '#ffd54f';
    this.levelEl = document.createElement('div');
    this.ammoEl = document.createElement('div');
    this.ammoEl.style.color = '#93c5fd';
    metaRow.append(this.acornEl, this.levelEl, this.ammoEl);

    this.ownedItemsEl = document.createElement('div');
    this.ownedItemsEl.style.cssText = 'display:flex;gap:4px;margin-top:6px;flex-wrap:wrap;';

    this.shopHintEl = document.createElement('div');
    this.shopHintEl.style.cssText = 'margin-top:4px;font-size:10px;color:#ffd54f;font-weight:700;';
    bl.append(hpBg, metaRow, this.ownedItemsEl, this.shopHintEl);
    el.appendChild(bl);

    // Bottom-center abilities with SVG spell icons + cooldown overlay
    const abBar = document.createElement('div');
    abBar.style.cssText = `
      position:fixed;left:50%;bottom:max(12px,env(safe-area-inset-bottom));transform:translateX(-50%);
      display:flex;gap:8px;
    `;
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
    el.appendChild(abBar);

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
  }

  showLobby(show: boolean): void {
    this.lobbyEl.style.display = show ? 'flex' : 'none';
    this.hudEl.style.display = show ? 'none' : 'block';
    if (show) this.endEl.style.display = 'none';
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
    const btn = document.createElement('button');
    btn.textContent = 'Play Again';
    btn.style.cssText = 'padding:12px 24px;border-radius:8px;border:none;background:#e67e22;color:#fff;font-weight:800;font-size:15px;cursor:pointer;';
    btn.onclick = () => this.callbacks.onPlayAgain();
    this.endEl.appendChild(btn);
  }

  flashHitmarker(color: string): void {
    this.hitmarkerEl.style.borderColor = color;
    this.hitmarkerEl.style.opacity = '1';
    window.setTimeout(() => {
      this.hitmarkerEl.style.opacity = '0';
    }, 95);
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

  spawnPopup(text: string, x: number, y: number, z: number, color: string): void {
    const el = document.createElement('div');
    el.textContent = text;
    el.style.cssText = `position:fixed;font-size:13px;font-weight:900;color:${color};text-shadow:0 1px 4px #000;pointer-events:none;transform:translate(-50%,-50%);`;
    this.hudEl.appendChild(el);
    this.floating.push({ el, x, y, z, ttl: 0.9 });
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
    this.hpFillEl.style.width = `${hpPct}%`;
    this.hpTextEl.textContent = local.alive
      ? `${Math.round(local.hp)}/${local.maxHp}${local.shield > 0 ? ` +${Math.round(local.shield)}` : ''}`
      : `RESPAWN ${local.respawnTimer.toFixed(1)}s`;
    this.acornEl.textContent = `${Math.round(local.acorns)}g`;
    this.levelEl.textContent = `Lv.${local.level}`;
    this.ammoEl.textContent = local.infiniteAmmoTimer > 0
      ? 'OVERDRIVE ∞'
      : local.move.sliding
        ? 'SLIDE ∞'
        : local.reloadTimer > 0
          ? 'RELOAD'
          : `${local.ammo}/${local.stats.magSize}`;

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

    // Flow State badge & speed vignette
    this.flowBadgeEl.textContent = local.move.flowTier > 0 ? `FLOW T${local.move.flowTier}` : '';
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
