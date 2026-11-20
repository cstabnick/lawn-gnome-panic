import { describe, expect, it } from 'vitest';
import { rankPads, type PadLike } from './pads';
import { decodeSteamReport, isSteamInterface, lizardModeReport } from './steam';

function report(opts: { bits?: number; lt?: number; rt?: number; lx?: number; ly?: number; rx?: number; ry?: number } = {}): DataView {
  const dv = new DataView(new ArrayBuffer(20));
  dv.setUint32(1, opts.bits ?? 0, true);
  dv.setInt16(5, opts.lt ?? 0, true);
  dv.setInt16(7, opts.rt ?? 0, true);
  dv.setInt16(9, opts.lx ?? 0, true);
  dv.setInt16(11, opts.ly ?? 0, true);
  dv.setInt16(13, opts.rx ?? 0, true);
  dv.setInt16(15, opts.ry ?? 0, true);
  return dv;
}

describe('decodeSteamReport', () => {
  it('ignores other reports and short ones', () => {
    expect(decodeSteamReport(0x46, report())).toBeNull();
    expect(decodeSteamReport(0x42, new DataView(new ArrayBuffer(8)))).toBeNull();
  });
  it('maps buttons to the standard layout', () => {
    const s = decodeSteamReport(0x42, report({ bits: 0x1 | 0x8 | 0x2000 | 0x40 }))!;
    expect(s.buttons[0].pressed).toBe(true); // A
    expect(s.buttons[3].pressed).toBe(true); // Y
    expect(s.buttons[12].pressed).toBe(true); // d-pad up
    expect(s.buttons[9].pressed).toBe(true); // menu = Start
    expect(s.buttons[1].pressed).toBe(false);
  });
  it('turns the triggers into analog buttons 6 and 7', () => {
    const s = decodeSteamReport(0x45, report({ lt: 32767, rt: 16384 }))!;
    expect(s.buttons[6].value).toBe(1);
    expect(s.buttons[7].value).toBeCloseTo(0.5, 2);
    expect(decodeSteamReport(0x45, report({ rt: -500 }))!.buttons[7].value).toBe(0);
  });
  it('flips stick Y so down is positive like the Gamepad API', () => {
    const s = decodeSteamReport(0x47, report({ lx: 32767, ly: 32767, rx: -32767, ry: -32767 }))!;
    expect(s.axes).toEqual([1, -1, -1, 1]);
  });
});

describe('lizardModeReport', () => {
  it('writes the settings command and pads to the feature length', () => {
    const off = lizardModeReport(false, 63);
    expect(off.length).toBe(63);
    expect([...off.slice(0, 5)]).toEqual([0x87, 3, 9, 0, 0]);
    expect(lizardModeReport(true)[3]).toBe(1);
  });
});

describe('isSteamInterface', () => {
  const vendor = [{ usagePage: 0xff00, usage: 1 }];
  it('accepts the vendor interface of a known product', () => {
    expect(isSteamInterface({ vendorId: 0x28de, productId: 0x1302, collections: vendor })).toBe(true);
  });
  it('rejects the dock, the keyboard/mouse interfaces and other devices', () => {
    expect(isSteamInterface({ vendorId: 0x28de, productId: 0x1305, collections: [{ usagePage: 0xff00, usage: 2 }] })).toBe(false);
    expect(isSteamInterface({ vendorId: 0x28de, productId: 0x1302, collections: [{ usagePage: 1, usage: 2 }] })).toBe(false);
    expect(isSteamInterface({ vendorId: 0x045e, productId: 0x1302, collections: vendor })).toBe(false);
  });
});

describe('rankPads', () => {
  const pad = (id: string, mapping: string, timestamp: number, connected = true): PadLike =>
    ({ id, mapping, connected, timestamp, axes: [], buttons: [] });
  it('puts standard pads first, then the freshest', () => {
    const ranked = rankPads([pad('odd', '', 900), pad('old', 'standard', 1), pad('new', 'standard', 5)]);
    expect(ranked.map((p) => p.id)).toEqual(['new', 'old', 'odd']);
  });
  it('still returns a non-standard pad when it is the only one, and drops disconnected ones', () => {
    expect(rankPads([pad('odd', '', 1)]).map((p) => p.id)).toEqual(['odd']);
    expect(rankPads([pad('gone', 'standard', 9, false)])).toEqual([]);
  });
});
