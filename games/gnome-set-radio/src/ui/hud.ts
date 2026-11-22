import { createVolumeButton, type VolumeStore } from '@arcade/volume';
import type { LevelSession } from '../game/events';
import type { GsrLevelDoc } from '../levels/schema';
import type { SkaterState } from '../sim/skater';
import type { GraffitiDesign } from '../view/graffiti';
import { createTalkingHead } from './talkingHead';

export interface CompassTarget {
  label: string;
  kind: 'story' | 'boss' | 'side';
  dist: number;
  arrow: string;
}

export interface HudHandle {
  update(
    doc: GsrLevelDoc,
    s: SkaterState,
    session: LevelSession,
    promptText: string | null,
    tags: readonly GraffitiDesign[],
    selectedTagIdx: number,
    compass?: CompassTarget | null,
    beatPulse?: number,
  ): void;
  slamTrick(name: string, mult: number, onBeat?: boolean): void;
  slamBank(points: number): void;
  setVisible(v: boolean): void;
  setPaused(v: boolean): void;
  setNetLabel(text: string): void;
}

function buildHudCss(): string {
  return `
#gsr-hud{position:fixed;inset:0;pointer-events:none;display:none;overflow:hidden;font-family:"Arial Black",Impact,system-ui,sans-serif;color:#fff;padding:env(safe-area-inset-top,10px) env(safe-area-inset-right,10px) env(safe-area-inset-bottom,10px) env(safe-area-inset-left,10px)}
#gsr-hud *{box-sizing:border-box}
#gsr-hud .gr{font-family:"Arial Black",Impact,system-ui,sans-serif;font-weight:900;font-style:italic;text-transform:uppercase;transform:skewX(-10deg);display:inline-block;line-height:1}
#gsr-hud .gsr-top{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap}
#gsr-hud .gsr-scorebox{background:rgba(18,8,34,0.82);border:2px solid #00e5ff;border-radius:10px;padding:8px 12px;min-width:170px;box-shadow:4px 4px 0 #ff4ecd;transition:transform .12s ease}
#gsr-hud .gsr-scoretop{display:flex;align-items:center;justify-content:space-between;gap:8px}
#gsr-hud .gsr-beatdot{width:10px;height:10px;border-radius:50%;background:#00e5ff;box-shadow:0 0 8px #00e5ff;flex:0 0 10px}
#gsr-hud .gsr-scoren{font-size:clamp(18px,3vw,26px);text-shadow:2px 2px 0 #120624,4px 4px 0 #ff4ecd}
#gsr-hud .gsr-btns{display:flex;gap:6px;align-items:center;pointer-events:auto;flex-wrap:wrap}
#gsr-hud .gsr-btn{min-height:44px;min-width:44px;padding:6px 11px;border-radius:10px;background:rgba(18,8,34,0.88);color:#fff;font-weight:800;font-size:12px;cursor:pointer;font-family:system-ui,sans-serif}
#gsr-hud .gsr-obj{position:absolute;right:12px;top:72px;max-width:min(250px,46vw);background:rgba(18,8,34,0.8);border:1px solid #ff4ecd;border-radius:10px;padding:8px 10px;font-size:11px;line-height:1.35;font-family:system-ui,sans-serif;pointer-events:auto}
#gsr-hud .gsr-obj-head{display:flex;justify-content:space-between;align-items:center;gap:6px;font-weight:900;color:#ffd740;margin-bottom:3px;cursor:pointer}
#gsr-hud .gsr-bossbar{position:fixed;left:50%;top:52px;transform:translateX(-50%);background:rgba(18,8,34,0.92);border:2px solid #ff5252;border-radius:10px;padding:6px 14px;display:none;flex-direction:column;align-items:center;gap:4px;min-width:220px;box-shadow:0 6px 20px rgba(0,0,0,0.6)}
#gsr-hud .gsr-bossname{font-size:11px;font-weight:900;color:#ff5252;letter-spacing:0.8px;font-family:system-ui,sans-serif}
#gsr-hud .gsr-bosspips{display:flex;gap:6px;width:100%}
#gsr-hud .gsr-bosspip{flex:1;height:8px;border-radius:4px;background:#ff5252;box-shadow:0 0 8px #ff5252}
#gsr-hud .gsr-bosspip.hit{background:rgba(255,255,255,0.14);box-shadow:none}
#gsr-hud .gsr-onbeat{display:inline-block;margin-left:6px;padding:2px 8px;border-radius:6px;background:#ffd740;color:#120624;font-size:12px;font-weight:900}
#gsr-hud .gsr-combo{position:fixed;left:50%;top:22%;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center}
#gsr-hud .gsr-pts{font-size:clamp(28px,4.5vw,48px);color:#ffd740;text-shadow:3px 3px 0 #120624,6px 6px 0 #ff4ecd}
#gsr-hud .gsr-link{width:190px;height:7px;background:rgba(18,8,34,0.7);border:2px solid #120624;transform:skewX(-10deg);overflow:hidden}
#gsr-hud .gsr-linkfill{height:100%;width:0;background:linear-gradient(90deg,#00e5ff,#ff4ecd)}
#gsr-hud .gsr-badges{display:flex;gap:6px}
#gsr-hud .gsr-badge{font-size:13px;padding:2px 8px;background:#120624;border:1px solid #00e5ff;color:#69f0ae}
#gsr-hud .gsr-slamwrap{position:fixed;left:0;right:0;top:11%;text-align:center;pointer-events:none}
#gsr-hud .gsr-slam{font-size:clamp(34px,6.5vw,76px);color:#fff;text-shadow:3px 3px 0 #120624,6px 6px 0 #ff4ecd;animation:gsr-slam 1.05s linear forwards}
#gsr-hud .gsr-hype{font-size:clamp(16px,2.5vw,26px);color:#ffd740;text-shadow:2px 2px 0 #120624}
#gsr-hud .gsr-bankwrap{position:fixed;left:0;right:0;top:46%;transform:translateY(-50%);text-align:center;animation:gsr-fade 1.5s linear forwards}
#gsr-hud .gsr-bankbig{font-size:clamp(46px,9vw,108px);color:#ffd740;text-shadow:4px 4px 0 #120624,8px 8px 0 #00e5ff;animation:gsr-pop .4s ease-out both}
#gsr-hud .gsr-speed{position:fixed;right:14px;bottom:14px;width:min(190px,42vw);text-align:right}
#gsr-hud .gsr-kmh{font-size:clamp(30px,5vw,52px);text-shadow:3px 3px 0 #120624,5px 5px 0 #ff4ecd}
#gsr-hud .gsr-meter{height:12px;background:rgba(18,8,34,0.72);border:2px solid #120624;transform:skewX(-10deg);overflow:hidden}
#gsr-hud .gsr-meter>div{height:100%;width:0;transition:width 60ms linear}
#gsr-hud .gsr-flow{position:fixed;left:14px;bottom:14px;width:min(210px,44vw)}
#gsr-hud .gsr-flow.boost .gsr-meter{animation:gsr-glow .45s ease-in-out infinite alternate}
#gsr-hud .gsr-tags{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);display:flex;gap:6px;pointer-events:auto}
#gsr-hud .gsr-tagbtn{min-height:44px;min-width:44px;padding:4px 10px;border-radius:10px;border:2px solid #554275;background:rgba(18,8,34,0.85);color:#fff;font-family:system-ui,sans-serif;font-weight:900;font-size:11px;cursor:pointer;display:inline-flex;align-items:center;gap:6px}
#gsr-hud .gsr-tagdot{width:10px;height:10px;border-radius:50%;flex:0 0 10px}
#gsr-hud .gsr-tagbtn.on{border-color:#ffd740;box-shadow:0 0 12px rgba(255,215,64,0.65);transform:translateY(-2px)}
#gsr-hud .gsr-compass{position:fixed;left:50%;top:12px;transform:translateX(-50%) skewX(-10deg);background:rgba(18,8,34,0.88);border:2px solid #00e5ff;border-radius:999px;padding:5px 14px;font-size:12px;font-weight:900;letter-spacing:0.5px;box-shadow:0 6px 18px rgba(0,0,0,0.5);white-space:nowrap;font-family:system-ui,sans-serif;display:none}
#gsr-pause{position:fixed;inset:0;z-index:40;display:none;align-items:center;justify-content:center;background:rgba(10,4,22,0.82);pointer-events:auto;padding:16px;font-family:system-ui,sans-serif}
#gsr-pause .gsr-pcard{width:min(360px,92vw);background:#180b2e;border:3px solid #00e5ff;border-radius:16px;padding:18px;color:#fff;display:flex;flex-direction:column;gap:10px;box-shadow:0 20px 60px rgba(0,0,0,0.8)}
#gsr-pause .gsr-pbtn{min-height:44px;border-radius:10px;border:2px solid #554275;background:#241145;color:#fff;font-weight:900;font-size:14px;cursor:pointer}
@media (max-width:640px){
  #gsr-hud .gsr-speed{display:none}
  #gsr-hud .gsr-flow{left:50%;bottom:66px;transform:translateX(-50%);width:min(190px,54vw)}
  #gsr-hud .gsr-tags{bottom:10px}
  #gsr-hud .gsr-obj{top:114px;font-size:10px;max-width:min(200px,48vw)}
  #gsr-hud .gsr-compass{top:58px;font-size:11px}
  #gsr-hud .gsr-bossbar{top:92px;min-width:180px}
}
@keyframes gsr-slam{0%{opacity:0;transform:skewX(-10deg) rotate(var(--tilt)) scale(1.55)}12%{opacity:1;transform:skewX(-10deg) rotate(var(--tilt)) scale(1)}68%{opacity:1;transform:skewX(-10deg) rotate(var(--tilt)) scale(1)}100%{opacity:0;transform:skewX(-10deg) rotate(var(--tilt)) scale(1)}}
@keyframes gsr-pop{0%{opacity:0;transform:skewX(-10deg) scale(.4)}60%{opacity:1;transform:skewX(-10deg) scale(1.16)}100%{opacity:1;transform:skewX(-10deg) scale(1)}}
@keyframes gsr-fade{0%,76%{opacity:1}100%{opacity:0}}
@keyframes gsr-glow{from{box-shadow:0 0 6px #00e5ff}to{box-shadow:0 0 22px #ff4ecd}}
`;
}

