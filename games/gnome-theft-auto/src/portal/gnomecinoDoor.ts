// The Gnomecino's velvet rope in Turfton: a portal door into Club Gnome's Gnomecino (@lawn/portal). Walking in opens the
// shared hall over the game; the GTA world is only parked (the player's pose sits inside the walls) and the GTA audio
// fades out until the player walks back through the rope.
import { createPortalHost, type LedgerEntry } from '@lawn/portal';
import { getAchievement } from '@lawn/achievements';
import { buyItem, earnAcorns, loadOakcount, spendAcorns, spendChips, winChips } from '@lawn/oakcount';
import type { GtaNet } from '../net';
import { getAudioOutput } from '../audio';
import type { Hud, Player } from '../types';

/** The rope's door, on the building's west face. */
export const GNOMECINO_DOOR = { x: 74.5, z: -30, range: 2.6 } as const;
/** Outside the door, facing west (forward = (sin yaw, cos yaw)). */
export const GNOMECINO_RETURN = { x: 72.3, z: -30, yaw: -Math.PI / 2 } as const;
/** Where a GTA player is parked while inside: hidden by the walls. */
export const GNOMECINO_INSIDE = { x: 84, z: -30 } as const;

const FOOTPRINT = { minX: 77, maxX: 103, minZ: -43, maxZ: -17 } as const;
const PORTAL_ID = 'gnomecino';
const COUNT_TTL_MS = 500;
const FADE_TAU_S = 0.08;

/** The building's footprint (x 77..103, z -43..-17): GTA players parked in it count as inside. */
export function insideFootprint(x: number, z: number): boolean {
  return x >= FOOTPRINT.minX && x <= FOOTPRINT.maxX && z >= FOOTPRINT.minZ && z <= FOOTPRINT.maxZ;
}

export interface GnomecinoDoorDeps {
  ui: HTMLElement;
  hud: Hud;
  player: Player;
  net: GtaNet;
  remotes: { blips(): { x: number; z: number; name: string; id: number }[] };
  tracker: { unlock(id: string): Promise<unknown> };
  room: string | null;
  me: { name: string; code: string } | null;
}

export interface GnomecinoDoor {
  readonly active: boolean;
  readonly door: { x: number; z: number };
  /** Door prompt or null. Cheap away from the door (null at once beyond 12 m on either axis). */
  prompt(heat: number): string | null;
  /** E / action at the door. Heat: a toast from Big Lou. Otherwise walks in. */
  interact(heat: number): void;
  /** Every frame while active, instead of the world: parks the player's pose inside the building. */
  idle(dt: number): void;
  /** Walk in from where the player stands (tests use it). False when already inside. */
  enterNow(): boolean;
}

export function createGnomecinoDoor(deps: GnomecinoDoorDeps): GnomecinoDoor {
  const { player, hud, net, remotes, tracker } = deps;

  // The GTA master gain as it was before the fade; null while not faded.
  let gainBeforeFade: number | null = null;

  const setGain = (target: number): void => {
    const out = getAudioOutput();
    if (!out) return;
    out.master.gain.setTargetAtTime(target, out.ctx.currentTime, FADE_TAU_S);
  };

  const host = createPortalHost({
    game: 'gnome-theft-auto',
    ui: deps.ui,
    returnLabel: 'Back to Turfton',
    title: (id) => getAchievement(id)?.title ?? id,
    apply: {
      chips(d: number) {
        void loadOakcount().then(() => {
          if (d > 0) winChips(d);
          else spendChips(-d);
        });
      },
      acorns(d: number) {
        void loadOakcount().then(() => {
          if (d > 0) earnAcorns(d);
          else spendAcorns(-d);
        });
      },
      item(id: string) {
        void loadOakcount().then(() => buyItem(id, 0, 'chips'));
      },
      achievement(id: string) {
        void tracker.unlock(id);
      },
      note: () => undefined,
    },
    onShown() {
      void tracker.unlock('gta-gnomecino-visit');
    },
    onExit(frame, settled: LedgerEntry[], summary: string[]) {
      player.respawn(frame.ret.x, frame.ret.z, frame.ret.yaw);
      if (gainBeforeFade !== null) {
        setGain(gainBeforeFade);
        gainBeforeFade = null;
      }
      hud.toast(
        summary.length ? `Back from The Gnomecino: ${summary.join(', ')}` : 'Back on the Greenhouse Strip.',
        5000,
      );
      const chipNet = settled
        .filter((e) => e.kind === 'chips')
        .reduce((sum, e) => sum + (e.amount ?? 0), 0);
      if (chipNet > 0) void tracker.unlock('gta-gnomecino-winnings');
    },
  });

  // Resume after a reload that happened inside: put the player back at the rope.
  const resumed = host.resume();
  if (resumed.frame) {
    player.respawn(resumed.frame.ret.x, resumed.frame.ret.z, resumed.frame.ret.yaw);
    hud.toast('You stepped back out of The Gnomecino.');
  }

  // Head count cache: the prompt is asked every frame near the door.
  let countAt = -Infinity;
  let countValue = 0;
  const insideCount = (): number => {
    const now = performance.now();
    if (now - countAt < COUNT_TTL_MS) return countValue;
    let gtaInside = 0;
    for (const b of remotes.blips()) if (insideFootprint(b.x, b.z)) gtaInside++;
    countValue = Math.max(gtaInside, host.insideCount(PORTAL_ID) ?? 0);
    countAt = now;
    return countValue;
  };

  const nearDoor = (): boolean => {
    const dx = player.x - GNOMECINO_DOOR.x;
    const dz = player.z - GNOMECINO_DOOR.z;
    if (Math.abs(dx) > 12 || Math.abs(dz) > 12) return false;
    return Math.hypot(dx, dz) <= GNOMECINO_DOOR.range;
  };

  const enterNow = (): boolean => {
    if (host.active) return false;
    const f = host.enter(
      PORTAL_ID,
      { x: GNOMECINO_RETURN.x, y: player.y, z: GNOMECINO_RETURN.z, yaw: GNOMECINO_RETURN.yaw },
      { room: deps.room, name: deps.me?.name ?? null, look: deps.me?.code ?? null },
    );
    if (!f) return false;
    const out = getAudioOutput();
    if (out && gainBeforeFade === null) {
      gainBeforeFade = out.master.gain.value;
      setGain(0);
    }
    return true;
  };

  return {
    get active() {
      return host.active;
    },
    door: { x: GNOMECINO_DOOR.x, z: GNOMECINO_DOOR.z },
    prompt(heat) {
      if (player.vehicle || player.airborne) return null;
      if (!nearDoor()) return null;
      if (heat > 0) return 'The Gnomecino: no heat past the rope';
      const n = insideCount();
      return n > 0 ? `Enter The Gnomecino (${n} inside)` : 'Enter The Gnomecino';
    },
    interact(heat) {
      if (!nearDoor()) return;
      if (heat > 0) {
        hud.toast("Big Lou: 'No heat past the rope.'");
        return;
      }
      enterNow();
    },
    idle(_dt) {
      net.setPose({
        x: GNOMECINO_INSIDE.x,
        y: player.y,
        z: GNOMECINO_INSIDE.z,
        yaw: player.yaw,
        veh: -1,
        tint: 0,
        moving: false,
        aiming: false,
        hurt: false,
        chute: false,
        ride: null,
        pitch: 0,
      });
    },
    enterNow,
  };
}
