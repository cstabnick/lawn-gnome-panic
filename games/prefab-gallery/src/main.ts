// Prefab Gallery: browse @lawn/prefabs.
//   /            the gallery (search, category chips, click a card for the turntable)
//   /?sheet      a contact sheet of every prefab (for screenshots); /?sheet=weapon for one category
import * as THREE from 'three';
import { createGnomeModel, getMyGnome, GNORMAN_LOOK, loadMyGnome } from '@lawn/gnome';
await loadMyGnome();
import {
  PALETTE, allPrefabs, buildPrefab, getPrefab, prefabForEmoji, prefabIcon,
  type Category, type PrefabDef, type Swatch,
} from '@lawn/prefabs';

const ui = document.getElementById('ui')!;
const params = new URLSearchParams(location.search);

const CATEGORY_ORDER: Category[] = [
  'weapon', 'shield', 'armor', 'tool', 'consumable', 'food', 'material', 'trinket', 'document', 'key', 'container', 'furniture', 'prop', 'gnomeokemon',
];

function el<K extends keyof HTMLElementTagNameMap>(tag: K, css: Partial<CSSStyleDeclaration> = {}, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  Object.assign(e.style, css);
  if (text !== undefined) e.textContent = text;
  return e;
}

function iconImg(id: string, px: number, tint?: Swatch | number): HTMLElement {
  const url = prefabIcon(id, { size: px * 2, tint });
  if (!url) return el('div', { width: `${px}px`, height: `${px}px` }, '?');
  const img = el('img', { width: `${px}px`, height: `${px}px`, display: 'block' });
  img.src = url;
  img.alt = id;
  return img;
}

// ------------------------------------------------------------------ contact sheet

function contactSheet(only: string): void {
  const root = el('div', { padding: '12px' });
  root.id = 'sheet';
  ui.append(root);
  for (const cat of CATEGORY_ORDER) {
    if (only && only !== cat) continue;
    const items = allPrefabs().filter((p) => p.category === cat);
    if (!items.length) continue;
    root.append(el('h3', { margin: '8px 0 4px', color: 'var(--accent)' }, `${cat} (${items.length})`));
    const grid = el('div', { display: 'flex', flexWrap: 'wrap', gap: '6px' });
    for (const p of items) {
      const card = el('div', { width: '120px', background: 'var(--panel)', borderRadius: '6px', padding: '4px', textAlign: 'center' });
      const pic = iconImg(p.id, 112);
      pic.style.margin = '0 auto';
      card.append(pic, el('div', { fontSize: '11px', color: 'var(--dim)', overflow: 'hidden', whiteSpace: 'nowrap' }, p.id));
      grid.append(card);
    }
    root.append(grid);
  }
}

// ------------------------------------------------------------------ turntable viewer

interface Viewer { show(def: PrefabDef, tint?: Swatch | number): void; element: HTMLElement; setGnome(on: boolean): void }

function referenceGnome(): THREE.Group {
  const gnome = createGnomeModel(getMyGnome()?.look ?? GNORMAN_LOOK);
  gnome.object.position.x = -0.6;
  return gnome.object;
}

