import { allGnomeokemon } from '../prefabs/registry';
import { computePhotoScore } from './scoring';
import type { PhotoRecord } from './types';

/**
 * Made-up photos for demos and smoke tests (`?mode=office&fake=4`): skip the ride and go straight to grading.
 * Scores spread across all four grades so every line pool gets used.
 */
export function makeFakePhotos(count: number): PhotoRecord[] {
  const entries = allGnomeokemon();
  const picks = [0, 5, 12, 35, 20, 3, 28, 41];
  const looks = [
    { coverage: 0.45, centerDist: 0.05, facingDot: 0.95, action: 'dancing' as const, inFrameCount: 3 },
    { coverage: 0.38, centerDist: 0.3, facingDot: 0.5, action: 'eating' as const, inFrameCount: 1 },
    { coverage: 0.22, centerDist: 0.6, facingDot: 0.1, action: 'idle' as const, inFrameCount: 1 },
    { coverage: 0.06, centerDist: 0.95, facingDot: -0.6, action: 'idle' as const, inFrameCount: 1 },
  ];
  const out: PhotoRecord[] = [];
  for (let i = 0; i < Math.min(count, picks.length); i++) {
    const entry = entries[picks[i] % entries.length];
    const score = computePhotoScore({ ...looks[i % looks.length], clipped: false });
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, 200);
      g.addColorStop(0, '#8fc8f0');
      g.addColorStop(1, '#5a9a48');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 320, 200);
      ctx.font = '72px serif';
      ctx.textAlign = 'center';
      ctx.fillText(entry.prefab.emoji[0] ?? '🍄', 160, 130);
    }
    out.push({
      id: `fake-${entry.prefab.id}-${i}`,
      speciesId: entry.prefab.id,
      dex: entry.dex,
      name: entry.prefab.name,
      element: entry.element,
      capturedAt: Date.now(),
      dataUrl: canvas.toDataURL('image/jpeg', 0.8),
      score,
      snapshot: { dogT: 0, cameraPos: [0, 0, 0], cameraQuat: [0, 0, 0, 1], fov: 56, creatures: [] },
    });
  }
  return out;
}
