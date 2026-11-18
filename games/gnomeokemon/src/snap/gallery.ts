import * as THREE from 'three';
import { allGnomeokemon, buildGnomeokemon, gnomeokemonIcon } from '../prefabs/registry';
import { createGiantDog } from './models';
import { clearBestPhotos, loadBestPhotos } from './storage';
import type { PhotoRecord } from './types';
import { animateLawnCreature, buildCourseEnvironment, createCourseCurve } from './world';

function openSceneRecreator(photo: PhotoRecord): void {
  const overlay = document.createElement('div');
  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    background: 'rgba(10, 16, 12, 0.86)',
    zIndex: '1000',
    display: 'grid',
    placeItems: 'center',
    padding: '16px',
  });

  const modal = document.createElement('div');
  Object.assign(modal.style, {
    width: 'min(920px, 100%)',
    background: 'var(--panel)',
    border: '1px solid var(--line)',
    borderRadius: '14px',
    padding: '14px',
  });
  overlay.append(modal);

  const head = document.createElement('div');
  Object.assign(head.style, {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px',
    flexWrap: 'wrap',
  });
  const title = document.createElement('div');
  title.innerHTML = `<strong>Recreated Scene: #${photo.dex} ${photo.name}</strong>
    <span style="color:var(--dim);font-size:12px;margin-left:8px">${photo.score.grade} · ${photo.score.total} pts</span>`;

  const btns = document.createElement('div');
  Object.assign(btns.style, { display: 'flex', gap: '8px', flexWrap: 'wrap' });

  let freeOrbit = false;
  const modeBtn = document.createElement('button');
  modeBtn.type = 'button';
  modeBtn.textContent = 'Orbit Around Moment';
  Object.assign(modeBtn.style, {
    minHeight: '44px',
    padding: '8px 14px',
    borderRadius: '8px',
    border: '1px solid var(--accent)',
    background: 'var(--panel-2)',
    color: 'var(--accent)',
    fontWeight: '600',
    cursor: 'pointer',
  });

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.textContent = 'Close ✕';
  Object.assign(closeBtn.style, {
    minHeight: '44px',
    padding: '8px 14px',
    borderRadius: '8px',
    border: '1px solid var(--line)',
    background: 'transparent',
    color: 'var(--ink)',
    fontWeight: '600',
    cursor: 'pointer',
  });

  btns.append(modeBtn, closeBtn);
  head.append(title, btns);
  modal.append(head);

  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, {
    width: '100%',
    height: 'min(62vh, 480px)',
    display: 'block',
    borderRadius: '10px',
    background: '#1a271d',
    touchAction: 'none',
  });
  modal.append(canvas);

  const hint = document.createElement('div');
  Object.assign(hint.style, { fontSize: '12px', color: 'var(--dim)', marginTop: '8px' });
  hint.textContent = 'Viewing from the exact camera position, angle, and FOV of your snapped photo.';
  modal.append(hint);

  document.body.append(overlay);

  // Build exact 3D diorama from snapshot
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const snap = photo.snapshot;
  const courseId = snap.courseId ?? 'lawn';
  const scene = new THREE.Scene();
  buildCourseEnvironment(scene, courseId);

  const curve = createCourseCurve(courseId);
  const dog = createGiantDog();
  const dogPos = curve.getPointAt(Math.min(1, Math.max(0, snap.dogT)));
  const dogTan = curve.getTangentAt(Math.min(1, Math.max(0, snap.dogT)));
  dog.position.copy(dogPos);
  dog.lookAt(dogPos.x + dogTan.x, dogPos.y, dogPos.z + dogTan.z);
  scene.add(dog);

  let focusPoint = new THREE.Vector3(dogPos.x, 0.5, dogPos.z);
  for (const cs of snap.creatures) {
    const g = buildGnomeokemon(cs.speciesId);
    g.position.set(cs.pos[0], cs.pos[1], cs.pos[2]);
    g.rotation.y = cs.rotY;
    animateLawnCreature(g, cs.action, cs.animTime, cs.pos[1], cs.rotY);
    scene.add(g);
    if (cs.speciesId === photo.speciesId) {
      focusPoint = new THREE.Vector3(cs.pos[0], cs.pos[1] + 0.4, cs.pos[2]);
    }
  }

  const camera = new THREE.PerspectiveCamera(snap.fov, 1, 0.1, 120);
  const origPos = new THREE.Vector3(...snap.cameraPos);
  const origQuat = new THREE.Quaternion(...snap.cameraQuat);
  camera.position.copy(origPos);
  camera.quaternion.copy(origQuat);

  let yaw = 0.6;
  let pitch = 0.35;
  let dist = 3.2;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  modeBtn.onclick = () => {
    freeOrbit = !freeOrbit;
    if (freeOrbit) {
      modeBtn.textContent = 'Reset to Photo Angle';
      hint.textContent = 'Free Orbit mode: drag to inspect the frozen moment from any angle, scroll to zoom.';
      canvas.style.cursor = 'grab';
    } else {
      modeBtn.textContent = 'Orbit Around Moment';
      hint.textContent = 'Viewing from the exact camera position, angle, and FOV of your snapped photo.';
      canvas.style.cursor = 'default';
      camera.fov = snap.fov;
      camera.updateProjectionMatrix();
      camera.position.copy(origPos);
      camera.quaternion.copy(origQuat);
    }
  };

  canvas.addEventListener('pointerdown', (e) => {
    if (!freeOrbit) return;
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointerup', () => {
    dragging = false;
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!freeOrbit || !dragging) return;
    yaw -= (e.clientX - lastX) * 0.01;
    pitch = Math.max(-0.1, Math.min(1.3, pitch + (e.clientY - lastY) * 0.01));
    lastX = e.clientX;
    lastY = e.clientY;
  });
  canvas.addEventListener(
    'wheel',
    (e) => {
      if (!freeOrbit) return;
      e.preventDefault();
      dist = Math.max(1.2, Math.min(12, dist * (1 + Math.sign(e.deltaY) * 0.1)));
    },
    { passive: false },
  );

  let alive = true;
  function tick(): void {
    if (!alive) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w > 0 && h > 0) {
      const pr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(w * pr) || canvas.height !== Math.round(h * pr)) {
        renderer.setPixelRatio(pr);
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
    }
    if (freeOrbit) {
      camera.position.set(
        focusPoint.x + dist * Math.cos(pitch) * Math.sin(yaw),
        focusPoint.y + dist * Math.sin(pitch),
        focusPoint.z + dist * Math.cos(pitch) * Math.cos(yaw),
      );
      camera.lookAt(focusPoint);
    }
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  function close(): void {
    alive = false;
    renderer.dispose();
    overlay.remove();
  }
  closeBtn.onclick = close;
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
}

