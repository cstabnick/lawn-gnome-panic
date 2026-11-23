// Item use: what the pack can do with a stack (eat, drink, hold, wear, stow, drop) and the timed recipes.
import { FIRE } from '../config';
import { getItem, hasTag, type Tag } from '../items/defs';
import { RECIPES } from '../items/recipes';
import { BODY_PARTS, type BodyPart, type CrackLevel } from './types';
import type { WeatherState } from '../sim/types';
import type { Bus } from './bus';
import type { BodySystem, CampSystem, InventorySystem, NeedsSystem, PlayerState, RecipeDef, RecipeId, StackRef, UseAction, UseApi } from './types';

export interface UseDeps { inv: InventorySystem; needs: NeedsSystem; body: BodySystem; camp: CampSystem; bus: Bus;
  rng: () => number; getPlayer: () => PlayerState; getWeather: () => WeatherState }

const LIQUID_SIP = 0.25;
const WET_WEATHER: readonly string[] = ['drizzle', 'rain', 'storm'];

const TREAT_MESSAGES: Partial<Record<RecipeId, { ok: string; fail: string }>> = {
  'salt-wash': { ok: 'The salt stings. The grey is gone.', fail: 'The grey is still there.' },
  'spirit-wash': { ok: 'The spirit burns. The wound is clean.', fail: 'The wound is still dirty.' },
  'scrape-seal': { ok: 'The moss packs the cut and holds.', fail: 'The moss is still in there.' },
  campfire: { ok: 'Fire takes.', fail: 'The fire will not take.' },
  'boil-water': { ok: 'The water boils clean.', fail: 'Nothing to boil.' },
  'mend-glaze': { ok: 'The glaze sets. The crack is shut.', fail: 'The glaze will not set.' },
};

const TAG_WHY: Partial<Record<Tag, string>> = { MOSS: 'No moss to treat' };

function fmtLitres(n: number): string { return String(Number(n.toFixed(2))); }

