import * as THREE from 'three';
import { allGnomeokemon } from './prefabs/registry';
import { createGnomeJesus, createGiantDog, animateGiantDog } from './snap/models';
import { loadBestPhotos } from './snap/storage';
import type { CourseId } from './snap/types';
import { COURSE_META, getCourseSpawns } from './snap/world';

function createCampDiorama(): HTMLElement {
  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, {
    width: '100%',
    height: '200px',
    display: 'block',
    borderRadius: '12px',
    background: 'linear-gradient(180deg, #2b4c32 0%, #18231a 100%)',
    border: '1px solid var(--line)',
  });

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xfffbe8, 0x3b4d34, 1.9));
  const sun = new THREE.DirectionalLight(0xfff0c8, 2.2);
  sun.position.set(3, 6, 4);
  scene.add(sun);

  const ground = new THREE.Mesh(
    new THREE.CylinderGeometry(3.4, 3.6, 0.14, 24),
    new THREE.MeshLambertMaterial({ color: 0x4b7838, flatShading: true }),
  );
  ground.position.y = -0.07;
  scene.add(ground);

  const dog = createGiantDog();
  dog.position.set(-0.9, 0, 0.2);
  dog.rotation.y = 0.65;
  dog.scale.setScalar(0.75);
  scene.add(dog);

  const jesus = createGnomeJesus();
  jesus.position.set(1.25, 0, 0.4);
  jesus.rotation.y = -0.45;
  jesus.scale.setScalar(1.35);
  scene.add(jesus);

  const camera = new THREE.PerspectiveCamera(34, 2, 0.1, 30);
  camera.position.set(0, 2.1, 6.0);
  camera.lookAt(0.15, 0.85, 0);

  let alive = true;
  const clock = new THREE.Clock();
  function tick(): void {
    if (!alive || !canvas.isConnected) {
      alive = false;
      renderer.dispose();
      return;
    }
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
    const t = clock.getElapsedTime();
    animateGiantDog(dog, t, true);
    jesus.position.y = Math.sin(t * 2.1) * 0.04;
    jesus.rotation.y = -0.45 + Math.sin(t * 0.8) * 0.22;
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  return canvas;
}

