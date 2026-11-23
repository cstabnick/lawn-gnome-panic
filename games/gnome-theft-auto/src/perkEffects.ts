// Applies the side-quest perks (perks.ts) to the running game (roadmap docs/roadmaps/gta-world-events-and-rewards.md).
// createPerkEffects wraps a few methods ON the passed objects (economy, player) so the rest of the game picks up the
// perk effects without knowing about them. No DOM here.
import { GOLDEN_ACORN_SPOTS, STOPPING_SHARD_SPOTS, loadCollected } from './easterEggs';
import type { Economy } from './economy';
import { districtAt } from './districts';
import { PRICE_PERKS, activePerks, perkActive, perkDef, priceScaleFor, takeNewPerks } from './perks';
import type { Blip, Hud, Player, Sfx, Watch } from './types';

export interface PerkEffectDeps {
  economy: Economy;
  watch: Watch;
  player: Player;
  hud: Hud;
  play?: (s: Sfx) => void;
  /** Unlock an achievement by id ('gta-perks-of-the-job'). */
  unlock?: (id: string) => void;
}

export interface PerkEffects {
  /** Every frame (heal, heat cooling, pension, unlock toasts). */
  update(dt: number): void;
  /** Map markers from perks (nearest Golden Acorn / Stopping Shard). */
  blips(): Blip[];
}

const PLAY_BEFORE_CHECK_S = 6;
const CHECK_EVERY_S = 2;
const PENSION_EVERY_S = 180;
const PENSION_ACORNS = 15;
const JOURNAL_UNLOCK_COUNT = 6;
const BLIP_EVERY_S = 2;

/** The perk name for a spend reason, when an active perk discounts it (for the toast). */
function discountPerkName(reason: string | undefined): string | undefined {
  if (!reason) return undefined;
  const active = activePerks();
  let best: { perk: string; scale: number } | undefined;
  for (const p of PRICE_PERKS) {
    if (!active.has(p.perk) || !p.reasons.includes(reason)) continue;
    if (!best || p.scale < best.scale) best = { perk: p.perk, scale: p.scale };
  }
  return best ? perkDef(best.perk)?.name : undefined;
}

