// The interior kit in node (no DOM): room shell colliders, door spawn and exit spot, prefab rugs versus solid furniture.
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import type { PlacedInterior } from './registry';
import { INTERIOR_THEMES } from './registry';
import { createKit } from './kit';

function fakePlaced(): PlacedInterior {
  return {
    def: {
      id: 't',
      name: 'Test',
      door: { x: 0, z: 0, yaw: 0 },
      exit: { x: 0, z: 0, yaw: 0 },
      size: { w: 10, d: 8, h: 3 },
      theme: 'shop',
      build() {},
    },
    origin: { x: 5100, y: 0, z: 5100 },
    large: false,
    theme: INTERIOR_THEMES.shop,
  };
}

describe('interior kit', () => {
  it('builds the room shell, a door, furniture and rugs', () => {
    const { kit, build } = createKit(fakePlaced());
    kit.room();
    kit.door(4.8, 0, -Math.PI / 2);
    kit.put('bed', 0, 0);
    kit.put('rug', 1, 1);

    // Four wall colliders plus one bed collider; the rug is under 0.25 m and adds none.
    expect(build.boxes).toHaveLength(5);

    expect(build.exitDoor).toEqual({ x: 4.8, z: 0, yaw: -Math.PI / 2 });
    expect(build.spawn).not.toBeNull();
    expect(build.spawn!.x).toBeCloseTo(3.3, 5);
    expect(build.spawn!.z).toBeCloseTo(0, 5);

    const exit = build.spots.find((s) => s.id === 'exit');
    expect(exit).toBeDefined();
    expect(exit!.prompt).toBe('Leave Test');
  });

  it('lets spawn() override the door default and keeps the first room() call', () => {
    const { kit, build } = createKit(fakePlaced());
    kit.room();
    kit.room({ w: 50 });
    expect(build.boxes).toHaveLength(4);
    kit.door(4.8, 0, -Math.PI / 2);
    kit.spawn(0, 0, 0);
    expect(build.spawn).toEqual({ x: 0, z: 0, yaw: 0 });
  });

  it('sorts wall decor onto its wall, leaves floor pieces out, and overhangs the ceiling', () => {
    const { kit, walls } = createKit(fakePlaced());
    kit.room();
    kit.sign('X', 0, 1.5, -3.95, 0);
    const painting = kit.put('painting', 4.9, 0, -Math.PI / 2, { y: 1.3, solid: false });
    const bed = kit.put('bed', 0, 0);

    const [north, south, west, east] = walls();
    const signGroup = kit.group.children.find((c) => c.name === 'sign');
    expect(signGroup).toBeDefined();
    expect(signGroup!.userData.wallSign).toBe(true);
    expect(north.objects).toContain(signGroup);
    expect(east.objects).toContain(painting);
    const all = [north, south, west, east].flatMap((w) => w.objects);
    expect(all).not.toContain(bed);
    expect(south.objects).toHaveLength(0);
    expect(west.objects).toHaveLength(0);

    // Shell meshes are tagged and never classified as decor.
    const shell = kit.group.children.filter((c) => c.userData.shell === true);
    expect(shell.length).toBeGreaterThan(0);
    expect(all.some((o) => o.userData.shell === true)).toBe(false);

    const ceiling = kit.group.children.find((c) => {
      const g = (c as THREE.Mesh).geometry as THREE.PlaneGeometry | undefined;
      return g?.type === 'PlaneGeometry' && g.parameters.width === 22;
    }) as THREE.Mesh | undefined;
    expect(ceiling).toBeDefined();
    expect((ceiling!.geometry as THREE.PlaneGeometry).parameters.height).toBe(20);
  });

  it('records a window pane and a stairs spot', () => {
    const { kit, build } = createKit(fakePlaced());
    kit.window(0, -4, 0);
    kit.stairsTo(2, 2, 'other');
    kit.stairsTo(-2, 2, { x: 1, y: 0, z: 1, yaw: 0 });
    expect(build.windows).toHaveLength(1);
    expect(build.spots.map((s) => s.id)).toEqual(['stairs-other', 'stairs-out']);
  });
});
