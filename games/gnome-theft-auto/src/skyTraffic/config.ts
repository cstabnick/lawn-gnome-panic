// Sky traffic tuning (docs/roadmaps/gta-npc-planes.md). Every number a human may want to tweak lives here.
export const SKY = {
  // ---- Scheduler and cost caps ----
  /** NPC aircraft at once (the Watch chopper may make it maxTotal). */
  maxActive: 4,
  maxTotal: 5,
  /** Seconds between scheduler passes (spawn / despawn decisions). */
  thinkEvery: 1,
  /** An airborne spawn is at least this far from the player, m; when no route point is that far, it appears spawnFar away. */
  minSpawnDist: 250,
  spawnFar: 380,
  /** Farther than this from the player for despawnAfter seconds: removed. */
  despawnDist: 950,
  despawnAfter: 5,
  /** Farther than this from the player, an aircraft is stepped only farTickHz times a second (dt accumulated). */
  farTick: 450,
  farTickHz: 5,
  /** Seconds between floor samples (terrain, decks, water, buildings) per aircraft. */
  floorEvery: 0.25,
  /** Floor lookahead, seconds of travel. */
  floorAhead: 1.5,
  /** Building probe heights above the terrain, m, and the clearance kept over a roof. */
  buildingProbe: [10, 30, 60, 90] as readonly number[],
  buildingClear: 8,
  /** A leaving aircraft is removed after this many seconds even if still near. */
  leaveFor: 40,

  // ---- Shot down ----
  crashGravity: 7,
  crashSpin: 1.6,
  /** Seconds a crashed wreck stays on the ground before it is removed. */
  wreckLife: 25,
  /** Seconds before a shot-down behaviour may fly again. */
  downedCooldown: 120,
  /** A downing counts for Clear Skies when the player is within this distance, m. */
  downedCredit: 300,

  // ---- Banner ----
  bannerLength: 40,
  bannerHeight: 8,
  bannerSegments: 20,
  ropeLength: 14,
  /** The banner's top edge hangs this far below the tow point, m. */
  bannerDrop: 1.5,
  flutterAmp: 1.2,
  /** Flutter wave number (rad per m along the banner) and speed (rad/s). */
  flutterWave: 0.35,
  flutterSpeed: 6,
  /** The cloth flutters only within this distance of the player, m (else it is held flat: no vertex upload). */
  bannerDetailRange: 350,
  /** Hidden beyond this distance from the player, m. */
  bannerDrawDist: 600,
  /** Bullet hits that tear it loose. */
  bannerTearHits: 12,
  /** At most this many ad textures are kept (oldest disposed). */
  bannerTextureCache: 3,
  /** Ad canvas size, px (5:1 like the cloth). */
  adCanvasW: 1280,
  adCanvasH: 256,
  /** Seconds each ad is shown before the next. */
  adEvery: 50,
  /** Chance that the next ad is an Easter egg. */
  eggChance: 0.06,
  /** A torn banner falls at this speed, m/s, and fades over this many seconds once on the floor. */
  bannerFall: 3,
  bannerFade: 4,
  /** Spotting and reading: within spotRange m once = spotted; within readRange m for readTime s = that ad read. */
  spotRange: 260,
  readRange: 160,
  readTime: 2.5,

  // ---- Puffs (sky-writing smoke, crop spray) ----
  puffCapacity: 192,
  smokeEvery: 0.12,
  smokeLife: 14,
  smokeSize: 6,
  sprayEvery: 0.06,
  sprayLife: 1.4,
  spraySize: 1.4,
  sprayColour: 0xd8f0a0,
  smokeColour: 0xffffff,

  // ---- Pigeon-Drop parcels ----
  parcelAcorns: 25,
  parcelLife: 60,
  parcelFall: 3,
  parcelPickup: 2.5,
  parcelMax: 3,
} as const;
