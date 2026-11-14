// Cutting grass: by hand with E, or automatically by pushing/driving an owned mower over grown tiles. Q cycles tools.
import type { Ctx, MowerModel, System, ToolId } from './config';
import { KEYS, TILE_SIZE, TOOL_ORDER, TOOLS } from './config';
import { burnFuel, cutTile, notify, tileAt, toolHasFuel, nightAmount } from './rules';
import { createMowerModel } from './mowerModels';
import { sfx, setEngine } from './audio';

const HAND_NOTIFY_COOLDOWN = 2; // seconds between "Grass is not grown yet" toasts
const ENGINE_FULL_SPEED = 5;    // m/s at which the engine reaches full level

export function createMowing(ctx: Ctx): System {
  const { state, input, scene } = ctx;
  const models: Partial<Record<ToolId, MowerModel>> = {};
  let clock = 0;
  let lastHandNotify = -Infinity;
  let warnedNoFuel = false;

  /** Returns the model for a tool, creating it on first use. */
  function modelFor(id: ToolId): MowerModel | null {
    const def = TOOLS[id];
    if (def.model === null) return null;
    let m = models[id];
    if (!m) {
      m = createMowerModel(def.model);
      m.group.scale.setScalar(def.modelScale);
      m.setNight(0);
      scene.add(m.group);
      models[id] = m;
    }
    return m;
  }

  return {
    update(dt: number) {
      clock += dt;
      const player = state.player;
      const pos = player.position;
      const vel = player.velocity;
      const speed = Math.hypot(vel.x, vel.z);
      const facing = player.facing;
      const forwardX = Math.sin(facing);
      const forwardZ = Math.cos(facing);

      // Tool cycle: next owned tool in TOOL_ORDER, wrapping.
      if (state.mode === 'play' && input.pressed(KEYS.tool)) {
        const idx = TOOL_ORDER.indexOf(state.equipped);
        for (let k = 1; k <= TOOL_ORDER.length; k++) {
          const cand = TOOL_ORDER[(idx + k) % TOOL_ORDER.length];
          if (state.tools[cand]) {
            state.equipped = cand;
            break;
          }
        }
        notify(state, 'Equipped ' + TOOLS[state.equipped].name);
        sfx('click');
      }

      const equipped = state.equipped;
      const def = TOOLS[equipped];

      // Show only the equipped tool's model and place it.
      let cutX = pos.x;
      let cutZ = pos.z;
      for (const id of TOOL_ORDER) {
        if (id !== equipped && models[id]) models[id]!.group.visible = false;
      }
      const shown = modelFor(equipped);
      if (shown && player.swimming) shown.group.visible = false;
      else if (shown) {
        shown.group.visible = true;
        shown.setNight(nightAmount(state));
        if (equipped === 'riding') {
          shown.group.position.set(pos.x, pos.y, pos.z);
        } else {
          const off = 0.9 * def.modelScale;
          shown.group.position.set(pos.x + forwardX * off, pos.y, pos.z + forwardZ * off);
        }
        shown.group.rotation.y = facing;
        shown.animate(dt, speed);
        cutX = shown.group.position.x;
        cutZ = shown.group.position.z;
      }

      if (state.mode === 'play' && !player.swimming) {
        if (equipped === 'hands') {
          // Hand cutting: E cuts the tile under the player (unless E is grabbing floating junk this frame).
          if (input.pressed(KEYS.interact) && !state.canGrab) {
            const tile = tileAt(state, pos.x, pos.z);
            if (tile) {
              const gained = cutTile(state, tile, TOOLS.hands.yieldMult);
              if (gained > 0) sfx('cut');
              else if (clock - lastHandNotify >= HAND_NOTIFY_COOLDOWN) {
                notify(state, 'Grass is not grown yet');
                lastHandNotify = clock;
              }
            }
          }
        } else if (speed > 0.5 && toolHasFuel(state)) {
          // Mower cutting: every grown tile within the cut radius of the mower.
          for (const t of state.tiles.values()) {
            const dist = Math.hypot(t.i * TILE_SIZE - cutX, t.j * TILE_SIZE - cutZ);
            if (dist > def.radius) continue;
            const g = cutTile(state, t, def.yieldMult);
            if (g > 0) {
              sfx('cut');
              burnFuel(state, def.fuelPerCut);
            }
          }
        }
      }

      // Out of fuel warning: once, re-armed only after fuel was above 0.
      if (def.fuelPerCut > 0) {
        if (state.inv.fuel <= 0) {
          if (!warnedNoFuel) {
            notify(state, def.name + ' is out of fuel! Switch with Q.');
            warnedNoFuel = true;
          }
        } else warnedNoFuel = false;
      } else if (state.inv.fuel > 0) {
        warnedNoFuel = false;
      }

      // Engine sound: only for fuel-burning tools that have fuel.
      let level = 0;
      if (def.fuelPerCut > 0 && state.inv.fuel > 0 && state.mode !== 'title') {
        level = 0.3 + 0.7 * Math.min(1, speed / ENGINE_FULL_SPEED);
      }
      setEngine(level);
    },
  };
}