export function renderSnap64Menu(
  container: HTMLElement,
  actions: {
    onStartCourse: (courseId: CourseId) => void;
    onOpenGnokomindex: () => void;
    onOpenGallery: () => void;
  },
): void {
  container.replaceChildren();
  const best = loadBestPhotos();
  const allEntries = allGnomeokemon();
  const snappedCount = allEntries.filter((e) => Boolean(best[e.prefab.id])).length;
  const totalScore = Object.values(best).reduce((sum, p) => sum + (p?.score?.total ?? 0), 0);

  const wrap = document.createElement('div');
  wrap.id = 'snap64-menu';
  Object.assign(wrap.style, {
    maxWidth: '1040px',
    margin: '0 auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  });
  container.append(wrap);

  // Hero / Camp Banner
  const hero = document.createElement('div');
  Object.assign(hero.style, {
    background: 'var(--panel)',
    border: '2px solid var(--accent)',
    borderRadius: '14px',
    padding: '16px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '16px',
    alignItems: 'center',
  });

  const heroLeft = document.createElement('div');
  heroLeft.innerHTML = `
    <div style="font-size:12px;font-weight:700;letter-spacing:0.08em;color:var(--accent);text-transform:uppercase;">Fescue Photo Safari</div>
    <h1 style="margin:4px 0 8px;font-size:28px;line-height:1.15;">Gnomokemon Snap 64</h1>
    <p style="margin:0 0 12px;color:var(--dim);font-size:14px;line-height:1.45;">
      Hop on the Giant Fetch Dog, toss treats and Pester Clods, blow the Gnome Flute, and submit your best shots to Gnome Jesus!
    </p>
  `;

  const statsRow = document.createElement('div');
  Object.assign(statsRow.style, { display: 'flex', gap: '10px', flexWrap: 'wrap' });
  const statPill = (label: string, val: string): HTMLElement => {
    const p = document.createElement('div');
    Object.assign(p.style, {
      background: '#162018',
      border: '1px solid var(--line)',
      borderRadius: '8px',
      padding: '8px 12px',
      fontSize: '12px',
    });
    p.innerHTML = `<div style="color:var(--dim)">${label}</div><strong style="font-size:16px;color:var(--accent)">${val}</strong>`;
    return p;
  };
  const divineCount = Object.values(best).filter((p) => p?.score?.grade === 'Divine').length;
  statsRow.append(
    statPill('Gnokomindex', `${snappedCount} / ${allEntries.length} Snapped`),
    statPill('Total Score', `${totalScore.toLocaleString()} pts`),
    statPill('Divine Grades', `${divineCount}`),
  );
  heroLeft.append(statsRow);

  const badgeRow = document.createElement('div');
  Object.assign(badgeRow.style, { display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' });
  const addBadge = (label: string, earned: boolean): void => {
    const b = document.createElement('span');
    Object.assign(b.style, {
      fontSize: '11px',
      padding: '3px 9px',
      borderRadius: '999px',
      border: `1px solid ${earned ? 'var(--accent)' : 'var(--line)'}`,
      background: earned ? 'var(--panel-2)' : '#141c16',
      color: earned ? 'var(--accent)' : 'var(--dim)',
      fontWeight: earned ? '700' : '500',
      opacity: earned ? '1' : '0.6',
    });
    b.textContent = label;
    badgeRow.append(b);
  };
  addBadge('📸 First Snap', snappedCount >= 1);
  addBadge('🌿 20+ Explorer', snappedCount >= 20);
  addBadge('🏆 Divine Eye', divineCount >= 1);
  addBadge('👑 Master of Fescue', snappedCount >= allEntries.length);
  heroLeft.append(badgeRow);

  hero.append(heroLeft, createCampDiorama());
  wrap.append(hero);

  // Section 1: Select Course (World 1 & World 2)
  const courseHeading = document.createElement('h2');
  courseHeading.textContent = '1. Select Safari Course';
  Object.assign(courseHeading.style, { margin: '4px 0 0', fontSize: '18px', color: 'var(--accent)' });
  wrap.append(courseHeading);

  const courseGrid = document.createElement('div');
  Object.assign(courseGrid.style, {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '12px',
  });
  wrap.append(courseGrid);

  for (const cid of ['lawn', 'desert', 'depths', 'kiln', 'ocean', 'night', 'frost'] as const) {
    const meta = COURSE_META[cid];
    const species = [...new Set(getCourseSpawns(cid).map((s) => s.speciesId))];
    const courseSnapped = species.filter((sid) => Boolean(best[sid])).length;

    const bg =
      cid === 'desert'
        ? 'linear-gradient(135deg, #3b2a1b 0%, #241b14 100%)'
        : cid === 'depths'
          ? 'linear-gradient(135deg, #1b2f38 0%, #142026 100%)'
          : cid === 'kiln'
            ? 'linear-gradient(135deg, #381e2b 0%, #22141c 100%)'
            : cid === 'ocean'
              ? 'linear-gradient(135deg, #123c4a 0%, #0b242d 100%)'
              : cid === 'night'
                ? 'linear-gradient(135deg, #1b1b3a 0%, #101124 100%)'
                : cid === 'frost'
                  ? 'linear-gradient(135deg, #213d4d 0%, #162630 100%)'
                  : 'linear-gradient(135deg, #223826 0%, #18261b 100%)';

    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'course-card';
    Object.assign(card.style, {
      background: bg,
      border: '2px solid var(--line)',
      borderRadius: '12px',
      padding: '16px',
      color: 'var(--ink)',
      textAlign: 'left',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      minHeight: '132px',
    });
    card.onmouseenter = () => {
      card.style.borderColor = 'var(--accent)';
    };
    card.onmouseleave = () => {
      card.style.borderColor = 'var(--line)';
    };
    card.onclick = () => actions.onStartCourse(cid);

    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;width:100%;">
        <strong style="font-size:18px;">${meta.label}</strong>
        <span style="padding:3px 10px;border-radius:999px;background:rgba(0,0,0,0.35);font-size:12px;color:var(--accent);font-weight:700;">
          ${courseSnapped}/${species.length} Species
        </span>
      </div>
      <div style="font-size:13px;color:var(--dim);">${meta.subtitle}</div>
      <div style="margin-top:auto;padding-top:8px;font-weight:700;color:var(--accent);font-size:14px;">
        Start Safari Ride →
      </div>
    `;
    courseGrid.append(card);
  }

  // Section 2: Camp Facilities (Gnokomindex & Photo Gallery)
  const campHeading = document.createElement('h2');
  campHeading.textContent = '2. Oak & Gnome Jesus Camp';
  Object.assign(campHeading.style, { margin: '4px 0 0', fontSize: '18px', color: 'var(--accent)' });
  wrap.append(campHeading);

  const campGrid = document.createElement('div');
  Object.assign(campGrid.style, {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '12px',
  });
  wrap.append(campGrid);

  const makeCampCard = (title: string, desc: string, badge: string, onClick: () => void): void => {
    const card = document.createElement('button');
    card.type = 'button';
    Object.assign(card.style, {
      background: 'var(--panel)',
      border: '2px solid var(--line)',
      borderRadius: '12px',
      padding: '16px',
      color: 'var(--ink)',
      textAlign: 'left',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      minHeight: '110px',
    });
    card.onmouseenter = () => {
      card.style.borderColor = 'var(--accent)';
    };
    card.onmouseleave = () => {
      card.style.borderColor = 'var(--line)';
    };
    card.onclick = onClick;
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;width:100%;">
        <strong style="font-size:17px;">${title}</strong>
        <span style="font-size:12px;color:var(--accent);font-weight:700;">${badge}</span>
      </div>
      <div style="font-size:13px;color:var(--dim);line-height:1.4;">${desc}</div>
    `;
    campGrid.append(card);
  };

  makeCampCard(
    '📖 Gnokomindex',
    'Inspect all 16 3D Gnomokemon prefab models, spin them, toggle idle animations, and read field lore.',
    `${allEntries.length} Models`,
    actions.onOpenGnokomindex,
  );
  makeCampCard(
    '🖼️ Best Pictures & Gallery',
    'View your highest-scoring graded photo for each Gnomokemon and recreate the exact 3D scene.',
    `${snappedCount}/${allEntries.length} Saved`,
    actions.onOpenGallery,
  );
}
