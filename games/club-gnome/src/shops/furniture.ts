// The furniture shop on Acorn Row (Hazel Dovetail's): not open yet. Peeking in shows what is coming.
import { openPanel, type PanelCtx } from '../panel';

export function openFurnitureWindow(ctx: PanelCtx): void {
  const p = openPanel(ctx.ui, {
    title: 'Dovetail Furniture: coming soon',
    subtitle: 'Hazel Dovetail is still sanding the shelves.',
  });
  const text = document.createElement('p');
  text.style.cssText = 'margin:0 0 12px;font-size:15px;line-height:1.4;';
  text.textContent = 'Soon you will spend acorns here on furniture for your own gnome hut. Save them up!';
  const ok = document.createElement('button');
  ok.type = 'button';
  ok.className = 'cgp-btn';
  ok.textContent = 'Can’t wait';
  ok.addEventListener('click', () => p.close());
  p.body.append(text, ok);
  ctx.npcSay('hazel-dovetail', 'Not open yet! Mind the sawdust.');
}
