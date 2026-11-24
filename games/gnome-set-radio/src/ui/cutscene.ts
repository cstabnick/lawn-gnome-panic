import * as THREE from 'three';
import type { JinglePlayer } from '../audio/jingles';
import type { CutsceneBeat, CutsceneDef } from '../data/cutscenes';
import type { CutsceneAnchors } from '../view/gangCrew';
import { createTalkingHead } from './talkingHead';

export interface CutscenePlayer {
  play(def: CutsceneDef, anchors: CutsceneAnchors, onDone: () => void): void;
  skip(): void;
  isActive(): boolean;
  updateCamera(camera: THREE.PerspectiveCamera, dt: number, beatPulse?: number): void;
}

function buildCutsceneCss(): string {
  return `
#gsr-cutscene{position:fixed;inset:0;z-index:38;display:none;flex-direction:column;justify-content:space-between;pointer-events:auto;font-family:system-ui,-apple-system,sans-serif;color:#fff}
#gsr-cutscene *{box-sizing:border-box}
#gsr-cutscene .cs-bar-top{height:clamp(42px,8vh,68px);background:linear-gradient(180deg,rgba(10,4,20,0.96),rgba(18,8,34,0.86));border-bottom:2px solid #ff4ecd;display:flex;align-items:center;justify-content:space-between;padding:0 16px;padding-top:env(safe-area-inset-top,0px)}
#gsr-cutscene .cs-tag{font-size:11px;font-weight:900;letter-spacing:1.2px;color:#00e5ff;text-transform:uppercase}
#gsr-cutscene .cs-skip{min-height:44px;min-width:88px;padding:6px 14px;border-radius:10px;border:1px solid #ffd740;background:#241145;color:#ffd740;font-weight:800;font-size:12px;cursor:pointer}
#gsr-cutscene .cs-center{flex:1;display:flex;align-items:flex-end;justify-content:flex-start;padding:18px clamp(14px,4vw,42px);pointer-events:none}
#gsr-cutscene .cs-card{background:rgba(16,6,32,0.9);border-left:6px solid #ff4ecd;border-radius:10px;padding:12px 18px;box-shadow:8px 8px 0 rgba(0,229,255,0.65);max-width:min(460px,88vw);animation:cs-slam .38s cubic-bezier(.2,.9,.2,1) both}
#gsr-cutscene .cs-card-badge{font-size:10px;font-weight:900;letter-spacing:1px;color:#ffd740;text-transform:uppercase}
#gsr-cutscene .cs-card-name{font-family:"Arial Black",Impact,system-ui,sans-serif;font-style:italic;font-size:clamp(22px,4.5vw,36px);line-height:1.05;margin:3px 0;text-shadow:3px 3px 0 #120624}
#gsr-cutscene .cs-card-sub{font-size:12px;color:#dfd3f7}
#gsr-cutscene .cs-bar-bot{background:linear-gradient(0deg,rgba(10,4,20,0.97),rgba(18,8,34,0.9));border-top:2px solid #00e5ff;padding:12px 16px calc(12px + env(safe-area-inset-bottom,0px));display:flex;justify-content:center}
#gsr-cutscene .cs-dialog-row{width:min(820px,100%);display:flex;align-items:center;gap:14px}
#gsr-cutscene .cs-dialog{flex:1;min-width:0;display:flex;flex-direction:column;gap:8px}
#gsr-cutscene .cs-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px;flex-wrap:wrap}
#gsr-cutscene .cs-speaker{font-weight:900;font-size:clamp(14px,2.4vw,17px);color:#ffd740}
#gsr-cutscene .cs-role{font-size:11px;color:#00e5ff;font-weight:700;margin-left:8px}
#gsr-cutscene .cs-count{font-size:11px;color:#b8a5db;font-weight:700}
#gsr-cutscene .cs-text{font-size:clamp(14px,2.3vw,17px);line-height:1.4;color:#f5f0ff;min-height:44px}
#gsr-cutscene .cs-actions{display:flex;justify-content:flex-end;gap:10px}
#gsr-cutscene .cs-next{min-height:44px;min-width:130px;padding:8px 18px;border-radius:10px;border:none;background:#00e5ff;color:#120624;font-weight:900;font-size:14px;cursor:pointer}
@keyframes cs-slam{0%{opacity:0;transform:translateX(-24px) skewX(-6deg) scale(1.06)}100%{opacity:1;transform:translateX(0) skewX(-4deg) scale(1)}}
`;
}

