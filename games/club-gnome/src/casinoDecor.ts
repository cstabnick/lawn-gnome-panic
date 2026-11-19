// The Gnomecino's architecture and dressing (carpet, wainscot, cornice, chandeliers, velvet ropes, neon, posters,
// cashier cage). Static meshes only: no blockers, no pickables. Plants are placed as map props in maps.ts.
import * as THREE from 'three';
import type { MapDef } from './config';

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

const BURGUNDY = '#6a1a2a';
const GOLD = 0xd4af37;
const RED = 0x9a1c2c;
const WOOD = 0x3a1a16;
const PLUM = 0x2b1020;
const PINK = 0xff4fd8;
const PINK_CSS = '#ff4fd8';
const CREAM = 0xfff0c0;
const GOLD_CSS = '#d4af37';
const FONT = 'system-ui, sans-serif';

/** A canvas texture painted once by draw. */
function canvasTex(w: number, h: number, draw: Draw): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (ctx) draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** A text board: dark or coloured ground, optional border, text shrunk to fit. */
function boardDraw(text: string, bg: string, fg: string, border: string | null): Draw {
  return (ctx, w, h) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    if (border) {
      ctx.strokeStyle = border;
      ctx.lineWidth = h * 0.05;
      ctx.strokeRect(h * 0.05, h * 0.05, w - h * 0.1, h - h * 0.1);
    }
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let size = Math.floor(h * 0.55);
    ctx.font = `bold ${size}px ${FONT}`;
    while (size > 12 && ctx.measureText(text).width > w * 0.82) {
      size -= 3;
      ctx.font = `bold ${size}px ${FONT}`;
    }
    ctx.fillText(text, w / 2, h / 2 + 2);
  };
}

/** A playing card poster: cream card, gold border, rank and suit. */
function cardDraw(rank: string, suit: string, red: boolean): Draw {
  return (ctx, w, h) => {
    ctx.fillStyle = '#f8f4ea';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = h * 0.06;
    ctx.strokeRect(h * 0.05, h * 0.05, w - h * 0.1, h - h * 0.1);
    const ink = red ? '#b0202a' : '#1a1a1a';
    ctx.fillStyle = ink;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = `bold ${Math.floor(h * 0.2)}px ${FONT}`;
    ctx.fillText(rank, h * 0.18, h * 0.12);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${Math.floor(h * 0.62)}px ${FONT}`;
    ctx.fillText(suit, w / 2, h / 2 + 4);
  };
}

/** A gold-on-cream 'LUCKY GNOME' poster. */
function luckyDraw(): Draw {
  return (ctx, w, h) => {
    ctx.fillStyle = '#f6ead0';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = h * 0.06;
    ctx.strokeRect(h * 0.05, h * 0.05, w - h * 0.1, h - h * 0.1);
    ctx.fillStyle = BURGUNDY;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${Math.floor(h * 0.3)}px ${FONT}`;
    ctx.fillText('LUCKY', w / 2, h * 0.36);
    ctx.fillText('GNOME', w / 2, h * 0.68);
  };
}

/** A radial warm glow for the chandeliers. */
function glowDraw(): Draw {
  return (ctx, w, h) => {
    const gr = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gr.addColorStop(0, 'rgba(255,214,140,0.9)');
    gr.addColorStop(0.35, 'rgba(255,190,100,0.35)');
    gr.addColorStop(1, 'rgba(255,170,80,0)');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
  };
}

/** The diamond casino carpet: burgundy ground, gold-edged diamonds, gold dots at the joins. */
function carpetDraw(): Draw {
  return (ctx, w, h) => {
    ctx.fillStyle = BURGUNDY;
    ctx.fillRect(0, 0, w, h);
    const cols = w / 64;
    const rows = h / 64;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const cx = 32 + 64 * i;
        const cy = 32 + 64 * j;
        diamond(ctx, cx, cy, 32, '#8c2338', '#b8902e', 3);
        diamond(ctx, cx, cy, 14, '#4a0f1c', '#8a6a2a', 1.5);
      }
    }
    ctx.fillStyle = '#c9a24a';
    for (let j = 0; j <= rows; j++) {
      for (let i = 0; i <= cols; i++) {
        ctx.beginPath();
        ctx.arc(64 * i, 64 * j, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };
}

function diamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string, stroke: string, lw: number): void {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r, cy);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r, cy);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lw;
  ctx.stroke();
}

