// Chicory Waymark, the guide by the fountain: three short answers for new players. Until the player has opened the guide
// once, Chicory calls out now and then and a ❓ Help button on the HUD pulses; both stop after that.
import { STORAGE } from './config';
import { openPanel, closePanel, type PanelCtx } from './panel';

const NPC_ID = 'chicory-waymark';
const CALL_OUT_EVERY_MS = 14000;
const CALL_OUTS = ['New here? Tap me!', 'Psst! I know where everything is.', "Questions? Tap me, I don't bite."];

const GUIDE_CSS = `
.cg-guide-help{min-width:44px;min-height:44px;padding:0 12px;border:0;border-radius:999px;background:rgba(20,20,28,0.78);color:#fff;font:inherit;font-size:15px;font-weight:600;cursor:pointer;}
.cg-guide-help.pulse{animation:cg-guide-pulse 2s ease-in-out infinite;}
@keyframes cg-guide-pulse{0%,100%{box-shadow:0 0 0 0 rgba(255,214,90,0.0);}50%{box-shadow:0 0 0 6px rgba(255,214,90,0.7);}}
.cg-guide-q{display:block;width:100%;text-align:left;justify-content:flex-start;margin:0 0 8px;min-height:52px;}
.cg-guide-q[aria-pressed="true"]{background:#2f7d4a;color:#fff;border-color:#2f7d4a;}
.cg-guide-answer{margin:4px 0 12px;padding:12px 14px;border-radius:12px;background:#fffdf5;border:2px solid #7a5a36;font-size:15px;line-height:1.4;min-height:1.4em;}
.cg-guide-answer:empty{display:none;}
@media (prefers-reduced-motion: reduce){.cg-guide-help.pulse{animation:none;}}
`;

const QUESTIONS: { label: string; answer: string }[] = [
  {
    label: '🗺️ Where am I?',
    answer:
      "This is Club Gnome, the town square every player shares. Walk around, say hi, and step through any door to play what's inside.",
  },
  {
    label: '🎮 How do I play games?',
    answer:
      'Walk up to a door, cabinet or table and tap the yellow button. In a hurry? Press Shift+Tab, or tap the Arcade tab at the top, to pick any game.',
  },
  {
    label: '🌰 What are acorns?',
    answer:
      'Acorns are your money, kept in your Oakcount (top left). Pick them up under the trees, then spend them on Acorn Row or trade them for Gnomecino chips.',
  },
];

let styleInjected = false;
let seenThisSession = false;
let helpButton: HTMLButtonElement | null = null;
let callTimer: ReturnType<typeof setInterval> | null = null;
let callIndex = 0;

function injectStyle(): void {
  if (styleInjected) return;
  styleInjected = true;
  const s = document.createElement('style');
  s.id = 'cg-guide-style';
  s.textContent = GUIDE_CSS;
  document.head.appendChild(s);
}

function readSeen(): boolean {
  if (seenThisSession) return true;
  try {
    return localStorage.getItem(STORAGE.guideSeen) === '1';
  } catch {
    return false;
  }
}

function markSeen(): void {
  seenThisSession = true;
  try {
    localStorage.setItem(STORAGE.guideSeen, '1');
  } catch {
    // Storage blocked: the session flag still stops the call-outs for this visit.
  }
  if (callTimer !== null) {
    clearInterval(callTimer);
    callTimer = null;
  }
  helpButton?.classList.remove('pulse');
}

/** Opens the guide's panel. */
export function openGuide(ctx: PanelCtx): void {
  markSeen();
  injectStyle();

  const panel = openPanel(ctx.ui, {
    title: "Hi! I'm Chicory.",
    subtitle: 'Ask me anything. Tap a question.',
  });

  const answer = document.createElement('div');
  answer.className = 'cg-guide-answer';
  answer.setAttribute('aria-live', 'polite');

  const buttons: HTMLButtonElement[] = [];
  for (const q of QUESTIONS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cgp-btn alt cg-guide-q';
    btn.textContent = q.label;
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', () => {
      answer.textContent = q.answer;
      for (const other of buttons) other.setAttribute('aria-pressed', other === btn ? 'true' : 'false');
    });
    buttons.push(btn);
    panel.body.appendChild(btn);
  }

  panel.body.appendChild(answer);

  const thanks = document.createElement('button');
  thanks.type = 'button';
  thanks.className = 'cgp-btn';
  thanks.textContent = 'Thanks, Chicory!';
  thanks.addEventListener('click', () => {
    closePanel();
    ctx.npcSay(NPC_ID, 'Have fun! I\'m always by the fountain.');
  });
  panel.body.appendChild(thanks);
}

/**
 * Call once at startup, after the first map loaded. Until the player has opened the guide once, the guide calls out
 * to them (a bubble now and then) and a "?" help button on the HUD opens the guide from anywhere.
 */
export function initGuide(ctx: PanelCtx, addTopControl: (el: HTMLElement) => void): void {
  injectStyle();

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'cg-guide-help';
  btn.textContent = '❓ Help';
  btn.setAttribute('aria-label', 'Help: talk to Chicory, the guide');
  btn.addEventListener('click', () => openGuide(ctx));
  helpButton = btn;
  addTopControl(btn);

  if (readSeen()) return;

  btn.classList.add('pulse');
  const callOut = (): void => {
    ctx.npcSay(NPC_ID, CALL_OUTS[callIndex % CALL_OUTS.length]);
    callIndex += 1;
  };
  callOut();
  callTimer = setInterval(callOut, CALL_OUT_EVERY_MS);
}
