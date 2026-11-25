// The Gnomlet's Hedgeworth scorecard app (STUB: issue A14 fills it in).
import type { GolfApi, GolfStore } from './types';

export interface GolfAppDeps {
  store(): GolfStore;
  api(): GolfApi | null;
  toast(text: string): void;
}

export function registerGolfApp(_deps: GolfAppDeps): void {}
