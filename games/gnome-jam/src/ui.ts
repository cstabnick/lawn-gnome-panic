// Arcade UI for GBA GJAM: Title, 8-Team Character Select, Custom Gnome Creator,
// Season Standings & Top-6 Knockout Bracket, In-Game HUD, Pause & Post-Game Box Score.
import { createVolumeButton, type VolumeStore } from '@arcade/volume';
import {
  BEARD_SWATCHES,
  CUSTOM_STAT_BUDGET,
  CUSTOM_SWATCHES,
  PRO_TEAMS,
  SKIN_SWATCHES,
  STAT_MAX,
  STAT_MIN,
  customGnomeToProfile,
  getTeamById,
  loadCustomGnome,
  saveCustomGnome,
} from './teams';
import {
  createSeason,
  getNextPlayoffMatch,
  getNextRegularGame,
  getPlayerSeed,
  isPlayerInPlayoffs,
  loadSeason,
  recordPlayoffResult,
  recordRegularGameResult,
  saveSeason,
  simReadyCpuPlayoffMatches,
  simulateCpuGame,
  sortedStandings,
} from './season';
import type {
  AnnouncerEvent,
  CustomGnomeData,
  Difficulty,
  GnomePlayerProfile,
  MatchConfig,
  MatchResult,
  OpponentMode,
  PlayoffMatch,
  SeasonState,
} from './types';

export interface JamUIHooks {
  volume: VolumeStore;
  onClickSound: () => void;
  onNextBeat: () => string;
  currentBeatName: () => string;
  onStartMatch: (config: MatchConfig) => void;
  onPreviewGnome: (look: CustomGnomeData['look'] | null) => void;
  onPauseToggle: () => void;
  onQuitMatch: () => void;
  onSeasonChampion: () => void;
}

const STYLE_CSS = `
#jam-app {
  position: fixed;
  inset: 0;
  pointer-events: none;
  color: #fff;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  z-index: 10;
}
#jam-app * { box-sizing: border-box; }
.jam-screen {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: max(14px, env(safe-area-inset-top, 14px)) max(14px, env(safe-area-inset-right, 14px)) max(14px, env(safe-area-inset-bottom, 14px)) max(14px, env(safe-area-inset-left, 14px));
  background: radial-gradient(circle at 50% 25%, rgba(24,28,58,0.68), rgba(10,12,24,0.88));
  pointer-events: auto;
  overflow-y: auto;
}
.jam-screen.transparent-bg {
  background: linear-gradient(90deg, rgba(10,12,26,0.92) 0%, rgba(10,12,26,0.45) 55%, rgba(10,12,26,0.86) 100%);
  align-items: flex-start;
  justify-content: flex-start;
}
.jam-panel {
  width: min(920px, 100%);
  background: rgba(16, 20, 40, 0.92);
  border: 2px solid rgba(255, 210, 31, 0.55);
  border-radius: 16px;
  padding: 18px;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.6);
  max-height: calc(100dvh - 28px);
  overflow-y: auto;
}
.jam-logo {
  font-size: clamp(40px, 8vw, 72px);
  font-weight: 900;
  letter-spacing: 2px;
  line-height: 0.95;
  text-align: center;
  background: linear-gradient(180deg, #fff5b8 0%, #ffd21f 45%, #ff6a00 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 6px 0 #4a1500);
  margin: 0;
}
.jam-sub {
  text-align: center;
  font-weight: 800;
  letter-spacing: 2px;
  font-size: clamp(12px, 2.2vw, 16px);
  color: #8fd3ff;
  margin: 6px 0 22px;
}
.jam-btn {
  min-height: 46px;
  padding: 10px 18px;
  border-radius: 10px;
  border: 2px solid rgba(255,255,255,0.28);
  background: linear-gradient(180deg, #2a3466, #1b2247);
  color: #fff;
  font-weight: 900;
  font-size: 15px;
  letter-spacing: 0.6px;
  cursor: pointer;
  transition: transform 0.1s, filter 0.1s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.jam-btn:hover { filter: brightness(1.15); }
.jam-btn:active { transform: scale(0.96); }
.jam-btn.primary {
  background: linear-gradient(180deg, #ff9d1c, #d9460f);
  border-color: #ffe070;
  color: #fff;
  box-shadow: 0 4px 16px rgba(255,106,0,0.4);
}
.jam-btn.green {
  background: linear-gradient(180deg, #2fb344, #1c7c2c);
  border-color: #8df59e;
}
.jam-btn.small { min-height: 44px; padding: 6px 12px; font-size: 13px; }
.jam-btn.active {
  border-color: #ffd21f;
  box-shadow: 0 0 0 2px rgba(255,210,31,0.5);
  background: linear-gradient(180deg, #3c4d99, #243066);
}
.jam-row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.jam-grid-teams {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
  gap: 8px;
  margin: 10px 0 14px;
}
.jam-team-card {
  border-radius: 10px;
  padding: 10px;
  border: 2px solid rgba(255,255,255,0.18);
  background: rgba(255,255,255,0.06);
  cursor: pointer;
  text-align: left;
  min-height: 58px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
}
.jam-team-card.selected {
  border-color: #ffd21f;
  background: rgba(255, 210, 31, 0.18);
  box-shadow: 0 0 14px rgba(255, 210, 31, 0.3);
}
.jam-badge {
  width: 36px; height: 36px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; flex-shrink: 0; border: 2px solid rgba(255,255,255,0.5);
}
.jam-stat-bar {
  height: 8px; border-radius: 4px; background: rgba(255,255,255,0.15); overflow: hidden; flex: 1;
}
.jam-stat-fill {
  height: 100%; border-radius: 4px; background: linear-gradient(90deg, #ffd21f, #ff5500);
}
.jam-roster-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 10px;
  margin: 10px 0;
}
.jam-player-card {
  background: rgba(255,255,255,0.07);
  border: 2px solid rgba(255,255,255,0.16);
  border-radius: 10px;
  padding: 10px;
  cursor: pointer;
}
.jam-player-card.selected {
  border-color: #44ff88;
  background: rgba(68,255,136,0.14);
}
.jam-swatch {
  width: 34px; height: 34px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.45);
  cursor: pointer;
}
.jam-swatch.selected {
  border: 3px solid #ffd21f;
  transform: scale(1.12);
}
#jam-hud {
  position: fixed;
  inset: 0;
  pointer-events: none;
  display: none;
  z-index: 20;
}
.jam-scoreboard {
  position: absolute;
  top: max(10px, env(safe-area-inset-top, 10px));
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(12, 14, 28, 0.88);
  border: 2px solid rgba(255, 210, 31, 0.7);
  border-radius: 12px;
  padding: 6px 14px;
  box-shadow: 0 6px 22px rgba(0,0,0,0.5);
  white-space: nowrap;
}
.jam-score-team {
  display: flex; align-items: center; gap: 8px; font-weight: 900; font-size: 16px;
}
.jam-score-num {
  font-family: monospace; font-size: 26px; font-weight: 900; color: #ffd21f; min-width: 32px; text-align: center;
}
.jam-clock-box {
  text-align: center; padding: 0 10px; border-left: 1px solid rgba(255,255,255,0.2); border-right: 1px solid rgba(255,255,255,0.2);
}
.jam-turbo-wrap {
  position: absolute;
  bottom: max(14px, env(safe-area-inset-bottom, 14px));
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 16px;
  align-items: center;
  background: rgba(12,14,28,0.82);
  border: 1px solid rgba(255,255,255,0.22);
  border-radius: 10px;
  padding: 6px 12px;
}
.jam-announce {
  position: absolute;
  top: 22%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.9);
  text-align: center;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.16s, transform 0.16s;
  text-shadow: 0 4px 0 rgba(0,0,0,0.85), 0 0 24px rgba(255,120,0,0.65);
}
.jam-announce.show {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.06);
}
.jam-bracket {
  display: grid;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  gap: 14px;
  margin: 12px 0;
}
@media (max-width: 680px) {
  .jam-bracket { grid-template-columns: 1fr; }
  .jam-turbo-wrap { bottom: auto; top: max(70px, calc(env(safe-area-inset-top, 10px) + 58px)); }
}
.jam-match-box {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 13px;
}
.jam-match-box.mine {
  border-color: #ffd21f;
  background: rgba(255,210,31,0.12);
}
.jam-table {
  width: 100%; border-collapse: collapse; font-size: 13px; margin: 10px 0;
}
.jam-table th, .jam-table td {
  padding: 6px 8px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.12);
}
.jam-table tr.top2 { background: rgba(68, 255, 136, 0.1); }
.jam-table tr.top6 { background: rgba(255, 210, 31, 0.06); }
.jam-table tr.mine { outline: 1px solid #ffd21f; font-weight: 800; }
`;

