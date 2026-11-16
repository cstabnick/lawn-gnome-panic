import * as THREE from 'three';
import { ITEM_CATALOG } from './shared/catalog';
import type { EnemyEntity, EnemyKind, WorldItem } from './shared/types';

export function createGnomeMesh(hatColor: string): THREE.Group {
  const g = new THREE.Group();

  // Body (robe)
  const body = new THREE.Mesh(
    new THREE.ConeGeometry(0.36, 0.85, 10),
    new THREE.MeshStandardMaterial({ color: 0x2a4d69, roughness: 0.7 }),
  );
  body.position.y = 0.44;
  body.castShadow = true;
  g.add(body);

  // Head
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xf4c7a1, roughness: 0.6 }),
  );
  head.position.y = 0.96;
  head.castShadow = true;
  g.add(head);

  // Beard
  const beard = new THREE.Mesh(
    new THREE.ConeGeometry(0.18, 0.34, 8),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 }),
  );
  beard.rotation.x = Math.PI;
  beard.position.set(0, 0.78, 0.14);
  g.add(beard);

  // Pointy Hat
  const hat = new THREE.Mesh(
    new THREE.ConeGeometry(0.26, 0.62, 10),
    new THREE.MeshStandardMaterial({ color: hatColor, roughness: 0.5 }),
  );
  hat.position.y = 1.36;
  hat.castShadow = true;
  g.add(hat);

  // Eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111827 });
  for (const sx of [-0.08, 0.08]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), eyeMat);
    eye.position.set(sx, 0.99, 0.19);
    g.add(eye);
  }

  // Halo (visible when praying/blessed)
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.26, 0.03, 8, 20),
    new THREE.MeshBasicMaterial({ color: 0xfde047 }),
  );
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 1.75;
  halo.name = 'halo';
  halo.visible = false;
  g.add(halo);

  return g;
}

export function createGnomeJesusMesh(skyGod = false): THREE.Group {
  const g = new THREE.Group();
  const opacity = skyGod ? 0.42 : 0.92;
  const robeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfef08a,
    emissiveIntensity: skyGod ? 0.55 : 0.35,
    transparent: skyGod,
    opacity,
  });

  const body = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.3, 12), robeMat);
  body.position.y = 0.65;
  g.add(body);

  // Red sash
  const sash = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.42, 0.25, 12),
    new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      emissive: 0x991b1b,
      emissiveIntensity: 0.3,
      transparent: skyGod,
      opacity,
    }),
  );
  sash.position.y = 0.8;
  g.add(sash);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 14, 12),
    new THREE.MeshStandardMaterial({
      color: 0xfde68a,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.2,
      transparent: skyGod,
      opacity,
    }),
  );
  head.position.y = 1.48;
  g.add(head);

  // Flowing Holy Beard
  const beard = new THREE.Mesh(
    new THREE.ConeGeometry(0.26, 0.56, 10),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfef9c3,
      emissiveIntensity: 0.3,
      transparent: skyGod,
      opacity,
    }),
  );
  beard.rotation.x = Math.PI;
  beard.position.set(0, 1.18, 0.2);
  g.add(beard);

  // Golden Hat
  const hat = new THREE.Mesh(
    new THREE.ConeGeometry(0.34, 0.85, 12),
    new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xeab308,
      emissiveIntensity: 0.5,
      transparent: skyGod,
      opacity,
    }),
  );
  hat.position.y = 2.04;
  g.add(hat);

  // Glowing Halo
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.52, 0.05, 10, 28),
    new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: skyGod,
      opacity: skyGod ? 0.75 : 1,
    }),
  );
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 2.55;
  halo.name = 'halo';
  g.add(halo);

  return g;
}

