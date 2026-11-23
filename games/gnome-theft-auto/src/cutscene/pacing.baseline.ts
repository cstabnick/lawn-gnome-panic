// Scenes not yet re-directed: the pacing checker (pacing.ts) only reports them; every scene NOT listed here must pass
// (pacing.test.ts). Step 2 of the direction pass shrinks this to zero: re-direct a scene against
// docs/design/gnome-theft-auto/direction/bible.md, write its notes from direction/TEMPLATE.md, make it pass (or waive a
// rule on purpose in its `direction.waive`), then delete its id here. Lanes and order: direction/lanes.md.
// Exact ids, or a prefix ending in '*'.
export const PACING_BASELINE: readonly string[] = [
  // Side A
  'sq-grid-truthers-intro',
  'sq-grid-truthers-gamma',
  'sq-grid-truthers-outro',
  'sq-porcelain-blues-intro',
  'sq-porcelain-blues-ledger',
  'sq-porcelain-blues-outro',
  'sq-fescue-fugitive-intro',
  'sq-fescue-fugitive-gallery',
  'sq-fescue-fugitive-hollow',
  'sq-fescue-fugitive-granny',
  'sq-hoa-audit-intro',
  'sq-hoa-audit-outro',
  'sq-castaway-drydock-intro',
  'sq-castaway-drydock-outro',
  'sq-mulch-pyramid-intro',
  'sq-mulch-pyramid-wasps',
  'sq-mulch-pyramid-outro',
  // Examples
  'street-pickup',
  'pull-up',
  'back-room',
];
