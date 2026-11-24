// Acorn shell casings (L57): ejection, landing on the ground to the right of the shooter, the cap and the fade.
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { CASINGS, createCasings } from './casings';
import { heightAt } from './terrain';

const DT = 1 / 60;

function run(seconds: number, step: (dt: number) => void): void {
  for (let t = 0; t < seconds; t += DT) step(DT);
}

describe('acorn shell casings', () => {
  it('ejects one shell for a pistol shot', () => {
    const casings = createCasings(new THREE.Scene());
    casings.eject('pistol', 0, 1.4, 0, 0);
    expect(casings.count()).toBe(1);
  });

  it('lands on the ground to the right of the shooter', () => {
    const scene = new THREE.Scene();
    const casings = createCasings(scene);
    const yaw = 0.7;
    const ex = 5;
    const ez = -3;
    casings.eject('pistol', ex, 1.4, ez, yaw);
    run(3, (dt) => casings.update(dt));

    const shell = scene.children.find((c) => c instanceof THREE.Group) as THREE.Group;
    expect(shell).toBeDefined();
    const p = shell.position;
    expect(Math.abs(p.y - heightAt(p.x, p.z))).toBeLessThan(0.06);

    const rightX = -Math.cos(yaw);
    const rightZ = Math.sin(yaw);
    expect((p.x - ex) * rightX + (p.z - ez) * rightZ).toBeGreaterThan(0);
  });

  it('keeps at most CASINGS.max shells, dropping the oldest', () => {
    const casings = createCasings(new THREE.Scene());
    for (let i = 0; i < 60; i++) casings.eject('pistol', 0, 1.4, 0, 0);
    expect(casings.count()).toBe(CASINGS.max);
  });

  it('adds nothing for a gun that fires no cartridge', () => {
    const casings = createCasings(new THREE.Scene());
    casings.eject('leaf-blower', 0, 1.4, 0, 0);
    expect(casings.count()).toBe(0);
  });

  it('removes shells after their life and fade', () => {
    const casings = createCasings(new THREE.Scene());
    casings.eject('shotgun', 0, 1.4, 0, 0);
    casings.eject('rifle', 0, 1.4, 0, 0);
    run(CASINGS.life + CASINGS.fade + 1, (dt) => casings.update(dt));
    expect(casings.count()).toBe(0);
  });
});
