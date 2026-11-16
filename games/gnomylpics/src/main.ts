// Gnomylpics is party-only: it has no game of its own, only Gnome Party slices (src/minigames/).
// It is not on the landing page (package.json "lawn": { "partyOnly": true }). This page is the dev harness:
// #minigame=<id> plays one event against 3 CPUs; anything else lists the events.
import { minigames } from './minigames';

if (/[#&]minigame\b/.test(location.hash)) {
  (await import('./minigames/play')).playOwnSlice();
} else {
  const box = document.createElement('div');
  box.id = 'events';
  box.style.cssText = 'position:absolute;inset:0;overflow:auto;padding:24px;pointer-events:auto;background:#1b5e20';
  box.innerHTML =
    '<h1 style="margin:0 0 4px">Gnomylpics</h1><p style="margin:0 0 16px;opacity:.8">Party-only: these events play inside Gnome Party. Pick one to practise against 3 CPUs.</p>';
  for (const m of minigames) {
    const a = document.createElement('a');
    a.href = `#minigame=${m.meta.id}`;
    a.style.cssText = 'display:block;margin:8px 0;padding:12px 16px;border-radius:10px;background:#2e7d32;color:#fff;text-decoration:none';
    a.innerHTML = `<b>${m.meta.title}</b><br><small>${m.meta.goal} ${m.meta.controls}</small>`;
    a.onclick = () => setTimeout(() => location.reload(), 0);
    box.appendChild(a);
  }
  document.getElementById('ui')!.appendChild(box);
}
