export interface TalkingHeadHandle {
  element: HTMLElement;
  setSpeaker(name: string, accentColor?: string): void;
  setTalking(talking: boolean): void;
  tick(dt: number, beatPulse?: number): void;
  dispose(): void;
}

type HeadArchetype =
  | 'dj'
  | 'spin'
  | 'tag'
  | 'glide'
  | 'piano'
  | 'bass'
  | 'sax'
  | 'bongo'
  | 'furnace'
  | 'fountain'
  | 'gnome';

interface HeadPalette {
  archetype: HeadArchetype;
  bg: string;
  accent: string;
  hat: string;
  skin: string;
  beard: string | null;
}

function resolvePalette(name: string, overrideAccent?: string): HeadPalette {
  const n = name.toLowerCase();
  if (n.includes('dj')) {
    return { archetype: 'dj', bg: '#1b0933', accent: overrideAccent ?? '#00e5ff', hat: '#ff4ecd', skin: '#ffd4b2', beard: '#ffffff' };
  }
  if (n.includes('spin')) {
    return { archetype: 'spin', bg: '#141b36', accent: overrideAccent ?? '#ff4ecd', hat: '#ff4ecd', skin: '#ffd4b2', beard: null };
  }
  if (n.includes('tag')) {
    return { archetype: 'tag', bg: '#16241d', accent: overrideAccent ?? '#69f0ae', hat: '#69f0ae', skin: '#f5c29b', beard: '#2d1e14' };
  }
  if (n.includes('glide')) {
    return { archetype: 'glide', bg: '#221433', accent: overrideAccent ?? '#ffd740', hat: '#ffd740', skin: '#ffd4b2', beard: null };
  }
  if (n.includes('maestro') || n.includes('upright')) {
    return { archetype: 'piano', bg: '#260b3d', accent: overrideAccent ?? '#ff4ecd', hat: '#111118', skin: '#ffffff', beard: null };
  }
  if (n.includes('pluck') || n.includes('gus')) {
    return { archetype: 'bass', bg: '#21102e', accent: overrideAccent ?? '#ff4ecd', hat: '#6d3b1e', skin: '#8d5524', beard: null };
  }
  if (n.includes('sal')) {
    return { archetype: 'sax', bg: '#24180d', accent: overrideAccent ?? '#ffd740', hat: '#ffd740', skin: '#d4a017', beard: null };
  }
  if (n.includes('kora') || n.includes('tobe') || n.includes('bongo')) {
    return { archetype: 'bongo', bg: '#2b1208', accent: overrideAccent ?? '#ff9100', hat: '#ff9100', skin: '#8d5524', beard: null };
  }
  if (n.includes('vera') || n.includes('trundle')) {
    return { archetype: 'furnace', bg: '#1a1118', accent: overrideAccent ?? '#76ff03', hat: '#2c303a', skin: '#ff6d00', beard: null };
  }
  if (n.includes('finn') || n.includes('vesper')) {
    return { archetype: 'fountain', bg: '#0c1836', accent: overrideAccent ?? '#00e5ff', hat: '#00e5ff', skin: '#b8f2ff', beard: null };
  }
  return { archetype: 'gnome', bg: '#1a0c30', accent: overrideAccent ?? '#00e5ff', hat: '#ff4ecd', skin: '#ffd4b2', beard: '#ffffff' };
}