function createViewer(): Viewer {
  const canvas = el('canvas', { width: '100%', height: '320px', display: 'block', borderRadius: '8px', background: '#33473a', cursor: 'grab' });
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.shadowMap.enabled = true;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x33473a);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x445533, 1.8));
  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.position.set(2, 5, 3);
  sun.castShadow = true;
  scene.add(sun);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(3, 32), new THREE.MeshLambertMaterial({ color: 0x5f8a45 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 50);
  const turn = new THREE.Group();
  scene.add(turn);
  const gnome = referenceGnome();
  gnome.visible = false;
  scene.add(gnome);
  let model: THREE.Object3D | null = null;
  let yaw = 0.6, pitch = 0.35, dist = 2, dragging = false, auto = true;
  const target = new THREE.Vector3();

  canvas.addEventListener('pointerdown', (e) => { dragging = true; auto = false; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointerup', () => { dragging = false; });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    yaw -= e.movementX * 0.01;
    pitch = Math.min(1.4, Math.max(-0.2, pitch + e.movementY * 0.01));
  });
  canvas.addEventListener('wheel', (e) => { e.preventDefault(); dist = Math.min(8, Math.max(0.2, dist * (1 + Math.sign(e.deltaY) * 0.1))); }, { passive: false });

  function frame(): void {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== w * devicePixelRatio || canvas.height !== h * devicePixelRatio) {
      renderer.setPixelRatio(devicePixelRatio);
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
    }
    if (auto) yaw += 0.008;
    camera.position.set(
      target.x + dist * Math.cos(pitch) * Math.sin(yaw),
      target.y + dist * Math.sin(pitch),
      target.z + dist * Math.cos(pitch) * Math.cos(yaw),
    );
    camera.lookAt(target);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  function frameView(): void {
    const box = new THREE.Box3();
    if (model) box.expandByObject(model);
    if (gnome.visible) box.expandByObject(gnome);
    const s = box.getBoundingSphere(new THREE.Sphere());
    target.copy(s.center);
    dist = (s.radius / Math.sin((camera.fov / 2) * (Math.PI / 180))) * 1.15;
  }

  return {
    element: canvas,
    show(def, tint) {
      if (model) turn.remove(model);
      model = buildPrefab(def, { tint });
      turn.add(model);
      auto = true;
      frameView();
    },
    setGnome(on) {
      gnome.visible = on;
      frameView();
    },
  };
}

// ------------------------------------------------------------------ gallery

