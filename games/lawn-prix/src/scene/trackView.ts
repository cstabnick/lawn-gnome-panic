// The look every course shares: sky, fog and lights, ground, the mown track (a striped ribbon with edge trim), the
// start/finish arch, long grass tufts and the boundary around the course bounds. THEMES colours these per course;
// the course's own props and background show come from scene/courses (buildCourseShow). The full game and the party
// slice both call buildTrack into a fresh scene. Every geometry and material is created inside buildTrack (nothing at
// import time). All randomness is seeded (no Math.random), so a course looks the same on every load.
import * as THREE from 'three';
import { buildPrefabInstances } from '@lawn/prefabs';
import { TRACK, type CourseId } from '../config';
import { getTrack, headingOf, pointAt, type Track } from '../track';
import { buildCourseShow, type CourseShow } from './courses';
import { canvasTexture, mulberry32, offTrackSpot } from './courses/util';
import { createHazardView } from './hazardView';

/** What buildTrack returns: the course's animated background show. */
export type CourseView = CourseShow;

// Phones: a lighter render keeps the frame rate up (fewer pixels, a smaller shadow map).
const COARSE = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
const TAU = Math.PI * 2;
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const UNIT_SCALE = new THREE.Vector3(1, 1, 1);

type Boundary = 'hedge' | 'fence' | 'sandbags' | 'rope';

interface Theme {
  sky: number;
  ground: number;
  fleck: number;
  stripeLight: number;
  stripeDark: number;
  trim: number;
  boundary: Boundary;
  tuft: number;
  tufts: number;
}

export const THEMES: Record<CourseId, Theme> = {
  garden: {
    sky: 0x8fd0ff, ground: 0x3f8a2e, fleck: 0x56a13b, stripeLight: 0x8fd16a, stripeDark: 0x76bd55,
    trim: 0xe8f0d0, boundary: 'hedge', tuft: 0x4f9a35, tufts: 600,
  },
  panic: {
    sky: 0x9fd8ff, ground: 0x4a9a34, fleck: 0x62ac44, stripeLight: 0x9ad870, stripeDark: 0x7fc458,
    trim: 0xffffff, boundary: 'fence', tuft: 0x4f9a35, tufts: 600,
  },
  front: {
    sky: 0xb8c4c8, ground: 0x5b6e33, fleck: 0x6e8240, stripeLight: 0xa88a5a, stripeDark: 0x9a7d50,
    trim: 0x6b5a3a, boundary: 'sandbags', tuft: 0x7a7040, tufts: 200,
  },
  golf: {
    sky: 0x7fd0ff, ground: 0x3f9a40, fleck: 0x55b050, stripeLight: 0x7fd65a, stripeDark: 0x6cc84a,
    trim: 0xf2e8c0, boundary: 'rope', tuft: 0x4a9a3a, tufts: 600,
  },
};