export class JamUI {
  readonly root: HTMLDivElement;
  private screenSlot: HTMLDivElement;
  private hudEl: HTMLDivElement;
  private announceEl: HTMLDivElement;
  private announceTimer: number | null = null;
  private hooks: JamUIHooks;

  // Persistent selections
  private homeTeamId = PRO_TEAMS[0].id;
  private awayTeamId = PRO_TEAMS[1].id;
  private homeDuo: [number, number] = [0, 1];
  private useCustom = false;
  private opponentMode: OpponentMode = 'ai';
  private difficulty: Difficulty = 'pro';
  private quarterSeconds = 60;
  private customGnome: CustomGnomeData;
  private season: SeasonState | null;
  private lastMatchConfig: MatchConfig | null = null;

  // HUD live nodes
  private hudHomeLbl!: HTMLElement;
  private hudAwayLbl!: HTMLElement;
  private hudHomeScore!: HTMLElement;
  private hudAwayScore!: HTMLElement;
  private hudQuarter!: HTMLElement;
  private hudClock!: HTMLElement;
  private hudShot!: HTMLElement;
  private hudP1Name!: HTMLElement;
  private hudP1Turbo!: HTMLElement;
  private hudFireBadge!: HTMLElement;

  constructor(uiParent: HTMLElement, hooks: JamUIHooks) {
    this.hooks = hooks;
    this.customGnome = loadCustomGnome();
    this.season = loadSeason();

    const style = document.createElement('style');
    style.textContent = STYLE_CSS;
    document.head.appendChild(style);

    this.root = document.createElement('div');
    this.root.id = 'jam-app';
    uiParent.appendChild(this.root);

    this.screenSlot = document.createElement('div');
    this.root.appendChild(this.screenSlot);

    this.hudEl = document.createElement('div');
    this.hudEl.id = 'jam-hud';
    this.buildHUD();
    this.root.appendChild(this.hudEl);

    this.announceEl = document.createElement('div');
    this.announceEl.className = 'jam-announce';
    this.hudEl.appendChild(this.announceEl);

    // Mount shared @arcade/volume button + 90s Beat Selector pill in top-left corner
    const volWrap = document.createElement('div');
    volWrap.style.cssText = `
      position:fixed;top:max(10px, env(safe-area-inset-top, 10px));left:max(10px, env(safe-area-inset-left, 10px));
      z-index:40;pointer-events:auto;display:flex;align-items:center;gap:8px;
    `;
    createVolumeButton(volWrap, hooks.volume, { title: 'Gnomerena Audio' });

    const beatBtn = document.createElement('button');
    beatBtn.type = 'button';
    beatBtn.id = 'jam-beat-btn';
    beatBtn.className = 'jam-btn small';
    beatBtn.style.cssText = 'min-height:44px;padding:6px 12px;font-size:12px;opacity:0.92';
    beatBtn.textContent = `🎵 ${hooks.currentBeatName()} ⏭`;
    beatBtn.title = 'Switch 90s Hip-Hop Beat';
    beatBtn.addEventListener('click', () => {
      const next = hooks.onNextBeat();
      beatBtn.textContent = `🎵 ${next} ⏭`;
    });
    volWrap.appendChild(beatBtn);
    this.root.appendChild(volWrap);
  }

  private buildHUD(): void {
    const sb = document.createElement('div');
    sb.className = 'jam-scoreboard';
    sb.innerHTML = `
      <div class="jam-score-team"><span id="hud-home-lbl">MOS</span><span id="hud-home-score" class="jam-score-num">0</span></div>
      <div class="jam-clock-box">
        <div id="hud-quarter" style="font-size:11px;font-weight:900;color:#8fd3ff">Q1</div>
        <div id="hud-clock" style="font-family:monospace;font-size:18px;font-weight:900;color:#ff5555">1:00</div>
        <div id="hud-shot" style="font-size:10px;color:#bbb;font-weight:700">SC 24</div>
      </div>
      <div class="jam-score-team"><span id="hud-away-score" class="jam-score-num">0</span><span id="hud-away-lbl">RED</span></div>
    `;

    const pauseBtn = document.createElement('button');
    pauseBtn.type = 'button';
    pauseBtn.className = 'jam-btn small';
    pauseBtn.textContent = '⏸';
    pauseBtn.title = 'Pause (Esc / P)';
    pauseBtn.style.cssText = `
      position:absolute;top:max(10px, env(safe-area-inset-top, 10px));right:max(10px, env(safe-area-inset-right, 10px));
      pointer-events:auto;min-width:44px;min-height:44px;
    `;
    pauseBtn.onclick = () => {
      this.hooks.onClickSound();
      this.hooks.onPauseToggle();
    };

    const turboWrap = document.createElement('div');
    turboWrap.className = 'jam-turbo-wrap';
    turboWrap.innerHTML = `
      <span id="hud-p1-name" style="font-size:12px;font-weight:800;color:#ffd21f">P1</span>
      <div style="width:110px;height:10px;border-radius:5px;background:rgba(255,255,255,0.18);overflow:hidden">
        <div id="hud-p1-turbo" style="height:100%;width:100%;background:linear-gradient(90deg,#33ddff,#ffd21f)"></div>
      </div>
      <span id="hud-fire-badge" style="display:none;font-size:12px;font-weight:900;color:#ff6a00">🔥 ON FIRE!</span>
    `;

    this.hudEl.append(sb, pauseBtn, turboWrap);
    this.hudHomeLbl = sb.querySelector('#hud-home-lbl')!;
    this.hudAwayLbl = sb.querySelector('#hud-away-lbl')!;
    this.hudHomeScore = sb.querySelector('#hud-home-score')!;
    this.hudAwayScore = sb.querySelector('#hud-away-score')!;
    this.hudQuarter = sb.querySelector('#hud-quarter')!;
    this.hudClock = sb.querySelector('#hud-clock')!;
    this.hudShot = sb.querySelector('#hud-shot')!;
    this.hudP1Name = turboWrap.querySelector('#hud-p1-name')!;
    this.hudP1Turbo = turboWrap.querySelector('#hud-p1-turbo')!;
    this.hudFireBadge = turboWrap.querySelector('#hud-fire-badge')!;
  }