function gallery(): void {
  const wrap = el('div', { display: 'flex', gap: '16px', padding: '16px', alignItems: 'flex-start', flexWrap: 'wrap' });
  wrap.id = 'gallery';
  const left = el('div', { flex: '1 1 480px', minWidth: '0' });
  const right = el('div', { flex: '0 1 380px', width: '100%', position: 'sticky', top: '16px' });
  wrap.append(left, right);
  ui.append(wrap);

  // header
  left.append(el('h1', { margin: '0 0 4px', fontSize: '22px' }, 'Prefab Gallery'));
  left.append(el('div', { color: 'var(--dim)', fontSize: '13px', marginBottom: '10px' },
    `${allPrefabs().length} prefabs in @lawn/prefabs. Built from primitives, no files. Click one to inspect it.`));
  const search = el('input', { width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--line)', background: 'var(--panel)', color: 'var(--ink)', fontSize: '14px' });
  search.placeholder = 'Search names, tags, uses, or paste an emoji';
  left.append(search);
  const chips = el('div', { display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '10px 0' });
  left.append(chips);
  const grid = el('div', { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(92px, 1fr))', gap: '8px' });
  left.append(grid);

  let category: Category | '' = '';
  const counts = new Map<Category, number>();
  for (const p of allPrefabs()) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  const chipEls: HTMLButtonElement[] = [];
  const addChip = (label: string, value: Category | ''): void => {
    const b = el('button', { padding: '4px 10px', borderRadius: '999px', border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink)', cursor: 'pointer', fontSize: '13px' }, label);
    b.dataset.value = value;
    b.onclick = () => { category = value; render(); };
    chipEls.push(b);
    chips.append(b);
  };
  addChip(`all ${allPrefabs().length}`, '');
  for (const c of CATEGORY_ORDER) if (counts.get(c)) addChip(`${c} ${counts.get(c)}`, c);

  // detail panel
  const viewer = createViewer();
  const detail = el('div', { background: 'var(--panel)', borderRadius: '10px', padding: '12px' });
  right.append(detail);
  detail.append(viewer.element);
  const info = el('div', { marginTop: '10px', fontSize: '13px', lineHeight: '1.5' });
  detail.append(info);

  let selected: PrefabDef = allPrefabs()[0];
  let tint: Swatch | number | undefined;
  let showGnome = false;

  function showDetail(def: PrefabDef): void {
    selected = def;
    viewer.show(def, tint);
    info.replaceChildren();
    info.append(el('div', { fontSize: '18px', fontWeight: '600' }, def.name));
    info.append(el('div', { color: 'var(--dim)' }, `${def.id} · ${def.category} · ${def.parts.length} parts`));
    info.append(el('p', { margin: '6px 0' }, def.about));
    const ex = el('ul', { margin: '4px 0 8px', paddingLeft: '18px', fontStyle: 'italic', color: '#dfe8d4' });
    for (const line of def.examine) ex.append(el('li', { margin: '2px 0' }, line));
    info.append(el('div', { color: 'var(--dim)' }, 'examine'), ex);
    const row = (k: string, v: string): void => {
      const r = el('div');
      r.append(el('span', { color: 'var(--dim)' }, `${k}: `), document.createTextNode(v || '—'));
      info.append(r);
    };
    row('uses', def.uses.join(', '));
    row('tags', def.tags.join(', '));
    row('emoji', def.emoji.join(' '));
    if (def.grip) row('grip', def.grip.join(', '));
    const gnomeBtn = el('button', { marginTop: '8px', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink)', cursor: 'pointer' },
      showGnome ? 'hide gnome for scale' : 'show gnome for scale');
    gnomeBtn.onclick = () => { showGnome = !showGnome; viewer.setGnome(showGnome); showDetail(def); };
    info.append(gnomeBtn);
    if (def.parts.some((p) => p.c === 'tint')) {
      info.append(el('div', { color: 'var(--dim)', marginTop: '8px' }, 'tint'));
      const sw = el('div', { display: 'flex', flexWrap: 'wrap', gap: '3px' });
      for (const name of ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'black', 'white', 'glaze-blue', 'glaze-green', 'gold'] as Swatch[]) {
        const b = el('button', { width: '20px', height: '20px', borderRadius: '4px', border: tint === name ? '2px solid var(--accent)' : '1px solid #0006', background: `#${PALETTE[name].toString(16).padStart(6, '0')}`, cursor: 'pointer' });
        b.title = name;
        b.onclick = () => { tint = name; showDetail(def); };
        sw.append(b);
      }
      info.append(sw);
    }
    const code = el('pre', { background: '#0003', padding: '8px', borderRadius: '6px', fontSize: '12px', overflowX: 'auto', marginTop: '10px' });
    code.textContent = `import { buildPrefab, prefabIcon, createDrop } from '@lawn/prefabs';\n\nscene.add(buildPrefab('${def.id}'${tint ? `, { tint: '${tint}' }` : ''}));\nimg.src = prefabIcon('${def.id}')!;\nconst drop = createDrop('${def.id}', { glow: 'gold' });`;
    info.append(code);
    for (const c of grid.children) (c as HTMLElement).style.outline = (c as HTMLElement).dataset.id === def.id ? '2px solid var(--accent)' : 'none';
  }

  function matches(p: PrefabDef, q: string): boolean {
    if (!q) return true;
    const byEmoji = prefabForEmoji(q);
    if (byEmoji) return p.emoji.some((e) => q.includes(e)) || byEmoji.id === p.id;
    const hay = [p.id, p.name, p.category, ...p.tags, ...p.uses].join(' ').toLowerCase();
    return q.toLowerCase().split(/\s+/).every((w) => hay.includes(w));
  }

  function render(): void {
    const q = search.value.trim();
    for (const b of chipEls) b.style.background = b.dataset.value === category ? 'var(--line)' : 'transparent';
    grid.replaceChildren();
    for (const p of allPrefabs()) {
      if (category && p.category !== category) continue;
      if (!matches(p, q)) continue;
      const card = el('button', { background: 'var(--panel)', border: 'none', borderRadius: '8px', padding: '6px 4px', color: 'var(--ink)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' });
      card.className = 'prefab-card';
      card.dataset.id = p.id;
      card.append(iconImg(p.id, 64), el('span', { fontSize: '11px', textAlign: 'center' }, p.name));
      card.onclick = () => showDetail(p);
      grid.append(card);
    }
    if (!grid.children.length) grid.append(el('div', { color: 'var(--dim)' }, 'Nothing matches.'));
  }

  search.oninput = render;
  render();
  const start = params.get('id');
  showDetail((start && getPrefab(start)) || selected);
}

if (params.has('sheet')) contactSheet(params.get('sheet') ?? '');
else gallery();
