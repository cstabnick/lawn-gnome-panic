// The Pay 'n' Glaze tab registry: which panels the shop shows, in what order, for which vehicle model.
// Extension point: a new tab (e.g. boat or plane tuning) is a Panel (glazeUi.ts) plus one registerGlazePanel call; the shop
// (glazeShop.ts) asks glazePanelsFor(kind) on every open and builds only those tabs. Panel.appliesTo limits a tab to some models.
import type { Panel } from './glazeUi';
import { paintPanel } from './glazePanelPaint';
import { wheelsPanel } from './glazePanelWheels';
import { lightsPanel } from './glazePanelLights';
import { bodyPanel } from './glazePanelBody';
import { trimPanel } from './glazePanelTrim';
import type { VehicleKind } from './types';

const registry: { panel: Panel; order: number }[] = [];

/** Add a tab (or replace the one with the same id). Lower `order` comes first; the built-ins use 10, 20, 30, 40, 50. */
export function registerGlazePanel(panel: Panel, order = 100): void {
  const i = registry.findIndex((r) => r.panel.id === panel.id);
  if (i >= 0) registry.splice(i, 1);
  registry.push({ panel, order });
  registry.sort((a, b) => a.order - b.order);
}

/** The tabs for this vehicle model, in order (a panel without appliesTo shows for every model). */
export function glazePanelsFor(kind: VehicleKind): Panel[] {
  return registry.filter((r) => !r.panel.appliesTo || r.panel.appliesTo(kind)).map((r) => r.panel);
}

registerGlazePanel(paintPanel, 10);
registerGlazePanel(wheelsPanel, 20);
registerGlazePanel(lightsPanel, 30);
registerGlazePanel(bodyPanel, 40);
registerGlazePanel(trimPanel, 50);
