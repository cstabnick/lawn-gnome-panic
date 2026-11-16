// Scripted playthrough for headless checks: open the game with #selftest.
// Drives the real systems with synthetic key events and rule calls, then logs SELFTEST OK or console.error per failure.
// tools/smoke.sh <url>#selftest rg-selftest-ok
import { ISLANDS, ISLAND_ORDER, RAFT_TOP, SHED, TILE_SIZE, type GameState, type IslandId } from './config';
import {
  chartCourse, castOff, collectDebris, craft, deconstruct, edgeTiles, growthMult, islandGap, islandRelPos, isWalkable, lootCrate,
  placeTile, raftExtent, removeTile, revealIsland, surfaceY, wallBlocks,
} from './rules';

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const key = (type: 'keydown' | 'keyup', code: string) => window.dispatchEvent(new KeyboardEvent(type, { code }));
async function tap(code: string): Promise<void> {
  key('keydown', code);
  await wait(50);
  key('keyup', code);
  await wait(50);
}

export async function runSelfTest(state: GameState, ui: HTMLElement): Promise<void> {
  const fails: string[] = [];
  const check = (ok: boolean, what: string) => {
    if (!ok) {
      fails.push(what);
      console.error('SELFTEST FAIL: ' + what);
    }
  };

  state.mode = 'play';
  Object.assign(state.inv, { grass: 60, dirt: 10, seed: 10, scrap: 40, fuel: 30, parts: 5 });
  await wait(200);

  await tap('KeyB');
  check((state.mode as string) === 'build', 'B enters build mode');
  await tap('KeyR');
  check(state.buildKind === 'seeded', 'R switches build kind');
  await tap('KeyB');
  check((state.mode as string) === 'play', 'B leaves build mode');

  check(placeTile(state, 2, 0, 'turf'), 'place turf tile');
  check(placeTile(state, 2, 1, 'seeded'), 'place seeded tile');
  check(!placeTile(state, 9, 9, 'turf'), 'cannot place detached tile');
  check(placeTile(state, 0, 0, 'sprinkler'), 'place sprinkler on a tile');
  check(!placeTile(state, 0, 0, 'flamingo'), 'one prop per tile');
  check(!placeTile(state, 5, 5, 'flamingo'), 'props need a tile');
  check(placeTile(state, 1, 1, 'flamingo'), 'place flamingo');
  const near = state.tiles.get('1,0')!;
  check(growthMult(state, near) >= 2, 'sprinkler boosts nearby growth');
  check(removeTile(state, 2, 1, 4), 'shark can remove a tile');
  check(!state.tiles.has('2,1'), 'removed tile is gone');
  check(edgeTiles(state).length > 0, 'edge tiles exist');
  const day0 = state.dayTime;

  for (const r of ['telescope', 'push', 'gas', 'riding'] as const) check(craft(state, r), 'craft ' + r);
  check(state.equipped === 'riding', 'crafting a mower equips it');
  await tap('KeyQ');
  check(state.equipped === 'hands', 'Q cycles tools');
  await tap('KeyQ');
  check(state.equipped === 'push', 'Q cycles to push');

  // Mow: grow everything, walk forward with the push mower.
  for (const t of state.tiles.values()) t.growth = 1;
  state.player.position.set(0, state.player.position.y, 0);
  const grassBefore = state.inv.grass;
  key('keydown', 'KeyW');
  await wait(600);
  key('keyup', 'KeyW');
  check(state.inv.grass > grassBefore, 'walking with a mower cuts grass');
  check([...state.tiles.values()].every((t) => Math.abs(t.i * TILE_SIZE - state.player.position.x) < 20), 'player stays near raft');

  // Hand cut.
  await tap('KeyQ'); await tap('KeyQ'); await tap('KeyQ');
  check(state.equipped === 'hands', 'back to hands');
  for (const t of state.tiles.values()) t.growth = 1;
  const g2 = state.inv.grass;
  await tap('KeyE');
  check(state.inv.grass > g2, 'E cuts grass by hand');

  // Shed pieces: floor, walls, roof, wall collision, deconstruct refund.
  state.inv.plank = 30;
  check(placeTile(state, 1, 0, 'floor'), 'place plank floor');
  check(!placeTile(state, 1, 0, 'floor'), 'one floor per tile');
  check(Math.abs((surfaceY(state, TILE_SIZE, 0) ?? 0) - (RAFT_TOP + SHED.FLOOR_THICK)) < 1e-6, 'floor raises the ground');
  check(!placeTile(state, 1, 1, 'ceiling'), 'roof needs a wall');
  check(placeTile(state, 1, 0, 'wall', 'x'), 'place wall on +x edge');
  check(placeTile(state, 1, 0, 'wall', 'z'), 'place wall on +z edge');
  check(placeTile(state, 1, 0, 'ceiling'), 'place roof next to a wall');
  check(wallBlocks(state, TILE_SIZE, 0, TILE_SIZE * 1.6, 0, 0.3), 'wall blocks walking through it');
  check(!wallBlocks(state, TILE_SIZE, 0, TILE_SIZE * 1.2, 0, 0.3, RAFT_TOP + 5), 'no wall block from the roof');
  const roof = state.structures.find((t) => t.kind === 'ceiling')!;
  const planks = state.inv.plank;
  check(deconstruct(state, roof) && state.inv.plank === planks + 1, 'deconstruct refunds half');
  // Fun junk.
  const chestPlanks = state.inv.plank;
  collectDebris(state, { item: 'grass', amount: 0, weight: 1, unlock: 'start', fun: 'chest' });
  check(state.inv.plank === chestPlanks + 4, 'treasure chest gives planks');
  collectDebris(state, { item: 'grass', amount: 0, weight: 1, unlock: 'start', fun: 'duck' });
  const ducks = state.inv.duck;
  check(ducks === 1 && placeTile(state, 0, 1, 'duck') && (state.inv.duck as number) === 0, 'rubber duck is placeable');

  // Swimming: drop the gnome in the water beside tile (0,0) (its -x edge is at x = -1).
  state.player.position.set(-2.2, RAFT_TOP, 0);
  state.player.grounded = true;
  await wait(500);
  check(state.player.swimming, 'off the raft the gnome swims');
  check(state.player.position.y < 0, 'swimmer is in the water');
  state.player.position.set(-1.4, state.player.position.y, 0);
  key('keydown', 'KeyA'); // yaw 0: A moves +x, toward the raft
  await wait(600);
  key('keyup', 'KeyA');
  check(!state.player.swimming && state.player.position.y >= RAFT_TOP - 1e-6, 'swimmer climbs back onto the raft');
  state.player.position.set(0, RAFT_TOP, 0);

  await tap('KeyT');
  check((state.mode as string) === 'telescope', 'T opens telescope');
  await tap('KeyT');
  check((state.mode as string) === 'play', 'T closes telescope');

  await tap('Tab');
  check((state.mode as string) === 'craft', 'Tab opens craft menu');
  await tap('Tab');
  check((state.mode as string) === 'play', 'Tab closes craft menu');

  check(state.dayTime !== day0, 'day time advances');
  check(revealIsland(state) !== null, 'bottle reveals an island');

  // Sail to every island, dock, loot.
  for (const id of ISLAND_ORDER as readonly IslandId[]) {
    state.islands[id].spotted = true;
    chartCourse(state, id);
    const isl = ISLANDS[id];
    const d = isl.radius + raftExtent(state) + 3;
    const dirx = isl.x - state.sea.x, dirz = isl.z - state.sea.z;
    const len = Math.hypot(dirx, dirz);
    state.sea.x = isl.x - (dirx / len) * d;
    state.sea.z = isl.z - (dirz / len) * d;
    await wait(700);
    check(state.sea.docked === id, 'docks at ' + id);
    check(state.islands[id].visited, 'visited ' + id);
    check(islandGap(state, id) < 0, 'docked raft touches the shore of ' + id);
    // There is a walkable path from the raft to the island: the nearest tile's point toward the island is on land.
    const ip = islandRelPos(state, id);
    let near = { x: 0, z: 0 }, nd = Infinity;
    for (const t of state.tiles.values()) {
      const d = Math.hypot(t.i * TILE_SIZE - ip.x, t.j * TILE_SIZE - ip.z);
      if (d < nd) { nd = d; near = { x: t.i * TILE_SIZE, z: t.j * TILE_SIZE }; }
    }
    let path = true;
    const n = Math.ceil(nd / 0.25);
    for (let k = 0; k <= n; k++) {
      const u = k / n;
      if (!isWalkable(state, near.x + (ip.x - near.x) * u, near.z + (ip.z - near.z) * u)) path = false;
    }
    check(path, 'can walk ashore at ' + id);
    isl.crates.forEach((_, k) => check(lootCrate(state, id, k), `loot ${id} crate ${k}`));
    castOff(state);
    check(state.sea.docked === null, 'cast off ' + id);
    const gap0 = islandGap(state, id);
    await wait(300);
    check(state.sea.docked === null && islandGap(state, id) > gap0, 'drifts away from ' + id + ' after casting off');
  }
  check(state.inv.parts >= 3, 'collected mower parts');

  console.log(fails.length ? `SELFTEST FAILED (${fails.length})` : 'SELFTEST OK');
  const marker = document.createElement('div');
  marker.id = fails.length ? 'rg-selftest-failed' : 'rg-selftest-ok';
  marker.style.display = 'none';
  ui.append(marker);
}

