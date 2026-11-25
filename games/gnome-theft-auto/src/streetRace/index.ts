// E26 street racing, composed for app.ts: the three meets (meetScene.ts), the race-mode session (session.ts), the
// bookies' prompts and wager panels, and the online link. app.ts makes one call (createStreetRacing) and then only
// forwards update, blips, prompt, interact and setNet.
import type * as THREE from 'three';
import type { Area, AreaDeps } from '../dirtCountry/types';
import { TRACKS } from '../raceTrack/tracks';
import type { Blip, World } from '../types';
import { MEET_CAST } from './cast';
import { buildMeet } from './meetScene';
import { MEETS } from './meets';
import { createRaceSession, type RaceSessionDeps } from './session';
import { openWagerPanel, type WagerPanel } from './wagerPanel';
import { MEET_IDS, WAGERS, type MeetId, type RaceNet, type RaceResult, type RaceSession, type StreetMeet } from './types';

export interface StreetRacingDeps extends AreaDeps {
  /** The session's deps, less the online link (index.ts supplies that from setNet). */
  session: Omit<RaceSessionDeps, 'net'>;
  /** The game's #ui element: the wager panel is appended to it. */
  ui: HTMLElement;
}

export interface StreetRacing extends Area {
  readonly session: RaceSession;
  /** Near a bookie (on foot): "Talk to <name> (street races and wagers)", else null. */
  prompt(x: number, z: number): string | null;
  /** Open that bookie's wager panel. True when there was one to open. */
  interact(x: number, z: number): boolean;
  /** The online race link (online/install.ts), or null offline. */
  setNet(net: RaceNet | null): void;
}

/** How close (m) a player must stand to a bookie for the prompt and the panel. */
const BOOKIE_REACH = 3.5;

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

function ordinal(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  const suffix = ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th';
  return `${n}${suffix}`;
}

function fmtTime(t: number): string {
  const m = Math.floor(t / 60);
  return `${m}:${(t - m * 60).toFixed(1).padStart(4, '0')}`;
}

export function createStreetRacing(scene: THREE.Scene, world: World, deps: StreetRacingDeps): StreetRacing {
  let net: RaceNet | null = null;
  const session = createRaceSession({ ...deps.session, net: () => net });

  const areas: Area[] = MEET_IDS.map((id: MeetId) => buildMeet(scene, world, MEETS[id], MEET_CAST[id], deps));

  let panel: WagerPanel | null = null;
  /** The stake of the pickup race running now (0 = friendly), or null when none is running. */
  let pickupWager: number | null = null;
  let seenResult: RaceResult | null = session.lastResult();

  /** The meet whose bookie stands within reach of (x, z), or null. */
  function bookieNear(x: number, z: number): StreetMeet | null {
    for (const id of MEET_IDS) {
      const meet = MEETS[id];
      if (Math.hypot(meet.bookie.x - x, meet.bookie.z - z) <= BOOKIE_REACH) return meet;
    }
    return null;
  }

  function announce(r: RaceResult): void {
    if (r.kind !== 'pickup' || r.time === null) return;
    const wager = pickupWager ?? 0;
    pickupWager = null;
    const meet = Object.values(MEETS).find((m) => (m.tracks as readonly string[]).includes(r.trackId));
    const cast = meet ? MEET_CAST[meet.id] : null;
    if (!cast) return;
    if (wager > 0 && r.place === 1) {
      deps.toast(`${pick(cast.bookie.winLines)} +${r.won} Acorns`);
    } else if (wager > 0) {
      deps.toast(pick(cast.bookie.loseLines));
    } else {
      deps.toast(`Finished ${ordinal(r.place)} in ${fmtTime(r.time)}`);
    }
  }

  function openBook(meet: StreetMeet): void {
    const cast = MEET_CAST[meet.id];
    const best = deps.session.store.data().best;
    panel = openWagerPanel({
      parent: deps.ui,
      title: `${cast.bookie.name}'s book`,
      line: cast.bookie.bubble,
      tracks: meet.tracks.map((id) => ({ id, name: TRACKS[id].name, best: best[id] ?? null })),
      wagers: WAGERS,
      acorns: deps.session.quest.economy?.state().acorns ?? 0,
      onPick: (trackId, wager) => {
        panel = null;
        const err = session.start({
          kind: 'pickup',
          trackId,
          vehicle: cast.pickupVehicle,
          laps: TRACKS[trackId].closed ? 2 : 1,
          rivals: cast.roster,
          wager,
          meetId: meet.id,
        });
        if (err !== null) {
          deps.toast(err);
        } else {
          pickupWager = wager;
          if (wager > 0) deps.toast(pick(cast.bookie.takeLines));
        }
      },
      onClose: () => {
        panel = null;
      },
    });
  }

  return {
    session,
    update(dt, px, pz, night) {
      for (const a of areas) a.update(dt, px, pz, night);
      session.update(dt);
      const r = session.lastResult();
      if (r !== seenResult) {
        seenResult = r;
        if (r) announce(r);
      }
    },
    blips(): Blip[] {
      return [...areas.flatMap((a) => a.blips()), ...session.blips()];
    },
    prompt(x, z) {
      if (session.active() !== null) return null;
      const meet = bookieNear(x, z);
      return meet ? `Talk to ${MEET_CAST[meet.id].bookie.name} (street races and wagers)` : null;
    },
    interact(x, z) {
      if (panel !== null || session.active() !== null) return false;
      const meet = bookieNear(x, z);
      if (!meet) return false;
      openBook(meet);
      return true;
    },
    setNet(n) {
      net = n;
      if (n) {
        n.onInvite = (l) => deps.toast(
          `${l.hostName} is hosting a race: ${TRACKS[l.trackId].name}. Open the Race Club to join.`,
        );
      }
    },
  };
}