  showHUD(show: boolean): void {
    this.hudEl.style.display = show ? 'block' : 'none';
  }

  updateHUD(
    homeAbbr: string,
    awayAbbr: string,
    homeScore: number,
    awayScore: number,
    quarter: number,
    clockSec: number,
    shotClock: number,
    p1Name: string,
    p1Turbo: number,
    onFire: boolean,
  ): void {
    this.hudHomeLbl.textContent = homeAbbr;
    this.hudAwayLbl.textContent = awayAbbr;
    this.hudHomeScore.textContent = String(homeScore);
    this.hudAwayScore.textContent = String(awayScore);
    this.hudQuarter.textContent = quarter > 4 ? 'OT' : `Q${quarter}`;
    const m = Math.floor(Math.max(0, clockSec) / 60);
    const s = Math.floor(Math.max(0, clockSec) % 60);
    this.hudClock.textContent = `${m}:${String(s).padStart(2, '0')}`;
    this.hudShot.textContent = `SC ${Math.ceil(Math.max(0, shotClock))}`;
    this.hudP1Name.textContent = p1Name;
    this.hudP1Turbo.style.width = `${Math.max(0, Math.min(100, p1Turbo))}%`;
    this.hudP1Turbo.style.background = onFire
      ? 'linear-gradient(90deg,#ff3300,#ffee33)'
      : 'linear-gradient(90deg,#33ddff,#ffd21f)';
    this.hudFireBadge.style.display = onFire ? 'inline' : 'none';
  }

  announce(ev: AnnouncerEvent): void {
    if (this.announceTimer !== null) window.clearTimeout(this.announceTimer);
    this.announceEl.innerHTML = `
      <div style="font-size:${ev.big ? 'clamp(28px,5.5vw,52px)' : 'clamp(22px,4vw,36px)'};font-weight:900;color:${ev.color};letter-spacing:1px">${ev.text}</div>
      ${ev.subtext ? `<div style="font-size:16px;font-weight:800;color:#fff;margin-top:2px">${ev.subtext}</div>` : ''}
    `;
    this.announceEl.classList.add('show');
    this.announceTimer = window.setTimeout(() => {
      this.announceEl.classList.remove('show');
    }, ev.big ? 1600 : 1200);
  }

  clearScreens(): void {
    this.screenSlot.innerHTML = '';
  }

  // =========================================================================
  // 1. TITLE SCREEN
  // =========================================================================
  showTitle(): void {
    this.showHUD(false);
    this.hooks.onPreviewGnome(null);
    const saved = loadSeason();
    this.season = saved;

    this.screenSlot.innerHTML = `
      <div class="jam-screen" id="jam-title">
        <div class="jam-panel" style="max-width:560px;text-align:center">
          <div style="font-size:42px;margin-bottom:4px">🏀🔥🧙‍♂️</div>
          <h1 class="jam-logo">GBA GJAM</h1>
          <div class="jam-sub">2-ON-2 GNOMERENA ARCADE BASKETBALL</div>
          <div style="display:flex;flex-direction:column;gap:10px;margin:14px 0">
            <button id="jam-quick-btn" class="jam-btn primary">⚡ QUICK JAM (EXHIBITION)</button>
            <button id="jam-season-btn" class="jam-btn green">🏆 ${saved && saved.phase !== 'complete' ? 'CONTINUE GBA SEASON' : 'GBA SEASON & TOP-6 PLAYOFFS'}</button>
            <button id="jam-custom-btn" class="jam-btn">🎨 CUSTOM GNOME CREATOR</button>
          </div>
          <div style="font-size:12px;color:#b8c4e0;line-height:1.5;margin-top:12px;background:rgba(0,0,0,0.28);padding:10px;border-radius:8px">
            <strong>Controls (P1):</strong> WASD / Arrows Move &nbsp;•&nbsp; <strong>Space / J</strong> Shoot, Dunk &amp; Block &nbsp;•&nbsp; <strong>K / E</strong> Pass, Steal &amp; Shove &nbsp;•&nbsp; <strong>Shift / L</strong> Turbo<br/>
            <strong>Mobile:</strong> Virtual Joystick + On-Screen Action Buttons &nbsp;•&nbsp; <strong>2P Local:</strong> Arrows + N/M/Comma
          </div>
        </div>
      </div>
    `;

    this.screenSlot.querySelector('#jam-quick-btn')!.addEventListener('click', () => {
      this.hooks.onClickSound();
      this.showTeamSelect('exhibition');
    });
    this.screenSlot.querySelector('#jam-season-btn')!.addEventListener('click', () => {
      this.hooks.onClickSound();
      if (this.season && this.season.phase !== 'complete') {
        this.showSeasonHub();
      } else {
        this.showTeamSelect('season');
      }
    });
    this.screenSlot.querySelector('#jam-custom-btn')!.addEventListener('click', () => {
      this.hooks.onClickSound();
      this.showCustomCreator('title');
    });
  }

