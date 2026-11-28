// The sermon hold (E17 issue J5): stand on one leg in Wader's Rest's ritual circle while Mother Saxifrage's sermon
// scrolls by. Press and hold HOLD (or Space). Let go early and you have had a thought; hold to the end and it is
// stood. DOM only, appended to `ui`. Nothing touches `document` or `window` at import time.
import type { SocietyDeps, SocietyPart } from '../config';
import { SOCIETY_EVENTS, WADERS_REST } from '../config';
import { updateSocietySave } from '../save';
import { addInteractSpot } from '../../interactables';
import { playAt } from '../../sound/bus';

const LINE_SECONDS = 2.5;
const WOBBLE_MS = 1500;
const STOOD_MS = 1200;
const TICK_MS = 50;

/** The day sermon: 8 lines, about 20 s. */
export const SERMON_DAY: readonly string[] = [
  'Good friends. Gather in. Find your one leg.',
  'Both legs are for walking, and today we are not walking.',
  'Lift the leg you trust least. Yes, that one. It has been waiting.',
  'Pink is for the Lady alone. So the washing is grey. So it is stood.',
  'Nobody turns their back on the Lady to eat. Eat sideways, like a gnome of sense.',
  'A gnome who wobbles has had a thought. A thought is owed one cup of reed tea.',
  'Breathe through the beak. Yes, we have beaks now. It is a new rule.',
  'Let us stand, and be still, and be one-legged together. So it is stood.',
];

/** The night sermon: 12 lines, about 30 s, ending with the prophecy. */
export const SERMON_NIGHT: readonly string[] = [
  'Friends, the night is long, so the sermon is long too.',
  'Gather in close to the Lady\'s shadow. Find your one leg. Hold it dear.',
  'Both legs are for walking, and tonight nobody is walking anywhere.',
  'No sitting on Tuesdays. Tonight is not a Tuesday, so the bench is also not sat on. Quite right.',
  'Pink is for the Lady alone. The washing is grey. The grey is a kind of faith.',
  'Nobody turns their back on the Lady to eat. Eat sideways, like a gnome of sense.',
  'The reed tea is poured by Sister Sedge. The wobbler owes a cup. The cup is owed. So it is stood.',
  'Brother Godwit has wobbled again. Brother Godwit is forgiven again. He will owe tea until the end of days.',
  'Novice Pipit is still learning which leg. Be patient with Pipit. We were all strangers to our own left leg once.',
  'The loch is quiet. The sky is long. Breathe in the long slow night and find your balance in it.',
  'The Lady does not blink. We need not either, if we are careful.',
  'And on the longest day comes the Even Cut. I do not know why I know it. So it is stood.',
];

/** Seconds a sermon takes: about 2.5 s per line. */
export function sermonLength(night: boolean): number {
  return (night ? SERMON_NIGHT : SERMON_DAY).length * LINE_SECONDS;
}

/** The line showing `elapsed` seconds into a sermon of `total` seconds; clamped to the first and last line. */
export function sermonLine(lines: readonly string[], elapsed: number, total: number): string {
  if (lines.length === 0) return '';
  if (!(total > 0)) return lines[lines.length - 1];
  const per = total / lines.length;
  const i = Math.floor(Math.max(0, elapsed) / per);
  return lines[Math.min(lines.length - 1, i)];
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  css: Partial<CSSStyleDeclaration>,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  Object.assign(node.style, css);
  if (text !== undefined) node.textContent = text;
  return node;
}

