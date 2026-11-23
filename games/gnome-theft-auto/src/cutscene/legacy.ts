// The old dialogue cutscene format (quests' `cutscene: { kind: 'dialogue', lines }`) as a SceneScript, so every quest
// scene plays on the director with typewriter text. Same staging as before: one speaker at a time in the room's centre.
import type { CutsceneRoom, DialogueLine } from '../quests/types';
import { speakerLookAndHz } from './cast';
import type { SceneScript, ScriptActor, Step } from './script';

const CAMEO_ICON = '🧹';

/** Dialogue lines as a script: a speaker gnome per line in the room, a dolly on the room; bodega cameos cut to the shop. */
export function legacyDialogueScript(req: { room: CutsceneRoom; lines: DialogueLine[]; titleCard?: string }): SceneScript {
  const lines: DialogueLine[] = req.lines.length > 0 ? req.lines : [{ speaker: 'Narrator', text: 'Meanwhile in Turfton...' }];
  const bodega = lines.some((l) => l.bodegaCameo);
  const actors: ScriptActor[] = [];
  const steps: Step[] = [];
  let up: string | null = null;

  lines.forEach((line, i) => {
    const id = `line${i}`;
    const cameo = line.bodegaCameo === true;
    const { look, hz, held, scale } = speakerLookAndHz(line);
    actors.push({ id, look, hz, held: held ?? null, scale, name: line.speaker, at: [0, -2.5], yaw: 0, hidden: true });

    if (cameo) {
      steps.push({ do: 'cam', shot: { kind: 'cut', pos: [30.4, 1.5, 1.5], look: [30, 1.1, -1.6] } });
    } else {
      if (up) steps.push({ do: 'despawn', id: up });
      steps.push({ do: 'spawn', id });
      up = id;
      steps.push({
        do: 'cam',
        shot: { kind: 'dolly', from: [-0.35, 1.45, 0.7], to: [0.35, 1.45, 0.7], look: [0, 1.1, -2.5], s: 6, ease: 'linear' },
      });
    }
    steps.push({
      do: 'say',
      who: cameo ? line.speaker : id,
      text: line.text,
      icon: line.icon ?? (cameo ? CAMEO_ICON : undefined),
      hz,
    });
  });

  return { id: 'legacy', stage: { kind: 'room', room: req.room, bodega }, title: req.titleCard, actors, steps };
}
