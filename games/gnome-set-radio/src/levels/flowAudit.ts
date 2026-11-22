import type { GsrLevelDoc } from './schema';

export interface FlowNode {
  id: string;
  kind: 'rail-end' | 'ramp-top' | 'launcher' | 'building-roof';
  x: number;
  y: number;
  z: number;
  maxGainY: number;
}

export interface FlowAuditReport {
  levelId: string;
  levelName: string;
  spawnLeadInDist: number;
  nodeCount: number;
  chainedCount: number;
  deadEnds: string[];
  isolatedObjectives: string[];
  flowScore: number;
}

const CHAIN_MAX_XZ = 26;
const CHAIN_MAX_UP_Y = 6.5;
const OBJ_MAX_XZ = 20;

export function extractFlowNodes(doc: GsrLevelDoc): FlowNode[] {
  const nodes: FlowNode[] = [];

  for (const r of doc.data.rails) {
    if (r.points.length === 0) continue;
    const first = r.points[0]!;
    const last = r.points[r.points.length - 1]!;
    nodes.push({ id: `rail:${r.id}:start`, kind: 'rail-end', x: first[0], y: first[1], z: first[2], maxGainY: 3.5 });
    nodes.push({ id: `rail:${r.id}:end`, kind: 'rail-end', x: last[0], y: last[1], z: last[2], maxGainY: 3.5 });
  }

  for (const r of doc.data.ramps) {
    const fwdX = Math.sin(r.yaw);
    const fwdZ = Math.cos(r.yaw);
    const topX = r.x + fwdX * (r.length * 0.5);
    const topZ = r.z + fwdZ * (r.length * 0.5);
    nodes.push({ id: `ramp:${r.id}:top`, kind: 'ramp-top', x: topX, y: r.yTop, z: topZ, maxGainY: 3.8 });
  }

  for (const it of doc.data.interactives) {
    if (it.kind === 'bongo-pad' || it.kind === 'hydrant' || it.kind === 'updraft-vent') {
      nodes.push({ id: `launcher:${it.id}`, kind: 'launcher', x: it.x, y: it.y, z: it.z, maxGainY: 9.5 });
    }
  }

  return nodes;
}

export function auditLevelFlow(doc: GsrLevelDoc): FlowAuditReport {
  const nodes = extractFlowNodes(doc);
  const spawn = doc.markers.find((m) => m.kind === 'spawn');
  const sx = spawn?.x ?? 0;
  const sz = spawn?.z ?? 36;

  // Distance from spawn to nearest flow element (rail point, ramp base, or launcher)
  let spawnLeadInDist = Infinity;
  for (const r of doc.data.rails) {
    for (const p of r.points) {
      spawnLeadInDist = Math.min(spawnLeadInDist, Math.hypot(p[0] - sx, p[2] - sz));
    }
  }
  for (const r of doc.data.ramps) {
    spawnLeadInDist = Math.min(spawnLeadInDist, Math.hypot(r.x - sx, r.z - sz));
  }
  for (const it of doc.data.interactives) {
    if (it.kind === 'bongo-pad' || it.kind === 'hydrant' || it.kind === 'updraft-vent') {
      spawnLeadInDist = Math.min(spawnLeadInDist, Math.hypot(it.x - sx, it.z - sz));
    }
  }

  // Build candidate targets that a flow node can chain into
  const targets: { id: string; x: number; y: number; z: number }[] = [];
  for (const r of doc.data.rails) {
    for (let i = 0; i < r.points.length; i++) {
      const p = r.points[i]!;
      targets.push({ id: `rail:${r.id}:${i}`, x: p[0], y: p[1], z: p[2] });
    }
  }
  for (const r of doc.data.ramps) {
    const fwdX = Math.sin(r.yaw);
    const fwdZ = Math.cos(r.yaw);
    targets.push({ id: `ramp:${r.id}:bot`, x: r.x - fwdX * (r.length * 0.5), y: r.yBottom, z: r.z - fwdZ * (r.length * 0.5) });
    targets.push({ id: `ramp:${r.id}:top`, x: r.x + fwdX * (r.length * 0.5), y: r.yTop, z: r.z + fwdZ * (r.length * 0.5) });
  }
  for (const it of doc.data.interactives) {
    targets.push({ id: `item:${it.id}`, x: it.x, y: it.y, z: it.z });
  }

  const deadEnds: string[] = [];
  let chainedCount = 0;

  for (const n of nodes) {
    const baseGroup = n.id.split(':')[1] ?? n.id;
    let hasChain = false;
    for (const t of targets) {
      const tGroup = t.id.split(':')[1] ?? t.id;
      if (tGroup === baseGroup) continue;
      const dxz = Math.hypot(t.x - n.x, t.z - n.z);
      const dy = t.y - n.y;
      if (dxz <= CHAIN_MAX_XZ && dy <= Math.max(CHAIN_MAX_UP_Y, n.maxGainY)) {
        hasChain = true;
        break;
      }
    }
    if (hasChain) chainedCount++;
    else deadEnds.push(n.id);
  }

  // Check that every objective target (billboard, dish, speaker, acorn, ring) is near flow
  const allFlowPts: { x: number; z: number }[] = [
    ...targets.filter((t) => !t.id.startsWith('item:') || doc.data.interactives.some((it) => `item:${it.id}` === t.id && (it.kind === 'bongo-pad' || it.kind === 'hydrant' || it.kind === 'updraft-vent'))),
    ...doc.data.buildings.map((b) => ({ x: b.x, z: b.z })),
  ];

  const isolatedObjectives: string[] = [];
  const checkObj = (id: string, x: number, z: number) => {
    let best = Infinity;
    for (const p of allFlowPts) {
      best = Math.min(best, Math.hypot(p.x - x, p.z - z));
    }
    if (best > OBJ_MAX_XZ) isolatedObjectives.push(`${id} (${best.toFixed(1)}m)`);
  };

  for (const bb of doc.data.billboards) checkObj(`billboard:${bb.id}`, bb.x, bb.z);
  for (const it of doc.data.interactives) {
    if (it.eventId) checkObj(`interactive:${it.id}`, it.x, it.z);
  }

  const totalChecks = nodes.length + doc.data.billboards.length + doc.data.interactives.filter((i) => i.eventId).length;
  const passedChecks = totalChecks - deadEnds.length - isolatedObjectives.length;
  const flowScore = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100;

  return {
    levelId: doc.id,
    levelName: doc.name,
    spawnLeadInDist: Math.round(spawnLeadInDist * 10) / 10,
    nodeCount: nodes.length,
    chainedCount,
    deadEnds,
    isolatedObjectives,
    flowScore,
  };
}

export function formatFlowReport(r: FlowAuditReport): string {
  const lines = [
    `[${r.levelId}] ${r.levelName}: flowScore=${r.flowScore}% (${r.chainedCount}/${r.nodeCount} nodes chained, spawnLeadIn=${r.spawnLeadInDist}m)`,
  ];
  if (r.deadEnds.length > 0) lines.push(`  deadEnds: ${r.deadEnds.join(', ')}`);
  if (r.isolatedObjectives.length > 0) lines.push(`  isolatedObjectives: ${r.isolatedObjectives.join(', ')}`);
  return lines.join('\n');
}