const HYPE_WORDS = ['NICE!', 'SICK!', 'RADICAL!', 'GNARLY!', 'UNREAL!', 'BROADCAST GOD!'];

export function createHud(
  container: HTMLElement,
  opts: {
    volume: VolumeStore;
    onOpenMusic: () => void;
    onOpenRoom?: () => void;
    onOpenAreas: () => void;
    onOpenHelper: () => void;
    onSelectTag: (idx: number) => void;
    onTogglePause: () => void;
    onRestart: () => void;
    onUnstuck: () => void;
  },
): HudHandle {
  if (!document.getElementById('gsr-hud-style')) {
    const style = document.createElement('style');
    style.id = 'gsr-hud-style';
    style.textContent = buildHudCss();
    document.head.appendChild(style);
  }

  const hud = document.createElement('div');
  hud.id = 'gsr-hud';

  const top = document.createElement('div');
  top.className = 'gsr-top';
  hud.appendChild(top);

  const scoreBox = document.createElement('div');
  scoreBox.className = 'gsr-scorebox';
  const scoreTop = document.createElement('div');
  scoreTop.className = 'gsr-scoretop';
  const areaLabelEl = document.createElement('div');
  areaLabelEl.style.cssText = 'font-size:10px; font-weight:800; font-family:system-ui,sans-serif;';
  const beatDot = document.createElement('div');
  beatDot.className = 'gsr-beatdot';
  scoreTop.append(areaLabelEl, beatDot);
  const scoreNumEl = document.createElement('div');
  scoreNumEl.className = 'gr gsr-scoren';
  scoreNumEl.textContent = '0 PTS';
  scoreBox.append(scoreTop, scoreNumEl);
  top.appendChild(scoreBox);

  const btnRow = document.createElement('div');
  btnRow.className = 'gsr-btns';
  const mkBtn = (text: string, border: string, onClick: () => void) => {
    const b = document.createElement('button');
    b.className = 'gsr-btn';
    b.textContent = text;
    b.style.border = `2px solid ${border}`;
    b.onclick = onClick;
    return b;
  };
  const netBtn = mkBtn('🌐 Online', '#69f0ae', () => opts.onOpenRoom?.());
  btnRow.appendChild(netBtn);
  btnRow.appendChild(mkBtn('🎵 Music', '#00e5ff', opts.onOpenMusic));
  btnRow.appendChild(mkBtn('💡 Helper', '#69f0ae', opts.onOpenHelper));
  btnRow.appendChild(mkBtn('🗺️ Areas', '#ff4ecd', opts.onOpenAreas));
  btnRow.appendChild(mkBtn('⏸', '#ffd740', opts.onTogglePause));
  const vol = createVolumeButton(btnRow, opts.volume);
  vol.element.style.pointerEvents = 'auto';
  top.appendChild(btnRow);

  const objBox = document.createElement('div');
  objBox.className = 'gsr-obj';
  let objCollapsed = false;
  const objHead = document.createElement('div');
  objHead.className = 'gsr-obj-head';
  objHead.innerHTML = '<span>EVENTS (ANY ORDER)</span><span id="gsr-obj-chev">▾</span>';
  const objList = document.createElement('div');
  objHead.onclick = () => {
    objCollapsed = !objCollapsed;
    objList.style.display = objCollapsed ? 'none' : 'block';
    const chev = objHead.querySelector('#gsr-obj-chev');
    if (chev) chev.textContent = objCollapsed ? '▸' : '▾';
  };
  objBox.append(objHead, objList);
  hud.appendChild(objBox);

  const bossBar = document.createElement('div');
  bossBar.className = 'gsr-bossbar';
  bossBar.id = 'gsr-boss-bar';
  const bossNameEl = document.createElement('div');
  bossNameEl.className = 'gsr-bossname';
  const bossPipsEl = document.createElement('div');
  bossPipsEl.className = 'gsr-bosspips';
  bossBar.append(bossNameEl, bossPipsEl);
  hud.appendChild(bossBar);

  const comboBox = document.createElement('div');
  comboBox.className = 'gsr-combo';
  comboBox.style.display = 'none';
  const comboPts = document.createElement('div');
  comboPts.className = 'gr gsr-pts';
  const comboLink = document.createElement('div');
  comboLink.className = 'gsr-link';
  const comboLinkFill = document.createElement('div');
  comboLinkFill.className = 'gsr-linkfill';
  comboLink.appendChild(comboLinkFill);
  const comboBadges = document.createElement('div');
  comboBadges.className = 'gsr-badges';
  comboBox.append(comboPts, comboLink, comboBadges);
  hud.appendChild(comboBox);

  const slamLayer = document.createElement('div');
  hud.appendChild(slamLayer);

  const speedBox = document.createElement('div');
  speedBox.className = 'gsr-speed';
  const kmhEl = document.createElement('div');
  kmhEl.className = 'gr gsr-kmh';
  kmhEl.textContent = '0';
  const kmhUnit = document.createElement('div');
  kmhUnit.className = 'gr';
  kmhUnit.style.cssText = 'font-size:13px; color:#00e5ff; margin-left:4px;';
  kmhUnit.textContent = 'KM/H';
  const speedMeter = document.createElement('div');
  speedMeter.className = 'gsr-meter';
  const speedFill = document.createElement('div');
  speedFill.style.background = 'linear-gradient(90deg,#00e5ff,#69f0ae)';
  speedMeter.appendChild(speedFill);
  speedBox.append(kmhEl, kmhUnit, speedMeter);
  hud.appendChild(speedBox);

  const flowBox = document.createElement('div');
  flowBox.className = 'gsr-flow';
  const flowLabel = document.createElement('div');
  flowLabel.className = 'gr';
  flowLabel.style.cssText = 'font-size:14px; color:#69f0ae; margin-bottom:2px;';
  flowLabel.textContent = 'AETHER BOOST';
  const flowMeter = document.createElement('div');
  flowMeter.className = 'gsr-meter';
  const flowFill = document.createElement('div');
  flowFill.style.background = 'linear-gradient(90deg,#00e5ff,#ff4ecd 55%,#ffd740)';
  flowMeter.appendChild(flowFill);
  flowBox.append(flowLabel, flowMeter);
  hud.appendChild(flowBox);

  const tagBar = document.createElement('div');
  tagBar.className = 'gsr-tags';
  hud.appendChild(tagBar);

  const compassEl = document.createElement('div');
  compassEl.className = 'gsr-compass';
  hud.appendChild(compassEl);

  const banner = document.createElement('div');
  banner.style.cssText = `
    position:absolute; left:50%; bottom:126px; transform:translateX(-50%);
    max-width:min(520px, 90vw); background:rgba(20,8,40,0.94); border:2px solid #ffd740;
    border-radius:14px; padding:8px 12px; color:#fff; font-size:13px;
    font-family:system-ui,sans-serif; box-shadow:6px 6px 0 #ff4ecd;
    display:none; align-items:center; gap:10px;
  `;
  const bannerHead = createTalkingHead(60);
  const bannerBody = document.createElement('div');
  bannerBody.style.cssText = 'flex:1; min-width:0; line-height:1.35;';
  banner.append(bannerHead.element, bannerBody);
  hud.appendChild(banner);

  const prompt = document.createElement('div');
  prompt.style.cssText = `
    position:absolute; left:50%; bottom:82px; transform:translateX(-50%);
    background:rgba(0,229,255,0.94); color:#120624; font-weight:900; font-size:13px;
    font-family:system-ui,sans-serif; padding:6px 14px; border-radius:999px; display:none;
  `;
  hud.appendChild(prompt);

  container.appendChild(hud);

  const pauseModal = document.createElement('div');
  pauseModal.id = 'gsr-pause';
  pauseModal.innerHTML = `
    <div class="gsr-pcard">
      <div style="font-size:11px;font-weight:900;color:#00e5ff;letter-spacing:1px;">BROADCAST PAUSED</div>
      <div style="font-size:22px;font-weight:900;color:#ffd740;">GNOM SET RADIO</div>
      <button class="gsr-pbtn" id="gsr-p-resume" style="background:#00e5ff;color:#120624;border:none;">▶ Resume</button>
      <button class="gsr-pbtn" id="gsr-p-restart" style="border-color:#69f0ae;">↻ Restart Area</button>
      <button class="gsr-pbtn" id="gsr-p-unstuck" style="border-color:#ffd740;">↩ Unstuck to Spawn</button>
      <button class="gsr-pbtn" id="gsr-p-music" style="border-color:#00e5ff;">🎵 Music Explorer</button>
      <button class="gsr-pbtn" id="gsr-p-areas" style="border-color:#ff4ecd;">🗺️ Area Select</button>
    </div>
  `;
  container.appendChild(pauseModal);
  pauseModal.querySelector('#gsr-p-resume')?.addEventListener('click', opts.onTogglePause);
  pauseModal.querySelector('#gsr-p-restart')?.addEventListener('click', () => {
    pauseModal.style.display = 'none';
    opts.onRestart();
  });
  pauseModal.querySelector('#gsr-p-unstuck')?.addEventListener('click', () => {
    opts.onTogglePause();
    opts.onUnstuck();
  });
  pauseModal.querySelector('#gsr-p-music')?.addEventListener('click', () => {
    opts.onTogglePause();
    opts.onOpenMusic();
  });
  pauseModal.querySelector('#gsr-p-areas')?.addEventListener('click', () => {
    pauseModal.style.display = 'none';
    opts.onOpenAreas();
  });

  let lastTagKey = '';
  let lastAreaKey = '';
  let lastObjHtml = '';
  let lastCompassHtml = '';
  let lastBannerHtml = '';
  let lastPrompt = '';
  let lastBossKey = '';
  let displayedScore = 0;

  return {
    setVisible(v) {
      hud.style.display = v ? 'block' : 'none';
    },
    setPaused(v) {
      pauseModal.style.display = v ? 'flex' : 'none';
    },
    setNetLabel(text) {
      netBtn.textContent = text;
    },
    slamTrick(name, mult, onBeat = false) {
      slamLayer.querySelectorAll('.gsr-slamwrap').forEach((n) => n.remove());
      const wrap = document.createElement('div');
      wrap.className = 'gsr-slamwrap';
      const hype = HYPE_WORDS[Math.min(HYPE_WORDS.length - 1, Math.max(0, mult - 1))]!;
      const el = document.createElement('div');
      el.className = 'gr gsr-slam';
      el.style.setProperty('--tilt', `${(Math.random() * 14 - 7).toFixed(1)}deg`);
      const beatBadge = onBeat ? '<span class="gsr-onbeat">★ ON BEAT!</span>' : '';
      el.innerHTML = `${name}! <div class="gsr-hype">${hype} ×${mult}${beatBadge}</div>`;
      wrap.appendChild(el);
      slamLayer.appendChild(wrap);
      setTimeout(() => wrap.remove(), 1100);
    },
    slamBank(points) {
      const wrap = document.createElement('div');
      wrap.className = 'gsr-bankwrap';
      const label = points >= 2000 ? 'LEGENDARY!' : points >= 900 ? 'SICK FLOW!' : 'BANKED!';
      wrap.innerHTML = `<div class="gr gsr-bankbig">+${points.toLocaleString()}</div><div class="gr gsr-hype">${label}</div>`;
      slamLayer.appendChild(wrap);
      setTimeout(() => wrap.remove(), 1550);
    },
    update(doc, s, session, promptText, tags, selectedTagIdx, compass, beatPulse = 0) {
      const compassHtml = compass
        ? `<span style="color:${compass.kind === 'boss' ? '#ff5252' : compass.kind === 'side' ? '#00e5ff' : '#ffd740'};">${compass.kind === 'boss' ? '👑' : compass.kind === 'side' ? '⭐' : '🎯'} ${compass.label}</span> · <b>${Math.round(compass.dist)}m</b> <span style="font-size:14px;color:${compass.kind === 'boss' ? '#ff5252' : compass.kind === 'side' ? '#00e5ff' : '#ffd740'};">${compass.arrow}</span>`
        : '';
      if (compassHtml !== lastCompassHtml) {
        lastCompassHtml = compassHtml;
        if (compass) {
          const col = compass.kind === 'boss' ? '#ff5252' : compass.kind === 'side' ? '#00e5ff' : '#ffd740';
          compassEl.style.display = 'block';
          compassEl.style.borderColor = col;
          compassEl.innerHTML = compassHtml;
        } else {
          compassEl.style.display = 'none';
        }
      }

      const areaKey = `${doc.id}:${doc.data.areaNumber}`;
      if (areaKey !== lastAreaKey) {
        lastAreaKey = areaKey;
        areaLabelEl.style.color = doc.data.accentColor;
        areaLabelEl.textContent = `AREA ${doc.data.areaNumber} · ${doc.name.toUpperCase()}`;
        displayedScore = s.totalScore;
      }
      if (displayedScore !== s.totalScore) {
        const diff = s.totalScore - displayedScore;
        displayedScore = Math.abs(diff) < 8 ? s.totalScore : Math.round(displayedScore + diff * 0.25);
        scoreNumEl.textContent = `${displayedScore.toLocaleString()} PTS`;
      }
      beatDot.style.transform = `scale(${(1 + beatPulse * 0.7).toFixed(2)})`;
      beatDot.style.background = beatPulse > 0.62 ? '#ffd740' : '#00e5ff';

      // Live combo stack
      if (s.comboScore > 0) {
        comboBox.style.display = 'flex';
        comboPts.textContent = `${s.comboScore} × ${s.comboMult}`;
        comboLinkFill.style.width = `${Math.min(100, Math.max(0, (s.comboTimer / 2.6) * 100))}%`;
        const badges: string[] = [];
        if (s.grinding) badges.push('<span class="gr gsr-badge">GRINDING</span>');
        if (s.wallRiding) badges.push('<span class="gr gsr-badge">WALL-RIDE</span>');
        if (!s.grounded && s.airJumpsLeft > 0) badges.push('<span class="gr gsr-badge">AIR JUMP READY</span>');
        comboBadges.innerHTML = badges.join('');
      } else {
        comboBox.style.display = 'none';
      }

      kmhEl.textContent = String(s.speedKmh);
      speedFill.style.width = `${Math.min(100, (s.speedKmh / 108) * 100)}%`;
      flowFill.style.width = `${Math.round(s.boost)}%`;
      flowBox.classList.toggle('boost', s.boosting);

      // Graffiti tag selector bar
      const tagKey = `${doc.id}:${selectedTagIdx}`;
      if (tagKey !== lastTagKey) {
        lastTagKey = tagKey;
        tagBar.replaceChildren(
          ...tags.map((t, idx) => {
            const b = document.createElement('button');
            b.className = `gsr-tagbtn${idx === selectedTagIdx ? ' on' : ''}`;
            b.style.borderColor = idx === selectedTagIdx ? '#ffd740' : t.primary;
            b.innerHTML = `<span class="gsr-tagdot" style="background:${t.primary};box-shadow:0 0 6px ${t.secondary};"></span><span>${idx + 1}. ${t.label}</span>`;
            b.onclick = () => opts.onSelectTag(idx);
            return b;
          }),
        );
      }

      const lines: string[] = [];
      let bossEvRuntime: { title: string; progress: number; targetCount: number } | null = null;
      for (const ev of session.events.values()) {
        if (ev.def.kind === 'boss') {
          bossEvRuntime = { title: ev.def.title, progress: ev.progress, targetCount: ev.def.targetCount };
          if (!session.bossUnlocked) {
            lines.push(`<div style="color:#888;">🔒 BOSS: ${ev.def.title}</div>`);
            continue;
          }
        }
        const icon = ev.completed ? '✅' : ev.def.kind === 'boss' ? '👑' : ev.def.kind === 'side' ? '⭐' : '🎯';
        const color = ev.completed ? '#69f0ae' : ev.def.kind === 'boss' ? '#ff5252' : ev.def.kind === 'side' ? '#00e5ff' : '#fff';
        lines.push(`<div style="color:${color};">${icon} ${ev.def.title} (${ev.progress}/${ev.def.targetCount})</div>`);
      }
      const objHtml = lines.join('');
      if (objHtml !== lastObjHtml) {
        lastObjHtml = objHtml;
        objList.innerHTML = objHtml;
      }

      const bossKey =
        session.bossUnlocked && !session.levelCleared && bossEvRuntime
          ? `${bossEvRuntime.title}:${bossEvRuntime.progress}/${bossEvRuntime.targetCount}`
          : '';
      if (bossKey !== lastBossKey) {
        lastBossKey = bossKey;
        if (bossKey && bossEvRuntime) {
          bossBar.style.display = 'flex';
          bossNameEl.textContent = `👑 ${bossEvRuntime.title.toUpperCase()}`;
          const rem = Math.max(0, bossEvRuntime.targetCount - bossEvRuntime.progress);
          bossPipsEl.innerHTML = Array.from({ length: bossEvRuntime.targetCount }, (_, i) =>
            `<div class="gsr-bosspip${i < rem ? '' : ' hit'}"></div>`,
          ).join('');
        } else {
          bossBar.style.display = 'none';
        }
      }

      const bannerHtml = session.activeBanner
        ? `<div style="font-weight:900;font-size:11px;color:#ffd740;letter-spacing:0.6px;">${session.activeBanner.speaker.toUpperCase()}</div><div>${session.activeBanner.text}</div>`
        : '';
      if (bannerHtml !== lastBannerHtml) {
        lastBannerHtml = bannerHtml;
        if (session.activeBanner) {
          banner.style.display = 'flex';
          bannerHead.setSpeaker(session.activeBanner.speaker);
          bannerHead.setTalking(true);
          bannerBody.innerHTML = bannerHtml;
        } else {
          banner.style.display = 'none';
          bannerHead.setTalking(false);
        }
      }
      if (session.activeBanner) {
        bannerHead.tick(1 / 60, beatPulse);
      }

      const nextPrompt = promptText ?? '';
      if (nextPrompt !== lastPrompt) {
        lastPrompt = nextPrompt;
        if (nextPrompt) {
          prompt.style.display = 'block';
          prompt.textContent = nextPrompt;
        } else {
          prompt.style.display = 'none';
        }
      }
    },
  };
}