export function createEnemyMesh(kind: EnemyKind): THREE.Group {
  const g = new THREE.Group();

  if (kind === 'earthworm') {
    const wormMat = new THREE.MeshStandardMaterial({
      color: 0xd9777f,
      roughness: 0.4,
    });
    for (let i = 0; i < 6; i++) {
      const r = 0.55 - i * 0.05;
      const seg = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), wormMat);
      seg.position.set(0, 0.45 + i * 0.55, 0);
      seg.name = `seg_${i}`;
      g.add(seg);
    }
    // Toothy maw at top
    const maw = new THREE.Mesh(
      new THREE.TorusGeometry(0.38, 0.1, 8, 14),
      new THREE.MeshStandardMaterial({ color: 0x450a0a }),
    );
    maw.rotation.x = Math.PI / 2;
    maw.position.y = 3.5;
    g.add(maw);

    // Dirt warning mound
    const mound = new THREE.Mesh(
      new THREE.ConeGeometry(1.4, 0.5, 12),
      new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 1 }),
    );
    mound.position.y = 0.2;
    mound.name = 'mound';
    g.add(mound);
  } else if (kind === 'mower') {
    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.45, 1.7),
      new THREE.MeshStandardMaterial({ color: 0xb91c1c, metalness: 0.4, roughness: 0.4 }),
    );
    deck.position.y = 0.4;
    deck.castShadow = true;
    g.add(deck);

    const engine = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.4, 0.45, 10),
      new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.7 }),
    );
    engine.position.set(0, 0.75, 0);
    g.add(engine);

    // Handlebar
    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.08, 1.3),
      new THREE.MeshStandardMaterial({ color: 0x9ca3af }),
    );
    handle.position.set(0, 1.25, -0.8);
    handle.rotation.x = -0.65;
    g.add(handle);

    // Wheels
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111827 });
    for (const [wx, wz] of [
      [-0.7, 0.65],
      [0.7, 0.65],
      [-0.7, -0.65],
      [0.7, -0.65],
    ]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.14, 10), wheelMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(wx, 0.24, wz);
      g.add(w);
    }

    // Demonic glowing red headlights
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xff1111 });
    for (const lx of [-0.36, 0.36]) {
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), lightMat);
      l.position.set(lx, 0.48, 0.86);
      g.add(l);
    }
  } else if (kind === 'squirrel') {
    const fur = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.8 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8), fur);
    body.position.y = 0.4;
    g.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), fur);
    head.position.set(0, 0.72, 0.2);
    g.add(head);

    // Bushy tail
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.85, 8), fur);
    tail.position.set(0, 0.75, -0.4);
    tail.rotation.x = -0.5;
    g.add(tail);

    // Manic wide eyes
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    for (const ex of [-0.1, 0.1]) {
      const w = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), whiteMat);
      w.position.set(ex, 0.78, 0.4);
      g.add(w);
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), pupilMat);
      p.position.set(ex, 0.78, 0.45);
      g.add(p);
    }
  } else if (kind === 'spider') {
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1e1b2e, roughness: 0.6 });
    const abd = new THREE.Mesh(new THREE.SphereGeometry(0.58, 12, 10), bodyMat);
    abd.position.set(0, 0.7, -0.45);
    abd.scale.set(1, 0.8, 1.25);
    g.add(abd);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 10, 8), bodyMat);
    head.position.set(0, 0.65, 0.25);
    g.add(head);

    // Glowing red eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff2244 });
    for (const [ex, ey] of [
      [-0.14, 0.72],
      [0.14, 0.72],
      [-0.06, 0.8],
      [0.06, 0.8],
    ]) {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), eyeMat);
      e.position.set(ex, ey, 0.56);
      g.add(e);
    }

    // 8 legs
    const legMat = new THREE.MeshStandardMaterial({ color: 0x0f0d1a });
    for (let i = 0; i < 4; i++) {
      for (const side of [-1, 1]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 1.25, 6), legMat);
        leg.position.set(side * 0.65, 0.45, 0.2 - i * 0.28);
        leg.rotation.z = side * 0.9;
        leg.name = `leg_${side}_${i}`;
        g.add(leg);
      }
    }
  } else if (kind === 'cultist') {
    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      emissive: 0x450a0a,
      emissiveIntensity: 0.4,
    });
    const robe = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.0, 10), darkMat);
    robe.position.y = 0.5;
    g.add(robe);

    const hood = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.65, 10), darkMat);
    hood.position.y = 1.25;
    g.add(hood);

    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    for (const ex of [-0.09, 0.09]) {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), eyeMat);
      e.position.set(ex, 1.02, 0.22);
      g.add(e);
    }

    // Tiny plastic pitchfork
    const fork = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 1.1, 6),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: 0x7f1d1d }),
    );
    fork.position.set(0.36, 0.85, 0.25);
    fork.rotation.x = 0.4;
    g.add(fork);
  } else if (kind === 'pillbug') {
    // Harmless creepy-cute rolling pillbug!
    const shell = new THREE.Group();
    shell.name = 'shell';
    const armorMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.45 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.65, 12, 10), armorMat);
    body.scale.set(0.95, 0.72, 1.25);
    shell.add(body);
    for (let i = -2; i <= 2; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.56 - Math.abs(i) * 0.06, 0.05, 6, 14),
        new THREE.MeshStandardMaterial({ color: 0x475569 }),
      );
      ring.position.z = i * 0.22;
      shell.add(ring);
    }
    shell.position.y = 0.52;
    g.add(shell);
  } else if (kind === 'dog') {
    // Giant Goofy Fetch Dog (NEVER hurts you!)
    const furMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 });
    const spotMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.1, 2.3), furMat);
    torso.position.y = 1.45;
    torso.castShadow = true;
    g.add(torso);

    const head = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.95, 1.1), furMat);
    head.position.set(0, 2.15, 1.25);
    g.add(head);

    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.46, 0.65), furMat);
    snout.position.set(0, 1.95, 1.95);
    g.add(snout);

    const nose = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x111827 }),
    );
    nose.position.set(0, 2.08, 2.28);
    g.add(nose);

    // Goofy happy tongue!
    const tongue = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.08, 0.42),
      new THREE.MeshBasicMaterial({ color: 0xf472b6 }),
    );
    tongue.position.set(0.1, 1.72, 2.1);
    tongue.rotation.x = 0.45;
    g.add(tongue);

    // Floppy ears
    for (const ex of [-0.56, 0.56]) {
      const ear = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.65, 0.45), spotMat);
      ear.position.set(ex, 2.1, 1.15);
      ear.rotation.z = ex > 0 ? -0.25 : 0.25;
      g.add(ear);
    }

    // Goofy eyes
    for (const ex of [-0.26, 0.26]) {
      const w = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff }),
      );
      w.position.set(ex, 2.32, 1.81);
      g.add(w);
      const p = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0x111827 }),
      );
      p.position.set(ex, 2.32, 1.9);
      g.add(p);
    }

    // 4 big legs
    for (const [lx, lz] of [
      [-0.45, 0.85],
      [0.45, 0.85],
      [-0.45, -0.85],
      [0.45, -0.85],
    ]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 1.0, 8), furMat);
      leg.position.set(lx, 0.5, lz);
      g.add(leg);
    }

    // Wagging tail
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 1.0, 8), furMat);
    tail.position.set(0, 1.95, -1.3);
    tail.rotation.x = -0.7;
    tail.name = 'tail';
    g.add(tail);
  }

  return g;
}