/**
 * Headless screenshots skip the WebGL canvas, so #snap=<scenario> copies the canvas into an <img> after a moment.
 * Scenarios: raft (default), island, mower, build, telescope, big, props, night, rain, shed, swim.
 */
export async function runSnap(state: GameState, ui: HTMLElement, canvas: HTMLCanvasElement, scenario: string): Promise<void> {
  state.mode = 'play';
  Object.assign(state.inv, { grass: 60, dirt: 10, seed: 10, scrap: 40, fuel: 30, parts: 5 });
  if (scenario === 'night') state.dayTime = 0.62;
  if (scenario === 'rain') state.raining = true;
  if (scenario === 'big' || scenario === 'mower' || scenario === 'props' || scenario === 'shed') {
    for (let i = -2; i <= 3; i++) for (let j = -2; j <= 3; j++) placeTile(state, i, j, 'turf');
    for (let i = -2; i <= 3; i++) for (let j = -2; j <= 3; j++) placeTile(state, i, j, 'turf');
  }
  if (scenario === 'props') {
    state.inv.grass = 100;
    placeTile(state, 0, 2, 'sprinkler');
    placeTile(state, 2, 2, 'flamingo');
    placeTile(state, -1, 2, 'flamingo');
    for (const t of state.tiles.values()) t.growth = (t.i + t.j) % 3 === 0 ? 0.1 : 1;
  }
  if (scenario === 'shed') {
    state.inv.plank = 200;
    state.inv.duck = 1;
    state.inv.statue = 1;
    for (const [i, j] of [[0, 0], [1, 0], [0, 1], [1, 1]]) placeTile(state, i, j, 'floor');
    for (const i of [0, 1]) { placeTile(state, i, 1, 'wall', 'z'); placeTile(state, i, -1, 'wall', 'z'); }
    placeTile(state, 1, 0, 'wall', 'x');
    placeTile(state, -1, 1, 'wall', 'x');
    for (const [i, j] of [[0, 0], [1, 0], [0, 1], [1, 1]]) placeTile(state, i, j, 'ceiling');
    placeTile(state, 2, 2, 'duck');
    placeTile(state, -1, 2, 'statue');
    state.player.position.set(-2.5, 0.3, 2.5);
  }
  if (scenario === 'swim') {
    state.player.position.set(-2.6, 0.3, 1);
  }
  if (scenario === 'mower') {
    for (const r of ['telescope', 'push', 'gas', 'riding'] as const) craft(state, r);
  }
  if (scenario === 'island') {
    const id: IslandId = 'mowerGraveyard';
    state.islands[id].spotted = true;
    chartCourse(state, id);
    const isl = ISLANDS[id];
    state.sea.x = isl.x - (isl.radius + raftExtent(state) + 2);
    state.sea.z = isl.z;
  }
  if (scenario === 'build') {
    await wait(100);
    await tap('KeyB');
  }
  if (scenario === 'telescope') {
    craft(state, 'telescope');
    await wait(100);
    await tap('KeyT');
  }
  await wait(1500);
  const img = document.createElement('img');
  img.id = 'rg-snap';
  img.src = canvas.toDataURL('image/png');
  img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:-1;';
  ui.append(img);
}