/** A flat strip along the centreline: left edge at offset oLeft, right edge at oRight (oLeft > oRight), at height y. */
function ribbon(track: Track, oLeft: number, oRight: number, y: number, colorAt?: (i: number) => THREE.Color): THREE.BufferGeometry {
  const n = track.points.length;
  const pos = new Float32Array(n * 6);
  const col = new Float32Array(n * 6);
  track.points.forEach((p, i) => {
    const lx = p.tz, lz = -p.tx; // left of the tangent
    pos.set([p.x + lx * oLeft, y, p.z + lz * oLeft, p.x + lx * oRight, y, p.z + lz * oRight], i * 6);
    if (colorAt) {
      const c = colorAt(i);
      col.set([c.r, c.g, c.b, c.r, c.g, c.b], i * 6);
    }
  });
  const idx: number[] = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n; // the last quad closes the loop back to point 0
    idx.push(2 * i, 2 * i + 1, 2 * j, 2 * i + 1, 2 * j + 1, 2 * j);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  if (colorAt) g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

interface Placed { x: number; y: number; z: number; yaw: number }

/** Builds the course into a fresh scene and returns its background show (call update every frame). */
export function buildTrack(scene: THREE.Scene, course: CourseId): CourseView {
  const T = getTrack(course);
  const theme = THEMES[course];
  const rand = mulberry32(0x1a2b3c);
  const half = TRACK.width / 2;
  const { minX, maxX, minZ, maxZ } = T.course.bounds;
  const group = new THREE.Group();
  group.name = 'track';

  // The four sides of the bounds as [ax, az, bx, bz].
  const sides: [number, number, number, number][] = [
    [minX, minZ, maxX, minZ], [minX, maxZ, maxX, maxZ], [minX, minZ, minX, maxZ], [maxX, minZ, maxX, maxZ],
  ];
  // fn at the middle of each side: (x, z, yaw, length). yaw turns local +z along the side.
  const eachSide = (fn: (mx: number, mz: number, yaw: number, len: number) => void): void => {
    for (const [ax, az, bx, bz] of sides) {
      fn((ax + bx) / 2, (az + bz) / 2, Math.atan2(bx - ax, bz - az), Math.hypot(bx - ax, bz - az));
    }
  };
  // fn every `step` metres along each side (both ends included).
  const alongSides = (step: number, fn: (x: number, z: number, yaw: number) => void): void => {
    for (const [ax, az, bx, bz] of sides) {
      const n = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / step));
      const yaw = Math.atan2(bx - ax, bz - az);
      for (let i = 0; i <= n; i++) fn(ax + ((bx - ax) * i) / n, az + ((bz - az) * i) / n, yaw);
    }
  };
  // One InstancedMesh for a list of placed copies of the same geometry.
  const instanced = (geo: THREE.BufferGeometry, mat: THREE.Material, items: Placed[]): void => {
    if (items.length === 0) return;
    const m = new THREE.InstancedMesh(geo, mat, items.length);
    const d = new THREE.Object3D();
    items.forEach((it, i) => {
      d.position.set(it.x, it.y, it.z);
      d.rotation.set(0, it.yaw, 0);
      d.updateMatrix();
      m.setMatrixAt(i, d.matrix);
    });
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
  };

  // Sky, fog and light.
  scene.background = new THREE.Color(theme.sky);
  scene.fog = new THREE.Fog(theme.sky, 60, 170);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x4a7a3a, 1.2));
  const sun = new THREE.DirectionalLight(0xfff2d6, 2.2);
  sun.position.set(30, 60, 20);
  sun.castShadow = true;
  const shadowSize = COARSE ? 1024 : 2048;
  sun.shadow.mapSize.set(shadowSize, shadowSize);
  const sc = sun.shadow.camera;
  sc.left = -80; sc.right = 80; sc.top = 80; sc.bottom = -80; sc.far = 200;
  sc.updateProjectionMatrix();
  scene.add(sun, sun.target);

  // Ground: long grass, flecked with the theme's fleck colour and a darker shade of the ground.
  const fleck = '#' + new THREE.Color(theme.fleck).getHexString();
  const shade = '#' + new THREE.Color(theme.ground).multiplyScalar(0.8).getHexString();
  const grassTex = canvasTexture(256, 256, (g) => {
    g.fillStyle = '#' + new THREE.Color(theme.ground).getHexString();
    g.fillRect(0, 0, 256, 256);
    g.lineWidth = 1;
    for (let i = 0; i < 900; i++) {
      const x = rand() * 256, y = rand() * 256, len = 4 + rand() * 6;
      g.strokeStyle = rand() < 0.5 ? fleck : shade;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + (rand() - 0.5) * 4, y - len);
      g.stroke();
    }
  });
  grassTex.wrapS = THREE.RepeatWrapping;
  grassTex.wrapT = THREE.RepeatWrapping;
  grassTex.repeat.set(60, 60);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshLambertMaterial({ map: grassTex }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = true;
  group.add(ground);

  // The mown track: stripes every 6 m of track, then edge trim just inside each edge.
  const LIGHT = new THREE.Color(theme.stripeLight), DARK = new THREE.Color(theme.stripeDark);
  const stripeColor = (i: number): THREE.Color => (Math.floor(T.points[i].s / 6) % 2 === 0 ? LIGHT : DARK);
  const trackMat = new THREE.MeshLambertMaterial({
    vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
  });
  const track = new THREE.Mesh(ribbon(T, half, -half, 0.01, stripeColor), trackMat);
  track.receiveShadow = true;
  group.add(track);

  const trimMat = new THREE.MeshLambertMaterial({
    color: theme.trim, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  });
  for (const [a, b] of [[half, half - 0.25], [-half + 0.25, -half]] as const) {
    const trim = new THREE.Mesh(ribbon(T, a, b, 0.015), trimMat);
    trim.receiveShadow = true;
    group.add(trim);
  }

  // Start/finish line and banner arch. The group is rotated to the track heading: local +z is forward, local +x is left.
  const start = pointAt(T, T.course.startS);
  const startGroup = new THREE.Group();
  startGroup.position.set(start.x, 0, start.z);
  startGroup.rotation.y = headingOf(start.tx, start.tz);
  group.add(startGroup);

  const checkerTex = canvasTexture(128, 32, (g) => {
    for (let cx = 0; cx < 8; cx++) {
      for (let cy = 0; cy < 2; cy++) {
        g.fillStyle = (cx + cy) % 2 ? '#ffffff' : '#111111';
        g.fillRect(cx * 16, cy * 16, 16, 16);
      }
    }
  });
  checkerTex.magFilter = THREE.NearestFilter;
  const checker = new THREE.Mesh(
    new THREE.PlaneGeometry(TRACK.width, 1.2),
    new THREE.MeshLambertMaterial({ map: checkerTex, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }),
  );
  checker.rotation.x = -Math.PI / 2;
  checker.position.y = 0.02;
  checker.receiveShadow = true;
  startGroup.add(checker);

  const bannerTex = canvasTexture(512, 128, (g) => {
    g.fillStyle = '#1d6b2a';
    g.fillRect(0, 0, 512, 128);
    g.fillStyle = '#ffffff';
    g.font = 'bold 84px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('LAWN PRIX', 256, 68);
  });
  const plainMat = new THREE.MeshLambertMaterial({ color: 0x1d6b2a });
  const bannerMat = new THREE.MeshLambertMaterial({ map: bannerTex });
  // Box face order: +x, -x, +y, -y, +z, -z. The text is on the two long faces.
  const crossbar = new THREE.Mesh(
    new THREE.BoxGeometry(TRACK.width + 1.5, 0.7, 0.15),
    [plainMat, plainMat, plainMat, plainMat, bannerMat, bannerMat],
  );
  crossbar.position.y = 4.6;
  crossbar.castShadow = true;
  startGroup.add(crossbar);
  const postGeo = new THREE.CylinderGeometry(0.12, 0.12, 4.6, 8);
  const postMat = new THREE.MeshLambertMaterial({ color: 0xe8e8e8 });
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(side * (half + 0.6), 2.3, 0);
    post.castShadow = true;
    startGroup.add(post);
  }

  // Long grass tufts off the track.
  const tuftMat = new THREE.MeshLambertMaterial({ color: theme.tuft });
  const tufts = new THREE.InstancedMesh(new THREE.ConeGeometry(0.18, 0.7, 4), tuftMat, theme.tufts);
  const dummy = new THREE.Object3D();
  let placed = 0;
  for (let k = 0; k < theme.tufts; k++) {
    const s = offTrackSpot(T, rand, 0.8, 1.5);
    if (!s) continue;
    dummy.position.set(s.x, 0.35, s.z);
    dummy.rotation.set(0, rand() * TAU, 0);
    dummy.scale.setScalar(0.8 + rand() * 0.6);
    dummy.updateMatrix();
    tufts.setMatrixAt(placed++, dummy.matrix);
  }
  tufts.count = placed;
  group.add(tufts);

  // The boundary around the bounds, in the theme's style.
  switch (theme.boundary) {
    case 'hedge': {
      const hedgeMat = new THREE.MeshLambertMaterial({ color: 0x2e6b2a });
      eachSide((mx, mz, yaw, len) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.6, len), hedgeMat);
        m.position.set(mx, 0.8, mz);
        m.rotation.y = yaw;
        m.castShadow = true;
        m.receiveShadow = true;
        group.add(m);
      });
      break;
    }
    case 'fence': {
      // White picket fence: a 1 m section (the picket-fence prefab, rails and pickets) every metre along each side,
      // turned from its own +x run onto the side's direction.
      const sections: THREE.Matrix4[] = [];
      const turn = new THREE.Quaternion();
      alongSides(1, (x, z, yaw) => {
        turn.setFromAxisAngle(Y_AXIS, yaw + Math.PI / 2);
        sections.push(new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), turn, UNIT_SCALE));
      });
      group.add(buildPrefabInstances('picket-fence', sections));
      break;
    }
    case 'sandbags': {
      // Two rows of sandbags.
      const bagMat = new THREE.MeshLambertMaterial({ color: 0xb8a070 });
      const bags: Placed[] = [];
      alongSides(1.1, (x, z, yaw) => {
        bags.push({ x, y: 0.2, z, yaw }, { x, y: 0.6, z, yaw });
      });
      instanced(new THREE.BoxGeometry(0.6, 0.4, 1.1), bagMat, bags);
      break;
    }
    case 'rope': {
      // White posts every 6 m with two rope strands.
      const white = new THREE.MeshLambertMaterial({ color: 0xffffff });
      eachSide((mx, mz, yaw, len) => {
        for (const y of [0.55, 0.85]) {
          const rope = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, len), white);
          rope.position.set(mx, y, mz);
          rope.rotation.y = yaw;
          group.add(rope);
        }
      });
      const posts: Placed[] = [];
      alongSides(6, (x, z, yaw) => posts.push({ x, y: 0.5, z, yaw }));
      instanced(new THREE.CylinderGeometry(0.07, 0.07, 1, 6), white, posts);
      break;
    }
  }

  scene.add(group);

  const show = buildCourseShow(course, scene, T);
  const hazards = createHazardView(scene, T);
  return {
    update(raceT: number, dt: number) {
      show.update(raceT, dt);
      hazards.update(raceT, dt);
    },
  };
}
