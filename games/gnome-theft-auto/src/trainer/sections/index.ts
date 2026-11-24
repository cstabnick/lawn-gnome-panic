// The built-in trainer tabs. install.ts calls registerBuiltInSections() once, on the first open (lazy chunk).
// Plug-ins (birding, hangar...) call registerTrainerSection / registerTrainerSpawnable from ../registry themselves.
import { registerSaveSection } from './save';
import { registerCharacterSection } from './character';
import { registerSpawnSection } from './spawn';
import { registerGarageSection } from './garage';
import { registerWorldSection } from './world';
import { registerCutsceneSection } from './cutscenes';
import { registerAnimationSection } from './animations';
import { registerQuestSimSection } from '../../questSim/trainer';

let done = false;

export function registerBuiltInSections(): void {
  if (done) return;
  done = true;
  registerSaveSection(); // order 10
  registerCharacterSection(); // order 20
  registerSpawnSection(); // order 30 (also registers the built-in spawnables)
  registerGarageSection(); // order 40
  registerWorldSection(); // order 50
  registerCutsceneSection(); // order 60
  registerAnimationSection(); // order 70
  registerQuestSimSection(); // order 75 (questSim/trainer.ts)
}