/**
 * Two-browser co-op check against a running matchmaking server (npm run dev -w packages/mp-server):
 * open #cooptest=host and, a few seconds later, #cooptest=guest. Each logs COOPTEST <ROLE> OK / FAILED and adds
 * #rg-cooptest-ok or #rg-cooptest-failed. The host builds tile (2,0); the guest must see it, then builds (-1,0),
 * which the host must receive.
 */
export async function runCoopTest(state: GameState, ui: HTMLElement, role: string): Promise<void> {
  const fails: string[] = [];
  const check = (ok: boolean, what: string) => {
    if (!ok) {
      fails.push(what);
      console.error('COOPTEST FAIL: ' + what);
    }
  };
  const until = async (cond: () => boolean, ms: number): Promise<boolean> => {
    const end = performance.now() + ms;
    while (performance.now() < end) {
      if (cond()) return true;
      await wait(100);
    }
    return cond();
  };
  const code = 'COOP' + (new URLSearchParams(location.search).get('room') ?? '42');

  if (role === 'host') {
    state.coop.request = { name: 'Hosty', code };
    check(await until(() => state.coop.status === 'in', 8000), 'host joins the room (status ' + state.coop.status + ' ' + state.coop.message + ')');
    check(state.netRole === 'host', 'first player hosts');
    check((state.mode as string) === 'play', 'host is playing');
    state.inv.grass = 40;
    check(placeTile(state, 2, 0, 'turf'), 'host builds (2,0)');
    check(await until(() => state.coop.players.length === 2, 15000), 'guest shows up in the player list');
    check(await until(() => state.tiles.has('-1,0'), 8000), "host receives the guest's tile (-1,0)");
  } else {
    await wait(3000);
    state.coop.request = { name: 'Guesty', code };
    check(await until(() => state.coop.status === 'in' && (state.mode as string) === 'play', 8000), 'guest joins and plays (status ' + state.coop.status + ' ' + state.coop.message + ')');
    check(state.netRole === 'guest', 'second player is a guest');
    check(await until(() => state.tiles.has('2,0'), 4000), "guest sees the host's tile (2,0)");
    check(state.coop.players.length === 2, 'two players listed');
    check(state.inv.grass > 0, 'guest shares the host inventory');
    check(placeTile(state, -1, 0, 'turf'), 'guest builds (-1,0)');
    await wait(2500);
    check(state.tiles.has('-1,0'), "guest's tile survives the host's snapshots");
  }
  console.log(fails.length ? `COOPTEST ${role.toUpperCase()} FAILED (${fails.length})` : `COOPTEST ${role.toUpperCase()} OK`);
  const marker = document.createElement('div');
  marker.id = fails.length ? 'rg-cooptest-failed' : 'rg-cooptest-ok';
  marker.style.display = 'none';
  ui.append(marker);
}
