import { prefabIconElement } from '@lawn/prefabs';
import type { AchievementDef } from './types';

const STYLE_ID = 'la-toast-style';
const CONTAINER_ID = 'la-toast-stack';

const CSS = `
#${CONTAINER_ID} {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
  max-width: 320px;
}
.la-toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(18, 28, 20, 0.92);
  border: 2px solid #ffd54f;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);
  color: #fff;
  font-family: system-ui, -apple-system, sans-serif;
  transform: translateX(24px);
  opacity: 0;
  transition: transform 220ms ease-out, opacity 220ms ease-out;
}
.la-toast.show {
  transform: translateX(0);
  opacity: 1;
}
.la-toast-icon {
  flex: 0 0 40px;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: rgba(255, 213, 79, 0.14);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}
.la-toast-body {
  min-width: 0;
}
.la-toast-kicker {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #ffd54f;
}
.la-toast-title {
  font-size: 14px;
  font-weight: 700;
  margin-top: 1px;
}
.la-toast-desc {
  font-size: 12px;
  color: #d6e4d6;
  margin-top: 2px;
}
.la-toast-reward {
  font-size: 11px;
  color: #9be7a8;
  margin-top: 3px;
}
.la-toast-rare {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #ffd54f;
  margin-top: 3px;
}
`;

function ensureContainer(ui: HTMLElement): HTMLElement {
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
  }
  let stack = document.getElementById(CONTAINER_ID);
  if (!stack) {
    stack = document.createElement('div');
    stack.id = CONTAINER_ID;
    ui.appendChild(stack);
  }
  return stack;
}

export function showAchievementToast(ui: HTMLElement, def: AchievementDef, durationMs = 4500): void {
  const stack = ensureContainer(ui);

  const toast = document.createElement('div');
  toast.className = 'la-toast';

  const iconWrap = document.createElement('div');
  iconWrap.className = 'la-toast-icon';
  if (def.reward) {
    iconWrap.append(prefabIconElement(def.reward.prefabId, '🏆', 36));
  } else {
    iconWrap.textContent = def.emote?.icon ?? '🏆';
  }

  const body = document.createElement('div');
  body.className = 'la-toast-body';

  const kicker = document.createElement('div');
  kicker.className = 'la-toast-kicker';
  kicker.textContent = 'Achievement Unlocked';

  const title = document.createElement('div');
  title.className = 'la-toast-title';
  title.textContent = def.title;

  const desc = document.createElement('div');
  desc.className = 'la-toast-desc';
  desc.textContent = def.description;

  body.append(kicker, title, desc);

  if (def.reward) {
    if (def.reward.exclusive === true) {
      const rare = document.createElement('div');
      rare.className = 'la-toast-rare';
      rare.textContent = 'RARE gear unlocked';
      body.append(rare);
    }
    const reward = document.createElement('div');
    reward.className = 'la-toast-reward';
    reward.textContent = `Unlocked in Gnome Creator: ${def.reward.label}`;
    body.append(reward);
  }
  if (def.emote) {
    const emote = document.createElement('div');
    emote.className = 'la-toast-reward';
    emote.textContent = `New emote: ${def.emote.label} (equip it in Gnome Creator)`;
    body.append(emote);
  }

  toast.append(iconWrap, body);
  stack.append(toast);

  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 260);
  }, durationMs);
}
