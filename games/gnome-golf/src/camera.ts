// STUB: replaced by its epic 2 issue. Keep the exported signature.
import type { Ctx, System } from './config';

export function createCameraRig(ctx: Ctx): System {
  return {
    update() {
      const s = ctx.state;
      const b = s.ball;
      ctx.camera.position.set(b.x - Math.sin(s.aimYaw) * 7, b.y + 2.5, b.z - Math.cos(s.aimYaw) * 7);
      ctx.camera.lookAt(b.x + Math.sin(s.aimYaw) * 30, b.y, b.z + Math.cos(s.aimYaw) * 30);
    },
  };
}
