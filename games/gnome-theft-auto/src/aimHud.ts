// Aim-down-sights overlay: a tighter ring on the crosshair while aiming and the full-screen scope view for strong optics.
// Its own container inside #ui (hud.ts keeps the plain crosshair). STUB: the aim-HUD issue fills it in.

export interface AimHud {
  /** Every frame: t = aim blend 0..1, zoom = total aim zoom (aimZoom), scoped = an optic is fitted. */
  update(t: number, zoom: number, scoped: boolean): void;
}

export function createAimHud(ui: HTMLElement): AimHud {
  void ui;
  return { update() {} };
}
