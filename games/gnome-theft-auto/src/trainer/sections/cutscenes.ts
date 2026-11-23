// The Cutscenes tab of the Save Trainer: every scripted scene by id, grouped and searchable. Playing one closes the
// trainer, shows a skip pill, puts the gnome back where it stood (on foot) and reopens the trainer when the scene ends.
import { SCENES } from '../../cutscene/scenes/index';
import { CH1_SCENES } from '../../cutscene/scenes/story/ch1';
import { CH1B_SCENES } from '../../cutscene/scenes/story/ch1b';
import { CH1C_SCENES } from '../../cutscene/scenes/story/ch1c';
import { CH1D_SCENES } from '../../cutscene/scenes/story/ch1d';
import { CH2_SCENES } from '../../cutscene/scenes/story/ch2';
import { CH2B_SCENES } from '../../cutscene/scenes/story/ch2b';
import { CH2C_SCENES } from '../../cutscene/scenes/story/ch2c';
import { CH2D_SCENES } from '../../cutscene/scenes/story/ch2d';
import { CH3_SCENES } from '../../cutscene/scenes/story/ch3';
import { CH4_SCENES } from '../../cutscene/scenes/story/ch4';
import { CH5_SCENES } from '../../cutscene/scenes/story/ch5';
import { SIDE_SCENES } from '../../cutscene/scenes/side';
import { SPEEDWAY_SCENES } from '../../cutscene/scenes/speedway';
import { LAB_SCENES } from '../../cutscene/scenes/lab';
import type { SceneScript } from '../../cutscene/script';
import { closeTrainerPanel } from '../panel';
import { registerTrainerSection } from '../registry';
import type { TrainerCtx } from '../types';
import { button, grid, input, note, status } from '../ui';

const STORY: Record<string, SceneScript>[] = [
  CH1_SCENES, CH1B_SCENES, CH1C_SCENES, CH1D_SCENES, CH2_SCENES, CH2B_SCENES, CH2C_SCENES, CH2D_SCENES, CH3_SCENES, CH4_SCENES, CH5_SCENES,
];

/** The scene ids of each named group, in display order. "Other" is whatever no group claims. */
function groups(): { name: string; ids: string[] }[] {
  const claimed = new Set<string>();
  const of = (records: Record<string, SceneScript>[]): string[] => {
    const ids: string[] = [];
    for (const r of records) for (const id of Object.keys(r)) { ids.push(id); claimed.add(id); }
    return ids;
  };
  const story = of(STORY);
  const side = of([SIDE_SCENES]);
  const races = of([SPEEDWAY_SCENES]);
  const labs = of([LAB_SCENES]);
  const other = Object.keys(SCENES).filter((id) => !claimed.has(id));
  return [
    { name: 'Story', ids: story },
    { name: 'Side quests', ids: side },
    { name: 'Races', ids: races },
    { name: 'Labs', ids: labs },
    { name: 'Other', ids: other },
  ];
}

/** The floating "Skip scene" pill, bottom left, above the game's HUD. */
function skipPill(ctx: TrainerCtx): HTMLButtonElement {
  const pill = document.createElement('button');
  pill.type = 'button';
  pill.textContent = 'Skip scene';
  pill.style.cssText = 'position:fixed;left:calc(env(safe-area-inset-left) + 10px);bottom:calc(env(safe-area-inset-bottom) + 10px);z-index:70;min-height:44px;padding:8px 16px;border-radius:999px;border:2px solid rgba(255,255,255,.7);background:rgba(0,0,0,.6);color:#fff;font:700 14px system-ui,sans-serif;';
  pill.addEventListener('pointerdown', (e) => e.stopPropagation());
  pill.addEventListener('click', () => ctx.cutscene.skip());
  return pill;
}

export function registerCutsceneSection(): void {
  registerTrainerSection({
    id: 'cutscenes',
    label: 'Cutscenes',
    order: 60,
    build(el: HTMLElement, ctx: TrainerCtx) {
      const st = status();
      el.append(st.el);
      el.append(note('Plays the scene now, where you stand. The trainer closes and comes back when it ends.'));

      function play(id: string): void {
        if (ctx.cutscene.active) {
          st.set('A scene is already playing.', true);
          return;
        }
        if (ctx.introActive()) {
          st.set('Finish the intro tour first: scenes wait until it ends.', true);
          return;
        }
        const p = ctx.player;
        const start = { x: p.x, z: p.z, yaw: p.yaw, onFoot: !p.vehicle };
        closeTrainerPanel();
        const pill = skipPill(ctx);
        ctx.ui.append(pill);
        const onDone = (): void => {
          pill.remove();
          const q = ctx.player;
          if (start.onFoot && !q.vehicle && Math.hypot(q.x - start.x, q.z - start.z) > 3) {
            q.respawn(start.x, start.z, start.yaw);
          }
          ctx.hud.toast(`Scene "${id}" done`, 3000);
          window.dispatchEvent(new CustomEvent('gta:trainer', { detail: { tab: 'cutscenes' } }));
        };
        ctx.cutscene.play({ kind: 'script', script: SCENES[id] }, onDone, {
          onTrigger: (n, a) => window.dispatchEvent(new CustomEvent('gta:cutscene-trigger', { detail: { name: n, arg: a, quest: null } })),
        });
        if (!ctx.cutscene.active) {
          pill.remove();
          ctx.hud.toast('Could not start that scene.', 3000);
        }
      }

      const search = input({ placeholder: 'Search scenes' });
      el.append(search);
      const list = document.createElement('div');
      el.append(list);
      const all = groups();

      const render = (): void => {
        const q = search.value.trim().toLowerCase();
        const sections: HTMLElement[] = [];
        all.forEach((g, i) => {
          const hits = g.ids.filter((id) => {
            if (!q) return true;
            const title = (SCENES[id]?.title ?? '').toLowerCase();
            return id.toLowerCase().includes(q) || title.includes(q);
          });
          if (hits.length === 0) return;
          const d = document.createElement('details');
          d.open = q ? true : i === 0;
          d.style.margin = '4px 0';
          const sum = document.createElement('summary');
          sum.textContent = `${g.name} (${hits.length})`;
          sum.style.cssText = 'min-height:44px;display:flex;align-items:center;cursor:pointer;font-weight:700;';
          d.append(sum, grid(...hits.map((id) => button(SCENES[id]?.title ?? id, () => play(id), id))));
          sections.push(d);
        });
        list.replaceChildren(...sections);
      };

      search.addEventListener('input', render);
      render();
    },
  });
}
