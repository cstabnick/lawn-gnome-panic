// Every Pardonlin district plan, made once (E30). Pure: the town builder, the residents and the tests read these.
import type { AmbientGnomeDef } from '../ambientGnomes';
import { planGardens } from './districts/gardens';
import { planLeftBank } from './districts/leftBank';
import { planOldTown } from './districts/oldTown';
import { planTeacupQuays } from './districts/teacupQuays';
import type { DistrictPlan, Vignette } from './plan';

let plans: DistrictPlan[] | null = null;

export function pardonlinPlans(): DistrictPlan[] {
  plans ??= [planOldTown(), planTeacupQuays(), planLeftBank(), planGardens()];
  return plans;
}

/** The Continentals who stand about town (app.ts makes them with createAmbientGnomes). */
export function pardonlinResidents(): AmbientGnomeDef[] {
  return pardonlinPlans().flatMap((p) => p.residents);
}

export function pardonlinVignettes(): (Vignette & { district: string })[] {
  return pardonlinPlans().flatMap((p) => p.vignettes.map((v) => ({ ...v, district: p.id })));
}
