// Achievement ids of the economy, ownership and inventory work (E08). Defined in packages/achievements/src/catalog.ts.
export const ECON_ACH = {
  /** Buy a vehicle at any dealership. */
  firstPurchase: 'gta-new-wheels',
  /** Own three vehicles of the same model (VehicleKind) in your garages. */
  threeOfAKind: 'gta-fleet-of-three',
  /** Buy a vehicle at all three dealerships. */
  allDealers: 'gta-showroom-regular',
  /** Reclaim a written-off vehicle through Kiln-Shield. */
  reclaim: 'gta-claim-approved',
  /** Eat a snack from the bag. */
  firstSnack: 'gta-first-snack',
  /** Repair a vehicle at the Pay 'n' Glaze or Slipway Repair tab. */
  repair: 'gta-good-as-new',
  /** Buy a property on a loan. */
  property: 'gta-signed-on-the-line',
} as const;