/** Puts a mesh or sprite at (x, y, z) under parent, never pickable. */
function put(parent: THREE.Object3D, obj: THREE.Mesh | THREE.Sprite, x: number, y: number, z: number): void {
  obj.position.set(x, y, z);
  obj.raycast = () => {};
  parent.add(obj);
}

/** A flat rectangle lying on the floor at height y. */
function floorPlane(parent: THREE.Object3D, w: number, d: number, mat: THREE.Material, x: number, y: number, z: number): void {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
  m.rotation.x = -Math.PI / 2;
  put(parent, m, x, y, z);
}

/** A standing board on a wall: planes face the room (+z by default). */
function boardMesh(w: number, h: number, tex: THREE.Texture): THREE.Mesh {
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
}

/** Adds the Gnomecino's dressing to g, under one 'casino-decor' group. */
export function addCasinoDecor(g: THREE.Group, map: MapDef): void {
  const root = new THREE.Group();
  root.name = 'casino-decor';
  const hw = map.w / 2;
  const hd = map.d / 2;

  const goldMat = new THREE.MeshLambertMaterial({ color: GOLD });
  const woodMat = new THREE.MeshLambertMaterial({ color: WOOD });
  const plumMat = new THREE.MeshLambertMaterial({ color: PLUM });
  const ropeMat = new THREE.MeshLambertMaterial({ color: RED });
  const bulbMat = new THREE.MeshBasicMaterial({ color: CREAM });

  // Carpet and the aisle runner from the exit (z 8) to the middle (z -2).
  const carpetMat = new THREE.MeshLambertMaterial({ map: canvasTex(768, 576, carpetDraw()) });
  floorPlane(root, map.w, map.d, carpetMat, 0, 0.012, 0);
  const runnerMat = new THREE.MeshLambertMaterial({ color: 0xa3202e });
  floorPlane(root, 2.4, 10, runnerMat, 0, 0.014, 3);
  for (const x of [-1.14, 1.14]) floorPlane(root, 0.12, 10, goldMat, x, 0.016, 3);

  // Wainscot (dark wood, 1.1 tall) with a gold cap, and a gold cornice at y 3.88, on the back and side walls.
  const wsH = 1.1;
  const wsIn = 0.02;
  const wsT = 0.06;
  const backZ = -hd + wsIn + wsT / 2;
  const sideX = hw - wsIn - wsT / 2;
  const back = new THREE.Mesh(new THREE.BoxGeometry(map.w, wsH, wsT), woodMat);
  put(root, back, 0, wsH / 2, backZ);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(map.w, 0.06, 0.08), goldMat);
  put(root, cap, 0, wsH + 0.03, backZ + 0.01);
  const cornice = new THREE.Mesh(new THREE.BoxGeometry(map.w, 0.12, 0.1), goldMat);
  put(root, cornice, 0, 3.88, -hd + 0.05);
  for (const sx of [-1, 1]) {
    const side = new THREE.Mesh(new THREE.BoxGeometry(wsT, wsH, map.d), woodMat);
    put(root, side, sx * sideX, wsH / 2, 0);
    const sideCap = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, map.d), goldMat);
    put(root, sideCap, sx * (sideX + 0.01), wsH + 0.03, 0);
    const sideCornice = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, map.d), goldMat);
    put(root, sideCornice, sx * (hw - 0.05), 3.88, 0);
  }

  // Four chandeliers: gold ring, chain, six cream bulbs, and a warm glow sprite under each.
  const glowMat = new THREE.SpriteMaterial({
    map: canvasTex(128, 128, glowDraw()),
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
  });
  const ringGeo = new THREE.TorusGeometry(0.5, 0.05, 8, 16);
  ringGeo.rotateX(Math.PI / 2);
  const chainGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.6, 4);
  const bulbGeo = new THREE.SphereGeometry(0.07, 6, 4);
  for (const cx of [-6, 6]) {
    for (const cz of [-4.5, 4.5]) {
      const ring = new THREE.Mesh(ringGeo, goldMat);
      put(root, ring, cx, 3.4, cz);
      const chain = new THREE.Mesh(chainGeo, goldMat);
      put(root, chain, cx, 3.7, cz);
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const bulb = new THREE.Mesh(bulbGeo, bulbMat);
        put(root, bulb, cx + Math.cos(a) * 0.5, 3.46, cz + Math.sin(a) * 0.5);
      }
      const glow = new THREE.Sprite(glowMat);
      glow.scale.setScalar(2.2);
      put(root, glow, cx, 3.1, cz);
    }
  }

  // Velvet ropes along z 2.9: gold posts at x -8,-5,-2 and 2,5,8, red rope sagging between them. Gap in the middle.
  const postGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.0, 8);
  for (const x of [-8, -5, -2, 2, 5, 8]) {
    const post = new THREE.Mesh(postGeo, goldMat);
    put(root, post, x, 0.5, 2.9);
  }
  for (const [a, b] of [
    [-8, -5],
    [-5, -2],
    [2, 5],
    [5, 8],
  ] as const) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(a, 0.94, 2.9),
      new THREE.Vector3((a + b) / 2, 0.66, 2.9),
      new THREE.Vector3(b, 0.94, 2.9),
    ]);
    const rope = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.03, 6, false), ropeMat);
    put(root, rope, 0, 0, 0);
  }

  // Neon: a magenta "21" high on the back wall, and a card-suit neon by the bar on the right wall.
  const neon21 = boardMesh(2.2, 0.9, canvasTex(512, 210, boardDraw('21', '#0a0a0c', PINK_CSS, PINK_CSS)));
  put(root, neon21, 0, 3.1, -hd + 0.07);
  const neonSuits = boardMesh(2.4, 0.7, canvasTex(512, 150, boardDraw('♠ ♥ ♦ ♣', '#0a0a0c', PINK_CSS, PINK_CSS)));
  neonSuits.rotation.y = -Math.PI / 2;
  put(root, neonSuits, hw - 0.1, 2.6, -1.9);
  const light21 = new THREE.PointLight(PINK, 3, 8);
  light21.position.set(0, 3.1, -hd + 1.0);
  root.add(light21);
  const lightSuits = new THREE.PointLight(PINK, 3, 8);
  lightSuits.position.set(hw - 1.0, 2.6, -1.9);
  root.add(lightSuits);

  // Posters: four framed pictures on the back wall at y 2.85, clear of the table signs below and the neon.
  const posters: Draw[] = [
    luckyDraw(),
    cardDraw('A', '♠', false),
    cardDraw('K', '♥', true),
    cardDraw('Q', '♣', false),
  ];
  const frameMat = new THREE.MeshLambertMaterial({ color: GOLD });
  posters.forEach((draw, i) => {
    const x = [-2.4, 2.2, 4.4, 6.6][i];
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.92, 0.05), frameMat);
    put(root, frame, x, 2.85, -hd + 0.05);
    const pic = new THREE.Mesh(
      new THREE.PlaneGeometry(1.1, 0.8),
      new THREE.MeshBasicMaterial({ map: canvasTex(352, 256, draw) }),
    );
    put(root, pic, x, 2.85, -hd + 0.1);
  });

  // Cashier cage against the left wall at x -11.3, z -1.5 (a matching blocker is in maps.ts).
  const cageX = -11.3;
  const cageZ = -1.5;
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.1, 2.5), plumMat);
  put(root, base, cageX, 0.55, cageZ);
  const counter = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 2.6), goldMat);
  put(root, counter, cageX, 1.14, cageZ);
  const backPanel = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.6, 2.5), woodMat);
  put(root, backPanel, -hw + 0.1, 1.99, cageZ);
  const barGeo = new THREE.BoxGeometry(0.05, 1.5, 0.05);
  for (let i = 0; i < 7; i++) {
    const bar = new THREE.Mesh(barGeo, goldMat);
    put(root, bar, -10.7, 1.93, cageZ - 1.2 + i * 0.4);
  }
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 2.6), goldMat);
  put(root, rail, -10.6, 2.72, cageZ);
  const cashier = boardMesh(2.2, 0.6, canvasTex(512, 160, boardDraw('CASHIER', '#2b0a14', '#ffd76a', GOLD_CSS)));
  cashier.rotation.y = Math.PI / 2;
  put(root, cashier, -10.55, 3.05, cageZ);

  g.add(root);
}
