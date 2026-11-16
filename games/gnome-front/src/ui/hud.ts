// src/ui/hud.ts: the whole 2D interface in DOM: title and pause screens, crosshair, hit markers, health, ammo,
// tickets, flags, kill feed, capture and vehicle prompts, minimap, death screen, scoreboard and end screen.
import {
  ARENA_HALF, CLASSES, CLASS_ORDER, DOM_IDS, GRENADE, NEUTRAL_CSS, TEAM_CSS, TEAM_NAMES, TUNING, WEAPONS, weaponOf,
  type DamageCause, type FlagState, type Game, type GameEvent, type InputState, type Soldier, type Team, type Vehicle,
  type WeaponId,
} from '../config';
import { nearestEnterable } from '../vehicles';

export type Overlay = 'title' | 'paused' | 'none';

export interface Hud {
  update(dt: number, input: InputState): void;
  setOverlay(mode: Overlay): void;
}

const MAP_PX = 170;
const KILL_FEED_MAX = 5;
const KILL_FEED_S = 6;
const TOAST_S = 2.5;
const HIT_S = 0.15;
const VIGNETTE_S = 0.5;
const MINIMAP_ENEMY_RANGE = 40;

const VERB: Record<Exclude<DamageCause, 'gun'>, string> = {
  grenade: 'pineconed',
  roadkill: 'mowed down',
  wreck: 'wrecked',
};

const WEAPON_VERB: Record<WeaponId, string> = {
  acornRifle: 'acorned',
  seedSprayer: 'seeded',
  peaShooter: 'pea-sniped',
  blunderbuss: 'blunderbussed',
};

/** Kill-feed verb: gun kills name the weapon; other causes use VERB. */
function verbFor(cause: DamageCause, weapon: WeaponId | null): string {
  if (cause === 'gun') return WEAPON_VERB[weapon ?? 'acornRifle'];
  return VERB[cause];
}

/** Digit keys that pick a class, in CLASS_ORDER. */
const CLASS_KEYS: readonly string[] = ['Digit1', 'Digit2', 'Digit3', 'Digit4'];

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

interface ClassPicker {
  root: HTMLDivElement;
  refresh(): void;
}

/** Four class cards. Highlights game.player.nextClassId; clicking a card sets it. */
function buildClassPicker(game: Game): ClassPicker {
  const root = el('div', 'gf-cards');
  const cards = CLASS_ORDER.map((id, k) => {
    const c = CLASSES[id];
    const w = WEAPONS[c.weapon];
    const card = el('div', 'gf-card');
    card.append(
      el('div', 'gf-card-key', `${k + 1}`),
      el('div', 'gf-card-name', c.name),
      el('div', 'gf-card-wpn', w.name),
      el('div', 'gf-card-blurb', c.blurb),
    );
    const stats: [string, number][] = [
      ['Dmg', (w.damage * w.pellets) / 120],
      ['Rate', 0.11 / w.fireIntervalS],
      ['Range', w.falloffEnd / 120],
    ];
    for (const [label, v] of stats) {
      const row = el('div', 'gf-stat');
      const bar = el('div', 'gf-stat-b');
      const fill = el('div', 'gf-stat-f');
      fill.style.width = `${clamp01(v) * 100}%`;
      bar.appendChild(fill);
      row.append(el('span', 'gf-stat-l', label), bar);
      card.appendChild(row);
    }
    card.appendChild(el('div', 'gf-card-gren', `${GRENADE.name} x${c.grenades}`));
    card.onclick = () => {
      game.player.nextClassId = id;
      refresh();
    };
    root.appendChild(card);
    return card;
  });

  function refresh(): void {
    CLASS_ORDER.forEach((id, k) => cards[k].classList.toggle('sel', game.player.nextClassId === id));
  }
  return { root, refresh };
}

