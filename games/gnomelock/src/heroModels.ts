import * as THREE from 'three';
import type { GnomeLook, GnomeModel } from '@lawn/gnome';
import { buildPrefab } from '@lawn/prefabs';
import type { HeroId } from './sim/config';

/**
 * Distinct fallback GnomeLook per hero when the player has no custom gnome
 * (or for bots). Team hat color is applied on top in `scene.ts`.
 */
export const HERO_LOOKS: Record<HeroId, GnomeLook> = {
  bramble: {
    hat: 0x3b6e38,
    shirt: 0x4b5d3a,
    pants: 0x3b2f24,
    skin: 0xf1c29b,
    boots: 0x2c1e16,
    beard: 0x5c3c24,
    hair: null,
    freckles: false,
    dress: false,
    glasses: false,
    bowlCut: null,
  },
  tansy: {
    hat: 0xd9a426,
    shirt: 0x6f9e4a,
    pants: 0x4c5e36,
    skin: 0xf5cfb0,
    boots: 0x4d3522,
    beard: null,
    hair: { color: 0xd99b26, style: 'long' },
    freckles: true,
    dress: true,
    glasses: false,
    bowlCut: null,
  },
  fernwick: {
    hat: 0x2e6b4f,
    shirt: 0x355c44,
    pants: 0x2d3830,
    skin: 0xeec19e,
    boots: 0x25211d,
    beard: 0x6e4f34,
    hair: null,
    freckles: false,
    dress: false,
    glasses: true,
    bowlCut: null,
  },
  potsworth: {
    hat: 0xb85b35,
    shirt: 0x8f472c,
    pants: 0x4a342a,
    skin: 0xe6b58f,
    boots: 0x33221a,
    beard: 0xa66942,
    hair: null,
    freckles: false,
    dress: false,
    glasses: false,
    bowlCut: null,
  },
  hookwort: {
    hat: 0x2c6870,
    shirt: 0x2f4d54,
    pants: 0x263238,
    skin: 0xe8be9b,
    boots: 0x1b2429,
    beard: 0x363d40,
    hair: null,
    freckles: false,
    dress: false,
    glasses: false,
    bowlCut: null,
  },
  buckshot: {
    hat: 0xa83232,
    shirt: 0x52362b,
    pants: 0x2e2522,
    skin: 0xebb994,
    boots: 0x201815,
    beard: 0x3a261d,
    hair: null,
    freckles: false,
    dress: false,
    glasses: false,
    bowlCut: null,
  },
  thistle: {
    hat: 0x7e42a8,
    shirt: 0x5d377a,
    pants: 0x352547,
    skin: 0xf4cfb6,
    boots: 0x281b36,
    beard: null,
    hair: { color: 0xb47ce0, style: 'pigtails' },
    freckles: true,
    dress: true,
    glasses: true,
    bowlCut: null,
  },
  loam: {
    hat: 0x2b2442,
    shirt: 0x1f1c30,
    pants: 0x171524,
    skin: 0xd9c2b2,
    boots: 0x12101c,
    beard: 0x221d33,
    hair: null,
    freckles: false,
    dress: false,
    glasses: false,
    bowlCut: null,
  },
};

/**
 * Subtle silhouette scale `[x, y, z]` per hero so tanky, nimble, and tall
 * heroes read differently at a glance without breaking hitboxes or animations.
 */
export const HERO_SCALES: Record<HeroId, [number, number, number]> = {
  bramble: [1.12, 1.04, 1.12],
  tansy: [0.96, 1.0, 0.96],
  fernwick: [0.92, 1.08, 0.92],
  potsworth: [1.16, 0.98, 1.16],
  hookwort: [1.0, 0.98, 1.04],
  buckshot: [1.06, 1.02, 1.02],
  thistle: [0.94, 1.04, 0.94],
  loam: [1.04, 1.1, 1.04],
};

function makeMat(color: number, roughness = 0.65, metalness = 0.15, emissive = 0, emissiveIntensity = 0): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    emissive,
    emissiveIntensity,
  });
}

/**
 * Attaches signature 3D gear onto a hero's GnomeModel rig/arms.
 * All attachments maintain >= 4cm clearance from body surfaces to prevent z-fighting.
 */
