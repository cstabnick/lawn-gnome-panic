import { createVolumeButton } from '@arcade/volume';
import { UI } from '../config';
import { volume } from '../volume';
import { TOUCH, dock } from './layout';

const STYLE_ID = 'gg-vol-style';

function injectStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const px = TOUCH ? 38 : 26;
  const fontSize = TOUCH ? 18 : 14;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
.gg-vol-btn {
  pointer-events: auto;
  cursor: pointer;
  width: ${px}px;
  min-height: ${px}px;
  padding: 0;
  font-size: ${fontSize}px;
  line-height: 1;
  background: ${UI.panelBg};
  color: ${UI.text};
  border: 2px solid ${UI.border};
  box-sizing: border-box;
  touch-action: manipulation;
  display: flex;
  align-items: center;
  justify-content: center;
}
.gg-vol-btn:hover {
  border-color: ${UI.borderLight};
}
.gg-vol-btn .vb-label {
  display: none;
}
.gg-vol-popover {
  left: 0;
  right: auto;
}
`;
  document.head.appendChild(style);
}

/** Top-left dock button that opens the Master / Sounds / Music volume popover. */
export function createDockVolumeButton(root: HTMLElement): void {
  injectStyle();
  const control = createVolumeButton(dock(root), volume, {
    buttonClassName: 'gg-vol-btn',
    className: 'gg-vol-popover',
    title: 'Audio',
    theme: {
      accent: UI.gold,
      bg: UI.panelBgDark,
      border: UI.borderLight,
      text: UI.text,
    },
  });
  control.button.id = 'volume-btn';
  control.button.title = 'Volume (M toggles mute)';
}