const CSS = `
#gf-hud{position:absolute;inset:0;pointer-events:none;font-family:"Trebuchet MS","Segoe UI",system-ui,sans-serif;font-weight:800;color:#fff;text-shadow:0 2px 0 #000,0 0 6px rgba(0,0,0,.5);user-select:none;overflow:hidden;z-index:10}
#gf-hud .gf-abs{position:absolute}
#gf-hud.gf-off{visibility:hidden}
.gf-top{top:12px;left:50%;transform:translateX(-50%);text-align:center;white-space:nowrap}
.gf-tickets{font-size:22px;letter-spacing:1px}
.gf-flags{display:flex;gap:8px;justify-content:center;margin-top:6px}
.gf-pill{position:relative;width:62px;height:30px;border-radius:15px;border:3px solid #000;overflow:hidden;background:${NEUTRAL_CSS};color:#111;text-shadow:none;font-size:16px;line-height:24px;text-align:center;box-sizing:border-box}
.gf-pill-fill{position:absolute;left:0;bottom:0;height:6px;width:0;background:#fff}
.gf-pill-letter{position:relative;z-index:1}
.gf-cap{margin-top:6px;font-size:15px;letter-spacing:2px;min-height:18px}
.gf-toasts{position:absolute;top:118px;left:50%;transform:translateX(-50%);text-align:center;font-size:18px;white-space:nowrap}
.gf-toast{margin-top:3px}
.gf-cross{position:absolute;left:50%;top:50%;width:0;height:0;--gap:5px}
.gf-tick{position:absolute;background:#fff;box-shadow:0 0 2px #000}
.gf-tick.u{left:-1px;top:calc(var(--gap) * -1 - 10px);width:2px;height:10px}
.gf-tick.d{left:-1px;top:var(--gap);width:2px;height:10px}
.gf-tick.l{top:-1px;left:calc(var(--gap) * -1 - 10px);height:2px;width:10px}
.gf-tick.r{top:-1px;left:var(--gap);height:2px;width:10px}
.gf-hitm{position:absolute;left:50%;top:50%;width:20px;height:20px;margin:-10px 0 0 -10px;opacity:0}
.gf-hitm i{position:absolute;left:9px;top:-2px;width:3px;height:24px;background:#fff;box-shadow:0 0 3px #000}
.gf-hitm i:nth-child(1){transform:rotate(45deg)}
.gf-hitm i:nth-child(2){transform:rotate(-45deg)}
.gf-hitm.kill i{background:#ff3b3b}
.gf-vig{position:absolute;inset:0;opacity:0;background:radial-gradient(ellipse at center,rgba(0,0,0,0) 45%,rgba(200,0,0,.9) 100%)}
.gf-bl{left:16px;bottom:16px;width:230px}
.gf-mini{display:block;width:170px;height:170px;background:rgba(0,0,0,.45);border:2px solid #000;border-radius:6px;margin-bottom:8px}
.gf-bar{position:relative;height:16px;border:2px solid #000;border-radius:8px;background:rgba(0,0,0,.5);overflow:hidden;margin-top:4px}
.gf-bar-fill{position:absolute;left:0;top:0;bottom:0;width:100%;background:#7ddc4a}
.gf-bar-text{position:absolute;inset:0;text-align:center;font-size:12px;line-height:12px;padding-top:0}
.gf-vlabel{font-size:14px;margin-top:6px}
.gf-br{right:16px;bottom:16px;text-align:right}
.gf-ammo{font-size:46px;line-height:46px}
.gf-reload{font-size:18px;color:#ffd23f;min-height:20px}
.gf-gren{font-size:15px}
.gf-lockhint{left:50%;top:38%;transform:translateX(-50%);font-size:26px;letter-spacing:2px;color:#ffd23f;white-space:nowrap;display:none}
.gf-prompt{left:50%;top:62%;transform:translateX(-50%);font-size:20px;white-space:nowrap;min-height:24px}
.gf-feed{top:12px;right:16px;text-align:right;font-size:15px}
.gf-row{display:inline-block;background:rgba(0,0,0,.35);padding:3px 8px;border-radius:4px;margin-top:3px}
.gf-row.you{background:rgba(255,210,63,.45)}
.gf-hs{color:#ffd23f}
.gf-death{inset:0;display:none;align-items:center;justify-content:center;flex-direction:column;background:rgba(90,0,0,.35);text-align:center}
.gf-death-text{font-size:34px}
.gf-death-timer{font-size:22px;margin-top:10px;color:#ffd23f}
.gf-score{left:50%;top:50%;transform:translate(-50%,-50%);display:none;gap:40px;background:rgba(0,0,0,.6);padding:18px 26px;border-radius:10px;font-size:17px;min-width:420px}
.gf-score-col{flex:1}
.gf-score-h{font-size:20px;margin-bottom:8px}
.gf-score-r{display:flex;justify-content:space-between;gap:12px;padding:2px 0}
.gf-score-r.you{color:#ffd23f}
.gf-end{inset:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.6);text-align:center;pointer-events:none}
.gf-end-box{pointer-events:auto}
.gf-end-h{font-size:72px;letter-spacing:2px;margin:0}
.gf-end-sub{font-size:24px;margin:6px 0 4px}
.gf-end-stats{font-size:20px;margin:6px 0 18px}
#gf-title{position:absolute;inset:0;z-index:20;display:block;pointer-events:auto;overflow-y:auto;box-sizing:border-box;padding:16px 0 calc(var(--gf-online-h,0px) + 16px);background:rgba(12,24,12,.84);text-align:center;font-family:"Trebuchet MS","Segoe UI",system-ui,sans-serif;font-weight:800;color:#fff;text-shadow:0 2px 0 #000}
#gf-title .gf-title-box{box-sizing:border-box;min-height:100%;margin:0 auto;display:flex;flex-direction:column;justify-content:center;width:min(680px,calc(100vw - 32px))}
#gf-title h1{font-size:76px;margin:0;color:#ffd23f;letter-spacing:3px}
#gf-title .gf-tag{font-size:21px;margin:10px 0 22px}
#gf-title ul{list-style:none;padding:0;margin:0 auto 28px;display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;text-align:left;font-size:18px;max-width:520px}
#gf-title li b{color:#ffd23f}
#gf-title button,#gf-hud button{pointer-events:auto;cursor:pointer;font:inherit;font-size:26px;letter-spacing:2px;color:#111;background:#ffd23f;border:3px solid #000;border-radius:10px;padding:10px 40px;box-shadow:0 4px 0 #000;text-shadow:none}
#gf-title button:active,#gf-hud button:active{transform:translateY(3px);box-shadow:0 1px 0 #000}
@media (max-width:600px){#gf-title h1{font-size:48px}#gf-title ul{grid-template-columns:1fr;font-size:16px}}
.gf-touchhelp{display:none;font-size:15px;margin:0 auto 14px;max-width:520px;line-height:1.5}
.gf-touchhelp b{color:#ffd23f}
@media (pointer:coarse){#gf-title ul{display:none}.gf-touchhelp{display:block}}
@media (max-height:500px){#gf-title h1{font-size:42px}#gf-title .gf-tag{font-size:15px;margin:4px 0 10px}#gf-title ul{font-size:13px;gap:1px 18px;margin-bottom:10px}#gf-title button,#gf-hud button{font-size:20px;padding:6px 30px}.gf-mini{width:110px;height:110px}.gf-ammo{font-size:30px;line-height:30px}.gf-end-h{font-size:44px}.gf-death-text{font-size:24px}.gf-feed{font-size:12px;top:48px}.gf-score{min-width:0;font-size:13px;padding:10px 14px}}
.gf-cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;width:min(720px,94vw);margin:0 auto 12px}
.gf-card{pointer-events:auto;cursor:pointer;min-width:0;box-sizing:border-box;padding:8px;background:rgba(0,0,0,.55);border:3px solid #000;border-radius:8px;text-align:left;font-size:13px;line-height:1.25;color:#fff}
.gf-card.sel{border-color:#ffd23f;background:rgba(255,210,63,.2)}
.gf-card-key{color:#ffd23f;font-size:12px}
.gf-card-name{font-size:17px;margin-top:1px}
.gf-card-wpn{font-size:12px;color:#cfe8c0}
.gf-card-blurb{font-size:11px;font-weight:600;opacity:.85;margin:4px 0 6px}
.gf-stat{display:flex;align-items:center;gap:4px;font-size:10px;margin-top:3px}
.gf-stat-l{width:36px}
.gf-stat-b{position:relative;flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,.2);overflow:hidden}
.gf-stat-f{position:absolute;left:0;top:0;bottom:0;background:#7ddc4a}
.gf-card-gren{font-size:11px;color:#ffd23f;margin-top:5px}
.gf-pick-note{font-size:15px;color:#ffd23f;margin:-4px 0 14px}
.gf-death-deploy{font-size:18px;margin:6px 0 14px}
.gf-dot{position:absolute;left:-2px;top:-2px;width:4px;height:4px;border-radius:50%;background:#fff;box-shadow:0 0 2px #000;display:none}
.gf-wpn{font-size:17px;color:#ffd23f;letter-spacing:1px}
.gf-score-cls{color:#9aa;font-size:.8em;margin-left:6px;font-weight:600}
.gf-scope{display:none;inset:0;background:radial-gradient(circle at 50% 50%,transparent 42vmin,#000 calc(42vmin + 1px))}
.gf-scope-h,.gf-scope-v{position:absolute;left:50%;top:50%;background:#000}
.gf-scope-h{width:84vmin;height:1px;margin:-1px 0 0 -42vmin}
.gf-scope-v{width:1px;height:84vmin;margin:-42vmin 0 0 -1px}
.gf-scope-dot{position:absolute;left:50%;top:50%;width:4px;height:4px;margin:-2px 0 0 -2px;border-radius:50%;background:#ff3b3b}
@media (max-width:600px){.gf-cards{grid-template-columns:1fr 1fr}}
@media (max-height:500px){.gf-cards{grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;margin-bottom:6px}.gf-card{padding:4px;font-size:10px}.gf-card-name{font-size:13px}.gf-card-blurb{display:none}.gf-card-wpn{font-size:10px}.gf-stat{font-size:8px}.gf-pick-note{font-size:12px;margin-bottom:6px}.gf-death-deploy{font-size:14px}.gf-wpn{font-size:13px}}
`;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function teamSpan(team: Team, text: string): HTMLSpanElement {
  const s = el('span', undefined, text);
  s.style.color = TEAM_CSS[team];
  return s;
}