export function createUseApi(deps: UseDeps): UseApi {
  const { inv, needs, body, camp, bus } = deps;
  let current: { action: UseAction; t: number } | null = null;

  const recipeWhy = (r: RecipeDef): string | null => {
    for (const input of r.inputs) {
      if (inv.countTag(input.tag) < input.count) return TAG_WHY[input.tag] ?? `Needs ${input.tag}`;
    }
    if (r.water > 0 && inv.cleanWater() < r.water) return `Needs clean water ${fmtLitres(r.water)} L`;
    if (r.tool && !inv.findTag(r.tool)) return `Needs ${r.tool}`;
    const player = deps.getPlayer();
    if (r.needsFire && !camp.nearFire(player.pos)) return 'Needs a fire';
    if (r.id === 'campfire' && WET_WEATHER.includes(deps.getWeather().kind) && !player.haven) return 'Too wet to light a fire here';
    if ((r.id === 'salt-wash' || r.id === 'spirit-wash' || r.id === 'scrape-seal') && !body.state.infection) return 'No infection to treat';
    if (r.id === 'mend-glaze' && !hasCrack(body.state.cracks)) return 'Nothing to mend';
    if (r.id === 'boil-water' && !hasDirtyVessel(inv)) return 'Nothing to boil';
    return null;
  };

  const complete = (action: UseAction): boolean => {
    if (action.kind === 'recipe' && action.recipe) return completeRecipe(action.recipe);
    if (!action.ref) return false;
    const stack = inv.get(action.ref);
    if (!stack) return false;
    const def = getItem(stack.def);
    switch (action.kind) {
      case 'eat':
        needs.eat(def);
        inv.take(action.ref, 1);
        bus.emit('ate', { def: def.id });
        return true;
      case 'drink':
        if (hasTag(stack.def, 'HOLD_LIQUID')) {
          // A container with no liquid left is not a drink; never fall through and consume it.
          if (!stack.liquid) return false;
          const liquid = stack.liquid;
          const clean = liquid.kind === 'clean';
          const sip = Math.min(LIQUID_SIP, liquid.litres);
          needs.drink(sip, clean);
          liquid.litres -= sip;
          if (liquid.litres <= 0.0001) delete stack.liquid;
          bus.emit('drank', { clean, litres: sip });
        } else {
          needs.drink(0.5, true);
          inv.take(action.ref, 1);
          bus.emit('drank', { clean: true, litres: 0.5 });
        }
        return true;
      case 'wear':
        return def.wear ? inv.move(action.ref, { where: 'worn', slot: def.wear }) : false;
      case 'unwear':
        return inv.move(action.ref, { where: 'pack', index: inv.state.pack.length });
      case 'hold':
        return inv.move(action.ref, { where: 'hand', index: 0 });
      case 'stow':
        return inv.move(action.ref, { where: 'pack', index: inv.state.pack.length });
      case 'drop':
        inv.take(action.ref, stack.count);
        return true;
    }
    return false;
  };

  const completeRecipe = (id: RecipeId): boolean => {
    const r = RECIPES.find((x) => x.id === id);
    const msgs = TREAT_MESSAGES[id] ?? { ok: 'Done.', fail: 'Nothing happens.' };
    const why = r ? recipeWhy(r) : 'Unknown recipe';
    let ok = why === null && r !== undefined;
    if (ok && r) ok = applyRecipe(r);
    bus.emit('recipe-done', { recipe: id, ok });
    bus.emit('hint', { text: ok ? msgs.ok : (why ?? msgs.fail) });
    return ok;
  };

  // Applies a recipe whose checks passed: consumes inputs, then runs the effect.
  const applyRecipe = (r: RecipeDef): boolean => {
    const player = deps.getPlayer();
    let burnHours = 0;
    let fireAt: { x: number; z: number } | null = null;
    if (r.id === 'campfire') {
      const fuel = r.inputs.find((i) => i.tag === 'FUEL');
      if (fuel) {
        const ref = inv.findTag('FUEL');
        const per = ref ? (getItem(inv.get(ref)!.def).props?.burnHours ?? 1) : 1;
        burnHours = per * fuel.count;
      }
      // Place the fire before spending anything: a refused spot must keep the tinder and fuel.
      const f = player.facing;
      const x = player.pos.x + Math.sin(f);
      const z = player.pos.z + Math.cos(f);
      if (!camp.placeFire(x, player.pos.y, z, FIRE.burnHoursPerFuel * burnHours)) return false;
      fireAt = { x, z };
    }
    for (const input of r.inputs) if (!inv.consumeTag(input.tag, input.count)) return false;
    if (r.water > 0 && inv.useWater(r.water) < r.water - 1e-6) return false;

    switch (r.id) {
      case 'campfire': {
        const { x, z } = fireAt!;
        const fs = inv.findTag('FIRESTARTER');
        const fstack = fs ? inv.get(fs) : null;
        if (fstack) fstack.condition = Math.max(0, fstack.condition - 1 / getItem(fstack.def).maxCondition);
        bus.emit('campfire-lit', { x, z });
        return true;
      }
      case 'salt-wash': return body.treat('salt-wash');
      case 'spirit-wash': return body.treat('spirit');
      case 'scrape-seal': return body.treat('scrape-seal');
      case 'mend-glaze': return body.mend();
      case 'boil-water': {
        const ref = inv.findTag('COOK_VESSEL');
        const vessel = ref ? inv.get(ref) : null;
        if (!vessel?.liquid || vessel.liquid.kind !== 'dirty') return false;
        vessel.liquid.kind = 'clean';
        return true;
      }
    }
    return true;
  };

  return {
    actionsFor(ref: StackRef): UseAction[] {
      const stack = inv.get(ref);
      if (!stack) return [];
      const def = getItem(stack.def);
      const out: UseAction[] = [];
      const worn = ref.where === 'worn';
      if (!worn && hasTag(stack.def, 'FOOD')) out.push({ id: 'eat', label: 'Eat', seconds: 2, kind: 'eat', ref });
      if (!worn && hasTag(stack.def, 'DRINK')) out.push({ id: 'drink', label: 'Drink', seconds: 2, kind: 'drink', ref });
      if (!worn && hasTag(stack.def, 'HOLD_LIQUID') && stack.liquid && stack.liquid.litres > 0) {
        out.push({ id: 'drink', label: 'Drink', seconds: 2, kind: 'drink', ref });
      }
      if (def.wear) {
        out.push(worn
          ? { id: 'unwear', label: 'Take off', seconds: 1, kind: 'unwear', ref }
          : { id: 'wear', label: 'Wear', seconds: 1, kind: 'wear', ref });
      }
      if (ref.where === 'pack') out.push({ id: 'hold', label: 'Hold', seconds: 0, kind: 'hold', ref });
      if (ref.where === 'hand') out.push({ id: 'stow', label: 'Put away', seconds: 0, kind: 'stow', ref });
      out.push({ id: 'drop', label: 'Drop (lost)', seconds: 0, kind: 'drop', ref });
      return out;
    },

    recipes() {
      return RECIPES.map((def) => {
        const why = recipeWhy(def);
        return { def, ok: why === null, why };
      });
    },

    start(action: UseAction): boolean {
      if (current) return false;
      if (action.kind === 'recipe') {
        const r = action.recipe ? RECIPES.find((x) => x.id === action.recipe) : undefined;
        if (!r || recipeWhy(r) !== null) return false;
      } else if (action.ref && !inv.get(action.ref)) {
        return false;
      }
      if (action.seconds <= 0) return complete(action);
      current = { action, t: 0 };
      return true;
    },

    update(dt: number): void {
      if (!current) return;
      current.t += dt;
      if (current.t < current.action.seconds) return;
      const done = current.action;
      current = null;
      complete(done);
    },

    busy() {
      if (!current) return null;
      return { label: current.action.label, progress: Math.min(1, current.t / current.action.seconds) };
    },

    cancel() { current = null; },
  };
}

function hasCrack(cracks: Record<BodyPart, CrackLevel>): boolean {
  return BODY_PARTS.some((p) => cracks[p] > 0);
}

function hasDirtyVessel(inv: InventorySystem): boolean {
  const ref = inv.findTag('COOK_VESSEL');
  const vessel = ref ? inv.get(ref) : null;
  return vessel?.liquid?.kind === 'dirty';
}
