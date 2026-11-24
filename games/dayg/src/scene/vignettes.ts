// Environmental storytelling vignettes: pre-breakout & post-breakout props with inspectable lore reader modal.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { PREFAB_SCALE } from '../config';
import type { RegionDef } from '../sim/types';
import type { Interact } from '../game/interact';
import type { Collider } from '../world/collide';
import { LORE_NOTES, markNoteDiscovered, type LoreNote } from '../sim/loreNotes';

function makeVignetteProp(era: LoreNote['era']): THREE.Object3D {
  const g = new THREE.Group();
  try {
    const base = buildPrefab(era === 'pre-breakout' ? 'crate' : 'loot-sack');
    base.scale.setScalar(PREFAB_SCALE * 0.75);
    g.add(base);
  } catch {
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.45, 0.6),
      new THREE.MeshStandardMaterial({ color: era === 'pre-breakout' ? 0x7a6248 : 0x4f5a46, roughness: 0.9 }),
    );
    box.position.y = 0.22;
    g.add(box);
  }
  const paper = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.03, 0.42),
    new THREE.MeshStandardMaterial({ color: era === 'pre-breakout' ? 0xe8dec8 : 0xcbd4c0, roughness: 0.8 }),
  );
  paper.position.set(0, 0.56, 0);
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
    badge.textContent = note.era === 'pre-breakout' ? 'PRE-BREAKOUT ARCHIVE' : 'POST-BREAKOUT NOTE';
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

  for (const note of LORE_NOTES) {
    const reg = regions.find((r) => r.id === note.region);
    if (!reg) continue;
    const cx = (reg.rect.x0 + reg.rect.x1) / 2 + note.offset[0];
    const cz = (reg.rect.z0 + reg.rect.z1) / 2 + note.offset[1];
    const x = Math.min(reg.rect.x1 - 2, Math.max(reg.rect.x0 + 2, cx));
    const z = Math.min(reg.rect.z1 - 2, Math.max(reg.rect.z0 + 2, cz));
    if (!collider.inBounds(x, z)) continue;
    const y = collider.groundAt(x, z, 6);
    if (y > 20) continue;

    const prop = makeVignetteProp(note.era);
    prop.position.set(x, y, z);
    scene.add(prop);

    interact.add({
      id: `lore:${note.id}`,
      x, y, z,
      radius: 2.2,
      label: () => `Read: ${note.title}`,
      act: () => showNote(note),
    });
  }

  return { isOpen: () => openFlag, close };
}