export function renderPhotoGallery(container: HTMLElement, onStartSnap: () => void): void {
  container.replaceChildren();
  const best = loadBestPhotos();
  const entries = allGnomeokemon();
  const caughtCount = entries.filter((e) => Boolean(best[e.prefab.id])).length;

  const wrap = document.createElement('div');
  Object.assign(wrap.style, {
    maxWidth: '1160px',
    margin: '0 auto',
    padding: '16px',
  });
  container.append(wrap);

  const top = document.createElement('div');
  Object.assign(top.style, {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '16px',
  });
  const h = document.createElement('div');
  h.innerHTML = `<h2 style="margin:0 0 4px">Photo Gallery (${caughtCount}/${entries.length} Snapped)</h2>
    <div style="color:var(--dim);font-size:13px">Your highest-scoring photo for each Gnomokemon, graded by Gnome Jesus. Click Recreate Scene to revisit the exact 3D moment.</div>`;

  const actions = document.createElement('div');
  Object.assign(actions.style, { display: 'flex', gap: '8px', flexWrap: 'wrap' });

  const rideBtn = document.createElement('button');
  rideBtn.type = 'button';
  rideBtn.textContent = '📸 Play Gnomokemon Snap';
  Object.assign(rideBtn.style, {
    minHeight: '44px',
    padding: '10px 16px',
    borderRadius: '8px',
    border: '1px solid var(--accent)',
    background: 'var(--accent)',
    color: '#18231a',
    fontWeight: '700',
    cursor: 'pointer',
  });
  rideBtn.onclick = onStartSnap;
  actions.append(rideBtn);

  if (caughtCount > 0) {
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.textContent = 'Clear Gallery';
    Object.assign(clearBtn.style, {
      minHeight: '44px',
      padding: '10px 14px',
      borderRadius: '8px',
      border: '1px solid var(--line)',
      background: 'transparent',
      color: 'var(--dim)',
      cursor: 'pointer',
    });
    clearBtn.onclick = () => {
      clearBestPhotos();
      renderPhotoGallery(container, onStartSnap);
    };
    actions.append(clearBtn);
  }

  top.append(h, actions);
  wrap.append(top);

  const grid = document.createElement('div');
  Object.assign(grid.style, {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '12px',
  });
  wrap.append(grid);

  for (const entry of entries) {
    const pic = best[entry.prefab.id];
    const card = document.createElement('div');
    Object.assign(card.style, {
      background: 'var(--panel)',
      border: `1px solid ${pic ? 'var(--accent)' : 'var(--line)'}`,
      borderRadius: '10px',
      padding: '10px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    });

    if (pic) {
      const img = document.createElement('img');
      img.src = pic.dataUrl;
      Object.assign(img.style, { width: '100%', height: '155px', objectFit: 'cover', borderRadius: '8px', display: 'block' });

      const title = document.createElement('div');
      Object.assign(title.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'center' });
      title.innerHTML = `<strong>#${entry.dex} ${entry.prefab.name}</strong>
        <span style="color:var(--accent);font-weight:700;font-size:13px">${pic.score.grade} · ${pic.score.total}</span>`;

      const stats = document.createElement('div');
      Object.assign(stats.style, { fontSize: '12px', color: 'var(--dim)' });
      stats.textContent = `Size ${pic.score.size} · Frame ${pic.score.framing} · Pose ${pic.score.pose} · Special +${pic.score.special}`;

      const recBtn = document.createElement('button');
      recBtn.type = 'button';
      recBtn.textContent = '🔄 Recreate Scene';
      Object.assign(recBtn.style, {
        minHeight: '44px',
        padding: '8px 12px',
        borderRadius: '8px',
        border: '1px solid var(--accent)',
        background: 'var(--panel-2)',
        color: 'var(--accent)',
        fontWeight: '600',
        cursor: 'pointer',
      });
      recBtn.onclick = () => openSceneRecreator(pic);

      card.append(img, title, stats, recBtn);
    } else {
      const iconUrl = gnomeokemonIcon(entry, { size: 160 });
      const placeholder = document.createElement('div');
      Object.assign(placeholder.style, {
        height: '155px',
        borderRadius: '8px',
        background: '#162018',
        display: 'grid',
        placeItems: 'center',
      });
      if (iconUrl) {
        const img = document.createElement('img');
        img.src = iconUrl;
        Object.assign(img.style, { width: '96px', height: '96px', filter: 'brightness(0.28) contrast(1.2)', opacity: '0.75' });
        placeholder.append(img);
      }
      const title = document.createElement('div');
      title.innerHTML = `<strong style="color:var(--dim)">#${entry.dex} ${entry.prefab.name}</strong>`;
      const note = document.createElement('div');
      Object.assign(note.style, { fontSize: '12px', color: 'var(--dim)' });
      note.textContent = `Region: ${entry.region} · Not yet photographed`;
      card.append(placeholder, title, note);
    }

    grid.append(card);
  }
}
