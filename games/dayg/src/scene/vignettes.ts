// Environmental storytelling vignettes: pre-breakout & post-breakout props with inspectable lore reader modal.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { PREFAB_SCALE } from '../config';
import type { RegionDef } from '../sim/types';
import type { Interact } from '../game/interact';
import type { Collider } from '../world/collide';
import { getDiscoveredNotes, LORE_NOTES, markNoteDiscovered, type LoreNote } from '../sim/loreNotes';

function makeVignetteProp(era: LoreNote['era'], variant: number): THREE.Object3D {
  const g = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: era === 'pre-breakout' ? 0x7a5c3e : 0x4c4034, roughness: 0.9 });
  const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x3b2d20, roughness: 0.92 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x7a8076, roughness: 0.95 });
  const waxMat = new THREE.MeshStandardMaterial({ color: 0xf0e6c8, roughness: 0.6 });
  const flameMat = new THREE.MeshStandardMaterial({ color: 0xffc857, emissive: 0xff8c1a, emissiveIntensity: 1.2, roughness: 0.3 });

  const kind = variant % 3;
  let noteY = 0.56;

  if (kind === 0) {
    // Overturned handcart + spilled crate
    const bed = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.1, 0.65), woodMat);
    bed.position.set(0, 0.28, 0);
    bed.rotation.z = 0.48;
    const wheelGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.08, 10);
    const w1 = new THREE.Mesh(wheelGeo, darkWoodMat);
    w1.rotation.x = Math.PI / 2;
    w1.position.set(-0.32, 0.22, 0.38);
    const w2 = new THREE.Mesh(wheelGeo, darkWoodMat);
    w2.rotation.x = Math.PI / 2;
    w2.position.set(0.28, 0.42, -0.36);
    g.add(bed, w1, w2);
    noteY = 0.42;
  } else if (kind === 1) {
    // Memorial stone plinth + candles
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.34, 0.55), stoneMat);
    plinth.position.set(0, 0.17, 0);
    g.add(plinth);
    const candleOffsets: [number, number, number][] = [[-0.22, 0.18, -0.1], [-0.12, 0.24, 0.12], [0.22, 0.14, 0.1]];
    for (const [cx, ch, cz] of candleOffsets) {
      const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, ch, 7), waxMat);
      candle.position.set(cx, 0.35 + ch / 2, cz);
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.06, 5), flameMat);
      flame.position.set(cx, 0.35 + ch + 0.035, cz);
      g.add(candle, flame);
    }
    noteY = 0.38;
  } else {
    // Barricaded crates + angled plank
    try {
      const base = buildPrefab(era === 'pre-breakout' ? 'crate' : 'loot-sack');
      base.scale.setScalar(PREFAB_SCALE * 0.75);
      g.add(base);
    } catch {
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.45, 0.6), woodMat);
      box.position.y = 0.225;
      g.add(box);
    }
    const plank = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.07, 0.22), darkWoodMat);
    plank.position.set(0.28, 0.26, 0.34);
    plank.rotation.set(0.2, 0.35, -0.55);
    g.add(plank);
  }

  const paper = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.03, 0.42),
    new THREE.MeshStandardMaterial({ color: era === 'pre-breakout' ? 0xe8dec8 : 0xcbd4c0, roughness: 0.8 }),
  );
  paper.position.set(0, noteY, 0);
  paper.rotation.y = 0.3;
  g.add(paper);
  return g;
}

export interface VignetteSystem {
  isOpen(): boolean;
  close(): void;
}

export function createVignetteSystem(deps: {
  scene: THREE.Scene;
  ui: HTMLElement;
  regions: readonly RegionDef[];
  interact: Interact;
  collider: Collider;
  onToast: (text: string) => void;
}): VignetteSystem {
  const { scene, ui, regions, interact, collider, onToast } = deps;
  const root = document.createElement('div');
  root.id = 'dayg-lore';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', 'Lore note');
  root.style.cssText = 'position:fixed;inset:0;z-index:62;display:none;align-items:center;justify-content:center;' +
    'background:rgba(10,14,10,0.78);backdrop-filter:blur(6px);pointer-events:auto;padding:16px;box-sizing:border-box;' +
    'font:15px/1.5 var(--dg-font);color:var(--dg-text)';
  root.addEventListener('mousedown', (e) => e.stopPropagation());

  const card = document.createElement('div');
  card.style.cssText = 'width:min(460px,94vw);background:var(--dg-surface);border:1px solid var(--dg-border-strong);' +
    'border-radius:var(--dg-radius);box-shadow:var(--dg-shadow);padding:18px 20px;box-sizing:border-box';
  root.appendChild(card);
  ui.appendChild(root);

  let openFlag = false;
  function close(): void { openFlag = false; root.style.display = 'none'; }
  window.addEventListener('keydown', (e) => { if (openFlag && e.key === 'Escape') { e.preventDefault(); close(); } });

  function showNote(note: LoreNote): void {
    const fresh = markNoteDiscovered(note.id);
    if (fresh) onToast(`📖 Discovered: ${note.title}`);
    card.replaceChildren();
    const badge = document.createElement('div');
    const discoveredCount = getDiscoveredNotes().length;
    badge.textContent = `${note.era === 'pre-breakout' ? 'PRE-BREAKOUT ARCHIVE' : 'POST-BREAKOUT NOTE'} · Discovered ${discoveredCount} / ${LORE_NOTES.length}`;
    badge.style.cssText = `font-size:11px;font-weight:700;letter-spacing:.08em;color:${note.era === 'pre-breakout' ? 'var(--dg-accent)' : 'var(--dg-ok)'};margin-bottom:6px`;
    const title = document.createElement('h3');
    title.textContent = note.title;
    title.style.cssText = 'margin:0 0 8px;font-size:19px';
    const body = document.createElement('p');
    body.textContent = note.body;
    body.style.cssText = 'margin:0 0 16px;color:var(--dg-text)';
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.textContent = 'Close';
    closeBtn.style.cssText = 'min-height:44px;min-width:96px;padding:8px 16px;border-radius:8px;border:1px solid var(--dg-border);' +
      'background:var(--dg-surface-2);color:var(--dg-text);font:14px var(--dg-font);cursor:pointer;touch-action:manipulation';
    closeBtn.addEventListener('click', (e) => { e.stopPropagation(); close(); });
    card.append(badge, title, body, closeBtn);
    openFlag = true;
    root.style.display = 'flex';
  }

  LORE_NOTES.forEach((note, idx) => {
    const reg = regions.find((r) => r.id === note.region);
    if (!reg) return;
    const cx = (reg.rect.x0 + reg.rect.x1) / 2 + note.offset[0];
    const cz = (reg.rect.z0 + reg.rect.z1) / 2 + note.offset[1];
    const x = Math.min(reg.rect.x1 - 2, Math.max(reg.rect.x0 + 2, cx));
    const z = Math.min(reg.rect.z1 - 2, Math.max(reg.rect.z0 + 2, cz));
    if (!collider.inBounds(x, z)) return;
    const y = collider.groundAt(x, z, 6);
    if (y > 20) return;

    const prop = makeVignetteProp(note.era, idx);
    prop.position.set(x, y, z);
    scene.add(prop);

    interact.add({
      id: `lore:${note.id}`,
      x, y, z,
      radius: 2.2,
      label: () => `Read: ${note.title}`,
      act: () => showNote(note),
    });
  });

  return { isOpen: () => openFlag, close };
}