export function attachHeroGear(
  model: GnomeModel,
  heroId: HeroId,
): { update?: (dt: number, t: number) => void } {
  switch (heroId) {
    case 'bramble': {
      // Thorned bark pauldrons + off-hand round shield
      const shield = buildPrefab('round-shield', { scale: 0.78 });
      shield.position.set(-0.08, -0.18, 0.08);
      shield.rotation.set(0, -Math.PI / 2, 0);
      model.arms.left.add(shield);

      const thornMat = makeMat(0x4f6b33, 0.78, 0.05);
      for (const side of [-1, 1]) {
        const pauldron = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.1, 7), thornMat);
        pauldron.position.set(side * 0.28, 0.74, 0);
        pauldron.rotation.z = side * -0.35;
        model.rig.add(pauldron);

        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.14, 5), thornMat);
        spike.position.set(side * 0.34, 0.84, 0);
        spike.rotation.z = side * -0.45;
        model.rig.add(spike);
      }
      return {};
    }

    case 'tansy': {
      // Sun-blossom cape + glowing nectar pouch
      const cape = buildPrefab('wind-cape', { scale: 0.95 });
      cape.position.set(0, 0.66, -0.24);
      model.rig.add(cape);

      const blossomMat = makeMat(0xf5c842, 0.4, 0.1, 0xd99b26, 0.45);
      const blossom = new THREE.Mesh(new THREE.DodecahedronGeometry(0.085, 0), blossomMat);
      blossom.position.set(-0.24, 0.44, -0.08);
      model.rig.add(blossom);
      return {};
    }

    case 'fernwick': {
      // Scout cloak + brass marksman visor
      const cape = buildPrefab('wind-cape', { scale: 0.9 });
      cape.position.set(0, 0.7, -0.24);
      model.rig.add(cape);

      const visor = buildPrefab('kiln-visor', { scale: 0.85 });
      visor.position.set(0, 0.98, 0.18);
      model.rig.add(visor);
      return {};
    }

    case 'potsworth': {
      // Kiln-forge backpack + terracotta shoulder pots
      const potMat = makeMat(0xb85b35, 0.7, 0.1);
      const emberMat = makeMat(0xff7722, 0.3, 0.1, 0xff5500, 0.8);

      const kiln = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 0.34, 8), potMat);
      kiln.position.set(0, 0.6, -0.28);
      model.rig.add(kiln);

      const core = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), emberMat);
      core.position.set(0, 0.8, -0.28);
      model.rig.add(core);

      for (const side of [-1, 1]) {
        const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.12, 8), potMat);
        rim.position.set(side * 0.29, 0.73, 0);
        rim.rotation.z = side * -0.25;
        model.rig.add(rim);
      }
      return {};
    }

    case 'hookwort': {
      // Coiled grapple pack + left-arm iron hook cuff
      const ropeMat = makeMat(0x8c7352, 0.85, 0.05);
      const ironMat = makeMat(0x55646e, 0.4, 0.65);

      const coil = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.045, 7, 12), ropeMat);
      coil.position.set(0, 0.58, -0.24);
      model.rig.add(coil);

      const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.12, 8), ironMat);
      cuff.position.set(0, -0.22, 0);
      model.arms.left.add(cuff);

      const prong = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.14, 5), ironMat);
      prong.position.set(0, -0.32, 0.05);
      prong.rotation.x = Math.PI * 0.75;
      model.arms.left.add(prong);
      return {};
    }

    case 'buckshot': {
      // Acorn bandolier + twin brass hip holsters
      const bandolier = buildPrefab('acorn-bandolier', { scale: 1.02 });
      bandolier.position.set(0, 0.58, 0.06);
      model.rig.add(bandolier);

      const brassMat = makeMat(0xb88c3a, 0.35, 0.6);
      for (const side of [-1, 1]) {
        const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.14, 0.1), brassMat);
        pouch.position.set(side * 0.25, 0.38, 0.04);
        model.rig.add(pouch);
      }
      return {};
    }

    case 'thistle': {
      // Relic bell + 3 orbiting spore orbs
      const bell = buildPrefab('relic-bell', { scale: 0.85 });
      bell.position.set(0.22, 0.44, -0.14);
      model.rig.add(bell);

      const orbitGroup = new THREE.Group();
      orbitGroup.position.set(0, 0.78, 0);
      model.rig.add(orbitGroup);

      const orbMat = makeMat(0xc47aff, 0.3, 0.1, 0x9933ff, 0.75);
      const orbs: THREE.Mesh[] = [];
      for (let i = 0; i < 3; i++) {
        const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.06, 0), orbMat);
        const angle = (i * Math.PI * 2) / 3;
        orb.position.set(Math.cos(angle) * 0.42, Math.sin(i * 1.4) * 0.08, Math.sin(angle) * 0.42);
        orbitGroup.add(orb);
        orbs.push(orb);
      }

      return {
        update: (dt: number, t: number) => {
          orbitGroup.rotation.y += dt * 2.2;
          for (let i = 0; i < orbs.length; i++) {
            orbs[i].position.y = Math.sin(t * 3.5 + i * 2.1) * 0.1;
            orbs[i].rotation.x += dt * 2.5;
          }
        },
      };
    }

    case 'loam': {
      // Spinning void singularity halo behind shoulders
      const haloGroup = new THREE.Group();
      haloGroup.position.set(0, 0.82, -0.28);
      model.rig.add(haloGroup);

      const coreMat = makeMat(0x110c1f, 0.2, 0.2, 0x3b1b6e, 0.6);
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), coreMat);
      haloGroup.add(core);

      const ringMat = makeMat(0x9a5cff, 0.25, 0.3, 0x7b2cff, 0.9);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.024, 8, 24), ringMat);
      ring.rotation.x = Math.PI * 0.32;
      haloGroup.add(ring);

      return {
        update: (dt: number, t: number) => {
          ring.rotation.z += dt * 2.4;
          ring.rotation.y += dt * 1.1;
          const pulse = 1 + Math.sin(t * 4) * 0.08;
          core.scale.setScalar(pulse);
        },
      };
    }
  }
}
