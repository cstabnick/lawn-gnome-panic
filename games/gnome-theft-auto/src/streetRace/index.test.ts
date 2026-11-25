import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { installFakeDom } from '../testing/fakeDom';
import { createStreetRacing, type StreetRacingDeps } from './index';
import { MEETS } from './meets';
import type { RaceLobby, RaceNet } from './types';

function makeDeps(toast = vi.fn()): StreetRacingDeps {
  return {
    toast,
    unlock: () => undefined,
    increment: () => undefined,
    ui: { appendChild: () => undefined } as unknown as HTMLElement,
    session: {
      quest: { economy: { state: () => ({ acorns: 50 }) }, hud: { toast } },
      seat: () => undefined,
      store: { data: () => ({ best: {} }) },
      questBusy: () => false,
      increment: () => undefined,
    },
  } as unknown as StreetRacingDeps;
}

describe('createStreetRacing', () => {
  it('offers a prompt near a bookie and none far away', () => {
    const restore = installFakeDom();
    try {
      const racing = createStreetRacing(new THREE.Scene(), { boxes: [] } as never, makeDeps());
      const b = MEETS['skyway-foot'].bookie;
      expect(racing.prompt(b.x, b.z)).toMatch(/^Talk to .+ \(street races and wagers\)$/);
      expect(racing.prompt(1e5, 1e5)).toBeNull();
    } finally {
      restore();
    }
  });

  it('setNet wires the invite toast', () => {
    const restore = installFakeDom();
    try {
      const toast = vi.fn();
      const racing = createStreetRacing(new THREE.Scene(), { boxes: [] } as never, makeDeps(toast));
      const net = { onInvite: null } as unknown as RaceNet;
      racing.setNet(net);
      expect(net.onInvite).toBeTypeOf('function');
      const lobby = { hostName: 'Dot', trackId: 'kerb-row-circuit' } as unknown as RaceLobby;
      net.onInvite!(lobby);
      expect(toast).toHaveBeenCalledWith(expect.stringContaining('Dot is hosting a race'));
    } finally {
      restore();
    }
  });
});
