import { pickWhisper, type ActiveLore } from '../lore/registry';
import type { EntityId, TributeItemDef } from '../lore/types';
import { ENTITY_ANCHORS, PICKUP_SPOTS, resolvePlayerMove } from './apartment';
import type { PickupItem, SimInput, SimState } from './types';

const WALK_SPEED = 3.6;
const SHIFT_SECONDS = 240; // 4 minutes: 12:00 AM -> 6:00 AM

function nextRng(s: SimState): number {
  let t = (s.rngState += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function distXZ(ax: number, az: number, bx: number, bz: number): number {
  return Math.hypot(ax - bx, az - bz);
}

function setMessage(s: SimState, text: string, entity: EntityId, source: 'prod' | 'dev' | 'custom', ttl = 5.5): void {
  s.activeMessage = { text, entity, source, ttl };
}

function spawnPickup(s: SimState, itemDef: TributeItemDef, spotIndex?: number): void {
  if (s.pickups.length >= 6) return;
  const usedSpots = new Set(s.pickups.map((p) => `${p.x.toFixed(1)},${p.z.toFixed(1)}`));
  const candidates = PICKUP_SPOTS.filter((sp) => !usedSpots.has(`${sp.x.toFixed(1)},${sp.z.toFixed(1)}`));
  const spot =
    spotIndex !== undefined
      ? PICKUP_SPOTS[spotIndex % PICKUP_SPOTS.length]
      : candidates.length > 0
        ? candidates[Math.floor(nextRng(s) * candidates.length)]
        : PICKUP_SPOTS[Math.floor(nextRng(s) * PICKUP_SPOTS.length)];

  s.pickups.push({
    uid: s.nextPickupUid++,
    tributeId: itemDef.id,
    name: itemDef.name,
    shortLabel: itemDef.shortLabel,
    color: itemDef.color,
    x: spot.x,
    y: spot.y,
    z: spot.z,
  });
}

function chooseDesiredTribute(s: SimState, lore: ActiveLore): string {
  const accepted = lore.tributes.filter((t) => t.accepted);
  if (accepted.length === 0) return 'garlic_sauce';
  return accepted[Math.floor(nextRng(s) * accepted.length)].id;
}

export function createSim(seed: number, lore: ActiveLore): SimState {
  const sim: SimState = {
    seed,
    rngState: seed | 0 || 1337,
    timeSeconds: 0,
    shiftDurationSeconds: SHIFT_SECONDS,
    hour: 0,
    dread: 12,
    devotion: 30,
    pricePoints: 2,
    nextPickupUid: 1,

    player: {
      x: 0,
      z: 3.4,
      yaw: 0, // facing north (-Z) toward the Rotating Cone & Kitchen
      pitch: -0.05,
      flashlightOn: true,
      holdingItem: null,
      nearestEntity: null,
      nearestPickupUid: null,
      promptText: '',
      nodAnimTimer: 0,
      chirpCooldown: 0,
      walkBob: 0,
      isMoving: false,
    },

    cone: {
      angle: 0,
      rpm: 1.4,
      direction: 1,
      pausedTimer: 0,
      pauseCooldown: 28,
      tributeDueTimer: 26,
      acceptedCount: 0,
      desiredItemId: 'garlic_sauce',
      lastReaction: 'Rotating since Tuesday.',
    },

    fridge: {
      phase: 'idle',
      noteCount: 4,
      noteStep: 0,
      noteTimer: 0,
      waitTimer: 0,
      cooldown: 11,
      satisfiedCount: 0,
      pulseIntensity: 0,
    },

    microwave: {
      day: 4,
      phase: 'glowing',
      display: '0:00',
      towelTimer: 0,
      escalationTimer: 16,
      cooldown: 10,
    },

    smokeDetector: {
      blinks: 1,
      soonTimer: 0,
      cooldown: 24,
      ledFlashTimer: 0,
    },

    toaster: {
      ejected: false,
      cooldown: 14,
    },

    printer: {
      jammed: false,
      jamReason: 'Ready.',
      alarmTimer: 0,
      cooldown: 18,
      paidCount: 0,
    },

    tv: {
      on: true,
      timer: 15,
    },

    pickups: [],
    activeMessage: null,
    ledgerLog: [
      '[12:00 AM] Tribute Schedule active. Keep Dread below 100% until 6:00 AM.',
      '[12:00 AM] Scammed at 2 price points (kibble / granola).',
    ],
    ambientWhisperTimer: 6,

    events: {
      fridgeNoteIndex: -1,
      smokeChirp: false,
      toasterPop: false,
      printerJam: false,
      coneStop: false,
      nodPerformed: false,
      chirpPerformed: false,
      tributeAccepted: false,
      tributeRejected: false,
    },

    outcome: 'playing',
    outcomeReason: '',
  };

  sim.cone.desiredItemId = chooseDesiredTribute(sim, lore);

  // Seed initial pickups around the apartment
  const accepted = lore.tributes.filter((t) => t.accepted);
  const warranty = lore.tributes.find((t) => !t.accepted);
  if (accepted.length > 0) {
    spawnPickup(sim, accepted[0], 0);
    spawnPickup(sim, accepted[Math.min(1, accepted.length - 1)], 1);
    spawnPickup(sim, accepted[Math.min(2, accepted.length - 1)], 3);
  }
  if (warranty) {
    spawnPickup(sim, warranty, 4);
  }

  setMessage(
    sim,
    'The cone arrived early and has been rotating since Tuesday. Keep the tribute schedule until 6:00 AM.',
    'cone',
    'prod',
    6.5,
  );

  return sim;
}

function resetFrameEvents(s: SimState): void {
  s.events.fridgeNoteIndex = -1;
  s.events.smokeChirp = false;
  s.events.toasterPop = false;
  s.events.printerJam = false;
  s.events.coneStop = false;
  s.events.nodPerformed = false;
  s.events.chirpPerformed = false;
  s.events.tributeAccepted = false;
  s.events.tributeRejected = false;
}

function updateTargetsAndPrompt(s: SimState, lore: ActiveLore): void {
  const px = s.player.x;
  const pz = s.player.z;

  // Check nearest pickup first if hands are empty
  let bestPickup: PickupItem | null = null;
  let bestPickupDist = 1.9;
  if (!s.player.holdingItem) {
    for (const p of s.pickups) {
      const d = distXZ(px, pz, p.x, p.z);
      if (d < bestPickupDist) {
        bestPickupDist = d;
        bestPickup = p;
      }
    }
  }
  s.player.nearestPickupUid = bestPickup ? bestPickup.uid : null;

  // Check nearest interactive entity
  let bestEntity: EntityId | null = null;
  let bestEntityDist = Infinity;
  const interactive: EntityId[] = ['cone', 'fridge', 'microwave', 'toaster', 'printer', 'tv'];
  for (const id of interactive) {
    const anc = ENTITY_ANCHORS[id];
    const d = distXZ(px, pz, anc.x, anc.z);
    if (d <= anc.interactRadius && d < bestEntityDist) {
      bestEntityDist = d;
      bestEntity = id;
    }
  }
  s.player.nearestEntity = bestEntity;

  // Build context prompt
  if (s.smokeDetector.blinks === 2) {
    s.player.promptText = `[C] Chirp Back at Smoke Detector ("SOON" - ${Math.ceil(s.smokeDetector.soonTimer)}s)`;
    return;
  }
  if (s.fridge.phase === 'waiting_nod') {
    s.player.promptText = `[SPACE] Nod Along to Fridge (${s.fridge.noteCount} notes)`;
    return;
  }

  if (bestEntity === 'cone') {
    if (s.player.holdingItem) {
      s.player.promptText = `[E] Offer "${s.player.holdingItem.shortLabel}" to the Cone`;
    } else {
      const desired = lore.tributes.find((t) => t.id === s.cone.desiredItemId);
      s.player.promptText = `Cone desires: ${desired ? desired.shortLabel : 'Offering'} (${Math.ceil(s.cone.tributeDueTimer)}s)`;
    }
    return;
  }

  if (bestPickup) {
    s.player.promptText = `[E] Pick up ${bestPickup.shortLabel}`;
    return;
  }

  if (bestEntity === 'microwave' && s.microwave.phase !== 'idle' && s.microwave.towelTimer <= 0) {
    s.player.promptText = `[E] Cover Microwave with Dish Towel (${s.microwave.display})`;
    return;
  }

  if (bestEntity === 'printer' && s.printer.jammed) {
    s.player.promptText = `[E] Pay Scam Toll / Clear Printer (${Math.ceil(s.printer.alarmTimer)}s)`;
    return;
  }

  if (bestEntity === 'fridge') {
    s.player.promptText = s.fridge.phase === 'singing' ? 'Listen... wait for the pause, then [SPACE] Nod' : 'The Fridge (4+ notes)';
    return;
  }

  if (bestEntity === 'tv') {
    s.player.promptText = '[E] Inspect Horse Hockey Broadcast';
    return;
  }

  s.player.promptText = s.player.holdingItem
    ? `Holding: ${s.player.holdingItem.shortLabel} — bring to Cone`
    : 'Explore the apartment. Listen to the appliances.';
}

export function stepSim(s: SimState, input: SimInput, dt: number, lore: ActiveLore): void {
  if (s.outcome !== 'playing') return;
  resetFrameEvents(s);

  s.timeSeconds += dt;
  s.hour = Math.min(6, Math.floor((s.timeSeconds / s.shiftDurationSeconds) * 6));

  if (s.timeSeconds >= s.shiftDurationSeconds) {
    s.outcome = 'survived';
    s.outcomeReason = '6:00 AM. The cone slows down. You survived the Tribute Schedule.';
    return;
  }

  // Player look & movement
  s.player.yaw += input.lookYawDelta;
  s.player.pitch = clamp(s.player.pitch + input.lookPitchDelta, -1.15, 1.15);

  if (input.toggleFlashlight) {
    s.player.flashlightOn = !s.player.flashlightOn;
  }

  const moveLen = Math.hypot(input.moveX, input.moveZ);
  s.player.isMoving = moveLen > 0.05;
  if (s.player.isMoving) {
    const nx = input.moveX / Math.max(1, moveLen);
    const nz = input.moveZ / Math.max(1, moveLen);
    // Forward is -Z when yaw = 0
    const sinY = Math.sin(s.player.yaw);
    const cosY = Math.cos(s.player.yaw);
    const worldDx = (nx * cosY + nz * sinY) * WALK_SPEED * dt;
    const worldDz = (-nx * sinY + nz * cosY) * WALK_SPEED * dt;
    const nextPos = resolvePlayerMove(s.player.x, s.player.z, worldDx, worldDz);
    s.player.x = nextPos.x;
    s.player.z = nextPos.z;
    s.player.walkBob += dt * 9;
  }

  if (s.player.nodAnimTimer > 0) s.player.nodAnimTimer = Math.max(0, s.player.nodAnimTimer - dt);
  if (s.player.chirpCooldown > 0) s.player.chirpCooldown = Math.max(0, s.player.chirpCooldown - dt);

  // Active message TTL
  if (s.activeMessage) {
    s.activeMessage.ttl -= dt;
    if (s.activeMessage.ttl <= 0) s.activeMessage = null;
  }

  // --- CONE ---
  if (s.hour >= 3 && s.cone.direction === 1) {
    s.cone.direction = -1;
    setMessage(s, '3:00 AM. The cone reversed its rotation. Offerings reorganized into a queue.', 'cone', 'prod', 6);
    s.ledgerLog.push('[3:00 AM] Cone reversed rotation (counterclockwise).');
  }

  if (s.cone.pausedTimer > 0) {
    s.cone.pausedTimer -= dt;
    if (s.player.isMoving) {
      s.dread += 3.5 * dt; // Moving during the sacred pause raises dread
    }
  } else {
    s.cone.angle += s.cone.direction * s.cone.rpm * dt;
    s.cone.pauseCooldown -= dt;
    if (s.cone.pauseCooldown <= 0 && s.hour >= 1) {
      s.cone.pausedTimer = 4.0;
      s.cone.pauseCooldown = 34 + nextRng(s) * 18;
      s.events.coneStop = true;
      setMessage(s, 'The cone stopped rotating. Stand still. Do not question the pause.', 'cone', 'prod', 4.5);
    }
  }

  s.cone.tributeDueTimer -= dt;
  if (s.cone.tributeDueTimer <= 0) {
    s.dread += 12;
    s.cone.rpm = Math.min(3.2, s.cone.rpm + 0.25);
    s.cone.tributeDueTimer = 24;
    setMessage(s, 'Offerings are late. The cone hums louder and spins faster.', 'cone', 'prod', 5);
    // Ensure there are pickups available
    const accepted = lore.tributes.filter((t) => t.accepted);
    if (accepted.length > 0 && s.pickups.length < 3) {
      spawnPickup(s, accepted[Math.floor(nextRng(s) * accepted.length)]);
    }
  }

  // --- FRIDGE ---
  if (s.fridge.phase === 'idle') {
    s.fridge.cooldown -= dt;
    s.fridge.pulseIntensity = Math.max(0, s.fridge.pulseIntensity - dt * 2);
    if (s.fridge.cooldown <= 0) {
      s.fridge.phase = 'singing';
      s.fridge.noteCount = Math.min(7, 4 + Math.floor(s.hour / 2));
      s.fridge.noteStep = 0;
      s.fridge.noteTimer = 0.05;
    }
  } else if (s.fridge.phase === 'singing') {
    s.fridge.noteTimer -= dt;
    s.fridge.pulseIntensity = 0.6;
    if (s.fridge.noteTimer <= 0) {
      if (s.fridge.noteStep < s.fridge.noteCount) {
        s.events.fridgeNoteIndex = s.fridge.noteStep;
        s.fridge.noteStep++;
        s.fridge.noteTimer = 0.48;
      } else {
        s.fridge.phase = 'waiting_nod';
        s.fridge.waitTimer = 7.5;
        setMessage(s, 'The fridge finished its notes and is waiting for you to [SPACE] Nod.', 'fridge', 'prod', 5);
      }
    }
  } else if (s.fridge.phase === 'waiting_nod') {
    s.fridge.waitTimer -= dt;
    s.fridge.pulseIntensity = 1.0;
    if (s.fridge.waitTimer <= 0) {
      s.fridge.phase = 'idle';
      s.fridge.cooldown = 16 + nextRng(s) * 8;
      s.dread += 11;
      setMessage(s, 'You did not nod along. The fridge is starting over, slower.', 'fridge', 'prod', 5);
    }
  }

  // --- MICROWAVE & BURRITO ---
  if (s.microwave.towelTimer > 0) {
    s.microwave.towelTimer -= dt;
    s.microwave.phase = 'idle';
  } else {
    s.microwave.escalationTimer -= dt;
    if (s.microwave.escalationTimer <= 0) {
      s.microwave.escalationTimer = 14 + nextRng(s) * 8;
      if (s.microwave.phase === 'idle') {
        s.microwave.phase = 'glowing';
        s.microwave.display = '0:00';
      } else if (s.microwave.phase === 'glowing') {
        s.microwave.phase = 'pulsing';
        s.microwave.display = 'HELP';
        setMessage(s, 'Microwave display reads HELP. The counter burrito shifted.', 'microwave', 'prod', 5);
      } else if (s.microwave.phase === 'pulsing') {
        s.microwave.phase = 'morse';
        s.microwave.display = 'SNACK';
        setMessage(s, 'Defrost button pulses Morse code: S-N-A-C-K. Cover it with a towel!', 'microwave', 'prod', 5);
      } else {
        s.microwave.phase = 'threat';
        s.microwave.day = Math.min(12, s.microwave.day + 1);
        s.dread += 10;
      }
    }
    if (s.microwave.phase === 'threat') {
      s.dread += 2.2 * dt;
    }
  }

  // --- SMOKE DETECTOR ---
  s.smokeDetector.ledFlashTimer += dt;
  if (s.smokeDetector.blinks === 1) {
    s.smokeDetector.cooldown -= dt;
    if (s.smokeDetector.cooldown <= 0) {
      s.smokeDetector.blinks = 2;
      s.smokeDetector.soonTimer = 15;
      s.events.smokeChirp = true;
      setMessage(s, 'SMOKE DETECTOR BLINKED TWICE ("SOON"). Press [C] to Chirp Back!', 'smoke_detector', 'prod', 6);
    }
  } else if (s.smokeDetector.blinks === 2) {
    s.smokeDetector.soonTimer -= dt;
    if (s.smokeDetector.soonTimer <= 0) {
      s.smokeDetector.blinks = 3;
      s.outcome = 'three_blinks';
      s.outcomeReason = 'The smoke detector blinked three times. You found out what a three-blink household looks like.';
      return;
    }
  }

  // --- TOASTER ---
  s.toaster.cooldown -= dt;
  if (s.toaster.cooldown <= 0) {
    s.toaster.cooldown = 20 + nextRng(s) * 14;
    s.toaster.ejected = true;
    s.events.toasterPop = true;
    const toastDef = lore.tributes.find((t) => t.id === 'premonition_toast') ?? lore.tributes[0];
    if (toastDef) {
      spawnPickup(s, toastDef, 2); // right end of kitchen counter
    }
  }

  // --- PRINTER & SCAM LEDGER ---
  if (!s.printer.jammed) {
    s.printer.cooldown -= dt;
    if (s.printer.cooldown <= 0) {
      const scam = lore.scams[Math.floor(nextRng(s) * Math.max(1, lore.scams.length))];
      s.printer.jammed = true;
      s.printer.jamReason = scam ? `${scam.item}: ${scam.scamText}` : 'Out of yellow ink.';
      s.printer.alarmTimer = 22;
      s.events.printerJam = true;
      setMessage(s, `Printer hostage in hallway: ${scam ? scam.item : 'Out of yellow ink'}.`, 'printer', scam?.sourceServer ?? 'dev', 5.5);
    }
  } else {
    s.printer.alarmTimer -= dt;
    if (s.printer.alarmTimer <= 0) {
      s.printer.jammed = false;
      s.printer.cooldown = 22 + nextRng(s) * 10;
      s.pricePoints += 1;
      s.dread += 14;
      s.ledgerLog.push(`[Hour ${s.hour}] Unpaid toll: Scammed at ${s.pricePoints} price points.`);
      setMessage(s, `We are getting scammed at ${s.pricePoints} price points now.`, 'printer', 'dev', 5);
    }
  }

  // --- AMBIENT WHISPERS ---
  s.ambientWhisperTimer -= dt;
  if (s.ambientWhisperTimer <= 0) {
    s.ambientWhisperTimer = 17 + nextRng(s) * 9;
    if (!s.activeMessage) {
      const entities: EntityId[] = ['cone', 'fridge', 'microwave', 'printer', 'apartment', 'tv'];
      const pickEnt = entities[Math.floor(nextRng(s) * entities.length)];
      const w = pickWhisper(lore, pickEnt, s.hour, () => nextRng(s));
      if (w) setMessage(s, w.text, w.entity, w.sourceServer, 5.5);
    }
  }

  // --- PLAYER ACTIONS: NOD & CHIRP ---
  if (input.nod) {
    s.player.nodAnimTimer = 0.35;
    s.events.nodPerformed = true;
    if (s.fridge.phase === 'waiting_nod' || s.fridge.phase === 'singing') {
      s.fridge.phase = 'idle';
      s.fridge.cooldown = 18 + nextRng(s) * 10;
      s.fridge.satisfiedCount++;
      s.dread = clamp(s.dread - 8, 0, 100);
      s.devotion = clamp(s.devotion + 6, 0, 100);
      setMessage(s, 'You nodded on the two and four. The fridge closes itself, satisfied.', 'fridge', 'prod', 4.5);
    }
  }

  if (input.chirp && s.player.chirpCooldown <= 0) {
    s.player.chirpCooldown = 1.2;
    s.events.chirpPerformed = true;
    if (s.smokeDetector.blinks === 2) {
      s.smokeDetector.blinks = 1;
      s.smokeDetector.cooldown = 26 + nextRng(s) * 12;
      s.dread = clamp(s.dread - 6, 0, 100);
      setMessage(s, 'You chirped back. The smoke detector settles to one blink. Relationship maintained.', 'smoke_detector', 'prod', 4.5);
    }
  }

  // Update target selection before handling interact
  updateTargetsAndPrompt(s, lore);

  // --- PLAYER ACTION: INTERACT ---
  if (input.interact) {
    if (s.player.nearestEntity === 'cone' && s.player.holdingItem) {
      const held = s.player.holdingItem;
      const def = lore.tributes.find((t) => t.id === held.tributeId);
      s.player.holdingItem = null;

      if (def && !def.accepted) {
        s.events.tributeRejected = true;
        s.dread = clamp(s.dread + def.dreadDelta, 0, 100);
        s.cone.lastReaction = def.coneReaction;
        setMessage(s, def.coneReaction, 'cone', def.sourceServer, 5.5);
        s.ledgerLog.push(`Offer rejected: ${def.shortLabel}.`);
      } else {
        s.events.tributeAccepted = true;
        const bonus = held.tributeId === s.cone.desiredItemId ? 6 : 0;
        const dreadReduce = Math.abs(def?.dreadDelta ?? 12) + bonus;
        s.dread = clamp(s.dread - dreadReduce, 0, 100);
        s.devotion = clamp(s.devotion + (def?.devotionDelta ?? 12), 0, 100);
        s.cone.acceptedCount++;
        s.cone.tributeDueTimer = 28;
        s.cone.rpm = Math.max(1.2, s.cone.rpm - 0.25);
        s.cone.desiredItemId = chooseDesiredTribute(s, lore);
        if (s.smokeDetector.blinks === 2) {
          s.smokeDetector.blinks = 1;
          s.smokeDetector.cooldown = 24;
        }
        const reaction = def?.coneReaction ?? 'Accepted. The cone rotates approvingly.';
        s.cone.lastReaction = reaction;
        setMessage(s, reaction, 'cone', def?.sourceServer ?? 'prod', 5);
        s.ledgerLog.push(`Tribute accepted: ${held.shortLabel}.`);
      }

      // Respawn a fresh item so the apartment never runs dry
      const accepted = lore.tributes.filter((t) => t.accepted);
      if (accepted.length > 0) {
        spawnPickup(s, accepted[Math.floor(nextRng(s) * accepted.length)]);
      }
    } else if (s.player.nearestPickupUid !== null && !s.player.holdingItem) {
      const idx = s.pickups.findIndex((p) => p.uid === s.player.nearestPickupUid);
      if (idx !== -1) {
        const [picked] = s.pickups.splice(idx, 1);
        s.player.holdingItem = picked;
        setMessage(s, `Picked up ${picked.name}. Bring it to the Rotating Cone.`, 'cone', 'prod', 4);
      }
    } else if (s.player.nearestEntity === 'microwave' && s.microwave.phase !== 'idle') {
      s.microwave.towelTimer = 20;
      s.microwave.phase = 'idle';
      s.dread = clamp(s.dread - 5, 0, 100);
      setMessage(s, 'Covered the microwave with a dish towel like a parrot. It settles.', 'microwave', 'prod', 4.5);
    } else if (s.player.nearestEntity === 'printer' && s.printer.jammed) {
      s.printer.jammed = false;
      s.printer.cooldown = 24 + nextRng(s) * 12;
      s.printer.paidCount++;
      s.pricePoints += 1;
      s.dread = clamp(s.dread - 6, 0, 100);
      s.ledgerLog.push(`Paid Price Point #${s.pricePoints}: ${s.printer.jamReason}`);
      setMessage(s, `Toll paid. Scammed at ${s.pricePoints} price points. Printer satisfied.`, 'printer', 'dev', 5);
    } else if (s.player.nearestEntity === 'tv') {
      const w = pickWhisper(lore, 'tv', s.hour, () => nextRng(s));
      setMessage(s, w ? w.text : 'The penalty box is a 10% smaller horse.', 'tv', 'prod', 5);
    }
    updateTargetsAndPrompt(s, lore);
  }

  // Passive dread & fail checks
  s.dread = clamp(s.dread + 0.35 * dt, 0, 100);
  if (s.dread >= 100) {
    s.outcome = 'consumed_by_dread';
    s.outcomeReason = 'Dread reached 100%. The appliances have absorbed you as kin.';
  }
}
