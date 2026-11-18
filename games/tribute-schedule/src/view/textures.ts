import * as THREE from 'three';

export function makeMeatConeTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#5a2d1c';
  ctx.fillRect(0, 0, 256, 256);

  for (let y = 0; y < 256; y += 6) {
    const shade = 25 + Math.floor(Math.sin(y * 0.25) * 18);
    ctx.fillStyle = `rgb(${85 + shade}, ${40 + Math.floor(shade * 0.5)}, ${25 + Math.floor(shade * 0.3)})`;
    ctx.fillRect(0, y, 256, 4);
    if (y % 18 === 0) {
      ctx.fillStyle = 'rgba(215, 165, 110, 0.22)';
      ctx.fillRect(0, y + 4, 256, 2);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function makeWoodFloorTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#1b1512';
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 32) {
    ctx.fillStyle = y % 64 === 0 ? '#201915' : '#17120f';
    ctx.fillRect(0, y, 256, 30);
    ctx.fillStyle = '#0d0a08';
    ctx.fillRect(0, y + 30, 256, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 5);
  return tex;
}

export function makeWallTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#1e1d22';
  ctx.fillRect(0, 0, 128, 128);
  for (let x = 0; x < 128; x += 16) {
    ctx.fillStyle = x % 32 === 0 ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(x, 0, 8, 128);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 2);
  return tex;
}

export function makeDisplayCanvas(): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  tex: THREE.CanvasTexture;
} {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const ctx = canvas.getContext('2d')!;
  const tex = new THREE.CanvasTexture(canvas);
  return { canvas, ctx, tex };
}

export function drawMicrowaveDisplay(
  ctx: CanvasRenderingContext2D,
  tex: THREE.CanvasTexture,
  text: string,
  color: string,
): void {
  ctx.fillStyle = '#090b0a';
  ctx.fillRect(0, 0, 256, 96);
  ctx.fillStyle = color;
  ctx.font = 'bold 56px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 50);
  tex.needsUpdate = true;
}

export function makeStickyNoteTexture(text: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#dfd07a';
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = '#222';
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(text, 64, 68);
  return new THREE.CanvasTexture(c);
}

export function drawHorseHockeyTv(
  ctx: CanvasRenderingContext2D,
  tex: THREE.CanvasTexture,
  tick: number,
): void {
  ctx.fillStyle = '#090d12';
  ctx.fillRect(0, 0, 256, 96);
  // Subtle scanlines
  ctx.fillStyle = 'rgba(130, 190, 220, 0.08)';
  for (let y = (tick * 3) % 8; y < 96; y += 8) {
    ctx.fillRect(0, y, 256, 2);
  }
  ctx.fillStyle = '#9ec7d8';
  ctx.font = '14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('HORSE HOCKEY LIVE', 128, 24);
  ctx.fillStyle = '#d98a5f';
  ctx.fillText('PENALTY BOX: 10% HORSE', 128, 52);
  ctx.fillStyle = 'rgba(200,220,235,0.6)';
  ctx.font = '11px monospace';
  ctx.fillText('NO ONE HAS SCORED SINCE 1987', 128, 76);
  tex.needsUpdate = true;
}
