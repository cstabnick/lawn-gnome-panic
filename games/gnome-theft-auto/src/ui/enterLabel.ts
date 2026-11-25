// The touch action button's label (input.setEnterLabel). It must offer a button for every prompt the interact key acts
// on, in the same order as app.ts's `inp.enterExit` chain: before E03 the label skipped the hunting, birding, fishing,
// job, Pebblewick, Gnomecino door and interactable prompts, so on a phone the prompt showed but no button did (you could
// not enter the Gnomecino or the Pebblewick shops on touch).

/** A short verb for a prompt sentence ("Enter The Gnomecino" -> "Enter"). */
export function promptVerb(text: string): string {
  const t = text.toLowerCase();
  if (/\benter\b|\bgo in\b|\bdoor\b/.test(t)) return 'Enter';
  if (/\bbuy\b|\bshop\b|\bstore\b/.test(t)) return 'Shop';
  if (/\btalk\b|\bask\b|\bchat\b|\bspeak\b/.test(t)) return 'Talk';
  if (/\bride\b|\bboard\b/.test(t)) return 'Ride';
  if (/\bfish\b|\bcast\b/.test(t)) return 'Fish';
  return 'Use';
}

/** Everything app.ts knows about what the interact key would do this frame (null = not available). */
export interface EnterContext {
  mounting: boolean;
  inVehicle: boolean;
  /** The vehicle to get in when getting in wins over prompts (preferVehicle && near), as its verb. */
  preferredVehicleVerb: string | null;
  giver: string | null;
  garage: string | null;
  lockup: string | null;
  /** E08 dealership prompt. */
  dealer: string | null;
  gun: string | null;
  hunt: string | null;
  bird: string | null;
  fish: string | null;
  job: string | null;
  town: string | null;
  portal: string | null;
  interactable: string | null;
  /** The nearest vehicle to get in (any), as its verb. */
  vehicleVerb: string | null;
  ride: boolean;
}

/** The label, or null for no button. Same priority as the interact key in app.ts. */
export function enterLabelFor(c: EnterContext): string | null {
  if (c.mounting) return null;
  if (c.inVehicle) return 'Exit';
  if (c.preferredVehicleVerb) return c.preferredVehicleVerb;
  if (c.giver) return 'Enter';
  if (c.garage?.startsWith('Tune')) return 'Tune';
  if (c.lockup) return c.lockup.startsWith('Buy') ? 'Buy' : 'Open';
  if (c.dealer) return 'Browse';
  if (c.gun) return 'Shop';
  for (const p of [c.hunt, c.bird, c.fish, c.job, c.town, c.portal, c.interactable]) if (p) return promptVerb(p);
  if (c.vehicleVerb) return c.vehicleVerb;
  if (c.ride) return 'Ride';
  return null;
}
