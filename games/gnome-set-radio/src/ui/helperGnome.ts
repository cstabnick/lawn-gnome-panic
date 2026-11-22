import { HELPER_GNOMES, type HelperGnomeProfile } from '../data/helpers';
import type { LevelSession } from '../game/events';
import type { GsrLevelId } from '../levels/loader';

export interface HelperGnomeHandle {
  showFact(levelId: GsrLevelId, factIdx?: number): void;
  showHint(levelId: GsrLevelId, session: LevelSession, showUnstuck?: boolean): void;
  hide(): void;
  tick(dt: number, levelId: GsrLevelId, session: LevelSession): void;
  resetForLevel(levelId: GsrLevelId): void;
  dispose(): void;
}

export function createHelperGnome(
  container: HTMLElement,
  opts: { onUnstuck: () => void },
): HelperGnomeHandle {
  const card = document.createElement('div');
  card.id = 'gsr-helper-popup';
  card.style.cssText = `
    position:fixed; left:14px; bottom:96px; z-index:26; max-width:min(340px, 86vw);
    background:rgba(18,8,34,0.94); border:2px solid #00e5ff; border-radius:14px;
    padding:10px 12px; color:#fff; box-shadow:0 12px 30px rgba(0,0,0,0.65);
    display:none; gap:10px; align-items:flex-start; pointer-events:auto;
    font-family:system-ui,sans-serif;
  `;

  const avatar = document.createElement('div');
  avatar.style.cssText = 'flex:0 0 42px; height:42px; border-radius:10px; display:flex; align-items:center; justify-content:center; background:#261245; border:2px solid #ffd740;';

  const body = document.createElement('div');
  body.style.cssText = 'flex:1; min-width:0; display:flex; flex-direction:column; gap:4px;';

  const header = document.createElement('div');
  header.style.cssText = 'display:flex; justify-content:space-between; align-items:center; gap:6px;';
  const nameEl = document.createElement('div');
  nameEl.style.cssText = 'font-size:12px; font-weight:900; color:#ffd740; letter-spacing:0.4px;';
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.cssText = 'min-width:28px; min-height:28px; border:none; border-radius:6px; background:rgba(255,255,255,0.1); color:#fff; font-weight:800; cursor:pointer;';
  closeBtn.onclick = () => hide();
  header.append(nameEl, closeBtn);

  const textEl = document.createElement('div');
  textEl.style.cssText = 'font-size:12px; line-height:1.38; color:#ece4ff;';

  const unstuckBtn = document.createElement('button');
  unstuckBtn.textContent = '↩ Unstuck to Spawn';
  unstuckBtn.style.cssText = `
    margin-top:4px; min-height:44px; padding:6px 12px; border-radius:8px;
    border:2px solid #69f0ae; background:#123828; color:#69f0ae;
    font-weight:900; font-size:12px; cursor:pointer; display:none; align-self:flex-start;
  `;
  unstuckBtn.onclick = () => {
    opts.onUnstuck();
    hide();
  };

  body.append(header, textEl, unstuckBtn);
  card.append(avatar, body);
  container.appendChild(card);

  let visibleTtl = 0;
  let factTimer = 10;
  let idleHintTimer = 38;
  let factCursor = 0;

  function renderProfile(p: HelperGnomeProfile, badge: string, msg: string, showUnstuck: boolean, ttl: number): void {
    card.style.borderColor = p.accentColor;
    avatar.style.borderColor = p.hatColor;
    avatar.innerHTML = `
      <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
        <polygon points="16,2 7,16 25,16" fill="${p.hatColor}" stroke="#120624" stroke-width="1.5"/>
        <circle cx="16" cy="19" r="6" fill="#ffd9b3"/>
        <path d="M10,20 Q16,30 22,20 Z" fill="#ffffff"/>
        <circle cx="14" cy="18" r="1" fill="#120624"/>
        <circle cx="18" cy="18" r="1" fill="#120624"/>
      </svg>
    `;
    nameEl.textContent = `${p.name} · ${badge}`;
    textEl.textContent = msg;
    unstuckBtn.style.display = showUnstuck ? 'inline-block' : 'none';
    card.style.display = 'flex';
    visibleTtl = ttl;
  }

  function hide(): void {
    card.style.display = 'none';
    visibleTtl = 0;
  }

  function showFact(levelId: GsrLevelId, idx?: number): void {
    const p = HELPER_GNOMES[levelId];
    const i = idx !== undefined ? idx % p.facts.length : factCursor++ % p.facts.length;
    renderProfile(p, 'FUN FACT', p.facts[i]!, false, 7.5);
  }

  function pickHint(p: HelperGnomeProfile, session: LevelSession): string {
    for (const ev of session.events.values()) {
      if (!ev.completed && (ev.def.kind === 'story' || (ev.def.kind === 'boss' && session.bossUnlocked))) {
        if (p.hints[ev.def.id]) return p.hints[ev.def.id]!;
      }
    }
    return p.defaultHint;
  }

  function showHint(levelId: GsrLevelId, session: LevelSession, showUnstuck = true): void {
    const p = HELPER_GNOMES[levelId];
    renderProfile(p, 'ROUTE HINT', pickHint(p, session), showUnstuck, 10.5);
    idleHintTimer = 40;
  }

  return {
    showFact,
    showHint,
    hide,
    resetForLevel() {
      hide();
      factTimer = 9;
      idleHintTimer = 38;
    },
    tick(dt, levelId, session) {
      if (visibleTtl > 0) {
        visibleTtl -= dt;
        if (visibleTtl <= 0) hide();
      }
      factTimer -= dt;
      if (factTimer <= 0) {
        factTimer = 46;
        if (visibleTtl <= 0) showFact(levelId);
      }
      idleHintTimer -= dt;
      if (idleHintTimer <= 0) {
        idleHintTimer = 45;
        if (visibleTtl <= 0 && !session.levelCleared) showHint(levelId, session, true);
      }
    },
    dispose() {
      card.remove();
    },
  };
}
