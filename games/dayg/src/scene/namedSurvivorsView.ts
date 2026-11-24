// 3D placement of the 8 named survivors and their interactive branching-story dialogue modal.
import * as THREE from 'three';
import type { Interact } from '../game/interact';
import type { RegionDef, WorldState } from '../sim/types';
import { LOCAL_PLAYER } from '../sim/world';
import type { Collider } from '../world/collide';
import { makeGnome, npcLook } from './gnomes';
import {
  BRANCH_STORIES,
  NAMED_SURVIVORS,
  acceptStory,
  advanceStory,
  completeStory,
  dispositionTier,
  getStoryStage,
  loadStoryState,
  saveStoryState,
} from '../sim/survivorStories';

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const SURVIVOR_OFFSETS: Record<string, [number, number]> = {
  maren: [4, -4],
  barnaby: [-4, 3],
  pip: [5, 2],
  fern: [-5, -3],
  alder: [3, 5],
  bram: [-4, 4],
  clod: [4, -3],
  moss: [-3, -5],
};

const CSS = `
#dayg-survivor-dlg{position:fixed;inset:0;z-index:62;display:none;align-items:center;justify-content:center;background:rgba(12,16,12,0.72);
  backdrop-filter:blur(6px);pointer-events:auto;padding:calc(12px + env(safe-area-inset-top)) calc(12px + env(safe-area-inset-right)) calc(12px + env(safe-area-inset-bottom)) calc(12px + env(safe-area-inset-left))}
#dayg-survivor-dlg.ds-open{display:flex}
#dayg-survivor-dlg .ds-card{max-width:520px;width:100%;max-height:88vh;overflow-y:auto;background:var(--dg-bg,#192017);color:var(--dg-text,#e8ece4);
  border:1px solid var(--dg-border-strong,#6b785f);border-radius:12px;padding:16px;font:14px var(--dg-font,system-ui,sans-serif);
  display:flex;flex-direction:column;gap:10px;box-shadow:0 12px 32px rgba(0,0,0,0.55)}
#dayg-survivor-dlg .ds-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;border-bottom:1px solid var(--dg-border,#434d3a);padding-bottom:8px}
#dayg-survivor-dlg .ds-btn{min-height:44px;min-width:44px;padding:8px 14px;border-radius:8px;border:1px solid var(--dg-border,#434d3a);
  background:var(--dg-surface-2,#263022);color:var(--dg-text,#e8ece4);font:600 14px var(--dg-font,system-ui,sans-serif);cursor:pointer;touch-action:manipulation}
#dayg-survivor-dlg .ds-btn:hover{background:var(--dg-surface-hover,#33402e);border-color:var(--dg-accent,#e8c35a)}
#dayg-survivor-dlg .ds-primary{background:#475c38;border-color:#88b366}
#dayg-survivor-dlg .ds-warn{padding:8px 10px;border-radius:8px;background:rgba(192,98,58,0.16);border:1px solid rgba(192,98,58,0.55);color:#f2b698;font-size:12px}
#dayg-survivor-dlg .ds-box{padding:10px;border-radius:8px;background:var(--dg-surface-2,#263022);border:1px solid var(--dg-border,#434d3a);display:flex;flex-direction:column;gap:6px}`;

