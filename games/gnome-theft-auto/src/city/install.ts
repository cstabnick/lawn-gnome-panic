// The city workstream's one hook into app.ts (docs/roadmaps/gta-city-lore-quests.md): the Kerbside Exchange phone app,
// the activity probes the Newcomers' Card tutorials watch (city/probes.ts), and the Newcomers' Card achievement.
// app.ts passes getters for the systems it owns, so nothing here imports them or runs at import time.
import type { Economy } from '../economy';
import type { Quests } from '../quests/quests';
import { NEWCOMER_CARD_ACHIEVEMENT, newcomerCardDone } from '../quests/newcomerQuests';
import type { Player } from '../types';
import { installKerbsideExchange, type ExchangeDeps } from './exchangeApp';
import { bumpProbe, declareCounter, installProbeEconomy, registerProbe } from './probes';

export interface CityHubDeps {
  ui: HTMLElement;
  phone: ExchangeDeps['phone'];
  quests: Pick<Quests, 'getJournal' | 'pinGiver'>;
  hud: ExchangeDeps['hud'];
  economy: Economy;
  player: Player;
  unlock(id: string): void;
  /** Live getters for the probes app.ts owns (each may throw before its system exists; probes read null then). */
  live: {
    wheelOpen(): boolean;
    kitOpen(): boolean;
    lockupStored(): number;
    /** Distance from the player to the nearest aircraft towing a sky banner, or Infinity. */
    bannerDist(): number;
    partyOn(): boolean;
  };
}

export interface CityHub {
  update(dt: number): void;
  /** The player played emote `id`; `pair` when it is a two-gnome (social) row. */
  noteEmote(pair: boolean): void;
  /** A street event the player joined ended well. */
  noteStreetEvent(): void;
}

const CARD_CHECK_S = 3;
const BANNER_NEAR = 150;

export function installCityHub(deps: CityHubDeps): CityHub {
  const exchange = installKerbsideExchange({ ui: deps.ui, phone: deps.phone, quests: deps.quests, hud: deps.hud, unlock: deps.unlock });
  installProbeEconomy(deps.economy);
  for (const id of ['emote', 'pair-emote', 'street-event']) declareCounter(id);
  const p = deps.player;
  registerProbe('wheel-open', () => (deps.live.wheelOpen() ? 1 : 0));
  registerProbe('kit-open', () => (deps.live.kitOpen() ? 1 : 0));
  registerProbe('lockup-stored', () => deps.live.lockupStored());
  registerProbe('banner-near', () => (deps.live.bannerDist() <= BANNER_NEAR ? 1 : 0));
  registerProbe('party-on', () => (deps.live.partyOn() ? 1 : 0));
  registerProbe('boat', () => (p.vehicle?.spec.boat ? 1 : 0));
  registerProbe('golf-cart', () => (p.vehicle?.kind === 'golf-cart' ? 1 : 0));

  let cardT = 0;
  let cardSent = false;
  return {
    update(dt) {
      exchange.update(dt);
      cardT += dt;
      if (cardSent || cardT < CARD_CHECK_S) return;
      cardT = 0;
      if (newcomerCardDone(deps.quests.getJournal().saves)) {
        cardSent = true;
        deps.unlock(NEWCOMER_CARD_ACHIEVEMENT);
      }
    },
    noteEmote(pair) {
      bumpProbe('emote');
      if (pair) bumpProbe('pair-emote');
    },
    noteStreetEvent() {
      bumpProbe('street-event');
    },
  };
}
