// Draws what marks out Gnome Golf's holes on top of the coloured ground (the ground itself already shows fairway, rough, green,
// sand and water through its colours): a numbered tee marker, the fairway centreline, and a flag at each pin.
import * as THREE from 'three';
import type { EditorContext } from '../context';
import { courseOf, levelToHoles, type GolfLevel } from './golfLevel';

const REBUILD_MS = 100;

function numberSprite(n: number): THREE.Sprite {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  g.fillStyle = '#ffd24a';
  g.beginPath();
  g.arc(32, 32, 30, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#222';
  g.font = 'bold 38px sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(String(n), 32, 34);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false }));
  s.scale.set(22, 22, 1);
  s.renderOrder = 9;
  return s;
}

export function createGolfObjectView(ctx: EditorContext): { dispose(): void } {
  const scene = ctx.viewport.scene;
  const root = new THREE.Group();
  root.name = 'object-view';
  const structures = new THREE.Group();
  const flora = new THREE.Group(); // the View tool's layer toggles expect a second group
  root.add(structures, flora);
  scene.add(root);

  function clear(): void {
    for (const c of [...structures.children]) {
      structures.remove(c);
      c.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.Line || o instanceof THREE.Sprite) {
          (o as THREE.Mesh).geometry?.dispose();
          const m = (o as THREE.Mesh).material;
          (Array.isArray(m) ? m : [m]).forEach((x) => { (x as THREE.SpriteMaterial).map?.dispose(); x.dispose(); });
        }
      });
    }
  }

  function build(): void {
    clear();
    const level = ctx.zones[ctx.zone] as unknown as GolfLevel;
    const course = courseOf(level);
    const holes = levelToHoles(level);
    holes.forEach((h, i) => {
      const y = (x: number, z: number): number => Math.max(0.3, course.heightAt(x, z)) + 0.8;
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(h.path.map((p) => new THREE.Vector3(p.x, y(p.x, p.z), p.z))),
        new THREE.LineBasicMaterial({ color: 0xffd24a, depthTest: false }),
      );
      line.renderOrder = 8;
      structures.add(line);
      const tee = new THREE.Mesh(new THREE.BoxGeometry(10, 0.5, 10), new THREE.MeshLambertMaterial({ color: 0xf2f2c0 }));
      tee.position.set(h.tee.x, course.heightAt(h.tee.x, h.tee.z) + 0.3, h.tee.z);
      structures.add(tee);
      const label = numberSprite(i + 1);
      label.position.set(h.tee.x, course.heightAt(h.tee.x, h.tee.z) + 14, h.tee.z);
      structures.add(label);
      const gy = course.heightAt(h.pin.x, h.pin.z);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 5, 6), new THREE.MeshLambertMaterial({ color: 0xffffff }));
      pole.position.set(h.pin.x, gy + 2.5, h.pin.z);
      const flag = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 0.1), new THREE.MeshLambertMaterial({ color: 0xe53935 }));
      flag.position.set(h.pin.x + 1.2, gy + 4.3, h.pin.z);
      structures.add(pole, flag);
    });
  }

  build();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let alive = true;
  const rebuild = (): void => {
    if (timer !== undefined) return;
    timer = setTimeout(() => { timer = undefined; if (alive) build(); }, REBUILD_MS);
  };
  const off = ctx.events.changed.on(rebuild);
  return { dispose() { alive = false; clearTimeout(timer); off(); clear(); scene.remove(root); } };
}