  // =========================================================================
  // 2. TEAM & CHARACTER SELECT (8 PRO GBA TEAMS)
  // =========================================================================
  showTeamSelect(mode: 'exhibition' | 'season'): void {
    this.showHUD(false);
    this.hooks.onPreviewGnome(null);
    const homeTeam = getTeamById(this.homeTeamId);
    const awayTeam = getTeamById(this.awayTeamId);

    const renderTeamCards = (selectedId: string, attr: string) =>
      PRO_TEAMS.map(
        (t) => `
          <button type="button" class="jam-team-card ${t.id === selectedId ? 'selected' : ''}" data-${attr}="${t.id}">
            <div class="jam-badge" style="background:${t.primaryHex};border-color:${t.secondaryHex}">${t.emblem}</div>
            <div>
              <div style="font-weight:900;font-size:13px">${t.city} ${t.name}</div>
              <div style="font-size:11px;color:#b8c4e0">${t.motto}</div>
            </div>
          </button>
        `,
      ).join('');

    const statBar = (label: string, val: number) => `
      <div style="display:flex;align-items:center;gap:6px;font-size:11px;margin-top:3px">
        <span style="width:36px;color:#b8c4e0">${label}</span>
        <div class="jam-stat-bar"><div class="jam-stat-fill" style="width:${(val / 9) * 100}%"></div></div>
        <span style="width:14px;text-align:right;font-weight:800">${val}</span>
      </div>
    `;

    const renderPlayerCard = (p: GnomePlayerProfile, idx: number, selected: boolean) => `
      <div class="jam-player-card ${selected ? 'selected' : ''}" data-duo-idx="${idx}">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <strong style="font-size:14px">#${p.number} ${p.name}</strong>
          <span style="font-size:10px;background:rgba(255,210,31,0.2);color:#ffd21f;padding:2px 6px;border-radius:6px;font-weight:800">${p.nickname}</span>
        </div>
        ${statBar('SPD', p.stats.speed)}
        ${statBar('3PT', p.stats.threePt)}
        ${statBar('DNK', p.stats.dunk)}
        ${statBar('DEF', p.stats.defense)}
      </div>
    `;

    const customProfile = customGnomeToProfile(this.customGnome, homeTeam);

    this.screenSlot.innerHTML = `
      <div class="jam-screen" id="jam-select">
        <div class="jam-panel">
          <div class="jam-row" style="justify-content:space-between;margin-bottom:8px">
            <h2 style="margin:0;font-size:22px;color:#ffd21f">${mode === 'season' ? '🏆 NEW GBA SEASON — PICK YOUR TEAM' : '⚡ QUICK JAM — TEAM & ROSTER SELECT'}</h2>
            <button id="sel-back" class="jam-btn small">← Back</button>
          </div>

          <div style="font-weight:800;font-size:13px;color:#8fd3ff">1. CHOOSE YOUR PRO GBA TEAM (8 TEAMS)</div>
          <div class="jam-grid-teams">${renderTeamCards(this.homeTeamId, 'home')}</div>

          <div class="jam-row" style="justify-content:space-between;margin-top:8px">
            <div style="font-weight:800;font-size:13px;color:#8fd3ff">2. PICK YOUR 2-GNOME DUO (OR SLOT IN YOUR CUSTOM GNOME)</div>
            <div class="jam-row">
              <button id="sel-toggle-custom" class="jam-btn small ${this.useCustom ? 'active' : ''}">
                ${this.useCustom ? '✅ Custom Gnome: ON' : '➕ Use Custom Gnome'}
              </button>
              <button id="sel-edit-custom" class="jam-btn small">🎨 Edit Custom</button>
            </div>
          </div>

          <div class="jam-roster-grid">
            ${this.useCustom ? renderPlayerCard(customProfile, -1, true) : ''}
            ${homeTeam.roster
              .map((p, idx) => {
                const isSel = this.useCustom ? this.homeDuo[1] === idx : this.homeDuo.includes(idx);
                return renderPlayerCard(p, idx, isSel);
              })
              .join('')}
          </div>

          ${
            mode === 'exhibition'
              ? `
            <div style="font-weight:800;font-size:13px;color:#ff9988;margin-top:10px">3. OPPONENT TEAM &amp; MODE</div>
            <div class="jam-row" style="margin:8px 0">
              <button data-opp-mode="ai" class="jam-btn small ${this.opponentMode === 'ai' ? 'active' : ''}">🤖 vs AI Opponents</button>
              <button data-opp-mode="local2p" class="jam-btn small ${this.opponentMode === 'local2p' ? 'active' : ''}">👥 2P Local Versus</button>
              <span style="margin-left:8px;font-size:12px;color:#b8c4e0">Opponent:</span>
              <select id="sel-away-team" style="min-height:44px;border-radius:8px;padding:6px 10px;background:#1b2247;color:#fff;border:1px solid #ffd21f;font-weight:700">
                ${PRO_TEAMS.map(
                  (t) => `<option value="${t.id}" ${t.id === awayTeam.id ? 'selected' : ''}>${t.emblem} ${t.city} ${t.name}</option>`,
                ).join('')}
              </select>
            </div>
          `
              : ''
          }

          <div class="jam-row" style="justify-content:space-between;margin-top:12px;border-top:1px solid rgba(255,255,255,0.12);padding-top:12px">
            <div class="jam-row">
              <span style="font-size:12px;color:#b8c4e0">AI Difficulty:</span>
              ${(['rookie', 'pro', 'allstar'] as Difficulty[])
                .map(
                  (d) => `<button data-diff="${d}" class="jam-btn small ${this.difficulty === d ? 'active' : ''}">${d.toUpperCase()}</button>`,
                )
                .join('')}
              <span style="font-size:12px;color:#b8c4e0;margin-left:6px">Quarter:</span>
              ${[45, 60, 90]
                .map(
                  (q) => `<button data-qsec="${q}" class="jam-btn small ${this.quarterSeconds === q ? 'active' : ''}">${q}s</button>`,
                )
                .join('')}
            </div>
            <button id="sel-go" class="jam-btn primary" style="min-width:190px;font-size:17px">
              ${mode === 'season' ? '🏆 START SEASON!' : '🏀 TIP-OFF!'}
            </button>
          </div>
        </div>
      </div>
    `;

    this.screenSlot.querySelector('#sel-back')!.addEventListener('click', () => {
      this.hooks.onClickSound();
      this.showTitle();
    });

    this.screenSlot.querySelectorAll('[data-home]').forEach((el) => {
      el.addEventListener('click', () => {
        this.hooks.onClickSound();
        this.homeTeamId = (el as HTMLElement).dataset.home!;
        if (this.awayTeamId === this.homeTeamId) {
          this.awayTeamId = PRO_TEAMS.find((t) => t.id !== this.homeTeamId)!.id;
        }
        this.showTeamSelect(mode);
      });
    });

    this.screenSlot.querySelector('#sel-toggle-custom')!.addEventListener('click', () => {
      this.hooks.onClickSound();
      this.useCustom = !this.useCustom;
      this.showTeamSelect(mode);
    });

    this.screenSlot.querySelector('#sel-edit-custom')!.addEventListener('click', () => {
      this.hooks.onClickSound();
      this.showCustomCreator(mode);
    });

    this.screenSlot.querySelectorAll('[data-duo-idx]').forEach((el) => {
      el.addEventListener('click', () => {
        const idx = Number((el as HTMLElement).dataset.duoIdx);
        if (idx < 0) return;
        this.hooks.onClickSound();
        if (this.useCustom) {
          this.homeDuo = [0, idx];
        } else if (!this.homeDuo.includes(idx)) {
          this.homeDuo = [this.homeDuo[1], idx];
        }
        this.showTeamSelect(mode);
      });
    });

    this.screenSlot.querySelectorAll('[data-opp-mode]').forEach((el) => {
      el.addEventListener('click', () => {
        this.hooks.onClickSound();
        this.opponentMode = (el as HTMLElement).dataset.oppMode as OpponentMode;
        this.showTeamSelect(mode);
      });
    });

    const awaySel = this.screenSlot.querySelector('#sel-away-team') as HTMLSelectElement | null;
    awaySel?.addEventListener('change', () => {
      this.awayTeamId = awaySel.value;
    });

    this.screenSlot.querySelectorAll('[data-diff]').forEach((el) => {
      el.addEventListener('click', () => {
        this.hooks.onClickSound();
        this.difficulty = (el as HTMLElement).dataset.diff as Difficulty;
        this.showTeamSelect(mode);
      });
    });

    this.screenSlot.querySelectorAll('[data-qsec]').forEach((el) => {
      el.addEventListener('click', () => {
        this.hooks.onClickSound();
        this.quarterSeconds = Number((el as HTMLElement).dataset.qsec);
        this.showTeamSelect(mode);
      });
    });

    this.screenSlot.querySelector('#sel-go')!.addEventListener('click', () => {
      this.hooks.onClickSound();
      if (mode === 'season') {
        this.season = createSeason(
          this.homeTeamId,
          this.useCustom,
          this.homeDuo,
          this.difficulty,
          this.quarterSeconds,
        );
        saveSeason(this.season);
        this.showSeasonHub();
      } else {
        const home = getTeamById(this.homeTeamId);
        const away = getTeamById(this.awayTeamId);
        const homeRoster = this.buildHomeRoster(home, this.useCustom, this.homeDuo);
        const config: MatchConfig = {
          homeTeamId: home.id,
          awayTeamId: away.id,
          homeRoster,
          awayRoster: [away.roster[0], away.roster[1]],
          opponentMode: this.opponentMode,
          difficulty: this.difficulty,
          quarterSeconds: this.quarterSeconds,
        };
        this.launchMatch(config);
      }
    });
  }

