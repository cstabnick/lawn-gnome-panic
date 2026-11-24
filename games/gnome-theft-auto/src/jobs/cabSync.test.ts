import { describe, expect, it } from 'vitest';
import type { MirrorEnt, OwnedEnt, SyncFrame, SyncLink } from '../online/hub';
import { createCabSync } from './cabSync';
import { callKey } from './cabCalls';
import { CAB_CMD, decodeCab } from './protocol';
import type { JobsNet } from './types';

interface Cmd { owner: number; id: number; c: number; a?: number[] }

/** A fake link: records every command and reports online state. */
function fakeLink(myId: number, online: boolean, cmds: Cmd[], deliver?: (c: Cmd) => void): SyncLink {
  return {
    command(owner, id, c, a) {
      const cmd: Cmd = { owner, id, c, a };
      cmds.push(cmd);
      deliver?.(cmd);
    },
    pay() {},
    online: () => online,
    myId: () => myId,
  };
}

const net = { riding: () => null } as unknown as JobsNet;
const frame = {} as SyncFrame;
const clock = () => 1000;

describe('createCabSync', () => {
  it('runs a full call: call, take, assign, drop, paid', () => {
    const toA: Cmd[] = [];
    const toB: Cmd[] = [];
    // The driver's commands go to the rider (player 1); the rider's to the driver.
    const A = createCabSync(fakeLink(1, true, toA), net, clock);
    const B = createCabSync(fakeLink(2, true, toB, (c) => A.command?.(2, c.id, c.c, c.a ?? [])), net, clock);

    const riderNotes: unknown[] = [];
    A.onRider((n) => riderNotes.push(n));

    expect(A.call('clay-mart', 'Ann', 10, 20)).toBeNull();

    const out: OwnedEnt[] = [];
    A.collect(out, frame);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe(1);

    const ent: MirrorEnt = { owner: 1, id: 1, rec: out[0].rec, str: out[0].str, seenAt: 0, sentAt: 0 };
    B.receive({ added: [ent], changed: [], removed: [] }, null);

    const open = B.open(0, 0);
    expect(open.map((s) => callKey(s.owner, s.call.id))).toEqual([callKey(1, 1)]);

    expect(B.take('1:1')).toBeNull();
    expect(toB).toEqual([{ owner: 1, id: 1, c: CAB_CMD.take, a: undefined }]);
    expect(riderNotes).toEqual([{ t: 'assigned', driver: 2 }]);

    const after: OwnedEnt[] = [];
    A.collect(after, frame);
    const taken = decodeCab(after[0].rec, after[0].str);
    expect(taken?.takenBy).toBe(2);

    const changed: MirrorEnt = { ...ent, rec: after[0].rec, str: after[0].str };
    B.receive({ added: [], changed: [changed], removed: [] }, null);
    expect(B.status(2)).toBe('ok');

    B.drop(40, 5);
    expect(toB[toB.length - 1]).toEqual({ owner: 1, id: 1, c: CAB_CMD.drop, a: [40, 5] });
    expect(riderNotes[riderNotes.length - 1]).toEqual({ t: 'paid', driver: 2, fare: 40, stars: 5 });
  });

  it('returns the online-only message when the link is offline', () => {
    const A = createCabSync(fakeLink(1, false, []), net, clock);
    expect(A.call('clay-mart', 'Ann', 0, 0)).toBe('Online only: no other players here.');
  });
});