export function createCutscenePlayer(
  container: HTMLElement,
  deps: {
    jingles: JinglePlayer;
    mutter: { say(text: string, hz?: number): void };
  },
): CutscenePlayer {
  if (!document.getElementById('gsr-cutscene-style')) {
    const style = document.createElement('style');
    style.id = 'gsr-cutscene-style';
    style.textContent = buildCutsceneCss();
    document.head.appendChild(style);
  }

  const root = document.createElement('div');
  root.id = 'gsr-cutscene';
  root.innerHTML = `
    <div class="cs-bar-top">
      <div class="cs-tag" id="gsr-cs-title">TRANSMISSION</div>
      <button class="cs-skip" id="gsr-cs-skip">SKIP ⏭</button>
    </div>
    <div class="cs-center" id="gsr-cs-center"></div>
    <div class="cs-bar-bot">
      <div class="cs-dialog-row" id="gsr-cs-row">
        <div class="cs-dialog">
          <div class="cs-head">
            <div><span class="cs-speaker" id="gsr-cs-speaker"></span><span class="cs-role" id="gsr-cs-role"></span></div>
            <span class="cs-count" id="gsr-cs-count"></span>
          </div>
          <div class="cs-text" id="gsr-cs-text"></div>
          <div class="cs-actions">
            <button class="cs-next" id="gsr-cs-next">NEXT ▶</button>
          </div>
        </div>
      </div>
    </div>
  `;
  container.appendChild(root);

  const talkingHead = createTalkingHead(92);
  const csRow = root.querySelector('#gsr-cs-row') as HTMLElement;
  csRow.prepend(talkingHead.element);

  const titleEl = root.querySelector('#gsr-cs-title') as HTMLElement;
  const centerEl = root.querySelector('#gsr-cs-center') as HTMLElement;
  const speakerEl = root.querySelector('#gsr-cs-speaker') as HTMLElement;
  const roleEl = root.querySelector('#gsr-cs-role') as HTMLElement;
  const countEl = root.querySelector('#gsr-cs-count') as HTMLElement;
  const textEl = root.querySelector('#gsr-cs-text') as HTMLElement;
  const nextBtn = root.querySelector('#gsr-cs-next') as HTMLButtonElement;
  const skipBtn = root.querySelector('#gsr-cs-skip') as HTMLButtonElement;

  let current: CutsceneDef | null = null;
  let beatIdx = 0;
  let anchors: CutsceneAnchors = {
    bossPos: { x: 0, y: 6, z: -24 },
    sidekickPos: { x: 2, y: 6, z: -22 },
    playerSpawn: { x: 0, y: 0, z: 38 },
    djBoothPos: { x: -6.5, y: 0, z: 36 },
    crewLineupPos: { x: 6.2, y: 0, z: 35 },
  };
  let doneCb: (() => void) | null = null;
  let camTime = 0;
  let fullText = '';
  let typedChars = 0;
  let typingTimer: number | null = null;
  let talkTail = 0;

  const camPos = new THREE.Vector3(0, 18, 42);
  const camLook = new THREE.Vector3(0, 4, 0);

  function stopTyping(): void {
    if (typingTimer !== null) {
      window.clearInterval(typingTimer);
      typingTimer = null;
    }
  }

  function finish(): void {
    stopTyping();
    const cb = doneCb;
    current = null;
    doneCb = null;
    root.style.display = 'none';
    cb?.();
  }

  function showBeat(): void {
    if (!current) return;
    const beat: CutsceneBeat | undefined = current.beats[beatIdx];
    if (!beat) {
      finish();
      return;
    }
    stopTyping();
    camTime = 0;
    titleEl.textContent = current.title.toUpperCase();
    speakerEl.textContent = beat.speaker;
    roleEl.textContent = beat.role ?? '';
    countEl.textContent = `${beatIdx + 1} / ${current.beats.length}`;
    talkingHead.setSpeaker(beat.speaker, beat.titleCard?.accentColor);
    talkingHead.setTalking(true);
    talkTail = 0.55;
    fullText = beat.text;
    typedChars = 0;
    textEl.textContent = '';
    nextBtn.textContent = beatIdx === current.beats.length - 1 ? 'ROLL OUT ▶' : 'NEXT ▶';
    typingTimer = window.setInterval(() => {
      typedChars = Math.min(fullText.length, typedChars + 2);
      textEl.textContent = fullText.slice(0, typedChars);
      if (typedChars >= fullText.length) stopTyping();
    }, 34);

    if (beat.titleCard) {
      centerEl.innerHTML = `
        <div class="cs-card" style="border-left-color:${beat.titleCard.accentColor};">
          <div class="cs-card-badge">${beat.titleCard.badge}</div>
          <div class="cs-card-name" style="color:${beat.titleCard.accentColor};">${beat.titleCard.name}</div>
          <div class="cs-card-sub">${beat.titleCard.subtitle}</div>
        </div>
      `;
    } else {
      centerEl.innerHTML = '';
    }

    if (beat.playJingle) {
      deps.jingles.play(beat.playJingle);
    }
    deps.mutter.say(beat.text, beat.mutterHz);
  }

  function advance(): void {
    if (!current) return;
    if (typedChars < fullText.length) {
      stopTyping();
      typedChars = fullText.length;
      textEl.textContent = fullText;
      return;
    }
    beatIdx++;
    if (beatIdx >= current.beats.length) {
      finish();
    } else {
      showBeat();
    }
  }

  nextBtn.addEventListener('click', advance);
  skipBtn.addEventListener('click', finish);
  root.querySelector('.cs-dialog')?.addEventListener('click', (e) => {
    if (e.target !== nextBtn) advance();
  });

  window.addEventListener('keydown', (e) => {
    if (!current) return;
    if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyF') {
      e.preventDefault();
      advance();
    } else if (e.code === 'Escape') {
      e.preventDefault();
      finish();
    }
  });

  return {
    play(def, nextAnchors, onDone) {
      current = def;
      beatIdx = 0;
      anchors = nextAnchors;
      doneCb = onDone;
      root.style.display = 'flex';
      showBeat();
    },
    skip() {
      if (current) finish();
    },
    isActive() {
      return current !== null;
    },
    updateCamera(camera, dt, beatPulse = 0) {
      if (!current) return;
      const beat = current.beats[beatIdx];
      if (!beat) return;
      camTime += dt;
      if (typedChars >= fullText.length) {
        talkTail = Math.max(0, talkTail - dt);
        if (talkTail <= 0) talkingHead.setTalking(false);
      }
      talkingHead.tick(dt, beatPulse);

      let targetPos: THREE.Vector3;
      let targetLook: THREE.Vector3;
      const bp = anchors.bossPos;
      const sk = anchors.sidekickPos;
      const ps = anchors.playerSpawn;
      const dj = anchors.djBoothPos;
      const cr = anchors.crewLineupPos;

      switch (beat.camera as string) {
        case 'boss-dramatic-low': {
          const push = Math.min(3.2, camTime * 0.85);
          targetPos = new THREE.Vector3(
            bp.x + Math.sin(camTime * 0.35) * 1.4,
            bp.y + 0.9,
            bp.z + 8.6 - push,
          );
          targetLook = new THREE.Vector3(bp.x, bp.y + 2.2, bp.z);
          break;
        }
        case 'boss-spiral-reveal': {
          const angle = camTime * 0.95;
          const radius = Math.max(5.5, 11.5 - camTime * 0.65);
          const climbY = Math.min(6.5, 1.5 + camTime * 1.25);
          targetPos = new THREE.Vector3(
            bp.x + Math.sin(angle) * radius,
            bp.y + climbY,
            bp.z + Math.cos(angle) * radius,
          );
          targetLook = new THREE.Vector3(bp.x, bp.y + 1.8, bp.z);
          break;
        }
        case 'dj-booth':
          targetPos = new THREE.Vector3(dj.x + 2.4 + Math.sin(camTime * 0.5) * 1.4, dj.y + 2.1, dj.z + 4.8);
          targetLook = new THREE.Vector3(dj.x, dj.y + 1.0, dj.z);
          break;
        case 'crew-lineup':
          targetPos = new THREE.Vector3(cr.x + Math.sin(camTime * 0.5) * 2.2, cr.y + 2.2, cr.z + 6.0);
          targetLook = new THREE.Vector3(cr.x, cr.y + 0.9, cr.z);
          break;
        case 'leader-closeup':
          targetPos = new THREE.Vector3(bp.x + Math.sin(camTime * 0.4) * 5.5, bp.y + 3.2, bp.z + 8.5);
          targetLook = new THREE.Vector3(bp.x, bp.y + 1.5, bp.z);
          break;
        case 'boss-stage':
          targetPos = new THREE.Vector3(bp.x - 9.5, bp.y + 5.8, bp.z + 12.5);
          targetLook = new THREE.Vector3(bp.x, bp.y + 1.4, bp.z);
          break;
        case 'sidekicks-pan':
          targetPos = new THREE.Vector3(sk.x + Math.sin(camTime * 0.6) * 8, sk.y + 3.6, sk.z + 9.5);
          targetLook = new THREE.Vector3(bp.x, bp.y + 1.2, bp.z + 1.4);
          break;
        case 'player-hero':
          targetPos = new THREE.Vector3(ps.x + 5.2, ps.y + 2.8, ps.z + 7.2);
          targetLook = new THREE.Vector3(ps.x, ps.y + 1.1, ps.z);
          break;
        case 'sky-ascend':
          targetPos = new THREE.Vector3(Math.sin(camTime * 0.3) * 28, 24 + camTime * 2.5, Math.cos(camTime * 0.3) * 28);
          targetLook = new THREE.Vector3(0, 12, -14);
          break;
        case 'wide-orbit':
        default:
          targetPos = new THREE.Vector3(Math.sin(camTime * 0.28) * 44, 21, Math.cos(camTime * 0.28) * 44);
          targetLook = new THREE.Vector3(0, 5, -8);
          break;
      }

      const k = Math.min(1, dt * 4.5);
      camPos.lerp(targetPos, k);
      camLook.lerp(targetLook, k);
      camera.position.copy(camPos);
      camera.lookAt(camLook);
    },
  };
}
