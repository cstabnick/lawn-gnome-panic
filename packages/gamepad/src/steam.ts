// The 2026 Steam Controller over WebHID.
//
// Why: outside Steam the controller shows the OS a mouse, a keyboard and a vendor interface, no gamepad ("lizard
// mode"), and on macOS Steam only adds virtual mouse and keyboard devices. So Chrome's Gamepad API never lists it
// and it just moves the cursor. WebHID can read the vendor interface directly and switch lizard mode off while the
// tab is visible. Chrome / Edge / Arc only (no Safari, no Firefox), https or localhost, and the player has to
// click once to grant the device (see connect.ts); after that it reopens by itself.
//
// Protocol constants come from a public reference implementation (vice7770/surfing-game, src/game/steam/), not
// from Valve documentation, and have NOT been verified against real hardware here.
import type { PadLike } from './pads';

export const VALVE_VENDOR = 0x28de;
/** Cable, Bluetooth LE, Puck, receiver. */
export const STEAM_PRODUCTS: readonly number[] = [0x1302, 0x1303, 0x1304, 0x1305];
export const VENDOR_USAGE_PAGE = 0xff00;
/** A receiver's dock interface shares the vendor page with usage 2; it is not a controller. */
const DOCK_USAGE = 0x0002;
const FEATURE_REPORT_ID = 1;
const FEATURE_REPORT_BYTES = 63;
const STATE_REPORTS = new Set([0x42, 0x45, 0x47]);
/** The firmware drops back to lizard mode a few seconds after the last command, so repeat it. */
export const LIZARD_KEEPALIVE_MS = 1000;
/** No state report for this long = the controller is gone (asleep, unplugged, out of range). */
export const STALE_MS = 1000;
const TRIGGER_PRESS = 0.12;

// ---- Decoding (pure, unit-tested) -------------------------------------------------------------------------------

/** Button bit -> standard-layout button index. 0-16 are the W3C standard buttons, 17+ are Steam extras. */
const BUTTON_BITS: readonly [bit: number, index: number][] = [
  [0x1, 0], [0x2, 1], [0x4, 2], [0x8, 3], // A B X Y
  [0x80000, 4], [0x200, 5], // LB RB
  [0x4000, 8], [0x40, 9], // view, menu
  [0x8000, 10], [0x20, 11], // stick clicks
  [0x2000, 12], [0x400, 13], [0x1000, 14], [0x800, 15], // d-pad up down left right
  [0x10000, 16], // Steam
  [0x20000, 17], [0x80, 18], [0x40000, 19], [0x100, 20], // L4 R4 L5 R5
  [0x10, 21], // quick access
];
const BUTTON_COUNT = 22;

export const STEAM_PAD_ID = 'Steam Controller (WebHID)';

/** Standard-layout pad state decoded from one input report. */
export interface SteamState {
  axes: [number, number, number, number];
  buttons: { pressed: boolean; value: number }[];
}

const clamp1 = (v: number): number => Math.max(-1, Math.min(1, v));
const unit = (raw: number): number => clamp1(raw / 32767);

/** `data` is the report body WebHID hands over (it leaves the report ID out). null for a report that is not a state report. */
export function decodeSteamReport(reportId: number, data: DataView): SteamState | null {
  if (!STATE_REPORTS.has(reportId) || data.byteLength < 17) return null;
  const bits = data.getUint32(1, true);
  const lt = Math.max(0, unit(data.getInt16(5, true)));
  const rt = Math.max(0, unit(data.getInt16(7, true)));
  const buttons: SteamState['buttons'] = Array.from({ length: BUTTON_COUNT }, () => ({ pressed: false, value: 0 }));
  for (const [bit, index] of BUTTON_BITS) {
    const on = (bits & bit) !== 0;
    buttons[index] = { pressed: on, value: on ? 1 : 0 };
  }
  buttons[6] = { pressed: lt > TRIGGER_PRESS, value: lt };
  buttons[7] = { pressed: rt > TRIGGER_PRESS, value: rt };
  // Raw sticks have up positive; the Gamepad API has down positive.
  const axes: SteamState['axes'] = [
    unit(data.getInt16(9, true)), -unit(data.getInt16(11, true)),
    unit(data.getInt16(13, true)), -unit(data.getInt16(15, true)),
  ];
  return { axes, buttons };
}

/** Feature report that turns lizard mode (mouse + keyboard emulation) on or off. */
export function lizardModeReport(on: boolean, length = FEATURE_REPORT_BYTES): Uint8Array<ArrayBuffer> {
  const buf = new Uint8Array(new ArrayBuffer(Math.max(length, 5)));
  buf.set([0x87, 3, 9, on ? 1 : 0, 0]); // SET_SETTINGS_VALUES, 3 bytes, setting 9 = lizard mode, value, 0
  return buf;
}

// ---- WebHID (minimal type slice: lib.dom has none) --------------------------------------------------------------

interface HidItem { reportSize?: number; reportCount?: number }
interface HidCollection { usagePage?: number; usage?: number; featureReports?: { reportId?: number; items?: HidItem[] }[] }
interface HidInputReportEvent extends Event { reportId: number; data: DataView }
interface HidDevice extends EventTarget {
  opened: boolean;
  vendorId: number;
  productId: number;
  collections: HidCollection[];
  open(): Promise<void>;
  sendFeatureReport(reportId: number, data: BufferSource): Promise<void>;
}
interface HidApi extends EventTarget {
  getDevices(): Promise<HidDevice[]>;
  requestDevice(options: { filters: Record<string, number>[] }): Promise<HidDevice[]>;
}

