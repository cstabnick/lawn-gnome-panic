// E31 living world sounds: positional one-shots for the Unmown (frog chorus at Reedmere, the bittern's boom, the
// ranger's crackly radio at the station, wind in the reeds) and the hamlets (a dog, a gate, a kettle whistle, a
// bus shelter bell). Stub (E31 foundation): issue A6 fills it. Keep the exported signature.

export interface LivingSound {
  /** px, pz: the listener. night: 0 day .. 1 night. inside: the player is in an interior (nothing plays). */
  update(dt: number, px: number, pz: number, night: number, inside: boolean): void;
}

export function createLivingSound(): LivingSound {
  return { update() { /* stub */ } };
}
