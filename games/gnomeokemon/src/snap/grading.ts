import * as THREE from 'three';
import { createGnomeJesus } from './models';
import { saveBestPhoto } from './storage';
import type { PhotoGrade, PhotoRecord } from './types';

const GRADE_COLORS: Record<PhotoGrade, { color: string; bg: string; sermon: string }> = {
  Divine: {
    color: '#ffe066',
    bg: '#4b3b12',
    sermon: 'Blessed be this glaze! Even the Tall Ones would hang it on their fridge.',
  },
  Gold: {
    color: '#ffd166',
    bg: '#3f3217',
    sermon: 'A righteous framing! My clay heart warms at such crisp composition.',
  },
  Silver: {
    color: '#cbd5e1',
    bg: '#28333f',
    sermon: 'Fair and faithful work. Next time, coax them with a treat or the Flute!',
  },
  Bronze: {
    color: '#d99b66',
    bg: '#3c291d',
    sermon: 'A humble snapshot. Get closer, center the crosshairs, and catch them in motion!',
  },
};

function playRevealTone(freq: number, dur: number, gain = 0.05): void {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
    setTimeout(() => void ctx.close(), dur * 1000 + 60);
  } catch {
    // Ignore audio errors
  }
}

function playGradeFanfare(grade: PhotoGrade): void {
  const base = grade === 'Divine' ? 587.33 : grade === 'Gold' ? 523.25 : grade === 'Silver' ? 440 : 349.23;
  playRevealTone(base, 0.14, 0.06);
  setTimeout(() => playRevealTone(base * 1.25, 0.14, 0.06), 110);
  setTimeout(() => playRevealTone(base * 1.5, 0.28, 0.07), 220);
}

function animateNumber(
  el: HTMLElement,
  target: number,
  durationMs: number,
  prefix: string,
  isCancelled: () => boolean,
): Promise<void> {
  if (isCancelled() || target === 0 || durationMs <= 0) {
    el.textContent = `${prefix}${target}`;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const start = performance.now();
    let lastTick = 0;
    function step(now: number): void {
      if (isCancelled()) {
        el.textContent = `${prefix}${target}`;
        resolve();
        return;
      }
      const p = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(target * eased);
      el.textContent = `${prefix}${val}`;
      if (now - lastTick > 75 && p < 1) {
        lastTick = now;
        playRevealTone(420 + p * 260, 0.03, 0.02);
      }
      if (p < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = `${prefix}${target}`;
        resolve();
      }
    }
    requestAnimationFrame(step);
  });
}

function createJesusPortrait(): HTMLElement {
  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, {
    width: '120px',
    height: '120px',
    borderRadius: '12px',
    background: '#1c2a20',
    border: '2px solid var(--accent)',
    flexShrink: '0',
  });
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1c2a20);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x445533, 2.0));
  const sun = new THREE.DirectionalLight(0xfff3d1, 2.2);
  sun.position.set(1.5, 3, 2);
  scene.add(sun);

  const jesus = createGnomeJesus();
  scene.add(jesus);

  const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 20);
  cam.position.set(0, 0.72, 1.55);
  cam.lookAt(0, 0.58, 0);

  let alive = true;
  const clock = new THREE.Clock();
  function tick(): void {
    if (!alive || !canvas.isConnected) {
      alive = false;
      renderer.dispose();
      return;
    }
    const t = clock.getElapsedTime();
    jesus.rotation.y = Math.sin(t * 0.9) * 0.35;
    jesus.position.y = Math.sin(t * 2.2) * 0.025;
    renderer.setSize(240, 240, false);
    renderer.render(scene, cam);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  return canvas;
}

