import { createVolumeButton, type VolumeStore } from '@arcade/volume';
import type { LevelSession } from '../game/events';
import type { GsrLevelDoc } from '../levels/schema';
import type { SkaterState } from '../sim/skater';

export interface HudHandle {
  update(doc: GsrLevelDoc, s: SkaterState, session: LevelSession, promptText: string | null): void;
  setVisible(v: boolean): void;
}

export function createHud(
  container: HTMLElement,
  opts: { volume: VolumeStore; onOpenMusic: () => void; onOpenAreas: () => void },
): HudHandle {
  const hud = document.createElement('div');
  hud.id = 'gsr-hud';
  hud.style.cssText = `
    position:fixed; inset:0; pointer-events:none; display:none;
    padding:env(safe-area-inset-top, 10px) env(safe-area-inset-right, 10px) env(safe-area-inset-bottom, 10px) env(safe-area-inset-left, 10px);
  `;

  // Top bar
  const top = document.createElement('div');
  top.style.cssText = 'display:flex; justify-content:space-between; align-items:flex-start; gap:8px; flex-wrap:wrap;';
  hud.appendChild(top);

  const scoreBox = document.createElement('div');
  scoreBox.style.cssText =
    'background:rgba(20,8,36,0.78); border:2px solid #00e5ff; border-radius:10px; padding:8px 12px; color:#fff; min-width:170px;';
  top.appendChild(scoreBox);

  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex; gap:6px; align-items:center; pointer-events:auto; flex-wrap:wrap;';
  const mkBtn = (text: string, border: string, onClick: () => void) => {
    const b = document.createElement('button');
    b.textContent = text;
    b.style.cssText = `min-height:44px; min-width:44px; padding:6px 12px; border-radius:10px; border:2px solid ${border}; background:rgba(20,8,36,0.82); color:#fff; font-weight:800; font-size:12px; cursor:pointer;`;
    b.onclick = onClick;
    return b;
  };
  btnRow.appendChild(mkBtn('🎵 Music', '#00e5ff', opts.onOpenMusic));
  btnRow.appendChild(mkBtn('🗺️ Areas', '#ff4ecd', opts.onOpenAreas));
  const vol = createVolumeButton(btnRow, opts.volume);
  vol.element.style.pointerEvents = 'auto';
  top.appendChild(btnRow);

  // Objectives panel (compact on mobile)
  const objBox = document.createElement('div');
  objBox.style.cssText = `
    position:absolute; right:12px; top:74px; max-width:255px;
    background:rgba(20,8,36,0.76); border:1px solid #ff4ecd; border-radius:10px;
    padding:8px 10px; color:#fff; font-size:11px; line-height:1.35;
  `;
  hud.appendChild(objBox);

  // Comic speech banner
  const banner = document.createElement('div');
  banner.style.cssText = `
    position:absolute; left:50%; bottom:128px; transform:translateX(-50%);
    max-width:min(480px, 88vw); background:#180b2e; border:2px solid #ffd740;
    border-radius:12px; padding:8px 14px; color:#fff; font-size:13px;
    box-shadow:0 8px 24px rgba(0,0,0,0.6); display:none; text-align:center;
  `;
  hud.appendChild(banner);

  // Context prompt
  const prompt = document.createElement('div');
  prompt.style.cssText = `
    position:absolute; left:50%; bottom:84px; transform:translateX(-50%);
    background:rgba(0,229,255,0.92); color:#120624; font-weight:900; font-size:13px;
    padding:6px 14px; border-radius:999px; display:none;
  `;
  hud.appendChild(prompt);

  container.appendChild(hud);

  return {
    setVisible(v) {
      hud.style.display = v ? 'block' : 'none';
    },
    update(doc, s, session, promptText) {
      const comboText =
        s.comboScore > 0 ? `<span style="color:#ffd740;">${s.lastTrickName || 'FLOW'} ${s.comboScore}×${s.comboMult}</span>` : '';
      scoreBox.innerHTML = `
        <div style="font-size:11px; font-weight:800; color:${doc.data.accentColor};">${doc.name.toUpperCase()}</div>
        <div style="font-size:16px; font-weight:900;">${s.totalScore.toLocaleString()} PTS ${comboText}</div>
        <div style="margin-top:4px; height:6px; background:#2c184a; border-radius:99px; overflow:hidden;">
          <div style="height:100%; width:${Math.round(s.boost)}%; background:linear-gradient(90deg,#00e5ff,#ff4ecd);"></div>
        </div>
      `;

      const lines: string[] = [];
      for (const ev of session.events.values()) {
        if (ev.def.kind === 'boss' && !session.bossUnlocked) {
          lines.push(`<div style="color:#888;">🔒 BOSS: ${ev.def.title}</div>`);
          continue;
        }
        const icon = ev.completed ? '✅' : ev.def.kind === 'boss' ? '👑' : ev.def.kind === 'side' ? '⭐' : '🎯';
        const color = ev.completed ? '#69f0ae' : ev.def.kind === 'boss' ? '#ff5252' : ev.def.kind === 'side' ? '#00e5ff' : '#fff';
        lines.push(
          `<div style="color:${color};">${icon} ${ev.def.title} (${ev.progress}/${ev.def.targetCount})</div>`,
        );
      }
      objBox.innerHTML = `<div style="font-weight:900; color:#ffd740; margin-bottom:3px;">EVENTS (ANY ORDER)</div>${lines.join('')}`;

      if (session.activeBanner) {
        banner.style.display = 'block';
        banner.innerHTML = `<strong style="color:#ffd740;">${session.activeBanner.speaker}:</strong> ${session.activeBanner.text}`;
      } else {
        banner.style.display = 'none';
      }

      if (promptText) {
        prompt.style.display = 'block';
        prompt.textContent = promptText;
      } else {
        prompt.style.display = 'none';
      }
    },
  };
}