  private buildHomeRoster(
    team: ReturnType<typeof getTeamById>,
    useCustom: boolean,
    duo: [number, number],
  ): [GnomePlayerProfile, GnomePlayerProfile] {
    if (useCustom) {
      return [customGnomeToProfile(this.customGnome, team), team.roster[duo[1]] ?? team.roster[0]];
    }
    return [team.roster[duo[0]] ?? team.roster[0], team.roster[duo[1]] ?? team.roster[1]];
  }

  // =========================================================================
  // 3. CUSTOM GNOME CREATOR (LIVE 3D PREVIEW)
  // =========================================================================
  showCustomCreator(returnTo: 'title' | 'exhibition' | 'season'): void {
    this.showHUD(false);
    const g = this.customGnome;
    this.hooks.onPreviewGnome(g.look);

    const usedPoints = g.stats.speed + g.stats.threePt + g.stats.dunk + g.stats.defense;
    const remaining = CUSTOM_STAT_BUDGET - usedPoints;

    const swatches = (list: readonly number[], current: number | null, key: string) =>
      list
        .map(
          (hex) =>
            `<button type="button" class="jam-swatch ${current === hex ? 'selected' : ''}" data-sw="${key}" data-hex="${hex}" style="background:#${hex.toString(16).padStart(6, '0')}"></button>`,
        )
        .join('');

    const statControl = (key: keyof CustomGnomeData['stats'], label: string) => `
      <div style="display:flex;align-items:center;gap:8px;margin:6px 0">
        <span style="width:74px;font-weight:800;font-size:13px">${label}</span>
        <button type="button" class="jam-btn small" data-stat-dec="${key}">−</button>
        <div class="jam-stat-bar"><div class="jam-stat-fill" style="width:${(g.stats[key] / STAT_MAX) * 100}%"></div></div>
        <span style="width:18px;text-align:center;font-weight:900">${g.stats[key]}</span>
        <button type="button" class="jam-btn small" data-stat-inc="${key}">+</button>
      </div>
    `;

    this.screenSlot.innerHTML = `
      <div class="jam-screen transparent-bg" id="jam-creator">
        <div class="jam-panel" style="max-width:440px">
          <div class="jam-row" style="justify-content:space-between;margin-bottom:8px">
            <h2 style="margin:0;font-size:20px;color:#ffd21f">🎨 CUSTOM GNOME</h2>
            <button id="cc-done" class="jam-btn primary small">Save &amp; Use</button>
          </div>

          <div class="jam-row" style="margin-bottom:10px">
            <input id="cc-name" type="text" maxlength="18" value="${g.name}" placeholder="Gnome Name"
              style="flex:1;min-height:44px;border-radius:8px;border:1px solid #ffd21f;background:#11152c;color:#fff;padding:6px 10px;font-weight:800" />
            <input id="cc-num" type="number" min="0" max="99" value="${g.number}"
              style="width:72px;min-height:44px;border-radius:8px;border:1px solid #ffd21f;background:#11152c;color:#fff;padding:6px 10px;font-weight:800" />
          </div>

          <div style="font-size:12px;font-weight:800;color:#8fd3ff;margin:6px 0 4px">HAT COLOUR</div>
          <div class="jam-row">${swatches(CUSTOM_SWATCHES, g.look.hat, 'hat')}</div>

          <div style="font-size:12px;font-weight:800;color:#8fd3ff;margin:8px 0 4px">JERSEY COLOUR</div>
          <div class="jam-row">${swatches(CUSTOM_SWATCHES, g.look.shirt, 'shirt')}</div>

          <div style="font-size:12px;font-weight:800;color:#8fd3ff;margin:8px 0 4px">SKIN TONE</div>
          <div class="jam-row">${swatches(SKIN_SWATCHES, g.look.skin, 'skin')}</div>

          <div style="font-size:12px;font-weight:800;color:#8fd3ff;margin:8px 0 4px">BEARD &amp; FEATURES</div>
          <div class="jam-row" style="margin-bottom:6px">
            <button type="button" id="cc-no-beard" class="jam-btn small ${g.look.beard === null ? 'active' : ''}">No Beard</button>
            ${swatches(BEARD_SWATCHES, g.look.beard, 'beard')}
          </div>
          <div class="jam-row">
            <button type="button" id="cc-hair" class="jam-btn small ${g.look.hair ? 'active' : ''}">Pigtails</button>
            <button type="button" id="cc-glasses" class="jam-btn small ${g.look.glasses ? 'active' : ''}">Glasses</button>
            <button type="button" id="cc-freckles" class="jam-btn small ${g.look.freckles ? 'active' : ''}">Freckles</button>
          </div>

          <div style="font-size:12px;font-weight:800;color:#ffd21f;margin:12px 0 4px">
            STAT POINTS (REMAINING: ${remaining})
          </div>
          ${statControl('speed', 'SPEED')}
          ${statControl('threePt', '3-POINT')}
          ${statControl('dunk', 'DUNK')}
          ${statControl('defense', 'DEFENSE')}
        </div>
      </div>
    `;

    const nameEl = this.screenSlot.querySelector('#cc-name') as HTMLInputElement;
    const numEl = this.screenSlot.querySelector('#cc-num') as HTMLInputElement;
    nameEl.addEventListener('input', () => {
      g.name = nameEl.value.trim() || 'My Gnome';
    });
    numEl.addEventListener('input', () => {
      g.number = Math.max(0, Math.min(99, Number(numEl.value) || 0));
    });

    this.screenSlot.querySelectorAll('[data-sw]').forEach((el) => {
      el.addEventListener('click', () => {
        this.hooks.onClickSound();
        const key = (el as HTMLElement).dataset.sw!;
        const hex = Number((el as HTMLElement).dataset.hex);
        if (key === 'hat') g.look.hat = hex;
        else if (key === 'shirt') g.look.shirt = hex;
        else if (key === 'skin') g.look.skin = hex;
        else if (key === 'beard') g.look.beard = hex;
        this.showCustomCreator(returnTo);
      });
    });

    this.screenSlot.querySelector('#cc-no-beard')!.addEventListener('click', () => {
      this.hooks.onClickSound();
      g.look.beard = null;
      this.showCustomCreator(returnTo);
    });
    this.screenSlot.querySelector('#cc-hair')!.addEventListener('click', () => {
      this.hooks.onClickSound();
      g.look.hair = g.look.hair ? null : { color: 0x6b3e26, style: 'pigtails' };
      this.showCustomCreator(returnTo);
    });
    this.screenSlot.querySelector('#cc-glasses')!.addEventListener('click', () => {
      this.hooks.onClickSound();
      g.look.glasses = !g.look.glasses;
      this.showCustomCreator(returnTo);
    });
    this.screenSlot.querySelector('#cc-freckles')!.addEventListener('click', () => {
      this.hooks.onClickSound();
      g.look.freckles = !g.look.freckles;
      this.showCustomCreator(returnTo);
    });

    this.screenSlot.querySelectorAll('[data-stat-inc]').forEach((el) => {
      el.addEventListener('click', () => {
        const key = (el as HTMLElement).dataset.statInc as keyof CustomGnomeData['stats'];
        if (remaining > 0 && g.stats[key] < STAT_MAX) {
          this.hooks.onClickSound();
          g.stats[key]++;
          this.showCustomCreator(returnTo);
        }
      });
    });
    this.screenSlot.querySelectorAll('[data-stat-dec]').forEach((el) => {
      el.addEventListener('click', () => {
        const key = (el as HTMLElement).dataset.statDec as keyof CustomGnomeData['stats'];
        if (g.stats[key] > STAT_MIN) {
          this.hooks.onClickSound();
          g.stats[key]--;
          this.showCustomCreator(returnTo);
        }
      });
    });

    this.screenSlot.querySelector('#cc-done')!.addEventListener('click', () => {
      this.hooks.onClickSound();
      saveCustomGnome(g);
      this.useCustom = true;
      this.hooks.onPreviewGnome(null);
      if (returnTo === 'title') this.showTitle();
      else this.showTeamSelect(returnTo);
    });
  }

