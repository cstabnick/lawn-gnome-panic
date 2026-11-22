import { describe, expect, it } from 'vitest';
import { hitchEvent, telemetryEndpoint } from './upload';

describe('upload', () => {
  it('maps the mp-server WebSocket URL to its telemetry path', () => {
    expect(telemetryEndpoint('wss://mp.example.com/ws')).toBe('https://mp.example.com/t');
    expect(telemetryEndpoint('ws://localhost:8787/ws')).toBe('http://localhost:8787/t');
    expect(telemetryEndpoint('')).toBe('');
  });

  it('builds an event inside the server limits (<= 12 fields, strings <= 200)', () => {
    const parts: [string, number][] = Array.from({ length: 30 }, (_, i) => [`system${i}WithALongName`, 30 - i]);
    const e = hitchEvent('gnomes-of-gnomomia', { kind: 'frame', ms: 900, at: 1234, parts, ctx: { zone: 'mossbottom' } }, { gpu: 'X', touch: false, cores: 8, mem: 8 });
    expect(e.ev).toBe('hitch');
    expect(Object.keys(e).filter((k) => k !== 'ev' && k !== 'at').length).toBeLessThanOrEqual(12);
    expect(String(e.top).length).toBeLessThanOrEqual(200);
    expect(e.where).toBe('zone=mossbottom');
    expect(String(e.top).startsWith('system0WithALongName 30,')).toBe(true);
  });
});
