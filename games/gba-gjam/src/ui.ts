// Arcade UI for GBA GJAM: Title, 8-Team Character Select, Custom Gnome Creator,
// Season Standings & Top-6 Knockout Bracket, In-Game HUD, Pause & Post-Game Box Score.
import { createVolumeButton, type VolumeStore } from '@arcade/volume';
import { showSyncNotice } from '@lawn/sync';
import { cloud } from './cloud';
import { exportSaveJson, importSaveJson } from './save';
import {
  BOT_PRESET_LABELS,
  BOT_SCRIPT_PRESETS,
  DEFAULT_REMOTE_BOT_URL,
  validateBotScriptSyntax,
  type BotPresetId,
  type BotSlotAssignment,
} from './ai';
import {
  BEARD_SWATCHES,
  CUSTOM_STAT_BUDGET,
  CUSTOM_SWATCHES,
  POINTS_PER_GAME,
  POINTS_PER_TOURNAMENT_WIN,
  POINTS_PER_WIN_BONUS,
  PRO_TEAMS,
  SKIN_SWATCHES,
  STAT_MAX,
  STAT_MIN,
  awardMatchProgression,
  customGnomeToProfile,
  getProgressionTier,
  getRemainingStatPoints,
  getTeamById,
  getTotalStatBudget,
  loadCustomGnome,
  saveCustomGnome,
} from './teams';
import { INITIAL_NET_STATUS, type NetStatus } from './net';
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
  isOnlineAvailable: () => boolean;
  onOnlineQueue: (
    code: string | null,
    payload: {
      teamId: string;
      useCustom: boolean;
      duo: [number, number];
      customGnome: CustomGnomeData;
      difficulty: Difficulty;
      quarterSeconds: number;
    },
  ) => void;
  onOnlineLeave: () => void;
  isBigHead: () => boolean;
  onToggleBigHead: () => boolean;
  isAnnouncerEnabled: () => boolean;
  onToggleAnnouncer: () => boolean;
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
  bottom: max(12px, env(safe-area-inset-bottom, 12px));
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 14px;
  align-items: center;
  background: rgba(12,14,28,0.84);
  border: 1px solid rgba(255,255,255,0.22);
  border-radius: 10px;
  padding: 6px 12px;
  max-width: calc(100vw - 20px);
}
.jam-turbo-team {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.jam-turbo-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 800;
}
.jam-turbo-role {
  font-size: 9px;
  font-weight: 900;
  padding: 1px 4px;
  border-radius: 4px;
  min-width: 24px;
  text-align: center;
}
.jam-turbo-name {
  width: 66px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.jam-turbo-track {
  width: 78px;
  height: 8px;
  border-radius: 4px;
  background: rgba(255,255,255,0.16);
  overflow: hidden;
}
.jam-turbo-fill {
  height: 100%;
  width: 100%;
  transition: width 0.06s linear;
}
@media (max-width: 820px), (max-height: 520px) {
  .jam-turbo-wrap {
    bottom: auto;
    top: max(66px, calc(env(safe-area-inset-top, 10px) + 56px));
    padding: 4px 8px;
    gap: 8px;
  }
  .jam-turbo-name { width: 46px; font-size: 10px; }
  .jam-turbo-track { width: 52px; height: 7px; }
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
  private homeBot: BotSlotAssignment = { preset: 'classic' };
  private awayBot: BotSlotAssignment = { preset: 'classic' };
  private customGnome: CustomGnomeData;
  private season: SeasonState | null;
  private lastMatchConfig: MatchConfig | null = null;
  private netStatus: NetStatus = { ...INITIAL_NET_STATUS };
  private roomCodeInput = '';
  private inOnlineLobby = false;
  private pendingSeasonContext: MatchConfig['seasonContext'] | null = null;

  // HUD live nodes
  private hudHomeLbl!: HTMLElement;
  private hudAwayLbl!: HTMLElement;
  private hudHomeScore!: HTMLElement;
  private hudAwayScore!: HTMLElement;
  private hudQuarter!: HTMLElement;
  private hudClock!: HTMLElement;
  private hudShot!: HTMLElement;
  private hudPlayerRows: Array<{
    role: HTMLElement;
    name: HTMLElement;
    fill: HTMLElement;
    fire: HTMLElement;
  }> = [];

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

    // Mount shared @arcade/volume button + 90s Beat Selector pill in top-right (left of pause button)
    const volWrap = document.createElement('div');
    volWrap.style.cssText = `
      position:fixed;top:max(10px, env(safe-area-inset-top, 10px));right:max(62px, calc(env(safe-area-inset-right, 10px) + 52px));
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

    const annBtn = document.createElement('button');
    annBtn.type = 'button';
    annBtn.id = 'jam-announcer-btn';
    annBtn.className = 'jam-btn small';
    annBtn.style.cssText = 'min-height:44px;min-width:44px;padding:6px 12px;font-size:12px;opacity:0.92';
    const syncAnnBtn = (on: boolean): void => {
      annBtn.textContent = on ? '🎙️ PA: ON' : '🔇 PA: OFF';
      annBtn.classList.toggle('active', on);
    };
    syncAnnBtn(hooks.isAnnouncerEnabled());
    annBtn.title = 'Toggle Stadium PA Announcer';
    annBtn.addEventListener('click', () => {
      hooks.onClickSound();
      syncAnnBtn(hooks.onToggleAnnouncer());
    });
    volWrap.appendChild(annBtn);
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
    const makeRow = (idx: number) => `
      <div class="jam-turbo-row" id="hud-p-row-${idx}">
        <span class="jam-turbo-role" id="hud-p-role-${idx}">CPU</span>
        <span class="jam-turbo-name" id="hud-p-name-${idx}">P${idx + 1}</span>
        <div class="jam-turbo-track"><div class="jam-turbo-fill" id="hud-p-turbo-${idx}"></div></div>
        <span id="hud-p-fire-${idx}" style="display:none;font-size:11px">🔥</span>
      </div>
    `;
    turboWrap.innerHTML = `
      <div class="jam-turbo-team">${makeRow(0)}${makeRow(1)}</div>
      <div style="width:1px;height:30px;background:rgba(255,255,255,0.16)"></div>
      <div class="jam-turbo-team">${makeRow(2)}${makeRow(3)}</div>
    `;

    this.hudEl.append(sb, pauseBtn, turboWrap);
    this.hudHomeLbl = sb.querySelector('#hud-home-lbl')!;
    this.hudAwayLbl = sb.querySelector('#hud-away-lbl')!;
    this.hudHomeScore = sb.querySelector('#hud-home-score')!;
    this.hudAwayScore = sb.querySelector('#hud-away-score')!;
    this.hudQuarter = sb.querySelector('#hud-quarter')!;
    this.hudClock = sb.querySelector('#hud-clock')!;
    this.hudShot = sb.querySelector('#hud-shot')!;
    this.hudPlayerRows = [0, 1, 2, 3].map((idx) => ({
      role: turboWrap.querySelector(`#hud-p-role-${idx}`)!,
      name: turboWrap.querySelector(`#hud-p-name-${idx}`)!,
      fill: turboWrap.querySelector(`#hud-p-turbo-${idx}`)!,
      fire: turboWrap.querySelector(`#hud-p-fire-${idx}`)!,
    }));
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
    players: Array<{ name: string; turbo: number; onFire: boolean; role: 'P1' | 'P2' | 'CPU'; teamColor: string }>,
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
    for (let i = 0; i < this.hudPlayerRows.length && i < players.length; i++) {
      const row = this.hudPlayerRows[i];
      const p = players[i];
      row.role.textContent = p.role;
      if (p.role === 'P1') {
        row.role.style.background = '#ffd21f';
        row.role.style.color = '#111';
        row.name.style.color = '#ffd21f';
      } else if (p.role === 'P2') {
        row.role.style.background = '#33eeff';
        row.role.style.color = '#111';
        row.name.style.color = '#33eeff';
      } else {
        row.role.style.background = 'rgba(255,255,255,0.14)';
        row.role.style.color = '#ccc';
        row.name.style.color = '#e5e7eb';
      }
      row.name.textContent = p.name;
      row.fill.style.width = `${Math.max(0, Math.min(100, p.turbo))}%`;
      row.fill.style.background = p.onFire
        ? 'linear-gradient(90deg,#ff3300,#ffee33)'
        : `linear-gradient(90deg,${p.teamColor},#ffd21f)`;
      row.fire.style.display = p.onFire ? 'inline' : 'none';
    }
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

  reloadSaveFromStorage(): void {
    this.customGnome = loadCustomGnome();
    this.season = loadSeason();
    if (document.getElementById('jam-title')) this.showTitle();
  }

  // =========================================================================
  // 1. TITLE SCREEN
  // =========================================================================
  private renderCareerStatsCard(g: CustomGnomeData): string {
    const p = g.progression;
    const c = p.career;
    const gp = Math.max(1, p.gamesPlayed);
    const ppg = (c.pts / gp).toFixed(1);
    const rpg = (c.rebounds / gp).toFixed(1);
    const spg = (c.steals / gp).toFixed(1);
    const bpg = (c.blocks / gp).toFixed(1);
    const fgPct = c.fga > 0 ? Math.round((c.fgm / c.fga) * 100) : 0;
    const tpPct = c.tpa > 0 ? Math.round((c.tpm / c.tpa) * 100) : 0;
    return `
      <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.16);border-radius:10px;padding:10px;margin:10px 0;font-size:12px">
        <div style="font-weight:900;color:#8fd3ff;margin-bottom:6px">📊 CAREER STATS (${p.gamesPlayed} GP · ${p.wins}-${Math.max(0, p.gamesPlayed - p.wins)} · ${p.tournamentWins} 🏆)</div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;text-align:center">
          <div><div style="font-size:15px;font-weight:900;color:#ffd21f">${ppg}</div><div style="font-size:10px;color:#b8c4e0">PPG (${c.pts})</div></div>
          <div><div style="font-size:15px;font-weight:900">${fgPct}%</div><div style="font-size:10px;color:#b8c4e0">FG (${c.fgm}/${c.fga})</div></div>
          <div><div style="font-size:15px;font-weight:900">${tpPct}%</div><div style="font-size:10px;color:#b8c4e0">3PT (${c.tpm}/${c.tpa})</div></div>
          <div><div style="font-size:15px;font-weight:900;color:#ff9944">${c.dunks}</div><div style="font-size:10px;color:#b8c4e0">DUNKS</div></div>
          <div><div style="font-size:14px;font-weight:800">${rpg}</div><div style="font-size:10px;color:#b8c4e0">RPG (${c.rebounds})</div></div>
          <div><div style="font-size:14px;font-weight:800">${spg}</div><div style="font-size:10px;color:#b8c4e0">SPG (${c.steals})</div></div>
          <div><div style="font-size:14px;font-weight:800">${bpg}</div><div style="font-size:10px;color:#b8c4e0">BPG (${c.blocks})</div></div>
          <div><div style="font-size:14px;font-weight:800;color:#44ff88">+${p.bonusPoints}</div><div style="font-size:10px;color:#b8c4e0">EARNED PTS</div></div>
        </div>
      </div>
    `;
  }

  showTitle(): void {
    this.inOnlineLobby = false;
    this.pendingSeasonContext = null;
    this.showHUD(false);
    this.hooks.onPreviewGnome(null);
    const saved = loadSeason();
    this.season = saved;
    this.customGnome = loadCustomGnome();
    const unspent = getRemainingStatPoints(this.customGnome);
    const totalBudget = getTotalStatBudget(this.customGnome);
    const tier = getProgressionTier(totalBudget);
    const prog = this.customGnome.progression;
    const bigHeadOn = this.hooks.isBigHead();
    const cloudStatus = cloud.status();
    const cloudLabel =
      cloudStatus === 'synced'
        ? '☁️ CLOUD BACKUP ON'
        : cloudStatus === 'syncing'
          ? '☁️ SYNCING...'
          : '💾 LOCAL SAVE';
    const cloudColor = cloudStatus === 'synced' ? '#44ff88' : cloudStatus === 'syncing' ? '#ffd21f' : '#b8c4e0';

    this.screenSlot.innerHTML = `
      <div class="jam-screen" id="jam-title">
        <div class="jam-panel" style="max-width:560px;text-align:center">
          <div style="font-size:42px;margin-bottom:4px">🏀🔥🧙‍♂️</div>
          <h1 class="jam-logo">GBA GJAM</h1>
          <div class="jam-sub">2-ON-2 GNOMERENA ARCADE BASKETBALL</div>
          <div style="display:flex;flex-direction:column;gap:10px;margin:14px 0">
            <button id="jam-quick-btn" class="jam-btn primary">⚡ QUICK JAM (EXHIBITION)</button>
            <button id="jam-online-btn" class="jam-btn" style="background:linear-gradient(180deg,#1e64d8,#133e8a);border-color:#7fb5ff">🌐 ONLINE MULTIPLAYER</button>
            <button id="jam-season-btn" class="jam-btn green">🏆 ${saved && saved.phase !== 'complete' ? 'CONTINUE GBA SEASON' : 'GBA SEASON & TOP-6 PLAYOFFS'}</button>
            <button id="jam-custom-btn" class="jam-btn">
              🎨 CUSTOM GNOME CREATOR
              ${unspent > 0 ? `<span style="background:#ffd21f;color:#111;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:900">+${unspent} PTS</span>` : ''}
            </button>
          </div>
          <div style="font-size:12px;color:#ffd21f;font-weight:800;margin-bottom:8px">
            <span style="color:${tier.color}">${tier.label}</span> &nbsp;|&nbsp; ${this.customGnome.name}: ${prog.gamesPlayed} GP · ${prog.wins} W · ${prog.tournamentWins} 🏆 &nbsp;|&nbsp; Budget: ${totalBudget} pts
          </div>
          <div class="jam-row" style="justify-content:center;margin:8px 0">
            <input id="jam-cheat-in" type="text" maxlength="12" placeholder="CHEAT CODE"
              style="width:130px;min-height:44px;border-radius:8px;border:1px solid rgba(255,255,255,0.28);background:#11152c;color:#fff;padding:6px 10px;font-weight:800;text-transform:uppercase;text-align:center;font-size:12px" />
            <button id="jam-cheat-btn" class="jam-btn small">🎮 Apply</button>
            ${bigHeadOn ? `<button id="jam-bighead-badge" class="jam-btn small active">🗿 BIGHEAD: ON</button>` : ''}
          </div>
          <div class="jam-row" style="justify-content:center;align-items:center;margin:8px 0;gap:8px;flex-wrap:wrap">
            <span id="jam-save-status" style="font-size:11px;font-weight:800;color:${cloudColor};padding:4px 8px;border-radius:999px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14)">${cloudLabel}</span>
            <button id="jam-export-save" class="jam-btn small" style="display:none;min-height:44px">⬇️ Export Backup</button>
            <button id="jam-import-save" class="jam-btn small" style="display:none;min-height:44px">⬆️ Restore Backup</button>
            <input id="jam-import-file" type="file" accept=".json,application/json" style="display:none" />
          </div>
          <div style="font-size:12px;color:#b8c4e0;line-height:1.5;margin-top:8px;background:rgba(0,0,0,0.28);padding:10px;border-radius:8px">
            <strong>Controls (P1):</strong> WASD / Arrows Move &nbsp;•&nbsp; <strong>Space / J</strong> Shoot, Dunk &amp; Block &nbsp;•&nbsp; <strong>K / E</strong> Pass, Steal &amp; Shove &nbsp;•&nbsp; <strong>Shift / L</strong> Turbo<br/>
            <strong>Specials:</strong> <strong>Turbo + Pass</strong> Alley-Oop / Off-the-Glass Spike &nbsp;•&nbsp; <strong>Turbo + Shoot</strong> near Partner = Launch Dunk &nbsp;•&nbsp; <strong>Shoot (off-ball)</strong> Jump for Alley-Oop / Putback<br/>
            <strong>Mobile:</strong> Virtual Joystick + On-Screen Action Buttons &nbsp;•&nbsp; <strong>2P Local:</strong> Arrows + N/M/Comma
          </div>
        </div>
      </div>
    `;

    this.screenSlot.querySelector('#jam-quick-btn')!.addEventListener('click', () => {
      this.hooks.onClickSound();
      this.showTeamSelect('exhibition');
    });
    this.screenSlot.querySelector('#jam-online-btn')!.addEventListener('click', () => {
      this.hooks.onClickSound();
      this.showOnlineLobby();
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

    const cheatIn = this.screenSlot.querySelector('#jam-cheat-in') as HTMLInputElement;
    const tryCheat = () => {
      const code = cheatIn.value.trim().toUpperCase();
      if (code === 'BIGHEAD') {
        this.hooks.onToggleBigHead();
        this.showTitle();
      }
    };
    this.screenSlot.querySelector('#jam-cheat-btn')!.addEventListener('click', () => {
      this.hooks.onClickSound();
      tryCheat();
    });
    cheatIn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') tryCheat();
    });
    this.screenSlot.querySelector('#jam-bighead-badge')?.addEventListener('click', () => {
      this.hooks.onClickSound();
      this.hooks.onToggleBigHead();
      this.showTitle();
    });

    this.screenSlot.querySelector('#jam-export-save')?.addEventListener('click', () => {
      this.hooks.onClickSound();
      const json = exportSaveJson();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const day = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `gba-gjam-backup-${day}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showSyncNotice('Save backup downloaded.');
    });

    const fileInput = this.screenSlot.querySelector('#jam-import-file') as HTMLInputElement | null;
    this.screenSlot.querySelector('#jam-import-save')?.addEventListener('click', () => {
      this.hooks.onClickSound();
      fileInput?.click();
    });
    fileInput?.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      void file.text().then((text) => {
        try {
          importSaveJson(text);
          this.customGnome = loadCustomGnome();
          this.season = loadSeason();
          this.showTitle();
          showSyncNotice('Save backup restored!');
        } catch (err) {
          showSyncNotice(err instanceof Error ? err.message : 'Invalid backup file.');
        }
      });
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
        <div class="jam-stat-bar"><div class="jam-stat-fill" style="width:${(val / STAT_MAX) * 100}%"></div></div>
        <span style="width:26px;text-align:right;font-weight:800">${val}</span>
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
              <button data-opp-mode="botvsbot" class="jam-btn small ${this.opponentMode === 'botvsbot' ? 'active' : ''}">📺 Bot vs Bot</button>
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
              ${
                mode === 'exhibition'
                  ? `<button id="sel-bot-ai" class="jam-btn small">🧠 Bot AI</button>`
                  : ''
              }
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

    this.screenSlot.querySelector('#sel-bot-ai')?.addEventListener('click', () => {
      this.hooks.onClickSound();
      this.showBotAISetup(mode);
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
          botSlots: {
            0: this.homeBot,
            1: this.homeBot,
            2: this.awayBot,
            3: this.awayBot,
          },
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
  showCustomCreator(returnTo: 'title' | 'exhibition' | 'season' | 'online'): void {
    this.inOnlineLobby = false;
    this.showHUD(false);
    const g = this.customGnome;
    this.hooks.onPreviewGnome(g.look);

    const totalBudget = getTotalStatBudget(g);
    const remaining = getRemainingStatPoints(g);
    const tier = getProgressionTier(totalBudget);

    const swatches = (list: readonly number[], current: number | null, key: string) =>
      list
        .map(
          (hex) =>
            `<button type="button" class="jam-swatch ${current === hex ? 'selected' : ''}" data-sw="${key}" data-hex="${hex}" style="background:#${hex.toString(16).padStart(6, '0')}"></button>`,
        )
        .join('');

    const statControl = (key: keyof CustomGnomeData['stats'], label: string) => `
      <div style="display:flex;align-items:center;gap:5px;margin:6px 0">
        <span style="width:66px;font-weight:800;font-size:12px">${label}</span>
        <button type="button" class="jam-btn small" style="min-width:44px;padding:4px 6px" data-stat-delta="-5" data-stat-key="${key}">−5</button>
        <button type="button" class="jam-btn small" style="min-width:44px;padding:4px 6px" data-stat-delta="-1" data-stat-key="${key}">−1</button>
        <div class="jam-stat-bar"><div class="jam-stat-fill" style="width:${(g.stats[key] / STAT_MAX) * 100}%"></div></div>
        <span style="width:30px;text-align:center;font-weight:900;font-size:13px">${g.stats[key]}</span>
        <button type="button" class="jam-btn small" style="min-width:44px;padding:4px 6px" data-stat-delta="1" data-stat-key="${key}">+1</button>
        <button type="button" class="jam-btn small" style="min-width:44px;padding:4px 6px" data-stat-delta="5" data-stat-key="${key}">+5</button>
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
            STAT POINTS (0–100) — UNSPENT: ${remaining} / ${totalBudget}
          </div>
          <div style="font-size:11px;color:#b8c4e0;margin-bottom:6px">
            <strong style="color:${tier.color}">${tier.label}</strong> &nbsp;|&nbsp;
            Career: ${g.progression.gamesPlayed} GP · ${g.progression.wins} W · ${g.progression.tournamentWins} 🏆 &nbsp;|&nbsp;
            +${POINTS_PER_GAME}/game · +${POINTS_PER_WIN_BONUS} win · +${POINTS_PER_TOURNAMENT_WIN} tourney
          </div>
          ${statControl('speed', 'SPEED')}
          ${statControl('threePt', '3-POINT')}
          ${statControl('dunk', 'DUNK')}
          ${statControl('defense', 'DEFENSE')}
          ${this.renderCareerStatsCard(g)}
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

    this.screenSlot.querySelectorAll('[data-stat-delta]').forEach((el) => {
      el.addEventListener('click', () => {
        const key = (el as HTMLElement).dataset.statKey as keyof CustomGnomeData['stats'];
        const rawDelta = Number((el as HTMLElement).dataset.statDelta);
        if (rawDelta > 0) {
          const add = Math.min(rawDelta, remaining, STAT_MAX - g.stats[key]);
          if (add > 0) {
            this.hooks.onClickSound();
            g.stats[key] += add;
            this.showCustomCreator(returnTo);
          }
        } else {
          const sub = Math.min(-rawDelta, g.stats[key] - STAT_MIN);
          if (sub > 0) {
            this.hooks.onClickSound();
            g.stats[key] -= sub;
            this.showCustomCreator(returnTo);
          }
        }
      });
    });

    this.screenSlot.querySelector('#cc-done')!.addEventListener('click', () => {
      this.hooks.onClickSound();
      saveCustomGnome(g);
      this.useCustom = true;
      this.hooks.onPreviewGnome(null);
      if (returnTo === 'title') this.showTitle();
      else if (returnTo === 'online') this.showOnlineLobby();
      else this.showTeamSelect(returnTo);
    });
  }

  // =========================================================================
  // 3B. ONLINE MULTIPLAYER LOBBY
  // =========================================================================
  updateOnlineStatus(status: NetStatus): void {
    this.netStatus = status;
    if (this.inOnlineLobby) {
      this.showOnlineLobby();
    }
  }

  showOnlineDisconnected(reason: string): void {
    this.showHUD(false);
    this.inOnlineLobby = false;
    this.screenSlot.innerHTML = `
      <div class="jam-screen" id="jam-online-lost">
        <div class="jam-panel" style="max-width:440px;text-align:center">
          <h2 style="margin:0 0 8px;color:#ff8866">🌐 MATCH ENDED</h2>
          <div style="font-size:14px;color:#dce4f7;margin-bottom:16px">${reason}</div>
          <div class="jam-row" style="justify-content:center">
            <button id="ol-retry" class="jam-btn primary">🌐 Online Lobby</button>
            <button id="ol-menu" class="jam-btn">🏠 Main Menu</button>
          </div>
        </div>
      </div>
    `;
    this.screenSlot.querySelector('#ol-retry')!.addEventListener('click', () => {
      this.hooks.onClickSound();
      this.showOnlineLobby();
    });
    this.screenSlot.querySelector('#ol-menu')!.addEventListener('click', () => {
      this.hooks.onClickSound();
      this.showTitle();
    });
  }

  showOnlineLobby(): void {
    this.inOnlineLobby = true;
    this.showHUD(false);
    this.hooks.onPreviewGnome(null);
    const homeTeam = getTeamById(this.homeTeamId);
    const customProfile = customGnomeToProfile(this.customGnome, homeTeam);
    const available = this.hooks.isOnlineAvailable();
    const st = this.netStatus;
    const isQueuing = st.status === 'connecting' || st.status === 'queued' || st.status === 'starting';

    const statBar = (label: string, val: number) => `
      <div style="display:flex;align-items:center;gap:6px;font-size:11px;margin-top:3px">
        <span style="width:36px;color:#b8c4e0">${label}</span>
        <div class="jam-stat-bar"><div class="jam-stat-fill" style="width:${(val / STAT_MAX) * 100}%"></div></div>
        <span style="width:26px;text-align:right;font-weight:800">${val}</span>
      </div>
    `;

    const renderPlayerCard = (p: GnomePlayerProfile, idx: number, selected: boolean) => `
      <div class="jam-player-card ${selected ? 'selected' : ''}" data-ol-duo="${idx}">
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

    this.screenSlot.innerHTML = `
      <div class="jam-screen" id="jam-online-lobby">
        <div class="jam-panel">
          <div class="jam-row" style="justify-content:space-between;margin-bottom:8px">
            <h2 style="margin:0;font-size:22px;color:#7fb5ff">🌐 ONLINE MULTIPLAYER (1v1 + AI TEAMMATES)</h2>
            <button id="ol-back" class="jam-btn small">← ${this.pendingSeasonContext ? 'Back to Season' : 'Back'}</button>
          </div>

          ${
            this.pendingSeasonContext
              ? `<div style="background:rgba(255,210,31,0.14);border:1px solid rgba(255,210,31,0.55);border-radius:10px;padding:10px;margin:8px 0;font-size:13px">
                  🏆 <strong style="color:#ffd21f">CAREER MODE MATCH:</strong> ${this.pendingSeasonContext.label} — Result will count toward your GBA Season!
                </div>`
              : ''
          }

          ${
            !available
              ? `<div style="background:rgba(255,90,90,0.16);border:1px solid #ff6666;border-radius:10px;padding:12px;margin:10px 0;font-size:13px">
                  Online matchmaking server is not configured for this build. Run <code>npm run dev -w packages/mp-server</code> locally or pass <code>?mp=ws://host/ws</code>.
                </div>`
              : ''
          }

          ${
            isQueuing
              ? `<div style="background:rgba(30,100,216,0.22);border:2px solid #7fb5ff;border-radius:12px;padding:16px;text-align:center;margin:10px 0">
                  <div style="font-size:20px;font-weight:900;color:#ffd21f">${st.message}</div>
                  <div style="font-size:13px;color:#dce4f7;margin:6px 0">
                    Players in room: <strong>${st.waiting}/2</strong>
                    ${st.startsInS > 0 ? ` &nbsp;•&nbsp; Timeout in <strong>${st.startsInS}s</strong>` : ''}
                  </div>
                  ${st.code ? `<div style="font-size:13px;margin:6px 0">Share Room Code: <strong style="color:#ffd21f;letter-spacing:2px;font-size:16px">${st.code}</strong></div>` : ''}
                  <button id="ol-cancel" class="jam-btn" style="margin-top:10px;background:#7a1c1c;border-color:#ff7777">✖ Cancel Search</button>
                </div>`
              : `
                ${st.status === 'error' && st.message ? `<div style="background:rgba(255,90,90,0.2);border:1px solid #ff6666;border-radius:8px;padding:10px;margin:8px 0;font-size:13px;color:#ffb4b4">${st.message}</div>` : ''}

                <div style="font-weight:800;font-size:13px;color:#8fd3ff">1. YOUR TEAM</div>
                <div class="jam-grid-teams">
                  ${PRO_TEAMS.map(
                    (t) => `
                      <button type="button" class="jam-team-card ${t.id === this.homeTeamId ? 'selected' : ''}" data-ol-team="${t.id}">
                        <div class="jam-badge" style="background:${t.primaryHex};border-color:${t.secondaryHex}">${t.emblem}</div>
                        <div>
                          <div style="font-weight:900;font-size:13px">${t.city} ${t.name}</div>
                          <div style="font-size:11px;color:#b8c4e0">${t.motto}</div>
                        </div>
                      </button>
                    `,
                  ).join('')}
                </div>

                <div class="jam-row" style="justify-content:space-between;margin-top:8px">
                  <div style="font-weight:800;font-size:13px;color:#8fd3ff">2. YOUR DUO</div>
                  <div class="jam-row">
                    <button id="ol-toggle-custom" class="jam-btn small ${this.useCustom ? 'active' : ''}">
                      ${this.useCustom ? '✅ Custom Gnome: ON' : '➕ Use Custom Gnome'}
                    </button>
                    <button id="ol-edit-custom" class="jam-btn small">🎨 Edit Custom</button>
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

                <div class="jam-row" style="justify-content:space-between;margin-top:10px;border-top:1px solid rgba(255,255,255,0.12);padding-top:12px">
                  <div class="jam-row">
                    <button id="ol-quick" class="jam-btn primary" ${!available ? 'disabled' : ''}>⚡ QUICK MATCH</button>
                  </div>
                  <div class="jam-row">
                    <input id="ol-code" type="text" maxlength="8" value="${this.roomCodeInput}" placeholder="ROOM CODE"
                      style="width:130px;min-height:44px;border-radius:8px;border:1px solid #7fb5ff;background:#11152c;color:#fff;padding:6px 10px;font-weight:900;text-transform:uppercase;letter-spacing:1.5px" />
                    <button id="ol-rand" class="jam-btn small" title="Random Room Code">🎲</button>
                    <button id="ol-join" class="jam-btn green" ${!available ? 'disabled' : ''}>🚪 JOIN / HOST ROOM</button>
                  </div>
                </div>
              `
          }
        </div>
      </div>
    `;

    this.screenSlot.querySelector('#ol-back')!.addEventListener('click', () => {
      this.hooks.onClickSound();
      if (isQueuing) this.hooks.onOnlineLeave();
      if (this.pendingSeasonContext && this.season) {
        this.pendingSeasonContext = null;
        this.showSeasonHub();
      } else {
        this.showTitle();
      }
    });

    this.screenSlot.querySelector('#ol-cancel')?.addEventListener('click', () => {
      this.hooks.onClickSound();
      this.hooks.onOnlineLeave();
    });

    this.screenSlot.querySelectorAll('[data-ol-team]').forEach((el) => {
      el.addEventListener('click', () => {
        this.hooks.onClickSound();
        this.homeTeamId = (el as HTMLElement).dataset.olTeam!;
        this.showOnlineLobby();
      });
    });

    this.screenSlot.querySelector('#ol-toggle-custom')?.addEventListener('click', () => {
      this.hooks.onClickSound();
      this.useCustom = !this.useCustom;
      this.showOnlineLobby();
    });

    this.screenSlot.querySelector('#ol-edit-custom')?.addEventListener('click', () => {
      this.hooks.onClickSound();
      this.showCustomCreator('online');
    });

    this.screenSlot.querySelectorAll('[data-ol-duo]').forEach((el) => {
      el.addEventListener('click', () => {
        const idx = Number((el as HTMLElement).dataset.olDuo);
        if (idx < 0) return;
        this.hooks.onClickSound();
        if (this.useCustom) this.homeDuo = [0, idx];
        else if (!this.homeDuo.includes(idx)) this.homeDuo = [this.homeDuo[1], idx];
        this.showOnlineLobby();
      });
    });

    const codeEl = this.screenSlot.querySelector('#ol-code') as HTMLInputElement | null;
    codeEl?.addEventListener('input', () => {
      this.roomCodeInput = codeEl.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
      codeEl.value = this.roomCodeInput;
    });

    this.screenSlot.querySelector('#ol-rand')?.addEventListener('click', () => {
      this.hooks.onClickSound();
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let c = '';
      for (let i = 0; i < 4; i++) c += chars[Math.floor(Math.random() * chars.length)];
      this.roomCodeInput = c;
      if (codeEl) codeEl.value = c;
    });

    const queueWith = (code: string | null) => {
      this.hooks.onOnlineQueue(code, {
        teamId: this.homeTeamId,
        useCustom: this.useCustom,
        duo: this.homeDuo,
        customGnome: this.customGnome,
        difficulty: this.difficulty,
        quarterSeconds: this.quarterSeconds,
      });
    };

    this.screenSlot.querySelector('#ol-quick')?.addEventListener('click', () => {
      this.hooks.onClickSound();
      queueWith(null);
    });

    this.screenSlot.querySelector('#ol-join')?.addEventListener('click', () => {
      const cleaned = this.roomCodeInput.trim().toUpperCase();
      if (!/^[A-Z0-9]{4,8}$/.test(cleaned)) {
        this.netStatus = { ...this.netStatus, status: 'error', message: 'Room code must be 4–8 letters or numbers (A-Z, 0-9).' };
        this.showOnlineLobby();
        return;
      }
      this.hooks.onClickSound();
      queueWith(cleaned);
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
                <button id="sh-play-online" class="jam-btn small" style="background:linear-gradient(180deg,#1e64d8,#133e8a);border-color:#7fb5ff">🌐 Play Online</button>
                <button id="sh-play" class="jam-btn primary">🏀 PLAY GAME</button>
              </div>
            </div>
            ${this.renderCareerStatsCard(this.customGnome)}

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
      this.screenSlot.querySelector('#sh-play-online')!.addEventListener('click', () => {
        if (!nextGame) return;
        this.hooks.onClickSound();
        this.openSeasonOnlineLobby(s, {
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
                ${playerHasMatch ? `<button id="po-play-online" class="jam-btn small" style="background:linear-gradient(180deg,#1e64d8,#133e8a);border-color:#7fb5ff">🌐 Play Online</button>` : ''}
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
    this.screenSlot.querySelector('#po-play-online')?.addEventListener('click', () => {
      if (!nextPO) return;
      this.hooks.onClickSound();
      this.openSeasonOnlineLobby(s, {
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

  private openSeasonOnlineLobby(
    s: SeasonState,
    ctx: NonNullable<MatchConfig['seasonContext']>,
  ): void {
    this.homeTeamId = s.playerTeamId;
    this.useCustom = s.useCustomGnome;
    this.homeDuo = s.playerDuoIndices;
    this.difficulty = s.difficulty;
    this.quarterSeconds = s.quarterSeconds;
    this.pendingSeasonContext = ctx;
    this.showOnlineLobby();
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
    this.inOnlineLobby = false;
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
    const isOnline = this.lastMatchConfig?.opponentMode === 'online';
    this.screenSlot.innerHTML = `
      <div class="jam-screen" id="jam-pause">
        <div class="jam-panel" style="max-width:400px;text-align:center">
          <h2 style="margin:0 0 12px;color:#ffd21f">${isOnline ? '🌐 ONLINE MENU (LIVE)' : '⏸ PAUSED'}</h2>
          <div style="display:flex;flex-direction:column;gap:10px">
            <button id="p-resume" class="jam-btn primary">▶ Resume Game</button>
            <button id="p-announcer" class="jam-btn ${this.hooks.isAnnouncerEnabled() ? 'active' : ''}">${this.hooks.isAnnouncerEnabled() ? '🎙️ Announcer: ON' : '🔇 Announcer: OFF'}</button>
            <button id="p-quit" class="jam-btn">🏠 ${isOnline ? 'Leave Match' : 'Quit to Menu'}</button>
          </div>
        </div>
      </div>
    `;
    this.screenSlot.querySelector('#p-resume')!.addEventListener('click', () => {
      this.hooks.onClickSound();
      this.hooks.onPauseToggle();
    });
    const pauseAnnBtn = this.screenSlot.querySelector('#p-announcer') as HTMLButtonElement;
    pauseAnnBtn.addEventListener('click', () => {
      this.hooks.onClickSound();
      const on = this.hooks.onToggleAnnouncer();
      pauseAnnBtn.textContent = on ? '🎙️ Announcer: ON' : '🔇 Announcer: OFF';
      pauseAnnBtn.classList.toggle('active', on);
      const topBtn = this.root.querySelector('#jam-announcer-btn');
      if (topBtn) {
        topBtn.textContent = on ? '🎙️ PA: ON' : '🔇 PA: OFF';
        topBtn.classList.toggle('active', on);
      }
    });
    this.screenSlot.querySelector('#p-quit')!.addEventListener('click', () => {
      this.hooks.onClickSound();
      this.hooks.onQuitMatch();
      if (this.lastMatchConfig?.seasonContext && this.season) this.showSeasonHub();
      else this.showTitle();
    });
  }

  showPostGame(result: MatchResult, config: MatchConfig): void {
    this.inOnlineLobby = false;
    this.showHUD(false);
    const home = getTeamById(result.homeTeamId);
    const away = getTeamById(result.awayTeamId);
    const winTeam = result.winner === 0 ? home : away;
    const myTeam = config.onlineContext?.myTeam ?? 0;
    const playerWon = result.winner === myTeam;
    const myScore = myTeam === 0 ? result.homeScore : result.awayScore;
    const oppScore = myTeam === 0 ? result.awayScore : result.homeScore;
    const seasonCtx = config.seasonContext ?? this.pendingSeasonContext ?? undefined;
    this.pendingSeasonContext = null;
    let tournamentWon = false;

    // Record into season if applicable!
    if (seasonCtx && this.season) {
      if (seasonCtx.phase === 'regular') {
        const game = this.season.schedule.find((g) => g.id === seasonCtx.matchId);
        if (game) {
          const isPlayerHomeInSched = game.homeTeamId === this.season.playerTeamId;
          recordRegularGameResult(
            this.season,
            game.id,
            isPlayerHomeInSched ? myScore : oppScore,
            isPlayerHomeInSched ? oppScore : myScore,
          );
        }
      } else if (seasonCtx.phase === 'playoffs' && this.season.bracket) {
        const b = this.season.bracket;
        const m = [b.qf1, b.qf2, b.sf1, b.sf2, b.finals].find(
          (x) => x.id === seasonCtx.matchId,
        );
        if (m) {
          const isPlayerHomeInMatch = m.homeTeamId === this.season.playerTeamId;
          recordPlayoffResult(
            this.season,
            m.id,
            isPlayerHomeInMatch ? myScore : oppScore,
            isPlayerHomeInMatch ? oppScore : myScore,
          );
          simReadyCpuPlayoffMatches(this.season);
          if (this.season.bracket.championTeamId === this.season.playerTeamId) {
            tournamentWon = true;
            this.hooks.onSeasonChampion();
          }
        }
      }
      saveSeason(this.season);
    }

    const myRoster = myTeam === 0 ? config.homeRoster : config.awayRoster;
    const myBox =
      result.boxScore.find((b) => b.team === myTeam && b.name === myRoster[0].name) ??
      result.boxScore.find((b) => b.team === myTeam);
    const prog = awardMatchProgression(this.customGnome, { won: playerWon, tournamentWon, box: myBox });
    const unspent = getRemainingStatPoints(this.customGnome);

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

          <div style="background:rgba(255,210,31,0.12);border:1px solid rgba(255,210,31,0.55);border-radius:10px;padding:10px;margin:0 0 12px;font-size:13px">
            <strong style="color:#ffd21f">+${prog.earned} STAT POINTS EARNED!</strong>
            <span style="color:#dce4f7"> (+${prog.gamePoints} Game${prog.winPoints ? ` · +${prog.winPoints} Win` : ''}${prog.tournamentPoints ? ` · +${prog.tournamentPoints} Tournament Win!` : ''})</span>
            <div style="font-size:12px;color:#8fd3ff;margin-top:4px">
              ${this.customGnome.name} Unspent Points: <strong>${unspent}</strong> &nbsp;•&nbsp; Budget: ${getTotalStatBudget(this.customGnome)}
            </div>
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
              seasonCtx
                ? `<button id="pg-season" class="jam-btn primary">🏆 Continue Season</button>`
                : config.onlineContext
                  ? `<button id="pg-online" class="jam-btn primary">🌐 New Online Match</button>`
                  : `<button id="pg-rematch" class="jam-btn primary">🔁 Rematch</button>`
            }
            <button id="pg-upgrade" class="jam-btn green">🎨 Upgrade Gnome (${unspent})</button>
            <button id="pg-menu" class="jam-btn">🏠 Main Menu</button>
          </div>
          ${this.renderCareerStatsCard(this.customGnome)}
        </div>
      </div>
    `;

    this.screenSlot.querySelector('#pg-season')?.addEventListener('click', () => {
      this.hooks.onClickSound();
      this.showSeasonHub();
    });
    this.screenSlot.querySelector('#pg-online')?.addEventListener('click', () => {
      this.hooks.onClickSound();
      this.showOnlineLobby();
    });
    this.screenSlot.querySelector('#pg-rematch')?.addEventListener('click', () => {
      this.hooks.onClickSound();
      this.launchMatch(config);
    });
    this.screenSlot.querySelector('#pg-upgrade')!.addEventListener('click', () => {
      this.hooks.onClickSound();
      this.showCustomCreator('title');
    });
    this.screenSlot.querySelector('#pg-menu')!.addEventListener('click', () => {
      this.hooks.onClickSound();
      this.showTitle();
    });
  }

  private showBotAISetup(returnMode: 'exhibition' | 'season'): void {
    const presetEntries = Object.entries(BOT_PRESET_LABELS) as Array<[BotPresetId, string]>;
    const renderSection = (side: 'home' | 'away', title: string, assignment: BotSlotAssignment) => {
      const isScript =
        assignment.preset === 'custom-script' ||
        assignment.preset === 'script-classic' ||
        assignment.preset === 'script-sniper' ||
        assignment.preset === 'script-rusher';
      const defaultCode =
        assignment.customCode ??
        (assignment.preset in BOT_SCRIPT_PRESETS
          ? BOT_SCRIPT_PRESETS[assignment.preset as keyof typeof BOT_SCRIPT_PRESETS].code
          : BOT_SCRIPT_PRESETS['script-classic'].code);

      return `
        <div style="border:1px solid rgba(255,255,255,0.16);border-radius:12px;padding:12px;margin-bottom:12px;background:rgba(255,255,255,0.03)">
          <div style="font-weight:900;color:#ffd21f;margin-bottom:8px">${title}</div>
          <div class="jam-row" style="margin-bottom:8px">
            <select id="bot-preset-${side}" style="min-height:44px;flex:1;min-width:220px;border-radius:8px;padding:6px 10px;background:#1b2247;color:#fff;border:1px solid rgba(255,255,255,0.3);font-weight:700">
              ${presetEntries
                .map(
                  ([id, label]) =>
                    `<option value="${id}" ${assignment.preset === id ? 'selected' : ''}>${label}</option>`,
                )
                .join('')}
            </select>
            <label class="jam-btn small" style="display:inline-flex;align-items:center;cursor:pointer">
              📂 Load .js
              <input id="bot-file-${side}" type="file" accept=".js,text/javascript" style="display:none">
            </label>
          </div>
          ${
            assignment.preset === 'remote-http'
              ? `
            <div style="margin-top:6px">
              <div style="font-size:12px;color:#8fd3ff;margin-bottom:4px">
                Python / ML Endpoint (POST { state, ctx } → PlayerControlInput):
              </div>
              <input id="bot-url-${side}" type="text" value="${assignment.remoteUrl ?? DEFAULT_REMOTE_BOT_URL}"
                style="width:100%;min-height:44px;padding:8px 10px;border-radius:8px;background:#11162e;color:#fff;border:1px solid #ffd21f;font-family:monospace;font-size:13px" />
              <div style="font-size:11px;color:#b8c4e0;margin-top:4px">
                Run <code>python games/gba-gjam/ai/poc_bot.py</code> locally to start the POC server.
              </div>
            </div>
          `
              : ''
          }
          ${
            isScript
              ? `
            <div style="margin-top:6px">
              <div style="font-size:12px;color:#8fd3ff;margin-bottom:4px">
                Sandboxed Worker Script (<code>function decide(state, ctx)</code>):
              </div>
              <textarea id="bot-code-${side}" rows="7" spellcheck="false"
                style="width:100%;padding:8px;border-radius:8px;background:#0c1024;color:#d6f5d6;border:1px solid rgba(255,255,255,0.22);font-family:monospace;font-size:12px;resize:vertical">${defaultCode.replace(/</g, '&lt;')}</textarea>
              <div class="jam-row" style="margin-top:6px">
                <button id="bot-check-${side}" class="jam-btn small">✓ Check Syntax</button>
                <span id="bot-status-${side}" style="font-size:12px;color:#8fd3ff"></span>
              </div>
            </div>
          `
              : ''
          }
        </div>
      `;
    };

    this.screenSlot.innerHTML = `
      <div class="jam-screen">
        <div class="jam-panel">
          <div class="jam-row" style="justify-content:space-between;margin-bottom:10px">
            <h2 style="margin:0;color:#ffd21f">🧠 BOT AI &amp; SCRIPT LOADER</h2>
            <button id="bot-done" class="jam-btn primary small">✓ Done</button>
          </div>
          <p style="margin:0 0 12px;font-size:13px;color:#b8c4e0">
            Bot scripts run inside an isolated Web Worker (no DOM/storage/network access), or connect to an external Python/ML HTTP server.
          </p>
          ${renderSection('home', 'HOME BOTS (Teammate / Bot-vs-Bot Home)', this.homeBot)}
          ${renderSection('away', 'AWAY BOTS (Opponents)', this.awayBot)}
        </div>
      </div>
    `;

    const bindSide = (side: 'home' | 'away', getRef: () => BotSlotAssignment, setRef: (v: BotSlotAssignment) => void) => {
      const sel = this.screenSlot.querySelector(`#bot-preset-${side}`) as HTMLSelectElement;
      sel.addEventListener('change', () => {
        const preset = sel.value as BotPresetId;
        const next: BotSlotAssignment = { preset };
        if (preset === 'remote-http') next.remoteUrl = getRef().remoteUrl ?? DEFAULT_REMOTE_BOT_URL;
        if (preset === 'custom-script') {
          next.customCode = getRef().customCode ?? BOT_SCRIPT_PRESETS['script-classic'].code;
        }
        setRef(next);
        this.showBotAISetup(returnMode);
      });

      const fileIn = this.screenSlot.querySelector(`#bot-file-${side}`) as HTMLInputElement;
      fileIn.addEventListener('change', async () => {
        const file = fileIn.files?.[0];
        if (!file) return;
        const text = await file.text();
        setRef({ preset: 'custom-script', customCode: text });
        this.showBotAISetup(returnMode);
      });

      const urlIn = this.screenSlot.querySelector(`#bot-url-${side}`) as HTMLInputElement | null;
      urlIn?.addEventListener('input', () => {
        setRef({ ...getRef(), remoteUrl: urlIn.value.trim() || DEFAULT_REMOTE_BOT_URL });
      });

      const codeIn = this.screenSlot.querySelector(`#bot-code-${side}`) as HTMLTextAreaElement | null;
      codeIn?.addEventListener('input', () => {
        setRef({ preset: 'custom-script', customCode: codeIn.value });
      });

      const checkBtn = this.screenSlot.querySelector(`#bot-check-${side}`);
      const statusEl = this.screenSlot.querySelector(`#bot-status-${side}`);
      checkBtn?.addEventListener('click', () => {
        const err = validateBotScriptSyntax(codeIn?.value ?? '');
        if (statusEl) {
          statusEl.textContent = err ? `❌ ${err}` : '✅ Syntax OK!';
          (statusEl as HTMLElement).style.color = err ? '#ff6666' : '#55ff99';
        }
      });
    };

    bindSide('home', () => this.homeBot, (v) => (this.homeBot = v));
    bindSide('away', () => this.awayBot, (v) => (this.awayBot = v));

    this.screenSlot.querySelector('#bot-done')!.addEventListener('click', () => {
      this.hooks.onClickSound();
      this.showTeamSelect(returnMode);
    });
  }
}
