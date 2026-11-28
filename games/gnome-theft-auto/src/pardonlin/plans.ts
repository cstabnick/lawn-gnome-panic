// Every Pardonlin district plan, made once (E30). Pure: the town builder, the residents and the tests read these.
// FX09 adds two passes that span districts: the Thymes' quays (districts/thymes.ts, whose pieces go to the district
// each one stands in) and the lanes cut through the blocks (districts/lanes.ts, after every row is placed).
import type { AmbientGnomeDef } from '../ambientGnomes';
import { planGardens } from './districts/gardens';
import { addLanes } from './districts/lanes';
import { planLeftBank } from './districts/leftBank';
import { planOldTown } from './districts/oldTown';
import { planTeacupQuays } from './districts/teacupQuays';
import { planThymes } from './districts/thymes';
import { districtAt } from './layout';
import type { DistrictPlan, Vignette } from './plan';

let plans: DistrictPlan[] | null = null;

/** Hand each piece of a cross-district plan to the district it stands in (pieces outside every district are dropped). */
export function distribute(extra: Omit<DistrictPlan, 'id'>, into: DistrictPlan[]): void {
  const at = (x: number, z: number): DistrictPlan | undefined => {
    const d = districtAt(x, z);
    return d ? into.find((p) => p.id === d) : undefined;
  };
  for (const b of extra.buildings) at(b.x, b.z)?.buildings.push(b);
  for (const p of extra.props) at(p.x, p.z)?.props.push(p);
  for (const s of extra.signs) at(s.x, s.z)?.signs.push(s);
  for (const v of extra.vignettes) at(v.x, v.z)?.vignettes.push(v);
  for (const r of extra.residents) at(r.x, r.z)?.residents.push(r);
  // Ground patches are drawn town-wide, so they can stay with the first plan.
  into[0]?.ground.push(...extra.ground);
}

export function pardonlinPlans(): DistrictPlan[] {
  if (plans) return plans;
  const list = [planOldTown(), planTeacupQuays(), planLeftBank(), planGardens()];
  distribute(planThymes(), list);
  addLanes(list);
  plans = list;
  return plans;
}

/** The Continentals who stand about town (app.ts makes them with createAmbientGnomes). */
export function pardonlinResidents(): AmbientGnomeDef[] {
  return pardonlinPlans().flatMap((p) => p.residents);
}

export function pardonlinVignettes(): (Vignette & { district: string })[] {
  return pardonlinPlans().flatMap((p) => p.vignettes.map((v) => ({ ...v, district: p.id })));
}