function killerName(killer: Soldier | null): string {
  return killer ? killer.name : 'a mower';
}

export function createHud(root: HTMLElement, game: Game, onPlay: () => void): Hud {
  if (!document.getElementById('gf-hud-style')) {
    const style = el('style');
    style.id = 'gf-hud-style';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  // ---- container -------------------------------------------------------
  const hudEl = el('div');
  hudEl.id = DOM_IDS.hud;

  // Tickets and flags (top centre)
  const top = el('div', 'gf-abs gf-top');
  const tickets = el('div', 'gf-tickets');
  const flagRow = el('div', 'gf-flags');
  const capText = el('div', 'gf-cap');
  top.append(tickets, flagRow, capText);
  const toasts = el('div', 'gf-toasts');

  type PillRefs = { pill: HTMLDivElement; fill: HTMLDivElement };
  const pills: PillRefs[] = game.flags.map((f) => {
    const pill = el('div', 'gf-pill');
    const fill = el('div', 'gf-pill-fill');
    const letter = el('span', 'gf-pill-letter', f.def.id);
    pill.append(fill, letter);
    flagRow.appendChild(pill);
    return { pill, fill };
  });

  // Crosshair and hit markers (centre)
  const cross = el('div', 'gf-abs gf-cross');
  const ticks: HTMLDivElement[] = ['u', 'd', 'l', 'r'].map((c) => el('div', `gf-tick ${c}`));
  const dot = el('div', 'gf-dot');
  cross.append(...ticks, dot);
  const hitm = el('div', 'gf-abs gf-hitm');
  hitm.append(el('i'), el('i'));
  const vig = el('div', 'gf-abs gf-vig');
  const scope = el('div', 'gf-abs gf-scope');
  scope.append(el('div', 'gf-scope-h'), el('div', 'gf-scope-v'), el('div', 'gf-scope-dot'));
  const pickers: ClassPicker[] = [];

  // Prompt (centre-low)
  const prompt = el('div', 'gf-abs gf-prompt');
  // Shown while playing with a mouse that is not locked (online matches start without a click).
  const lockHint = el('div', 'gf-abs gf-lockhint', 'CLICK TO AIM');

  // Bottom left: minimap, health, vehicle
  const bl = el('div', 'gf-abs gf-bl');
  const mini = el('canvas', 'gf-mini');
  mini.width = MAP_PX;
  mini.height = MAP_PX;
  const mctx = mini.getContext('2d');
  const healthBar = el('div', 'gf-bar');
  const healthFill = el('div', 'gf-bar-fill');
  const healthText = el('div', 'gf-bar-text');
  healthBar.append(healthFill, healthText);
  const vLabel = el('div', 'gf-vlabel');
  const vBar = el('div', 'gf-bar');
  const vFill = el('div', 'gf-bar-fill');
  vFill.style.background = '#ffd23f';
  const vText = el('div', 'gf-bar-text');
  vBar.append(vFill, vText);
  vLabel.style.display = 'none';
  vBar.style.display = 'none';
  bl.append(mini, healthBar, vLabel, vBar);

  // Bottom right: ammo
  const br = el('div', 'gf-abs gf-br');
  const ammo = el('div', 'gf-ammo');
  const reload = el('div', 'gf-reload');
  const gren = el('div', 'gf-gren');
  const wpn = el('div', 'gf-wpn');
  br.append(wpn, ammo, reload, gren);

  // Kill feed (top right)
  const feed = el('div', 'gf-abs gf-feed');

  // Death screen
  const death = el('div', 'gf-abs gf-death');
  const deathText = el('div', 'gf-death-text');
  const deathTimer = el('div', 'gf-death-timer');
  const deathDeploy = el('div', 'gf-death-deploy');
  const deathPicker = buildClassPicker(game);
  pickers.push(deathPicker);
  death.append(deathText, deathTimer, deathDeploy, deathPicker.root);

  // Scoreboard
  const score = el('div', 'gf-abs gf-score');

  // End screen
  const end = el('div', 'gf-abs gf-end');
  const endBox = el('div', 'gf-end-box');
  const endH = el('h1', 'gf-end-h');
  const endSub = el('div', 'gf-end-sub');
  const endStats = el('div', 'gf-end-stats');
  const again = el('button', undefined, 'PLAY AGAIN');
  again.id = 'gf-again';
  again.onclick = () => location.reload();
  endBox.append(endH, endSub, endStats, again);
  end.appendChild(endBox);

  hudEl.append(top, toasts, cross, scope, hitm, vig, prompt, lockHint, bl, br, feed, death, score, end);

  /** Touch screen: prompts name the RIDE button instead of the E key. */
  const coarse = window.matchMedia('(pointer: coarse)').matches;

  // ---- title / pause overlay ------------------------------------------
  const title = el('div');
  title.id = DOM_IDS.title;
  const tBox = el('div', 'gf-title-box');
  const tH = el('h1', undefined, 'GNOME FRONT');
  const tTag = el('p', 'gf-tag', 'Conquest on the lawn. 12 gnomes a side. Ride the mowers.');
  const controls = el('ul');
  const CONTROL_LIST: [string, string][] = [
    ['WASD', 'move'], ['Mouse', 'aim'], ['Click', 'fire'], ['R', 'reload'], ['G', 'pinecone grenade'],
    ['Space', 'jump'], ['Shift', 'sprint'], ['E', 'ride / hop off a mower'], ['Tab', 'scores'], ['M', 'mute music'],
  ];
  for (const [k, v] of CONTROL_LIST) {
    const li = el('li');
    const b = el('b', undefined, k);
    li.append(b, document.createTextNode(` ${v}`));
    controls.appendChild(li);
  }
  const touchHelp = el('p', 'gf-touchhelp');
  touchHelp.innerHTML = '<b>Left thumb</b> move &middot; <b>Right thumb</b> look &middot; hold <b>FIRE</b> and drag to aim<br><b>AIM</b> zoom in &middot; <b>RIDE</b> hop on / off a mower &middot; <b>GREN</b> pinecone &middot; <b>JUMP</b> &middot; <b>RELOAD</b>';
  const play = el('button', undefined, 'PLAY');
  play.id = DOM_IDS.play;
  const titlePicker = buildClassPicker(game);
  pickers.push(titlePicker);
  const pickNote = el('p', 'gf-pick-note', 'Your class applies the next time you spawn.');
  pickNote.style.display = 'none';
  // onPlay (main.ts) applies the picked class when the match has not started yet.
  play.onclick = () => onPlay();
  tBox.append(tH, tTag, controls, touchHelp, titlePicker.root, pickNote, play);
  title.appendChild(tBox);

  root.append(hudEl, title);

  // ---- state -------------------------------------------------------------
  let now = 0;
  let overlay: Overlay = 'title';
  let hitT = 0;
  let hitKill = false;
  let vigT = 0;
  let vigMax = 0;
  let lastDeath: { name: string; verb: string } | null = null;
  let endShown = false;
  const killFeed: { t: number; killer: Soldier | null; victim: Soldier; cause: DamageCause; weapon: WeaponId | null; headshot: boolean }[] = [];
  const toastList: { t: number; text: string; team: Team }[] = [];

  game.on((e: GameEvent) => {
    switch (e.type) {
      case 'hit':
        if (e.shooter === game.player && !(hitT > 0 && hitKill)) {
          hitT = HIT_S;
          hitKill = false;
        }
        if (e.victim === game.player) {
          vigT = VIGNETTE_S;
          vigMax = Math.min(0.9, 0.35 + e.damage / 80);
        }
        break;
      case 'vehicleHit':
        if (e.shooter === game.player && !(hitT > 0 && hitKill)) {
          hitT = HIT_S;
          hitKill = false;
        }
        break;
      case 'kill':
        if (e.killer === game.player) {
          hitT = HIT_S;
          hitKill = true;
        }
        killFeed.push({ t: now, killer: e.killer, victim: e.victim, cause: e.cause, weapon: e.weapon, headshot: e.headshot });
        while (killFeed.length > KILL_FEED_MAX) killFeed.shift();
        if (e.victim === game.player) {
          lastDeath = { name: killerName(e.killer), verb: verbFor(e.cause, e.weapon) };
        }
        break;
      case 'flagCaptured':
        toastList.push({ t: now, text: `${TEAM_NAMES[e.team]} captured ${e.flag.def.name}`, team: e.team });
        break;
      case 'flagLost':
        toastList.push({ t: now, text: `${e.flag.def.name} lost`, team: e.team });
        break;
      default:
        break;
    }
  });

  // Number keys pick a class at any time (the pick applies at the next respawn).
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    const k = CLASS_KEYS.indexOf(e.code);
    if (k < 0) return;
    game.player.nextClassId = CLASS_ORDER[k];
    for (const pk of pickers) pk.refresh();
  });

  function renderFlags(): void {
    game.flags.forEach((f: FlagState, i: number) => {
      const { pill, fill } = pills[i];
      pill.style.background = f.owner === null ? NEUTRAL_CSS : TEAM_CSS[f.owner];
      const leader: Team = f.progress >= 0 ? 0 : 1;
      fill.style.background = TEAM_CSS[leader];
      fill.style.width = `${Math.min(1, Math.abs(f.progress)) * 100}%`;
    });
  }

  function captureLine(): string {
    if (!game.player.alive) return '';
    for (const f of game.flags) {
      const dx = game.player.pos.x - f.def.x;
      const dz = game.player.pos.z - f.def.z;
      if (Math.hypot(dx, dz) > TUNING.captureRadius) continue;
      if (f.contested) return 'CONTESTED';
      return `${f.owner === game.player.team ? 'DEFENDING' : 'CAPTURING'} ${f.def.id}`;
    }
    return '';
  }

  function drawMinimap(): void {
    if (!mctx) return;
    const s = MAP_PX / (2 * ARENA_HALF);
    const mx = (x: number): number => (x + ARENA_HALF) * s;
    const mz = (z: number): number => (z + ARENA_HALF) * s;
    mctx.clearRect(0, 0, MAP_PX, MAP_PX);

    for (const f of game.flags) {
      const x = mx(f.def.x);
      const y = mz(f.def.z);
      mctx.beginPath();
      mctx.arc(x, y, 9, 0, Math.PI * 2);
      mctx.fillStyle = f.owner === null ? NEUTRAL_CSS : TEAM_CSS[f.owner];
      mctx.fill();
      mctx.lineWidth = 2;
      mctx.strokeStyle = '#000';
      mctx.stroke();
      mctx.fillStyle = f.owner === null ? '#000' : '#fff';
      mctx.font = 'bold 11px sans-serif';
      mctx.textAlign = 'center';
      mctx.textBaseline = 'middle';
      mctx.fillText(f.def.id, x, y + 0.5);
    }

    for (const s2 of game.soldiers) {
      if (!s2.alive || s2 === game.player) continue;
      const dist = Math.hypot(s2.pos.x - game.player.pos.x, s2.pos.z - game.player.pos.z);
      if (s2.team !== game.player.team && dist > MINIMAP_ENEMY_RANGE) continue;
      mctx.beginPath();
      mctx.arc(mx(s2.pos.x), mz(s2.pos.z), 3, 0, Math.PI * 2);
      mctx.fillStyle = TEAM_CSS[s2.team];
      mctx.fill();
    }

    for (const v of game.vehicles) {
      if (!v.alive) continue;
      mctx.fillStyle = v.driver ? TEAM_CSS[v.team] : '#8a8a8a';
      mctx.fillRect(mx(v.pos.x) - 4, mz(v.pos.z) - 4, 8, 8);
    }

    if (game.player.alive) {
      const dx = Math.sin(game.player.yaw);
      const dy = Math.cos(game.player.yaw);
      const cx = mx(game.player.pos.x);
      const cy = mz(game.player.pos.z);
      const tipX = cx + dx * 8;
      const tipY = cy + dy * 8;
      const bX = cx - dx * 4;
      const bY = cy - dy * 4;
      mctx.beginPath();
      mctx.moveTo(tipX, tipY);
      mctx.lineTo(bX - dy * 4.5, bY + dx * 4.5);
      mctx.lineTo(bX + dy * 4.5, bY - dx * 4.5);
      mctx.closePath();
      mctx.fillStyle = '#fff';
      mctx.fill();
      mctx.lineWidth = 1;
      mctx.strokeStyle = '#000';
      mctx.stroke();
    }
  }

  function renderScoreboard(): void {
    score.replaceChildren();
    for (const team of [0, 1] as Team[]) {
      const col = el('div', 'gf-score-col');
      const h = el('div', 'gf-score-h');
      h.appendChild(teamSpan(team, TEAM_NAMES[team]));
      col.appendChild(h);
      const rows = game.soldiers
        .filter((s) => s.team === team)
        .sort((a, b) => b.kills - a.kills || a.deaths - b.deaths);
      for (const s of rows) {
        const r = el('div', s.isPlayer ? 'gf-score-r you' : 'gf-score-r');
        const nameCell = el('span');
        nameCell.append(document.createTextNode(s.name), el('span', 'gf-score-cls', CLASSES[s.classId].name));
        r.append(nameCell, el('span', undefined, `${s.kills} / ${s.deaths}`));
        col.appendChild(r);
      }
      score.appendChild(col);
    }
  }

  function renderFeed(): void {
    feed.replaceChildren();
    for (const k of killFeed) {
      const row = el('div', 'gf-row');
      if (k.killer === game.player || k.victim === game.player) row.classList.add('you');
      if (k.killer) row.appendChild(teamSpan(k.killer.team, k.killer.name));
      else row.appendChild(document.createTextNode('a mower'));
      row.appendChild(document.createTextNode(` ${verbFor(k.cause, k.weapon)} `));
      row.appendChild(teamSpan(k.victim.team, k.victim.name));
      if (k.headshot) row.appendChild(el('span', 'gf-hs', ' (HEADSHOT)'));
      feed.appendChild(row);
    }
  }

  function renderToasts(): void {
    toasts.replaceChildren();
    for (const t of toastList) {
      const d = el('div', 'gf-toast');
      d.style.color = TEAM_CSS[t.team];
      d.textContent = t.text;
      toasts.appendChild(d);
    }
  }

  function renderEnd(): void {
    const winner = game.winner;
    const won = winner !== null && winner === game.player.team;
    endH.textContent = winner === null ? 'DRAW' : won ? 'VICTORY' : 'DEFEAT';
    endH.style.color = winner === null ? '#fff' : TEAM_CSS[winner];
    endSub.textContent = winner === null ? '' : `${TEAM_NAMES[winner]} WIN`;
    endStats.textContent = `Kills ${game.player.kills}   Deaths ${game.player.deaths}`;
    end.style.display = 'flex';
    if (!endShown) {
      endShown = true;
      document.exitPointerLock();
    }
  }

  return {
    update(dt: number, input: InputState): void {
      now += dt;
      const p = game.player;

      // Timers
      hitT = Math.max(0, hitT - dt);
      vigT = Math.max(0, vigT - dt);
      while (toastList.length && now - toastList[0].t >= TOAST_S) toastList.shift();
      while (killFeed.length && now - killFeed[0].t >= KILL_FEED_S) killFeed.shift();

      // Tickets, flags, capture line
      tickets.replaceChildren(
        teamSpan(0, TEAM_NAMES[0]),
        document.createTextNode(` ${Math.ceil(game.tickets[0])} | ${Math.ceil(game.tickets[1])} `),
        teamSpan(1, TEAM_NAMES[1]),
      );
      renderFlags();
      const cap = captureLine();
      capText.textContent = cap;
      capText.style.color = cap === 'CONTESTED' ? '#ffd23f' : cap.startsWith('DEFENDING') ? TEAM_CSS[p.team] : '#fff';

      // Crosshair, scope and hit markers
      const w = weaponOf(p);
      const alive = p.alive && !game.over && overlay === 'none';
      const scopeOn = alive && w.scope && p.adsT > 0.85;
      const dotOnly = !w.scope && p.adsT > 0.9;
      cross.style.display = alive && !scopeOn ? 'block' : 'none';
      cross.style.setProperty('--gap', `${(p.sprinting ? 12 : 5) + (2 - (p.sprinting ? 12 : 5)) * p.adsT}px`);
      for (const t of ticks) t.style.display = dotOnly ? 'none' : 'block';
      dot.style.display = dotOnly ? 'block' : 'none';
      scope.style.display = scopeOn ? 'block' : 'none';
      hitm.style.opacity = hitT > 0 ? String(Math.min(1, hitT / HIT_S + 0.2)) : '0';
      hitm.className = hitKill ? 'gf-abs gf-hitm kill' : 'gf-abs gf-hitm';

      // Damage vignette
      vig.style.opacity = String(vigT > 0 ? vigMax * (vigT / VIGNETTE_S) : 0);

      // Prompt
      let promptText = '';
      if (p.alive && !game.over) {
        if (p.vehicle) {
          promptText = coarse ? 'Tap RIDE to hop off' : 'E to hop off';
        } else {
          const v = nearestEnterable(game, p);
          if (v) promptText = coarse ? `Tap RIDE to ride the ${v.def.name}` : `Press E to ride the ${v.def.name}`;
        }
      }
      prompt.textContent = promptText;
      lockHint.style.display = !coarse && !input.locked && overlay === 'none' && !game.over ? 'block' : 'none';

      // Health and vehicle bars
      const hpFrac = Math.max(0, Math.min(1, p.hp / TUNING.maxHp));
      healthFill.style.width = `${hpFrac * 100}%`;
      healthFill.style.background = hpFrac > 0.35 ? '#7ddc4a' : '#ff5a4f';
      healthText.textContent = `HEALTH ${Math.max(0, Math.ceil(p.hp))}`;
      const v: Vehicle | null = p.vehicle;
      if (v) {
        vLabel.style.display = 'block';
        vBar.style.display = 'block';
        vLabel.textContent = v.def.name;
        const vFrac = Math.max(0, Math.min(1, v.hp / v.def.maxHp));
        vFill.style.width = `${vFrac * 100}%`;
        vText.textContent = `${Math.max(0, Math.ceil(v.hp))} / ${v.def.maxHp}`;
      } else {
        vLabel.style.display = 'none';
        vBar.style.display = 'none';
      }

      // Ammo
      wpn.textContent = w.name;
      ammo.textContent = `${p.ammo} / ${p.reserve}`;
      reload.textContent = p.reloadT > 0 ? 'RELOADING' : '';
      gren.textContent = `${GRENADE.name} x${p.grenades}`;
      br.style.display = p.alive ? 'block' : 'none';

      // Death screen
      if (!p.alive && !game.over) {
        death.style.display = 'flex';
        deathText.textContent = lastDeath ? `${lastDeath.name} ${lastDeath.verb} you` : 'You were knocked out';
        deathTimer.textContent = `Respawning in ${Math.max(0, Math.ceil(p.respawnT))}`;
        deathDeploy.textContent = `Deploying as ${CLASSES[p.nextClassId].name} in ${Math.max(0, Math.ceil(p.respawnT))}`;
      } else {
        death.style.display = 'none';
      }

      // Class pickers, lists and minimap
      for (const pk of pickers) pk.refresh();
      renderFeed();
      renderToasts();
      drawMinimap();
      if (input.scoreboard && !game.over) {
        score.style.display = 'block';
        renderScoreboard();
      } else {
        score.style.display = 'none';
      }

      // End screen
      if (game.over) {
        renderEnd();
      }
    },

    setOverlay(mode: Overlay): void {
      overlay = mode;
      if (mode === 'none') {
        title.style.display = 'none';
        hudEl.classList.remove('gf-off');
      } else {
        title.style.display = 'block';
        hudEl.classList.add('gf-off');
        const paused = mode === 'paused';
        tH.textContent = paused ? 'PAUSED' : 'GNOME FRONT';
        tTag.style.display = paused ? 'none' : 'block';
        pickNote.style.display = paused ? 'block' : 'none';
        play.textContent = paused ? 'RESUME' : 'PLAY';
      }
    },
  };
}
