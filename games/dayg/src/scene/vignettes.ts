// Environmental storytelling vignettes: 42 pre-breakout & post-breakout @lawn/prefabs dioramas with inspectable lore reader modal.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import type { RegionDef } from '../sim/types';
import type { Interact } from '../game/interact';
import type { Collider } from '../world/collide';
import { getDiscoveredNotes, LORE_NOTES, markNoteDiscovered, type LoreNote } from '../sim/loreNotes';

function makeVignetteProp(note: LoreNote, variant: number): THREE.Object3D {
  const g = new THREE.Group();
  try {
    const model = buildPrefab(note.prefabId);
    model.scale.setScalar(1.2);
    model.rotation.y = (variant % 6) * 0.45;
    g.add(model);
  } catch {
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.45, 0.7),
      new THREE.MeshStandardMaterial({ color: note.era === 'pre-breakout' ? 0x7a5c3e : 0x4c4034, roughness: 0.9 }),
    );
    box.position.y = 0.225;
    g.add(box);
  }

  // Subtle parchment note & warm pinlight accent so players spot lore dioramas at dusk
  const paper = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.03, 0.42),
    new THREE.MeshStandardMaterial({ color: note.era === 'pre-breakout' ? 0xe8dec8 : 0xcbd4c0, roughness: 0.8 }),
  );
  paper.position.set(0.45, 0.04, 0.45);
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
  onDiscover?: (note: LoreNote) => void;
  onToast: (text: string) => void;
}): VignetteSystem {
  const { scene, ui, regions, interact, collider, onDiscover, onToast } = deps;
  const root = document.createElement('div');
  root.id = 'dayg-lore';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', 'Lore note');
  root.style.cssText = 'position:fixed;inset:0;z-index:62;display:none;align-items:center;justify-content:center;' +
    'background:rgba(10,14,10,0.78);backdrop-filter:blur(6px);pointer-events:auto;padding:16px;box-sizing:border-box;' +
    'font:15px/1.5 var(--dg-font);color:var(--dg-text)';
  root.addEventListener('mousedown', (e) => e.stopPropagation());

  const card = document.createElement('div');
  card.style.cssText = 'width:min(480px,94vw);background:var(--dg-surface);border:1px solid var(--dg-border-strong);' +
    'border-radius:var(--dg-radius);box-shadow:var(--dg-shadow);padding:18px 20px;box-sizing:border-box';
  root.appendChild(card);
  ui.appendChild(root);

  let openFlag = false;
  function close(): void { openFlag = false; root.style.display = 'none'; }
  window.addEventListener('keydown', (e) => { if (openFlag && e.key === 'Escape') { e.preventDefault(); close(); } });

  function showNote(note: LoreNote): void {
    const fresh = markNoteDiscovered(note.id);
    if (fresh) {
      onDiscover?.(note);
      const rewardTxt = note.rewardAcorns ? ` (+${note.rewardAcorns} acorns)` : '';
      onToast(`📖 Discovered: ${note.title}${rewardTxt}`);
    }
    card.replaceChildren();
    const badge = document.createElement('div');
    const discoveredCount = getDiscoveredNotes().length;
    badge.textContent = `${note.era === 'pre-breakout' ? 'PRE-BREAKOUT ARCHIVE' : 'POST-BREAKOUT NOTE'} · Discovered ${discoveredCount} / ${LORE_NOTES.length}`;
    badge.style.cssText = `font-size:11px;font-weight:700;letter-spacing:.08em;color:${note.era === 'pre-breakout' ? 'var(--dg-accent)' : 'var(--dg-ok)'};margin-bottom:6px`;
    const title = document.createElement('h3');
    title.textContent = note.title;
    title.style.cssText = 'margin:0 0 2px;font-size:19px';
    const byline = document.createElement('div');
    byline.textContent = `Signed: ${note.author}`;
    byline.style.cssText = 'font-size:12px;color:var(--dg-muted);margin-bottom:10px';
    const body = document.createElement('p');
    body.textContent = note.body;
    body.style.cssText = 'margin:0 0 12px;color:var(--dg-text)';

    card.append(badge, title, byline, body);

    if (note.clue) {
      const clueBox = document.createElement('div');
      clueBox.textContent = `🧭 Clue: ${note.clue}`;
      clueBox.style.cssText = 'font-size:13px;padding:8px 10px;border-radius:6px;background:rgba(232,195,90,0.1);' +
        'border:1px solid var(--dg-border);color:var(--dg-accent);margin-bottom:14px';
      card.append(clueBox);
    }

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.textContent = 'Close';
    closeBtn.style.cssText = 'min-height:44px;min-width:96px;padding:8px 16px;border-radius:8px;border:1px solid var(--dg-border);' +
      'background:var(--dg-surface-2);color:var(--dg-text);font:14px var(--dg-font);cursor:pointer;touch-action:manipulation';
    closeBtn.addEventListener('click', (e) => { e.stopPropagation(); close(); });
    card.append(closeBtn);
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

    const prop = makeVignetteProp(note, idx);
    prop.position.set(x, y, z);
    scene.add(prop);

    interact.add({
      id: `lore:${note.id}`,
      x, y, z,
      radius: 2.3,
      label: () => `Read: ${note.title}`,
      act: () => showNote(note),
    });
  });

  return { isOpen: () => openFlag, close };
}
