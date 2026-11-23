// Aim-down-sights overlay: a ring that closes in around the plain crosshair while aiming, and the full-screen scope view for
// strong optics. Its own container inside #ui (hud.ts keeps the plain crosshair).
import { AIM } from './gunMods';

export interface AimHud {
  /** Every frame: t = aim blend 0..1, zoom = total aim zoom (aimZoom), scoped = an optic is fitted. */
  update(t: number, zoom: number, scoped: boolean): void;
}

const TICK = 'position:absolute;background:#ff7a1a;border-radius:1px;';

export function createAimHud(ui: HTMLElement): AimHud {
  const root = document.createElement('div');
  root.id = 'gta-aim';
  root.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:6;';

  const ring = document.createElement('div');
  ring.style.cssText =
    'position:absolute;left:50%;top:50%;border:2px solid rgba(255,255,255,0.85);box-shadow:0 0 0 1px rgba(0,0,0,0.55);' +
    'border-radius:50%;transform:translate(-50%,-50%);display:none;box-sizing:border-box;';
  // Four short orange ticks at 12, 3, 6 and 9 o'clock.
  for (const [x, y, w, h] of [['50%', '-5px', '2px', '7px'], ['50%', 'calc(100% - 2px)', '2px', '7px'], ['-5px', '50%', '7px', '2px'], ['calc(100% - 2px)', '50%', '7px', '2px']]) {
    const t = document.createElement('div');
    t.style.cssText = `${TICK}left:${x};top:${y};width:${w};height:${h};transform:translate(-50%,-50%);`;
    ring.appendChild(t);
  }

  // Scope view: dark everywhere but a round lens, a thin lens rim and fine cross hairs with a gap at the centre.
  const scope = document.createElement('div');
  scope.style.cssText =
    'position:absolute;inset:0;display:none;' +
    'background:radial-gradient(circle at 50% 50%, transparent 0, transparent 38vmin, rgba(10,10,8,0.6) 38vmin, rgba(0,0,0,0.92) calc(38vmin + 3px));';
  const rim = document.createElement('div');
  rim.style.cssText = 'position:absolute;left:50%;top:50%;width:76vmin;height:76vmin;border-radius:50%;border:3px solid rgba(0,0,0,0.85);transform:translate(-50%,-50%);box-sizing:border-box;';
  const hair = (css: string): HTMLDivElement => {
    const d = document.createElement('div');
    d.style.cssText = 'position:absolute;background:rgba(0,0,0,0.85);' + css;
    return d;
  };
  scope.append(
    rim,
    hair('left:calc(50% - 38vmin);width:calc(38vmin - 10px);top:50%;height:1px;'),
    hair('left:calc(50% + 10px);width:calc(38vmin - 10px);top:50%;height:1px;'),
    hair('top:calc(50% - 38vmin);height:calc(38vmin - 10px);left:50%;width:1px;'),
    hair('top:calc(50% + 10px);height:calc(38vmin - 10px);left:50%;width:1px;'),
  );

  root.append(scope, ring);
  ui.appendChild(root);

  let lastD = -1;
  let lastRingOp = -1;
  let lastScopeOp = -1;

  return {
    update(t, zoom, scoped) {
      const scopeOn = scoped && zoom >= AIM.scopeOverlayAt && t > 0.85;
      const scopeOp = scopeOn ? Math.round(Math.min(1, (t - 0.85) / 0.15) * 20) / 20 : 0;
      if (scopeOp !== lastScopeOp) {
        lastScopeOp = scopeOp;
        scope.style.display = scopeOp > 0 ? '' : 'none';
        scope.style.opacity = String(scopeOp);
      }
      const ringOp = scopeOn || t < 0.02 ? 0 : Math.round(t * 20) / 20;
      if (ringOp !== lastRingOp) {
        lastRingOp = ringOp;
        ring.style.display = ringOp > 0 ? '' : 'none';
        ring.style.opacity = String(ringOp);
      }
      const d = Math.round(64 - 42 * Math.max(0, Math.min(1, t)));
      if (ringOp > 0 && d !== lastD) {
        lastD = d;
        ring.style.width = `${d}px`;
        ring.style.height = `${d}px`;
      }
    },
  };
}