export function installSermon(deps: SocietyDeps): SocietyPart {
  let overlay: HTMLElement | null = null;

  const isNight = (): boolean => {
    const label = deps.timeLabel();
    return label === 'Dusk' || label === 'Neon Night';
  };

  const openOverlay = (): void => {
    if (typeof document === 'undefined') return;
    const night = isNight();
    const lines = night ? SERMON_NIGHT : SERMON_DAY;
    const total = sermonLength(night);

    let holding = false;
    let finished = false;
    let holdStart = 0;
    let tick: ReturnType<typeof setInterval> | null = null;
    let closeTimer: ReturnType<typeof setTimeout> | null = null;

    const root = el('div', {
      position: 'fixed',
      inset: '0',
      zIndex: '60',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)',
      boxSizing: 'border-box',
      padding: 'calc(env(safe-area-inset-top) + 12px) calc(env(safe-area-inset-right) + 12px) calc(env(safe-area-inset-bottom) + 12px) calc(env(safe-area-inset-left) + 12px)',
      pointerEvents: 'auto',
    });
    root.id = 'gta-sermon';

    const panel = el('div', {
      position: 'relative',
      width: '100%',
      maxWidth: '440px',
      maxHeight: '100%',
      overflowY: 'auto',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '10px',
      padding: '14px',
      background: '#1d2a20',
      border: '2px solid rgba(255,255,255,0.28)',
      borderRadius: '18px',
      color: '#fff',
      fontFamily: 'system-ui, sans-serif',
      textAlign: 'center',
      boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
    });
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Stand on one leg');

    const title = el('div', { fontWeight: '800', fontSize: '17px' }, 'Stand on one leg');

    const lineEl = el('div', {
      minHeight: '4.2em',
      fontSize: '20px',
      fontWeight: '600',
      lineHeight: '1.35',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }, 'Press and hold to stand.');

    const barOuter = el('div', {
      width: '100%',
      height: '12px',
      boxSizing: 'border-box',
      background: 'rgba(255,255,255,0.15)',
      borderRadius: '6px',
      overflow: 'hidden',
    });
    const barFill = el('div', {
      width: '0%',
      height: '100%',
      background: '#8fd18f',
    });
    barOuter.appendChild(barFill);

    const hold = el('button', {
      width: '104px',
      height: '104px',
      minWidth: '88px',
      minHeight: '88px',
      borderRadius: '50%',
      border: '3px solid rgba(255,255,255,0.5)',
      background: '#3f7a4a',
      color: '#fff',
      font: '800 22px system-ui, sans-serif',
      touchAction: 'none',
      userSelect: 'none',
      webkitUserSelect: 'none',
      cursor: 'pointer',
      flex: '0 0 auto',
    }, 'HOLD');
    hold.type = 'button';
    hold.setAttribute('aria-label', 'Hold to stand on one leg');

    const hint = el('div', { fontSize: '13px', color: 'rgba(255,255,255,0.8)', minHeight: '2.4em' },
      'Let go early and you wobble.');

    const stepOut = el('button', {
      minWidth: '44px',
      minHeight: '44px',
      padding: '0 18px',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.3)',
      background: '#2a323a',
      color: '#fff',
      font: '700 15px system-ui, sans-serif',
      cursor: 'pointer',
      touchAction: 'manipulation',
    }, 'Step out');
    stepOut.type = 'button';

    panel.append(title, lineEl, barOuter, hold, hint, stepOut);
    root.appendChild(panel);

    const stopTick = (): void => {
      if (tick !== null) clearInterval(tick);
      tick = null;
    };

    const teardown = (): void => {
      stopTick();
      if (closeTimer !== null) clearTimeout(closeTimer);
      closeTimer = null;
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      root.remove();
      if (overlay === root) overlay = null;
    };

    const elapsed = (): number => (holding ? (Date.now() - holdStart) / 1000 : 0);

    const showProgress = (t: number): void => {
      barFill.style.width = `${(Math.min(1, t / total) * 100).toFixed(2)}%`;
      lineEl.textContent = sermonLine(lines, t, total);
    };

    const endWithMessage = (text: string, ms: number, after?: () => void): void => {
      finished = true;
      holding = false;
      stopTick();
      hold.disabled = true;
      hint.textContent = text;
      lineEl.textContent = text;
      closeTimer = setTimeout(() => {
        closeTimer = null;
        teardown();
        after?.();
      }, ms);
    };

    const wobble = (): void => {
      if (finished) return;
      endWithMessage(
        'You wobbled. You have had a thought. Sister Sedge pours you a cup of reed tea.',
        WOBBLE_MS,
      );
    };

    const complete = (): void => {
      if (finished) return;
      // Counted at once, so the stood sermon is kept even if the overlay is cut short.
      updateSocietySave((s) => { s.sermonsStood++; });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(SOCIETY_EVENTS.sermon, { detail: { long: night } }));
      }
      playAt('flock-hum', WADERS_REST.circle);
      showProgress(total);
      endWithMessage('So it is stood.', STOOD_MS);
    };

    const startHold = (): void => {
      if (finished || holding) return;
      holding = true;
      holdStart = Date.now();
      hint.textContent = 'Keep still. Let go early and you wobble.';
      stopTick();
      tick = setInterval(() => {
        const t = elapsed();
        if (t >= total) {
          showProgress(total);
          complete();
          return;
        }
        showProgress(t);
      }, TICK_MS);
      showProgress(0);
    };

    const endHold = (): void => {
      if (finished || !holding) return;
      const t = elapsed();
      if (t >= total) {
        complete();
        return;
      }
      wobble();
    };

    const quit = (): void => {
      if (finished) return;
      finished = true;
      holding = false;
      teardown();
    };

    function onKeyDown(e: KeyboardEvent): void {
      if (e.code === 'Escape') {
        e.preventDefault();
        quit();
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        if (!e.repeat) startHold();
      }
    }

    function onKeyUp(e: KeyboardEvent): void {
      if (e.code === 'Space') {
        e.preventDefault();
        endHold();
      }
    }

    hold.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      startHold();
    });
    hold.addEventListener('pointerup', (e) => { e.preventDefault(); endHold(); });
    hold.addEventListener('pointercancel', () => endHold());
    hold.addEventListener('pointerleave', () => endHold());
    hold.addEventListener('contextmenu', (e) => e.preventDefault());
    stepOut.addEventListener('click', (e) => {
      e.stopPropagation();
      quit();
    });
    // Keep the overlay from passing taps through to the game underneath.
    root.addEventListener('pointerdown', (e) => e.stopPropagation());

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    overlay = root;
    deps.ui.appendChild(root);
  };

  addInteractSpot({
    x: WADERS_REST.circle.x,
    z: WADERS_REST.circle.z,
    prompt: 'Stand for the sermon',
    run(_player, spotDeps) {
      const blockedBy = deps.blocked();
      if (blockedBy) {
        spotDeps.hud.toast(blockedBy);
        return true;
      }
      if (overlay) return true;
      openOverlay();
      return true;
    },
  });

  return {
    isOpen: () => overlay !== null,
  };
}
