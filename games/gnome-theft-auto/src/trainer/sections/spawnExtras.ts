// The Spawn tab's blocks that are not one-tap spawnables: weapons, gun mods, prefab props.
import type { Object3D } from 'three';
import { allPrefabs, buildPrefab } from '@lawn/prefabs';
import { GUNS } from '../../config';
import { modsFor, normalizeGunLoadout, SLOT_NAMES, slotsFor } from '../../gunMods';
import { heightAt } from '../../terrain';
import type { GunKind } from '../../types';
import { trainerSpot } from '../aim';
import type { TrainerCtx } from '../types';
import { button, grid, heading, input, note, row, select, status } from '../ui';

/** Props placed by the trainer this session (removed by "Remove placed props"). Nothing here is saved. */
const placed: Object3D[] = [];

export function buildSpawnExtras(el: HTMLElement, ctx: TrainerCtx): void {
  const st = status();
  el.append(st.el);

  // ---- Weapons ----
  el.append(heading('Weapons'), note('Every gun, in your hands now.'));
  const gunButtons = new Map<GunKind, HTMLButtonElement>();
  const paintGuns = (): void => {
    for (const [k, b] of gunButtons) b.classList.toggle('on', ctx.weapons.gun === k);
  };
  const gunGrid = grid();
  for (const k of Object.keys(GUNS) as GunKind[]) {
    const name = GUNS[k].name;
    const b = button(name, () => {
      ctx.weapons.unlock(k);
      ctx.weapons.selectGun(k);
      st.set(`Holding ${name}`);
      paintGuns();
      drawMods();
    });
    gunButtons.set(k, b);
    gunGrid.append(b);
  }
  el.append(gunGrid);
  paintGuns();

  // ---- Gun mods ----
  el.append(heading('Gun mods'), note('On the held gun, this session only. Buy them at Ammu-Gnation to keep them.'));
  const modsBox = document.createElement('div');
  const drawMods = (): void => {
    modsBox.replaceChildren();
    const gun = ctx.weapons.gun;
    for (const slot of slotsFor(gun)) {
      const sel = select(
        [{ value: '', label: 'Stock' }, ...modsFor(gun, slot).map((m) => ({ value: m.id, label: m.name }))],
        ctx.weapons.loadoutOf(gun)[slot] ?? '',
      );
      sel.addEventListener('change', () => {
        const next = { ...ctx.weapons.loadoutOf(gun) };
        if (sel.value) next[slot] = sel.value;
        else delete next[slot];
        ctx.weapons.setLoadout(gun, normalizeGunLoadout(gun, next));
      });
      modsBox.append(row(SLOT_NAMES[slot], sel));
    }
  };
  el.append(modsBox, button('Refresh for held gun', () => {
    paintGuns();
    drawMods();
  }));
  drawMods();

  // ---- Props ----
  el.append(heading('Props'), note('Any prefab, placed at the crosshair. Just for looking: no collision, not saved.'));
  const search = input({ placeholder: 'Search props (name, id, tag)' }) as HTMLInputElement;
  const results = document.createElement('div');

  const placeProp = (id: string, name: string): void => {
    try {
      const obj = buildPrefab(id);
      const at = trainerSpot(ctx);
      obj.position.set(at.x, heightAt(at.x, at.z), at.z);
      obj.rotation.y = at.yaw;
      ctx.scene.add(obj);
      placed.push(obj);
      st.set(`Placed ${name} (${placed.length} placed)`);
    } catch (e) {
      st.set(`Could not place ${name}: ${e instanceof Error ? e.message : String(e)}`, true);
    }
  };

  const drawProps = (): void => {
    const q = search.value.trim().toLowerCase();
    const matches = allPrefabs()
      .filter((d) => d.id.toLowerCase().includes(q)
        || d.name.toLowerCase().includes(q)
        || d.tags.some((t) => t.toLowerCase().includes(q)))
      .slice(0, 40);
    results.replaceChildren(
      matches.length > 0
        ? grid(...matches.map((d) => button(d.name, () => placeProp(d.id, d.name), d.id)))
        : note('No props match.'),
    );
  };
  search.addEventListener('input', drawProps);
  el.append(search, results, button('Remove placed props', () => {
    const n = placed.length;
    for (const o of placed) o.removeFromParent();
    placed.length = 0;
    st.set(`Removed ${n} placed prop${n === 1 ? '' : 's'}`);
  }));
  drawProps();
}