const hidApi = (): HidApi | null => {
  if (typeof navigator === 'undefined') return null;
  return ((navigator as unknown as { hid?: HidApi }).hid) ?? null;
};

/** True where WebHID exists (Chrome, Edge, Arc over https/localhost). */
export const steamSupported = (): boolean => hidApi() !== null;

export function isSteamInterface(d: Pick<HidDevice, 'vendorId' | 'productId' | 'collections'>): boolean {
  return d.vendorId === VALVE_VENDOR && STEAM_PRODUCTS.includes(d.productId)
    && d.collections.some((c) => c.usagePage === VENDOR_USAGE_PAGE && c.usage !== DOCK_USAGE);
}

function featureLength(d: HidDevice): number {
  for (const c of d.collections) {
    for (const r of c.featureReports ?? []) {
      if (r.reportId !== FEATURE_REPORT_ID) continue;
      const bits = (r.items ?? []).reduce((n, i) => n + (i.reportSize ?? 0) * (i.reportCount ?? 0), 0);
      if (bits > 0) return Math.ceil(bits / 8);
    }
  }
  return FEATURE_REPORT_BYTES;
}

// ---- Driver -----------------------------------------------------------------------------------------------------

type Listener = (connected: boolean) => void;

interface Slot { device: HidDevice; state: SteamState | null; lastAt: number; length: number }

const slots = new Map<HidDevice, Slot>();
const listeners = new Set<Listener>();
let started = false;
let lastError = '';
let wasLive = false;

const live = (s: Slot, now: number): boolean => s.state !== null && now - s.lastAt <= STALE_MS;

function notify(): void {
  const now = performance.now();
  const on = [...slots.values()].some((s) => live(s, now));
  if (on === wasLive) return;
  wasLive = on;
  for (const l of listeners) l(on);
}

async function setLizard(s: Slot, on: boolean): Promise<void> {
  try {
    await s.device.sendFeatureReport(FEATURE_REPORT_ID, lizardModeReport(on, s.length));
  } catch (e) {
    lastError = e instanceof Error ? e.message : String(e);
  }
}

async function adopt(device: HidDevice): Promise<void> {
  if (slots.has(device) || !isSteamInterface(device)) return;
  const slot: Slot = { device, state: null, lastAt: 0, length: featureLength(device) };
  slots.set(device, slot);
  device.addEventListener('inputreport', (ev) => {
    const e = ev as HidInputReportEvent;
    const state = decodeSteamReport(e.reportId, e.data);
    if (!state) return;
    slot.state = state;
    slot.lastAt = performance.now();
    notify();
  });
  try {
    if (!device.opened) await device.open();
  } catch (e) {
    slots.delete(device);
    lastError = e instanceof Error ? e.message : String(e);
    return;
  }
  if (typeof document === 'undefined' || !document.hidden) void setLizard(slot, false);
}

/** Reopens devices the player already granted. No click needed. Safe to call every frame: it runs once. */
export function startSteam(): void {
  const hid = hidApi();
  if (!hid || started) return;
  started = true;
  const reopen = (): void => {
    hid.getDevices().then((ds) => { for (const d of ds) void adopt(d); }).catch(() => {});
  };
  reopen();
  hid.addEventListener('connect', reopen);
  hid.addEventListener('disconnect', () => notify());
  // Keep lizard mode off while we are watching, and hand the mouse back when the tab is hidden.
  setInterval(() => {
    if (typeof document !== 'undefined' && document.hidden) return;
    for (const s of slots.values()) void setLizard(s, false);
    notify();
  }, LIZARD_KEEPALIVE_MS);
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      for (const s of slots.values()) void setLizard(s, document.hidden);
    });
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', () => { for (const s of slots.values()) void setLizard(s, true); });
  }
}

/** Ask the player to grant the controller. Must run inside a click / tap handler. Resolves true when a controller is open. */
export async function requestSteam(): Promise<boolean> {
  const hid = hidApi();
  if (!hid) return false;
  startSteam();
  lastError = '';
  const devices = await hid.requestDevice({
    filters: STEAM_PRODUCTS.map((productId) => ({ vendorId: VALVE_VENDOR, productId, usagePage: VENDOR_USAGE_PAGE })),
  });
  await Promise.all(devices.map(adopt));
  return devices.length > 0 && slots.size > 0;
}

/** Why the last open / feature-report call failed (e.g. another app holds the device), or ''. */
export const steamError = (): string => lastError;

export function onSteamChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

/** True while a Steam Controller is sending state reports. */
export function steamConnected(): boolean {
  const now = performance.now();
  return [...slots.values()].some((s) => live(s, now));
}

/** The Steam Controller as a standard-mapping pad, or null when none is sending reports. Starts the driver on first call. */
export function steamPad(): PadLike | null {
  startSteam();
  const now = performance.now();
  let best: Slot | null = null;
  for (const s of slots.values()) if (live(s, now) && (!best || s.lastAt > best.lastAt)) best = s;
  if (!best?.state) return null;
  return {
    id: STEAM_PAD_ID,
    mapping: 'standard',
    connected: true,
    timestamp: best.lastAt,
    axes: best.state.axes,
    buttons: best.state.buttons,
  };
}