  // =========================================================================
  // 4. GBA SEASON HUB & TOP-6 KNOCKOUT TOURNAMENT BRACKET
  // =========================================================================
  showSeasonHub(): void {
    this.showHUD(false);
    this.hooks.onPreviewGnome(null);
    const s = this.season;
    if (!s) {
      this.showTeamSelect('season');
      return;
    }

    // Auto-sim any CPU-only playoff matches while player sits on a #1/#2 BYE!
    if (s.phase === 'playoffs') {
      simReadyCpuPlayoffMatches(s);
      saveSeason(s);
    }

    const ranked = sortedStandings(s.standings);
    const myTeam = getTeamById(s.playerTeamId);

    if (s.phase === 'regular') {
      const nextGame = getNextRegularGame(s);
      const oppId = nextGame
        ? nextGame.homeTeamId === s.playerTeamId
          ? nextGame.awayTeamId
          : nextGame.homeTeamId
        : PRO_TEAMS[0].id;
      const oppTeam = getTeamById(oppId);

      this.screenSlot.innerHTML = `
        <div class="jam-screen" id="jam-season-hub">
          <div class="jam-panel">
            <div class="jam-row" style="justify-content:space-between">
              <h2 style="margin:0;color:#ffd21f">🏆 GBA SEASON — ROUND ${s.currentRound + 1} OF 7</h2>
              <div class="jam-row">
                <button id="sh-menu" class="jam-btn small">Main Menu</button>
                <button id="sh-reset" class="jam-btn small" style="background:#5a1e28">New Season</button>
              </div>
            </div>

            <div style="margin:10px 0;padding:12px;border-radius:10px;background:rgba(255,210,31,0.12);border:1px solid rgba(255,210,31,0.45);display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px">
              <div>
                <div style="font-size:12px;color:#8fd3ff;font-weight:800">NEXT MATCHUP</div>
                <div style="font-size:18px;font-weight:900">${myTeam.emblem} ${myTeam.city} ${myTeam.name} &nbsp;vs&nbsp; ${oppTeam.emblem} ${oppTeam.city} ${oppTeam.name}</div>
              </div>
              <div class="jam-row">
                <button id="sh-sim" class="jam-btn small">⏭ Sim Game</button>
                <button id="sh-play" class="jam-btn primary">🏀 PLAY GAME</button>
              </div>
            </div>

            <div style="font-size:12px;color:#b8c4e0;margin-top:8px">
              Top <strong>6</strong> teams advance to the Knockout Tournament. Top <strong>2</strong> earn a <strong>First-Round Bye</strong> straight into the Semifinals!
            </div>

            <table class="jam-table">
              <thead><tr><th>#</th><th>Team</th><th>W</th><th>L</th><th>PF</th><th>PA</th><th>Diff</th><th>Status</th></tr></thead>
              <tbody>
                ${ranked
                  .map((st, idx) => {
                    const t = getTeamById(st.teamId);
                    const diff = st.pointsFor - st.pointsAgainst;
                    const cls = [
                      idx < 2 ? 'top2' : idx < 6 ? 'top6' : '',
                      st.teamId === s.playerTeamId ? 'mine' : '',
                    ].join(' ');
                    const tag = idx < 2 ? '🌟 R1 BYE' : idx < 6 ? '✅ PLAYOFFS' : '—';
                    return `<tr class="${cls}">
                      <td>${idx + 1}</td>
                      <td>${t.emblem} ${t.city} ${t.name}</td>
                      <td>${st.wins}</td><td>${st.losses}</td>
                      <td>${st.pointsFor}</td><td>${st.pointsAgainst}</td>
                      <td>${diff >= 0 ? '+' : ''}${diff}</td>
                      <td style="font-weight:800">${tag}</td>
                    </tr>`;
                  })
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      this.screenSlot.querySelector('#sh-menu')!.addEventListener('click', () => {
        this.hooks.onClickSound();
        this.showTitle();
      });
      this.screenSlot.querySelector('#sh-reset')!.addEventListener('click', () => {
        this.hooks.onClickSound();
        saveSeason(null);
        this.season = null;
        this.showTeamSelect('season');
      });
      this.screenSlot.querySelector('#sh-sim')!.addEventListener('click', () => {
        if (!nextGame) return;
        this.hooks.onClickSound();
        const simRes = simulateCpuGame(nextGame.homeTeamId, nextGame.awayTeamId);
        recordRegularGameResult(s, nextGame.id, simRes.homeScore, simRes.awayScore);
        saveSeason(s);
        this.showSeasonHub();
      });
      this.screenSlot.querySelector('#sh-play')!.addEventListener('click', () => {
        if (!nextGame) return;
        this.hooks.onClickSound();
        this.launchSeasonMatch(s, oppId, {
          phase: 'regular',
          roundIndex: s.currentRound,
          matchId: nextGame.id,
          label: `Regular Season — Round ${s.currentRound + 1}`,
        });
      });
      return;
    }

    // PLAYOFFS OR COMPLETE: Show Top-6 Knockout Bracket!
    const b = s.bracket!;
    const nextPO = getNextPlayoffMatch(s);
    const inPO = isPlayerInPlayoffs(s);
    const mySeed = getPlayerSeed(s);
    const playerHasMatch =
      nextPO && (nextPO.homeTeamId === s.playerTeamId || nextPO.awayTeamId === s.playerTeamId);

    const renderMatchBox = (m: PlayoffMatch) => {
      const h = m.homeTeamId ? getTeamById(m.homeTeamId) : null;
      const a = m.awayTeamId ? getTeamById(m.awayTeamId) : null;
      const isMine = m.homeTeamId === s.playerTeamId || m.awayTeamId === s.playerTeamId;
      return `
        <div class="jam-match-box ${isMine ? 'mine' : ''}">
          <div style="font-size:11px;color:#8fd3ff;font-weight:800;margin-bottom:4px">${m.label}</div>
          <div style="display:flex;justify-content:space-between;${m.winnerTeamId && m.winnerTeamId === m.homeTeamId ? 'color:#44ff88;font-weight:900' : ''}">
            <span>${h ? `#${m.homeSeed ?? ''} ${h.emblem} ${h.abbr}` : 'TBD'}</span>
            <strong>${m.played ? m.homeScore : '—'}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:2px;${m.winnerTeamId && m.winnerTeamId === m.awayTeamId ? 'color:#44ff88;font-weight:900' : ''}">
            <span>${a ? `#${m.awaySeed ?? ''} ${a.emblem} ${a.abbr}` : 'TBD'}</span>
            <strong>${m.played ? m.awayScore : '—'}</strong>
          </div>
        </div>
      `;
    };

    const champ = b.championTeamId ? getTeamById(b.championTeamId) : null;

    this.screenSlot.innerHTML = `
      <div class="jam-screen" id="jam-bracket-screen">
        <div class="jam-panel">
          <div class="jam-row" style="justify-content:space-between">
            <h2 style="margin:0;color:#ffd21f">🏆 GBA TOP-6 KNOCKOUT TOURNAMENT</h2>
            <div class="jam-row">
              <button id="po-menu" class="jam-btn small">Main Menu</button>
              <button id="po-reset" class="jam-btn small" style="background:#5a1e28">New Season</button>
            </div>
          </div>

          ${
            champ
              ? `
            <div style="text-align:center;margin:12px 0;padding:14px;border-radius:12px;background:linear-gradient(135deg,rgba(255,210,31,0.22),rgba(255,106,0,0.2));border:2px solid #ffd21f">
              <div style="font-size:36px">🏆🌰</div>
              <div style="font-size:22px;font-weight:900;color:#ffd21f">${champ.emblem} ${champ.city.toUpperCase()} ${champ.name.toUpperCase()} ARE GBA CHAMPIONS!</div>
              <div style="font-size:13px;color:#fff;margin-top:4px">${champ.id === s.playerTeamId ? 'YOU LIFTED THE GOLDEN ACORN TROPHY!' : 'Better luck next season!'}</div>
            </div>
          `
              : `
            <div style="margin:10px 0;padding:12px;border-radius:10px;background:rgba(255,210,31,0.1);border:1px solid rgba(255,210,31,0.4);display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px">
              <div>
                <div style="font-size:13px;font-weight:800;color:#8fd3ff">
                  ${inPO ? `Your Seed: #${mySeed} ${mySeed! <= 2 ? '(Earned First-Round BYE into Semifinals!)' : ''}` : 'Missed Top 6 Playoffs'}
                </div>
                <div style="font-size:16px;font-weight:900">
                  ${playerHasMatch ? `Next Up: ${nextPO!.label}` : nextPO ? 'Tournament in progress...' : 'Playoffs Complete'}
                </div>
              </div>
              <div class="jam-row">
                ${playerHasMatch ? `<button id="po-play" class="jam-btn primary">🏀 PLAY PLAYOFF GAME</button>` : ''}
                ${nextPO ? `<button id="po-sim" class="jam-btn small">⏭ Sim Next</button>` : ''}
              </div>
            </div>
          `
          }

          <div class="jam-bracket">
            <div style="display:flex;flex-direction:column;gap:10px">
              <div style="font-size:12px;font-weight:900;color:#ffd21f;text-align:center">ROUND 1 (WILDCARD)</div>
              <div style="font-size:11px;color:#44ff88;text-align:center">Seeds #1 &amp; #2 receive R1 BYE!</div>
              ${renderMatchBox(b.qf1)}
              ${renderMatchBox(b.qf2)}
            </div>
            <div style="display:flex;flex-direction:column;gap:10px;justify-content:center">
              <div style="font-size:12px;font-weight:900;color:#ffd21f;text-align:center">ROUND 2 (SEMIFINALS)</div>
              ${renderMatchBox(b.sf1)}
              ${renderMatchBox(b.sf2)}
            </div>
            <div style="display:flex;flex-direction:column;gap:10px;justify-content:center">
              <div style="font-size:12px;font-weight:900;color:#ffd21f;text-align:center">ROUND 3 (GBA FINALS)</div>
              ${renderMatchBox(b.finals)}
            </div>
          </div>
        </div>
      </div>
    `;

    this.screenSlot.querySelector('#po-menu')!.addEventListener('click', () => {
      this.hooks.onClickSound();
      this.showTitle();
    });
    this.screenSlot.querySelector('#po-reset')!.addEventListener('click', () => {
      this.hooks.onClickSound();
      saveSeason(null);
      this.season = null;
      this.showTeamSelect('season');
    });
    this.screenSlot.querySelector('#po-play')?.addEventListener('click', () => {
      if (!nextPO) return;
      this.hooks.onClickSound();
      const oppId = nextPO.homeTeamId === s.playerTeamId ? nextPO.awayTeamId! : nextPO.homeTeamId!;
      this.launchSeasonMatch(s, oppId, {
        phase: 'playoffs',
        roundIndex: nextPO.round,
        matchId: nextPO.id,
        label: nextPO.label,
      });
    });
    this.screenSlot.querySelector('#po-sim')?.addEventListener('click', () => {
      if (!nextPO || !nextPO.homeTeamId || !nextPO.awayTeamId) return;
      this.hooks.onClickSound();
      const simRes = simulateCpuGame(nextPO.homeTeamId, nextPO.awayTeamId);
      recordPlayoffResult(s, nextPO.id, simRes.homeScore, simRes.awayScore);
      simReadyCpuPlayoffMatches(s);
      saveSeason(s);
      this.showSeasonHub();
    });
  }

  private launchSeasonMatch(
    s: SeasonState,
    oppTeamId: string,
    ctx: NonNullable<MatchConfig['seasonContext']>,
  ): void {
    const myTeam = getTeamById(s.playerTeamId);
    const oppTeam = getTeamById(oppTeamId);
    const config: MatchConfig = {
      homeTeamId: myTeam.id,
      awayTeamId: oppTeam.id,
      homeRoster: this.buildHomeRoster(myTeam, s.useCustomGnome, s.playerDuoIndices),
      awayRoster: [oppTeam.roster[0], oppTeam.roster[1]],
      opponentMode: 'ai',
      difficulty: s.difficulty,
      quarterSeconds: s.quarterSeconds,
      seasonContext: ctx,
    };
    this.launchMatch(config);
  }

  private launchMatch(config: MatchConfig): void {
    this.lastMatchConfig = config;
    this.clearScreens();
    this.showHUD(true);
    this.hooks.onStartMatch(config);
  }

  // =========================================================================
  // 5. PAUSE & POST-GAME BOX SCORE
  // =========================================================================
  showPauseMenu(paused: boolean): void {
    if (!paused) {
      this.clearScreens();
      return;
    }
    this.screenSlot.innerHTML = `
      <div class="jam-screen" id="jam-pause">
        <div class="jam-panel" style="max-width:400px;text-align:center">
          <h2 style="margin:0 0 12px;color:#ffd21f">⏸ PAUSED</h2>
          <div style="display:flex;flex-direction:column;gap:10px">
            <button id="p-resume" class="jam-btn primary">▶ Resume Game</button>
            <button id="p-quit" class="jam-btn">🏠 Quit to Menu</button>
          </div>
        </div>
      </div>
    `;
    this.screenSlot.querySelector('#p-resume')!.addEventListener('click', () => {
      this.hooks.onClickSound();
      this.hooks.onPauseToggle();
    });
    this.screenSlot.querySelector('#p-quit')!.addEventListener('click', () => {
      this.hooks.onClickSound();
      this.hooks.onQuitMatch();
      if (this.lastMatchConfig?.seasonContext && this.season) this.showSeasonHub();
      else this.showTitle();
    });
  }

  showPostGame(result: MatchResult, config: MatchConfig): void {
    this.showHUD(false);
    const home = getTeamById(result.homeTeamId);
    const away = getTeamById(result.awayTeamId);
    const winTeam = result.winner === 0 ? home : away;

    // Record into season if applicable!
    if (config.seasonContext && this.season) {
      if (config.seasonContext.phase === 'regular') {
        const game = this.season.schedule.find((g) => g.id === config.seasonContext!.matchId);
        if (game) {
          const isPlayerHomeInSched = game.homeTeamId === this.season.playerTeamId;
          recordRegularGameResult(
            this.season,
            game.id,
            isPlayerHomeInSched ? result.homeScore : result.awayScore,
            isPlayerHomeInSched ? result.awayScore : result.homeScore,
          );
        }
      } else if (config.seasonContext.phase === 'playoffs' && this.season.bracket) {
        const b = this.season.bracket;
        const m = [b.qf1, b.qf2, b.sf1, b.sf2, b.finals].find(
          (x) => x.id === config.seasonContext!.matchId,
        );
        if (m) {
          const isPlayerHomeInMatch = m.homeTeamId === this.season.playerTeamId;
          recordPlayoffResult(
            this.season,
            m.id,
            isPlayerHomeInMatch ? result.homeScore : result.awayScore,
            isPlayerHomeInMatch ? result.awayScore : result.homeScore,
          );
          simReadyCpuPlayoffMatches(this.season);
          if (this.season.bracket.championTeamId === this.season.playerTeamId) {
            this.hooks.onSeasonChampion();
          }
        }
      }
      saveSeason(this.season);
    }

    this.screenSlot.innerHTML = `
      <div class="jam-screen" id="jam-postgame">
        <div class="jam-panel" style="max-width:660px;text-align:center">
          <div style="font-size:13px;font-weight:800;color:#8fd3ff">${result.overtime ? 'FINAL (OVERTIME)' : 'FINAL SCORE'}</div>
          <h2 style="margin:4px 0 10px;font-size:28px;color:#ffd21f">${winTeam.emblem} ${winTeam.city.toUpperCase()} ${winTeam.name.toUpperCase()} WIN!</h2>

          <div style="display:flex;justify-content:center;gap:28px;align-items:center;margin:10px 0 14px;font-size:24px;font-weight:900">
            <span style="color:${home.primaryHex}">${home.emblem} ${home.abbr} ${result.homeScore}</span>
            <span style="color:#888">—</span>
            <span style="color:${away.primaryHex}">${result.awayScore} ${away.abbr} ${away.emblem}</span>
          </div>

          <table class="jam-table">
            <thead><tr><th>Player</th><th>PTS</th><th>FG</th><th>3PT</th><th>DNK</th><th>REB</th><th>STL</th><th>BLK</th></tr></thead>
            <tbody>
              ${result.boxScore
                .map(
                  (b) => `<tr>
                    <td style="font-weight:800;color:${b.team === 0 ? home.primaryHex : away.primaryHex}">${b.name}</td>
                    <td><strong>${b.pts}</strong></td>
                    <td>${b.fgm}/${b.fga}</td>
                    <td>${b.tpm}/${b.tpa}</td>
                    <td>${b.dunks}</td>
                    <td>${b.rebounds}</td>
                    <td>${b.steals}</td>
                    <td>${b.blocks}</td>
                  </tr>`,
                )
                .join('')}
            </tbody>
          </table>

          <div class="jam-row" style="justify-content:center;margin-top:14px">
            ${
              config.seasonContext
                ? `<button id="pg-season" class="jam-btn primary">🏆 Continue Season</button>`
                : `<button id="pg-rematch" class="jam-btn primary">🔁 Rematch</button>`
            }
            <button id="pg-menu" class="jam-btn">🏠 Main Menu</button>
          </div>
        </div>
      </div>
    `;

    this.screenSlot.querySelector('#pg-season')?.addEventListener('click', () => {
      this.hooks.onClickSound();
      this.showSeasonHub();
    });
    this.screenSlot.querySelector('#pg-rematch')?.addEventListener('click', () => {
      this.hooks.onClickSound();
      this.launchMatch(config);
    });
    this.screenSlot.querySelector('#pg-menu')!.addEventListener('click', () => {
      this.hooks.onClickSound();
      this.showTitle();
    });
  }
}