export function renderGradingView(
  container: HTMLElement,
  photos: readonly PhotoRecord[],
  actions: { onRideAgain: () => void; onOpenGallery: () => void },
): void {
  container.replaceChildren();

  const wrap = document.createElement('div');
  Object.assign(wrap.style, {
    maxWidth: '1040px',
    margin: '0 auto',
    padding: '16px',
  });
  container.append(wrap);

  if (photos.length === 0) {
    const empty = document.createElement('div');
    Object.assign(empty.style, {
      background: 'var(--panel)',
      border: '1px solid var(--line)',
      borderRadius: '12px',
      padding: '24px',
      textAlign: 'center',
    });
    empty.innerHTML = `<h2 style="margin:0 0 8px">No Gnomokemon Caught on Film!</h2>
      <p style="color:var(--dim);margin:0 0 16px">Aim at a Gnomokemon during the dog ride and tap Snap (or Space) to capture a photo for Gnome Jesus.</p>`;
    const btn = document.createElement('button');
    btn.textContent = 'Ride Again';
    Object.assign(btn.style, {
      minHeight: '44px',
      padding: '10px 20px',
      borderRadius: '8px',
      border: '1px solid var(--accent)',
      background: 'var(--panel-2)',
      color: 'var(--accent)',
      cursor: 'pointer',
      fontWeight: '600',
    });
    btn.onclick = actions.onRideAgain;
    empty.append(btn);
    wrap.append(empty);
    return;
  }

  // Group captured photos by species, default-selecting the first shot per species (spoiler-free!)
  const bySpecies = new Map<string, PhotoRecord[]>();
  for (const p of photos) {
    const list = bySpecies.get(p.speciesId) ?? [];
    list.push(p);
    bySpecies.set(p.speciesId, list);
  }

  const chosen = new Map<string, PhotoRecord>();
  for (const [sid, list] of bySpecies.entries()) {
    chosen.set(sid, list[0]);
  }

  let submitted = false;
  let skipReveal = false;

  function render(): void {
    wrap.replaceChildren();

    // Header with Gnome Jesus
    const header = document.createElement('div');
    Object.assign(header.style, {
      display: 'flex',
      gap: '16px',
      alignItems: 'center',
      background: 'var(--panel)',
      border: '1px solid var(--line)',
      borderRadius: '12px',
      padding: '14px',
      marginBottom: '16px',
      flexWrap: 'wrap',
    });
    header.append(createJesusPortrait());

    const hText = document.createElement('div');
    hText.style.flex = '1 1 260px';
    const title = document.createElement('h2');
    title.style.margin = '0 0 6px';
    title.textContent = submitted ? 'Gnome Jesus Grades Your Photos!' : 'Pick Your Best Shot per Gnomokemon';

    const sub = document.createElement('p');
    Object.assign(sub.style, { margin: '0 0 10px', color: 'var(--dim)', fontSize: '14px', lineHeight: '1.45' });
    sub.textContent = submitted
      ? 'Watch Gnome Jesus weigh Size, Framing, Pose, and Special Bonus on the Scale of the Lawn.'
      : `You snapped ${photos.length} photo(s) across ${bySpecies.size} species. Scores are hidden until you submit them to Gnome Jesus!`;

    const btnRow = document.createElement('div');
    Object.assign(btnRow.style, { display: 'flex', gap: '8px', flexWrap: 'wrap' });

    if (!submitted) {
      const submitBtn = document.createElement('button');
      submitBtn.textContent = `Submit ${chosen.size} Photo(s) to Gnome Jesus`;
      Object.assign(submitBtn.style, {
        minHeight: '44px',
        padding: '10px 18px',
        borderRadius: '8px',
        border: '1px solid var(--accent)',
        background: 'var(--accent)',
        color: '#18231a',
        fontWeight: '700',
        cursor: 'pointer',
      });
      submitBtn.onclick = () => {
        submitted = true;
        for (const pic of chosen.values()) saveBestPhoto(pic);
        render();
      };
      btnRow.append(submitBtn);
    } else {
      const skipBtn = document.createElement('button');
      skipBtn.textContent = 'Skip Reveal ⏭';
      Object.assign(skipBtn.style, {
        minHeight: '44px',
        padding: '10px 14px',
        borderRadius: '8px',
        border: '1px solid var(--line)',
        background: 'transparent',
        color: 'var(--dim)',
        fontWeight: '600',
        cursor: 'pointer',
      });
      skipBtn.onclick = () => {
        skipReveal = true;
        skipBtn.remove();
      };

      const galBtn = document.createElement('button');
      galBtn.textContent = 'Open Photo Gallery';
      Object.assign(galBtn.style, {
        minHeight: '44px',
        padding: '10px 18px',
        borderRadius: '8px',
        border: '1px solid var(--accent)',
        background: 'var(--accent)',
        color: '#18231a',
        fontWeight: '700',
        cursor: 'pointer',
      });
      galBtn.onclick = actions.onOpenGallery;
      btnRow.append(skipBtn, galBtn);
    }

    const againBtn = document.createElement('button');
    againBtn.textContent = 'Ride Again';
    Object.assign(againBtn.style, {
      minHeight: '44px',
      padding: '10px 16px',
      borderRadius: '8px',
      border: '1px solid var(--line)',
      background: 'var(--panel-2)',
      color: 'var(--ink)',
      fontWeight: '600',
      cursor: 'pointer',
    });
    againBtn.onclick = actions.onRideAgain;
    btnRow.append(againBtn);

    hText.append(title, sub, btnRow);
    header.append(hText);
    wrap.append(header);

    if (!submitted) {
      // Selection mode: spoiler-free (no points shown!)
      for (const [sid, list] of bySpecies.entries()) {
        const sec = document.createElement('div');
        Object.assign(sec.style, {
          background: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: '10px',
          padding: '12px',
          marginBottom: '12px',
        });
        sec.append(
          Object.assign(document.createElement('div'), {
            textContent: `#${list[0].dex} ${list[0].name} (${list.length} shot${list.length > 1 ? 's' : ''})`,
            style: 'font-weight:700;margin-bottom:8px;',
          }),
        );
        const row = document.createElement('div');
        Object.assign(row.style, { display: 'flex', flexWrap: 'wrap', gap: '10px' });

        list.forEach((pic, idx) => {
          const isPicked = chosen.get(sid)?.id === pic.id;
          const card = document.createElement('button');
          card.type = 'button';
          Object.assign(card.style, {
            width: '190px',
            background: isPicked ? 'var(--panel-2)' : '#162018',
            border: `2px solid ${isPicked ? 'var(--accent)' : 'var(--line)'}`,
            borderRadius: '8px',
            padding: '6px',
            color: 'var(--ink)',
            cursor: 'pointer',
            textAlign: 'left',
          });
          const img = document.createElement('img');
          img.src = pic.dataUrl;
          Object.assign(img.style, { width: '100%', height: '110px', objectFit: 'cover', borderRadius: '6px', display: 'block' });
          const cap = document.createElement('div');
          Object.assign(cap.style, { fontSize: '12px', marginTop: '6px', display: 'flex', justifyContent: 'space-between' });
          cap.innerHTML = `<span>${isPicked ? '✓ Selected' : 'Select'}</span><span style="color:var(--dim)">Shot #${idx + 1}</span>`;
          card.append(img, cap);
          card.onclick = () => {
            chosen.set(sid, pic);
            render();
          };
          row.append(card);
        });
        sec.append(row);
        wrap.append(sec);
      }
    } else {
      // Animated Reveal Mode
      const grid = document.createElement('div');
      Object.assign(grid.style, {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
        gap: '12px',
      });
      wrap.append(grid);

      const selectedList = [...chosen.values()];
      void (async () => {
        for (const pic of selectedList) {
          if (!wrap.isConnected) return;
          const gMeta = GRADE_COLORS[pic.score.grade];
          const card = document.createElement('div');
          Object.assign(card.style, {
            background: 'var(--panel)',
            border: `1px solid ${gMeta.color}66`,
            borderRadius: '10px',
            padding: '10px',
            opacity: '0',
            transform: 'translateY(14px) scale(0.97)',
            transition: 'opacity 280ms ease, transform 280ms ease',
          });

          const img = document.createElement('img');
          img.src = pic.dataUrl;
          Object.assign(img.style, { width: '100%', height: '165px', objectFit: 'cover', borderRadius: '8px', display: 'block' });

          const top = document.createElement('div');
          Object.assign(top.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', gap: '8px' });
          const nameEl = document.createElement('strong');
          nameEl.textContent = `#${pic.dex} ${pic.name}`;

          const badge = document.createElement('span');
          Object.assign(badge.style, {
            padding: '2px 10px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: '800',
            color: gMeta.color,
            background: gMeta.bg,
            border: `1px solid ${gMeta.color}55`,
            opacity: '0',
            transform: 'scale(1.6)',
            transition: 'opacity 220ms ease, transform 260ms cubic-bezier(0.22, 1, 0.36, 1)',
          });
          badge.textContent = `${pic.score.grade}!`;
          top.append(nameEl, badge);

          const scale = document.createElement('div');
          Object.assign(scale.style, {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '6px',
            fontSize: '12px',
            color: 'var(--dim)',
            marginTop: '8px',
            background: '#162018',
            padding: '8px',
            borderRadius: '6px',
          });

          const mkStat = (label: string, accent = false): HTMLElement => {
            const cell = document.createElement('div');
            const val = document.createElement('strong');
            val.style.color = accent ? 'var(--accent)' : 'var(--ink)';
            val.textContent = '0';
            cell.append(document.createTextNode(`${label}: `), val);
            scale.append(cell);
            return val;
          };

          const sizeVal = mkStat('Size');
          const frameVal = mkStat('Framing');
          const poseVal = mkStat('Pose');
          const specVal = mkStat('Special', true);

          const totalBar = document.createElement('div');
          Object.assign(totalBar.style, {
            marginTop: '8px',
            padding: '6px 10px',
            borderRadius: '6px',
            background: '#131b15',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '14px',
          });
          const totalVal = document.createElement('strong');
          totalVal.style.color = gMeta.color;
          totalVal.style.fontSize = '18px';
          totalVal.textContent = '0';
          totalBar.append(document.createTextNode('Total Score'), totalVal);

          const tagsEl = document.createElement('div');
          Object.assign(tagsEl.style, {
            fontSize: '11px',
            color: 'var(--accent)',
            marginTop: '6px',
            minHeight: '16px',
            opacity: '0',
            transition: 'opacity 220ms ease',
          });
          tagsEl.textContent = pic.score.specialLabels.join(' · ');

          const sermon = document.createElement('div');
          Object.assign(sermon.style, {
            fontSize: '12px',
            fontStyle: 'italic',
            color: '#dce6d2',
            marginTop: '6px',
            opacity: '0',
            transition: 'opacity 260ms ease',
          });
          sermon.textContent = `"${gMeta.sermon}"`;

          card.append(img, top, scale, totalBar);
          if (pic.score.specialLabels.length) card.append(tagsEl);
          card.append(sermon);
          grid.append(card);

          // Trigger card entrance
          requestAnimationFrame(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0) scale(1)';
          });

          const dur = () => (skipReveal ? 0 : 280);
          const isSkipped = () => skipReveal || !wrap.isConnected;
          await animateNumber(sizeVal, pic.score.size, dur(), '', isSkipped);
          await animateNumber(frameVal, pic.score.framing, dur(), '', isSkipped);
          await animateNumber(poseVal, pic.score.pose, dur(), '', isSkipped);
          if (pic.score.special > 0) tagsEl.style.opacity = '1';
          await animateNumber(specVal, pic.score.special, dur(), '+', isSkipped);
          await animateNumber(totalVal, pic.score.total, skipReveal ? 0 : 360, '', isSkipped);

          badge.style.opacity = '1';
          badge.style.transform = 'scale(1)';
          sermon.style.opacity = '1';
          if (!skipReveal) playGradeFanfare(pic.score.grade);
        }
      })();
    }
  }

  render();
}
