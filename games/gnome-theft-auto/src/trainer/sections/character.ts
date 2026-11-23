// The Character tab of the Save Trainer: health, Acorns and Kiln-Debt, Hat Watch heat, perks, achievements (read only),
// gear try-on (session only), and the story / hunting editors from ./progress.
import type * as THREE from 'three';
import { achievementsForGame } from '@lawn/achievements';
import { allPrefabs, getPrefab } from '@lawn/prefabs';
import { buildGear, gearSlotFor, type EquipSlot } from '@lawn/gnome';
import { MAX_HEAT } from '../../config';
import { clearPerkOverride, grantPerk, listPerks, revokePerk } from '../../perks';
import { registerTrainerSection } from '../registry';
import { markTrainerModified } from '../mark';
import { button, grid, heading, input, note, row, select, status } from '../ui';
import type { TrainerCtx } from '../types';
import { buildHuntEditor, buildStoryEditor } from './progress';

const SLOTS: readonly EquipSlot[] = ['head', 'back', 'neck', 'hand'];

/** Gear the trainer is trying on right now (session only, never saved). */
const worn: Partial<Record<EquipSlot, { id: string; obj: THREE.Object3D }>> = {};

const fmt = (n: number): string => n.toLocaleString('en-US');

/** Put a try-on item on (or take the slot's own gear back). Returns the status text. */
function tryOn(ctx: TrainerCtx, slot: EquipSlot, id: string): string {
  const prev = worn[slot];
  if (prev) {
    prev.obj.parent?.remove(prev.obj);
    delete worn[slot];
  }
  const model = ctx.player.model;
  if (id === '') {
    // The hand is always overridden by the game (guns), so only the other slots go back to the look's gear.
    if (slot !== 'hand') model.setEquipmentOverride?.(slot, false);
    return `Back to your own ${slot}`;
  }
  if (slot !== 'hand') model.setEquipmentOverride?.(slot, true);
  const obj = buildGear(slot, id);
  (slot === 'hand' ? model.arms.right : model.rig).add(obj);
  worn[slot] = { id, obj };
  return `Wearing ${getPrefab(id)?.name ?? id}`;
}