export function createTalkingHead(size = 84): TalkingHeadHandle {
  const wrap = document.createElement('div');
  wrap.style.cssText = `
    width:${size}px; height:${size}px; flex:0 0 ${size}px;
    border-radius:12px; border:3px solid #00e5ff; background:#140824;
    box-shadow:4px 4px 0 #ff4ecd; overflow:hidden; position:relative;
    transform:skewX(-4deg);
  `;

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  canvas.style.cssText = 'width:100%; height:100%; display:block;';
  wrap.appendChild(canvas);

  const ctx = canvas.getContext('2d')!;
  let pal = resolvePalette('DJ Broadcast');
  let talking = false;
  let elapsed = 0;
  let mouthFrame = 0;
  let mouthTimer = 0;
  let blinkTimer = 2.1;
  let beat = 0;

  function draw(): void {
    const w = 128;
    const h = 128;
    ctx.clearRect(0, 0, w, h);

    // Comic halftone backdrop
    ctx.fillStyle = pal.bg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = pal.accent;
    ctx.globalAlpha = 0.16;
    for (let y = 10; y < h; y += 16) {
      for (let x = 10; x < w; x += 16) {
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // Animated anime EQ bars at bottom
    const eqCount = 7;
    for (let i = 0; i < eqCount; i++) {
      const amp = talking
        ? 8 + Math.abs(Math.sin(elapsed * 14 + i * 1.1)) * 18
        : 4 + beat * 12 * (0.5 + 0.5 * Math.sin(i + elapsed * 4));
      ctx.fillStyle = i % 2 === 0 ? pal.accent : '#ff4ecd';
      ctx.globalAlpha = 0.45;
      ctx.fillRect(8 + i * 16, h - amp, 11, amp);
    }
    ctx.globalAlpha = 1;

    const bobY = Math.sin(elapsed * (talking ? 12 : 3.2)) * (talking ? 2.4 : 1.2) - beat * 3.5;
    const tilt = talking ? Math.sin(elapsed * 7) * 0.045 : 0;
    const blinking = blinkTimer < 0.11;
    const mouthOpen = talking ? (mouthFrame % 3 === 0 ? 1 : mouthFrame % 3 === 1 ? 0.55 : 0.15) : 0;

    ctx.save();
    ctx.translate(64, 70 + bobY);
    ctx.rotate(tilt);

    if (pal.archetype === 'piano') {
      // Lacquered piano face + glowing gold eyes + chattering ivory keys
      ctx.fillStyle = '#14141d';
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(-36, -38, 72, 74, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffd740';
      if (!blinking) {
        ctx.beginPath(); ctx.arc(-15, -10, 6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(15, -10, 6, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillRect(-21, -11, 12, 3);
        ctx.fillRect(9, -11, 12, 3);
      }
      // Keyboard jaw
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-26, 10, 52, 12 + mouthOpen * 10);
      ctx.fillStyle = '#111118';
      for (let k = -20; k <= 16; k += 12) ctx.fillRect(k, 10, 6, 7);
    } else if (pal.archetype === 'bongo') {
      ctx.fillStyle = '#8d5524';
      ctx.strokeStyle = '#ffd740';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Crown
      ctx.fillStyle = '#ffd740';
      ctx.beginPath();
      ctx.moveTo(-22, -26); ctx.lineTo(-14, -44); ctx.lineTo(0, -32); ctx.lineTo(14, -44); ctx.lineTo(22, -26);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffd740';
      ctx.fillRect(-16, -10, 10, blinking ? 3 : 8);
      ctx.fillRect(6, -10, 10, blinking ? 3 : 8);
      ctx.fillStyle = '#120624';
      ctx.beginPath();
      ctx.ellipse(0, 14, 14, 4 + mouthOpen * 10, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (pal.archetype === 'furnace') {
      ctx.fillStyle = '#2c303a';
      ctx.strokeStyle = '#76ff03';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(-32, -32, 64, 64, 8);
      ctx.fill();
      ctx.stroke();
      // Glowing visor
      ctx.fillStyle = '#76ff03';
      ctx.fillRect(-24, -14, 48, blinking ? 3 : 10);
      // Furnace grate mouth
      ctx.fillStyle = '#ff6d00';
      ctx.fillRect(-20, 10, 40, 8 + mouthOpen * 12);
    } else if (pal.archetype === 'fountain') {
      ctx.fillStyle = '#1c3b6e';
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 2, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#00e5ff';
      ctx.beginPath();
      ctx.moveTo(-24, -22); ctx.lineTo(0, -44); ctx.lineTo(24, -22); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-15, -6, 9, blinking ? 2 : 7);
      ctx.fillRect(6, -6, 9, blinking ? 2 : 7);
      ctx.fillStyle = '#ff4ecd';
      ctx.beginPath();
      ctx.ellipse(0, 15, 13, 4 + mouthOpen * 9, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (pal.archetype === 'bass' || pal.archetype === 'sax') {
      ctx.fillStyle = pal.archetype === 'sax' ? '#e6b800' : '#7b4322';
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(0, 2, 28, 36, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#120624';
      ctx.fillRect(-20, -14, 16, 10);
      ctx.fillRect(4, -14, 16, 10);
      ctx.fillStyle = pal.accent;
      ctx.beginPath();
      ctx.ellipse(0, 16, 12, 4 + mouthOpen * 9, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Gnome bust (DJ Broadcast, Spin, Tag, Glide, Helpers, Crew)
      // Shoulders / jacket
      ctx.fillStyle = pal.accent;
      ctx.strokeStyle = '#120624';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-34, 20, 68, 34, 14);
      ctx.fill();
      ctx.stroke();

      // Head
      ctx.fillStyle = pal.skin;
      ctx.beginPath();
      ctx.arc(0, 0, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Beard if any
      if (pal.beard) {
        ctx.fillStyle = pal.beard;
        ctx.beginPath();
        ctx.moveTo(-22, 6);
        ctx.quadraticCurveTo(0, 38, 22, 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Cone hat
      ctx.fillStyle = pal.hat;
      ctx.beginPath();
      ctx.moveTo(-27, -10);
      ctx.lineTo(2, -54);
      ctx.lineTo(27, -10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Eyes / DJ visor shades
      if (pal.archetype === 'dj' || pal.archetype === 'spin') {
        ctx.fillStyle = '#120624';
        ctx.fillRect(-21, -8, 18, 10);
        ctx.fillRect(3, -8, 18, 10);
        ctx.fillRect(-3, -5, 6, 4);
        ctx.fillStyle = '#00e5ff';
        ctx.fillRect(-17, -6, 6, 3);
        ctx.fillRect(7, -6, 6, 3);
      } else {
        ctx.fillStyle = '#120624';
        if (!blinking) {
          ctx.beginPath(); ctx.arc(-9, -3, 3.3, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(9, -3, 3.3, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.fillRect(-13, -4, 8, 2.5);
          ctx.fillRect(5, -4, 8, 2.5);
        }
      }

      // DJ Headphones & mic boom
      if (pal.archetype === 'dj') {
        ctx.fillStyle = '#00e5ff';
        ctx.fillRect(-30, -14, 8, 20);
        ctx.fillRect(22, -14, 8, 20);
        ctx.strokeStyle = '#ffd740';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-26, 2);
        ctx.lineTo(-8, 14);
        ctx.stroke();
      }

      // Animated anime mouth
      ctx.fillStyle = '#120624';
      ctx.beginPath();
      ctx.ellipse(0, 11, 8, 2.2 + mouthOpen * 6.5, 0, 0, Math.PI * 2);
      ctx.fill();
      if (mouthOpen > 0.4) {
        ctx.fillStyle = '#ff4ecd';
        ctx.beginPath();
        ctx.ellipse(0, 13, 4.5, 2.2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  draw();

  return {
    element: wrap,
    setSpeaker(name, accentColor) {
      pal = resolvePalette(name, accentColor);
      wrap.style.borderColor = pal.accent;
      wrap.style.boxShadow = `4px 4px 0 ${pal.hat}`;
      draw();
    },
    setTalking(v) {
      talking = v;
      if (!v) {
        mouthFrame = 0;
        draw();
      }
    },
    tick(dt, beatPulse = 0) {
      elapsed += dt;
      beat = beatPulse;
      blinkTimer -= dt;
      if (blinkTimer <= 0) blinkTimer = 2.4 + Math.random() * 2.2;
      if (talking) {
        mouthTimer += dt;
        if (mouthTimer >= 0.095) {
          mouthTimer = 0;
          mouthFrame++;
        }
      }
      draw();
    },
    dispose() {
      wrap.remove();
    },
  };
}