export function animateEnemyMesh(group: THREE.Group, mob: EnemyEntity, t: number): void {
  if (mob.kind === 'earthworm') {
    const mound = group.getObjectByName('mound');
    if (mound) {
      mound.visible = mob.state === 'warning' || mob.state === 'erupt';
      if (mob.state === 'warning') {
        mound.scale.setScalar(1 + Math.sin(t * 28) * 0.14);
      } else {
        mound.scale.setScalar(1);
      }
    }
    for (let i = 0; i < 6; i++) {
      const seg = group.getObjectByName(`seg_${i}`);
      if (seg) {
        seg.position.x = Math.sin(t * 8 + i * 0.7) * 0.18;
      }
    }
  } else if (mob.kind === 'pillbug') {
    const shell = group.getObjectByName('shell');
    if (shell) {
      if (mob.state === 'roll') {
        shell.rotation.x += 0.25;
      } else {
        shell.rotation.x = 0;
        shell.position.y = 0.52 + Math.abs(Math.sin(t * 6)) * 0.05;
      }
    }
  } else if (mob.kind === 'dog') {
    const tail = group.getObjectByName('tail');
    if (tail) {
      const wagSpeed = mob.state === 'excited' || mob.state === 'fetch' ? 18 : 7;
      tail.rotation.z = Math.sin(t * wagSpeed) * 0.55;
    }
    group.position.y = mob.y + Math.abs(Math.sin(t * 9)) * 0.12;
  } else if (mob.kind === 'spider') {
    for (let i = 0; i < 4; i++) {
      for (const side of [-1, 1]) {
        const leg = group.getObjectByName(`leg_${side}_${i}`);
        if (leg) {
          leg.rotation.x = Math.sin(t * 16 + i * 1.4 + side) * 0.3;
        }
      }
    }
  } else if (mob.kind === 'mower') {
    if (mob.state === 'rev' || mob.state === 'charge') {
      group.position.y = Math.abs(Math.sin(t * 40)) * 0.06;
    }
  }
}

export function createItemMesh(item: WorldItem): THREE.Group {
  const g = new THREE.Group();
  const def = ITEM_CATALOG[item.kind];
  const mat = new THREE.MeshStandardMaterial({
    color: def.color,
    emissive: item.cursed ? 0x7e22ce : def.color,
    emissiveIntensity: item.cursed ? 0.55 : 0.2,
    roughness: 0.35,
  });

  let mesh: THREE.Mesh;
  if (item.kind === 'tennis_ball' || item.kind === 'golden_acorn') {
    mesh = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), mat);
  } else if (item.kind === 'toaster_666' || item.kind === 'necro_gnomeicon') {
    mesh = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.36, 0.34), mat);
  } else if (item.kind === 'cursed_flamingo') {
    mesh = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.72, 8), mat);
  } else if (item.kind === 'trowel' || item.kind === 'flashlight' || item.kind === 'airhorn') {
    mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.55, 8), mat);
    mesh.rotation.z = Math.PI / 3;
  } else {
    mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), mat);
  }
  mesh.position.y = 0.25;
  mesh.castShadow = true;
  g.add(mesh);

  if (item.cursed) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.36, 0.03, 6, 16),
      new THREE.MeshBasicMaterial({ color: 0xc026d3 }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.08;
    g.add(ring);
  }

  return g;
}

export function createAcornProjectileMesh(): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x92400e, emissive: 0x451a03 }),
  );
}