export function createPerkEffects(deps: PerkEffectDeps): PerkEffects {
  const { economy, watch, player, hud, play, unlock } = deps;

  // ---- Price and earn wrappers (installed once, on the shared objects). ----
  const origSpend = economy.spend.bind(economy);
  economy.spend = (amount: number, reason?: string): boolean => {
    const s = priceScaleFor(reason, activePerks());
    if (s >= 1) return origSpend(amount, reason);
    const cost = Math.round(amount * s);
    const ok = origSpend(cost, reason);
    if (ok && amount - cost > 0) {
      hud.toast(`${discountPerkName(reason) ?? 'Perk'}: saved ${amount - cost} Acorns`, 2500);
    }
    return ok;
  };

  const origEarn = economy.earn.bind(economy);
  economy.earn = (amount: number, reason?: string): void => {
    const boosted = reason === 'Speed Trap Daredevil' && perkActive('rookie-plate') ? Math.round(amount * 1.25) : amount;
    origEarn(boosted, reason);
  };

  // origEarn above is the unwrapped earn: refunds and pension go through it so they are not boosted twice.
  const origCharge = economy.chargeHospital.bind(economy);
  economy.chargeHospital = () => {
    const r = origCharge();
    if (perkActive('porcelain-charm') && r.fee > 0) {
      const back = Math.floor(r.fee / 2);
      origEarn(back, 'Porcelain-Glaze Charm');
      r.receipt += ` PORCELAIN CHARM: ${back} Acorns refunded.`;
    }
    return r;
  };

  const origHurt = player.hurt.bind(player);
  player.hurt = (amount: number): void => {
    origHurt(perkActive('thick-glaze') ? amount * 0.9 : amount);
  };

  // ---- Per-frame state. ----
  let playT = 0;
  let checkT = 0;
  let pensionT = 0;
  let journalUnlocked = false;

  let blipT = Infinity;
  let blipCache: Blip[] = [];

  function playerXZ(): { x: number; z: number } {
    return player.vehicle ? { x: player.vehicle.x, z: player.vehicle.z } : { x: player.x, z: player.z };
  }

  function announceNewPerks(): void {
    for (const p of takeNewPerks()) {
      hud.banner('PERK UNLOCKED', 2500);
      hud.toast(`${p.name}: ${p.text}`, 7000);
      play?.('stunt');
    }
    if (!journalUnlocked && activePerks().size >= JOURNAL_UNLOCK_COUNT) {
      journalUnlocked = true;
      unlock?.('gta-perks-of-the-job');
    }
  }

  function update(dt: number): void {
    playT += dt;
    if (playT >= PLAY_BEFORE_CHECK_S) {
      checkT += dt;
      if (checkT >= CHECK_EVERY_S) {
        checkT = 0;
        announceNewPerks();
      }
    }

    const { x: px, z: pz } = playerXZ();

    // alley-clearance: Watch heat under 3 cools faster inside Turfton.
    if (perkActive('alley-clearance') && watch.heat > 0 && watch.heat < 3 && districtAt(px, pz) !== null) {
      watch.heat = Math.max(0, watch.heat - 0.025 * dt);
    }
    // audit-paperwork: heat below one hat fades three times faster.
    if (perkActive('audit-paperwork') && watch.heat > 0 && watch.heat < 1) {
      watch.heat = Math.max(0, watch.heat - 0.16 * dt);
    }
    // castaway-float: cracks mend slowly while swimming.
    if (perkActive('castaway-float') && player.swimming && player.health > 0) {
      player.health = Math.min(1, player.health + 0.01 * dt);
    }
    // bracken-blessing: on foot outside Turfton, cracks mend slowly up to 60%.
    if (
      perkActive('bracken-blessing') && !player.vehicle && !player.swimming && districtAt(px, pz) === null &&
      player.health > 0 && player.health < 0.6
    ) {
      player.health = Math.min(0.6, player.health + 0.005 * dt);
    }
    // rebel-pension: +15 Acorns every 3 minutes of play.
    if (perkActive('rebel-pension')) {
      pensionT += dt;
      if (pensionT >= PENSION_EVERY_S) {
        pensionT -= PENSION_EVERY_S;
        origEarn(PENSION_ACORNS, "Brenda's Pension");
        hud.toast(`Brenda's Pension: +${PENSION_ACORNS} Acorns`, 3000);
      }
    }

    blipT += dt;
  }

  function blips(): Blip[] {
    if (blipT >= BLIP_EVERY_S) {
      blipT = 0;
      blipCache = computeBlips();
    }
    return blipCache;
  }

  function computeBlips(): Blip[] {
    const out: Blip[] = [];
    const { x: px, z: pz } = playerXZ();
    const collected = loadCollected();
    if (perkActive('biscuit-nose')) {
      const found = new Set(collected.acorns);
      const spot = nearest(GOLDEN_ACORN_SPOTS.filter((s) => !found.has(s.id)), px, pz);
      if (spot) out.push({ x: spot.x, z: spot.z, color: '#f7c927', quest: "Biscuit's Nose" });
    }
    if (perkActive('sonar-trinket')) {
      const found = new Set(collected.shards);
      const spot = nearest(STOPPING_SHARD_SPOTS.filter((s) => !found.has(s.id)), px, pz);
      if (spot) out.push({ x: spot.x, z: spot.z, color: '#38e89e', quest: 'Sonar Trinket' });
    }
    return out;
  }

  return { update, blips };
}

function nearest<T extends { x: number; z: number }>(list: readonly T[], x: number, z: number): T | undefined {
  let best: T | undefined;
  let bestD = Infinity;
  for (const s of list) {
    const d = (s.x - x) * (s.x - x) + (s.z - z) * (s.z - z);
    if (d < bestD) { bestD = d; best = s; }
  }
  return best;
}