export function createNamedSurvivorsView(deps: {
  scene: THREE.Scene;
  ui: HTMLElement;
  regions: readonly RegionDef[];
  interact: Interact;
  collider: Collider;
  world: WorldState;
  onToast: (t: string) => void;
}): { isOpen(): boolean; update(dt: number): void } {
  const { scene, ui, regions, interact, collider, world, onToast } = deps;

  if (!document.getElementById('dayg-survivor-dlg-style')) {
    const st = document.createElement('style');
    st.id = 'dayg-survivor-dlg-style';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  const root = document.createElement('div');
  root.id = 'dayg-survivor-dlg';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', 'Survivor Dialogue');
  root.addEventListener('mousedown', (e) => e.stopPropagation());
  ui.appendChild(root);

  let activeSurvivorId: string | null = null;
  const actors: { obj: THREE.Object3D; baseYaw: number; phase: number }[] = [];
  let elapsed = 0;

  function close(): void {
    activeSurvivorId = null;
    root.classList.remove('ds-open');
  }

  function openDialogue(survivorId: string): void {
    activeSurvivorId = survivorId;
    const st = loadStoryState();
    if (st.survivors[survivorId]) {
      st.survivors[survivorId].met = true;
      saveStoryState(st);
    }
    root.classList.add('ds-open');
    renderDialogue();
  }

  window.addEventListener('keydown', (e) => {
    if (activeSurvivorId && e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  });

  function renderDialogue(): void {
    if (!activeSurvivorId) return;
    const surv = NAMED_SURVIVORS.find((x) => x.id === activeSurvivorId);
    if (!surv) { close(); return; }

    const st = loadStoryState();
    const rec = st.survivors[surv.id];
    const story = BRANCH_STORIES.find((b) => b.survivorId === surv.id);
    const regName = regions.find((r) => r.id === surv.home)?.name ?? surv.home;
    const tier = dispositionTier(rec?.disposition ?? 0);

    root.replaceChildren();
    const card = document.createElement('div');
    card.className = 'ds-card';

    const head = document.createElement('div');
    head.className = 'ds-head';
    const titleWrap = document.createElement('div');
    const h2 = document.createElement('h2');
    h2.style.cssText = 'margin:0;font:700 18px var(--dg-font,system-ui,sans-serif);color:var(--dg-accent,#e8c35a)';
    h2.textContent = `${surv.name} · ${surv.role}`;
    const sub = document.createElement('div');
    sub.style.cssText = 'font-size:12px;opacity:0.8;margin-top:2px';
    sub.textContent = `${regName} · Relationship: ${tier} (${rec?.disposition ?? 0})`;
    titleWrap.append(h2, sub);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'ds-btn';
    closeBtn.textContent = 'Close';
    closeBtn.addEventListener('click', (e) => { e.stopPropagation(); close(); });
    head.append(titleWrap, closeBtn);
    card.append(head);

    const blurb = document.createElement('div');
    blurb.style.cssText = 'font-style:italic;opacity:0.9;line-height:1.4';
    blurb.textContent = `“${surv.blurb}”`;
    card.append(blurb);

    if (story) {
      const status = st.stories[story.id];
      const stage = getStoryStage(st, story.id);
      const box = document.createElement('div');
      box.className = 'ds-box';

      const stTitle = document.createElement('div');
      stTitle.style.cssText = 'font-weight:700;font-size:15px';
      stTitle.textContent = `${story.title} · Stage ${stage}/3`;
      const stSum = document.createElement('div');
      stSum.style.cssText = 'font-size:13px;opacity:0.85';
      stSum.textContent = story.summary;
      box.append(stTitle, stSum);

      if (status === 'locked') {
        const lockedMsg = document.createElement('div');
        lockedMsg.className = 'ds-warn';
        lockedMsg.textContent = 'LOCKED OUT: You sided with a rival survivor on this arc.';
        box.append(lockedMsg);
      } else if (status === 'completed') {
        const doneMsg = document.createElement('div');
        doneMsg.style.cssText = 'color:var(--dg-ok,#8ec07c);font-weight:700';
        doneMsg.textContent = `Completed (+${story.rewardAcorns} Acorns) — ${story.outcomeTag}`;
        box.append(doneMsg);
      } else {
        const stageText = document.createElement('div');
        stageText.style.cssText = 'padding:8px;border-radius:6px;background:rgba(232,195,90,0.1);border:1px solid rgba(232,195,90,0.35);font-size:13px';
        if (stage === 0) {
          stageText.textContent = `Stage 1 Preview: ${story.stages[0]}`;
        } else {
          stageText.textContent = `Current Objective (Stage ${stage}/3): ${story.stages[stage - 1]}`;
        }
        box.append(stageText);

        // Rival lockout warning
        const rivalNames = story.locksOut.map((rid) => {
          const rStory = BRANCH_STORIES.find((x) => x.id === rid);
          const rSurv = rStory ? NAMED_SURVIVORS.find((x) => x.id === rStory.survivorId) : null;
          return rStory ? `${rStory.title}${rSurv ? ` (${rSurv.name})` : ''}` : rid;
        });
        const warn = document.createElement('div');
        warn.className = 'ds-warn';
        warn.textContent = `Warning: Completing Stage 3 will permanently lock out ${rivalNames.join(', ')}.`;
        box.append(warn);

        const actions = document.createElement('div');
        actions.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-top:4px';

        if (status === 'available') {
          const accBtn = document.createElement('button');
          accBtn.type = 'button';
          accBtn.className = 'ds-btn ds-primary';
          accBtn.textContent = 'Accept Story (Stage 1/3)';
          accBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (acceptStory(st, story.id)) {
              saveStoryState(st);
              onToast(`Accepted: ${story.title}`);
              renderDialogue();
            }
          });
          actions.append(accBtn);
        } else {
          const advBtn = document.createElement('button');
          advBtn.type = 'button';
          advBtn.className = 'ds-btn ds-primary';
          advBtn.textContent = stage < 3
            ? `Complete Stage ${stage} → Stage ${stage + 1}/3`
            : `Complete Stage 3 (+${story.rewardAcorns} Acorns)`;
          advBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const res = advanceStory(st, story.id);
            if (res.ok) {
              saveStoryState(st);
              if (res.completed) {
                const p = world.players[LOCAL_PLAYER];
                if (p) p.acorns += res.rewardAcorns;
                onToast(`${story.title} complete! +${res.rewardAcorns} acorns`);
              } else {
                onToast(`${story.title}: Stage ${res.stage}/3`);
              }
              renderDialogue();
            }
          });
          actions.append(advBtn);

          if (stage < 3) {
            const fastBtn = document.createElement('button');
            fastBtn.type = 'button';
            fastBtn.className = 'ds-btn';
            fastBtn.textContent = `Finish Arc Now (+${story.rewardAcorns} Acorns)`;
            fastBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              const res = completeStory(st, story.id);
              if (res.ok) {
                saveStoryState(st);
                const p = world.players[LOCAL_PLAYER];
                if (p) p.acorns += res.rewardAcorns;
                onToast(`${story.title} complete! +${res.rewardAcorns} acorns`);
                renderDialogue();
              }
            });
            actions.append(fastBtn);
          }
        }
        box.append(actions);
      }

      card.append(box);
    }

    root.append(card);
  }

  for (let i = 0; i < NAMED_SURVIVORS.length; i++) {
    const s = NAMED_SURVIVORS[i];
    const reg = regions.find((r) => r.id === s.home);
    if (!reg) continue;
    const cx = (reg.rect.x0 + reg.rect.x1) / 2;
    const cz = (reg.rect.z0 + reg.rect.z1) / 2;
    const off = SURVIVOR_OFFSETS[s.id] ?? [3, 3];
    const x = Math.min(reg.rect.x1 - 2, Math.max(reg.rect.x0 + 2, cx + off[0]));
    const z = Math.min(reg.rect.z1 - 2, Math.max(reg.rect.z0 + 2, cz + off[1]));
    if (!collider.inBounds(x, z)) continue;
    const y = collider.groundAt(x, z, reg.floorY + 4);

    const model = makeGnome(npcLook(hashStr(s.id)));
    const yaw = Math.atan2(cx - x, cz - z);
    model.object.position.set(x, y, z);
    model.object.rotation.y = yaw;
    scene.add(model.object);
    actors.push({ obj: model.object, baseYaw: yaw, phase: i * 1.1 });

    interact.add({
      id: `survivor:${s.id}`,
      x,
      y,
      z,
      radius: 2.5,
      label: () => `Talk to ${s.name} (${s.role})`,
      act: () => openDialogue(s.id),
    });
  }

  return {
    isOpen: () => activeSurvivorId !== null,
    update(dt: number) {
      elapsed += dt;
      for (const a of actors) {
        a.obj.rotation.y = a.baseYaw + Math.sin(elapsed * 1.1 + a.phase) * 0.08;
      }
    },
  };
}