export function registerCharacterSection(): void {
  registerTrainerSection({
    id: 'character',
    label: 'Character',
    order: 20,
    build(el, ctx) {
      const st = status();
      el.append(st.el);

      // 1. Health (session only).
      el.append(heading('Health'));
      const healthNote = note('');
      const paintHealth = (): void => {
        healthNote.textContent = `Health: ${Math.round(ctx.player.health * 100)}%`;
      };
      paintHealth();
      el.append(healthNote);
      el.append(
        grid(
          button('Heal', () => {
            ctx.player.health = 1;
            paintHealth();
            st.set('Healed.');
          }),
          button('Hurt 25%', () => {
            ctx.player.hurt(0.25);
            paintHealth();
            st.set('Hurt 25%.');
          }),
          button('Get up here', () => {
            if (ctx.player.vehicle) {
              st.set('Get out first.', true);
              return;
            }
            ctx.player.respawn(ctx.player.x, ctx.player.z, ctx.player.yaw);
            paintHealth();
            st.set('Back on your feet.');
          }),
        ),
      );

      // 2. Acorns and Kiln-Debt (saved: each change is marked).
      el.append(heading('Acorns & Kiln-Debt'));
      const walletNote = note('');
      const paintWallet = (): void => {
        const s = ctx.economy.state();
        walletNote.textContent = `Acorns: ${fmt(s.acorns)} · Kiln-Debt left: ${fmt(s.debtRemaining)}`;
      };
      paintWallet();
      el.append(walletNote);

      const acornsInput = input({ type: 'number', value: String(ctx.economy.state().acorns) });
      el.append(
        row(
          'Set Acorns',
          acornsInput,
          button('Set', () => {
            const value = Number(acornsInput.value);
            if (!Number.isFinite(value)) {
              st.set('Type a number of Acorns first.', true);
              return;
            }
            const target = Math.max(0, Math.round(value));
            const delta = target - ctx.economy.state().acorns;
            if (delta > 0) ctx.economy.earn(delta, 'trainer');
            else if (delta < 0 && !ctx.economy.spend(-delta, 'trainer')) {
              st.set('Not enough Acorns to take that away.', true);
              return;
            }
            const now = ctx.economy.state().acorns;
            markTrainerModified('acorns ' + now);
            paintWallet();
            acornsInput.value = String(now);
            st.set(`Acorns set to ${fmt(now)}.`);
          }),
        ),
      );

      el.append(
        row(
          null,
          button('+100', () => {
            ctx.economy.earn(100, 'trainer');
            markTrainerModified('acorns ' + ctx.economy.state().acorns);
            paintWallet();
            st.set('+100 Acorns.');
          }),
          button('+1,000', () => {
            ctx.economy.earn(1000, 'trainer');
            markTrainerModified('acorns ' + ctx.economy.state().acorns);
            paintWallet();
            st.set('+1,000 Acorns.');
          }),
          button('+10,000', () => {
            ctx.economy.earn(10000, 'trainer');
            markTrainerModified('acorns ' + ctx.economy.state().acorns);
            paintWallet();
            st.set('+10,000 Acorns.');
          }),
        ),
      );

      el.append(
        row(
          null,
          button('Pay 500 Kiln-Debt', () => {
            const paid = ctx.economy.payDebt(500);
            markTrainerModified('debt ' + ctx.economy.state().debtRemaining);
            paintWallet();
            st.set(paid > 0 ? `Paid ${fmt(paid)} Kiln-Debt.` : 'No Kiln-Debt left to pay.');
          }),
        ),
      );

      // 3. Hat Watch heat (session only).
      el.append(heading('Hat Watch'));
      const heatBox = document.createElement('div');
      const paintHeat = (): void => {
        const current = Math.floor(ctx.watch.heat);
        heatBox.replaceChildren(
          note(`Heat: ${current} / ${MAX_HEAT}`),
          grid(
            ...Array.from({ length: MAX_HEAT + 1 }, (_, n) => {
              const b = button(String(n), () => {
                ctx.watch.clear();
                if (n > 0) ctx.watch.addHeat(n);
                paintHeat();
                st.set(`Heat set to ${n}.`);
              });
              b.classList.toggle('on', n === current);
              return b;
            }),
          ),
        );
      };
      paintHeat();
      el.append(heatBox);

      // 4. Perks (kept on this device, not in the save bundle).
      el.append(heading('Perks'));
      el.append(note('Perk changes stay on this device.'));
      const perksBox = document.createElement('div');
      const paintPerks = (): void => {
        const nodes: HTMLElement[] = [];
        for (const { def, source } of listPerks()) {
          const apply = (fn: () => boolean, label: string): void => {
            fn();
            st.set(`${def.name}: ${label}.`);
            paintPerks();
          };
          const onBtn = button('On', () => apply(() => grantPerk(def.id), 'on'));
          const offBtn = button('Off', () => apply(() => revokePerk(def.id), 'off'));
          const autoBtn = button('Auto', () => apply(() => clearPerkOverride(def.id), 'back to its quest'), 'from its quest');
          // Highlight the button that matches the current state: granted -> On, revoked -> Off, quest/locked -> Auto.
          if (source === 'granted') onBtn.classList.add('on');
          else if (source === 'revoked') offBtn.classList.add('on');
          else autoBtn.classList.add('on');
          nodes.push(note(`${def.name}: ${def.text} (${source})`), row(null, onBtn, offBtn, autoBtn));
        }
        perksBox.replaceChildren(...nodes);
      };
      paintPerks();
      el.append(perksBox);

      // 5. Achievements (read only; try their gear on).
      el.append(heading('Achievements'));
      el.append(
        note(
          "Achievements belong to your account and every game, so the trainer never unlocks or resets them. Try their gear on below.",
        ),
      );
      // Gear selects of section 6 below, filled in once they exist (a Try on click always runs after the build).
      const gearSelects: Partial<Record<EquipSlot, HTMLSelectElement>> = {};
      const defs = achievementsForGame('gnome-theft-auto');
      const details = document.createElement('details');
      const summary = document.createElement('summary');
      summary.textContent = `${defs.length} achievements`;
      summary.style.minHeight = '44px';
      summary.style.display = 'flex';
      summary.style.alignItems = 'center';
      details.append(summary);
      for (const def of defs) {
        const mark = document.createElement('span');
        mark.textContent = '…';
        mark.setAttribute('aria-label', 'checking');
        void ctx.isAchievementUnlocked(def.id).then(
          (yes) => {
            mark.textContent = yes ? '✓' : '·';
            mark.setAttribute('aria-label', yes ? 'unlocked' : 'locked');
          },
          () => {
            mark.textContent = '?';
            mark.setAttribute('aria-label', 'unknown');
          },
        );
        const controls: HTMLElement[] = [mark];
        if (def.reward) {
          const reward = def.reward;
          controls.push(
            button('Try on', () => {
              const msg = tryOn(ctx, reward.slot, reward.prefabId);
              const sel = gearSelects[reward.slot];
              if (sel) sel.value = reward.prefabId;
              st.set(msg);
            }),
          );
        }
        details.append(row(def.title, ...controls));
      }
      el.append(details);

      // 6. Gear try-on (this session only).
      el.append(heading('Gear try-on'));
      el.append(note('Not saved: your own gear comes back on reload.'));
      for (const slot of SLOTS) {
        const options = [
          { value: '', label: '(your own)' },
          ...allPrefabs()
            .filter((d) => gearSlotFor(d) === slot)
            .map((d) => ({ value: d.id, label: d.name })),
        ];
        const s = select(options, worn[slot]?.id ?? '');
        s.addEventListener('change', () => {
          st.set(tryOn(ctx, slot, s.value));
        });
        gearSelects[slot] = s;
        el.append(row(slot, s));
      }
      el.append(
        row(
          null,
          button('Take it all off', () => {
            for (const slot of SLOTS) {
              tryOn(ctx, slot, '');
              const sel = gearSelects[slot];
              if (sel) sel.value = '';
            }
            st.set('Back to your own gear.');
          }),
        ),
      );

      // 7. Story & quests (./progress).
      el.append(heading('Story & quests'));
      const storyBox = document.createElement('div');
      el.append(storyBox);
      buildStoryEditor(storyBox, ctx);

      // 8. Hunting (./progress).
      el.append(heading('Hunting'));
      const huntBox = document.createElement('div');
      el.append(huntBox);
      buildHuntEditor(huntBox, ctx);

      // 9. Pointer to the other tab.
      el.append(note('Emotes and every animation: the Animations tab.'));
    },
  });
}
