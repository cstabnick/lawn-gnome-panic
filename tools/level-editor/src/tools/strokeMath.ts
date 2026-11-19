// Dab spacing along a brush stroke. Pure: the tool feeds it mouse segments and keeps the returned carry.
// The carry is the distance walked since the last dab, so dabs stay evenly spaced however the pointer moves.

export interface Pt {
  x: number;
  z: number;
}

export function dabPositions(
  from: Pt | null,
  to: Pt,
  spacing: number,
  carry: number,
): { points: Pt[]; carry: number } {
  if (from === null) return { points: [{ x: to.x, z: to.z }], carry: 0 };
  if (!(spacing > 0)) return { points: [], carry };

  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const len = Math.hypot(dx, dz);
  if (len === 0) return { points: [], carry };

  const points: Pt[] = [];
  // Offsets along this segment, measured from `from`, of each dab that falls inside it.
  let offset = Math.max(0, spacing - carry);
  let lastOffset: number | null = null;
  while (offset <= len + 1e-9) {
    const t = offset / len;
    points.push({ x: from.x + dx * t, z: from.z + dz * t });
    lastOffset = offset;
    offset += spacing;
  }
  const newCarry = lastOffset === null ? carry + len : len - lastOffset;
  return { points, carry: newCarry };
}
