## Environment (shared by every FX05 issue)

- Worktree: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a3dd1be052eb33383` (Git Bash). Work only
  inside it; game at `games/gnome-theft-auto`, source paths below are under `games/gnome-theft-auto/src/`.
  If node is missing: `export PATH="/c/Program Files/nodejs:$PATH"`.
- Other workers edit other files of the same game at the same time. Edit ONLY the files your issue owns. Never run
  `git commit`, `git stash`, `git checkout` or `npm run build` (vite build writes dist/); never start or stop a dev server.
- Keep LF line endings. Do not change dialogue text (`say` lines, titles, intro card names/roles/lines): the act epics own
  the words. You change cameras, actor and prop positions and facings, lights, weather, extras and set pieces.
  Do not edit `cutscene/cast.ts`, `cutscene/director.ts`, `cutscene/pacing.ts`, `cutscene/script.ts`, `stageSets.ts`.
- New objects come from `@lawn/prefabs` (browse `packages/prefabs/src/catalog/*.ts` for ids). Anything flat on the
  ground needs a draw layer, not just a lift (rule in `docs/rendering.md`).

### What the lead already built (use it)

- `SceneScript.weather?: 'clear' | 'cloud' | 'mist' | 'rain' | 'snow' | 'world'`. Default for world scenes: `'clear'`
  (rain only when `ambience` is 'rain' or 'storm', snow when 'snow'). Set it only to override.
- `SceneScript.keyLights?: SceneKeyLight[]`, a warm practical light per entry:
  `{ at: '<prop/actor/vehicle id>' | [x, y, z]; lift?: number /* default 0.6 over an id */; color?: number /* 0xffb066 lamp, 0xff8a3a fire */; intensity?: number /* default 7 */; range?: number /* default 9 */; from?: number; until?: number /* scene seconds, eased 0.8 s */; flicker?: boolean }`.
  Put one on the lantern / campfire / lamp prop the scene already has (add a prop if it has none). For a lamp that
  "comes on" mid-scene use `from`.
- `SceneScript.faceFill?: boolean | number`: a soft warm light beside the camera that lights faces in close shots. On by
  default for world scenes with `sky: 'night'` or `'golden'`; a number sets its intensity (default 3.2), false turns it off.
- `sky: 'noon' | 'golden' | 'night'` already existed (the sky time-lapses to that hour; "dusk" = 'golden').
- GR6 key-frame check (`cutscene/pacing.ts` `keyFrameFaults`, `KEY_FRAME`): on every close line (speaker fills >= 60 % of
  the frame height) and every `intro` card the speaker must be seen within 60 deg of their facing, the camera must not
  look down on the head more than 40 deg, and nobody may stand between the camera and the face or have the lens at their
  shoulder (within ~0.75 m of their body). Your scenes are in `KEY_FRAME_STRICT` in `cutscene/pacing.test.ts`, so these
  faults fail the test. Fix them by moving the camera (`shot(who, size, { toward, side, height })`, `coverage(a, b,
  side, angle)` in `cutscene/direct.ts`), turning the speaker (`{ do: 'face', who, at }`), or moving actors apart. Do not
  add waivers unless the shot is deliberately a back view and the face is not the point (say why).
- The whole pacing check must still pass for your scenes (shot lengths, line framing, 180-degree line): same test.

### Checks you run

```
cd games/gnome-theft-auto
npx tsc --noEmit
npx vitest run src/cutscene/pacing.test.ts src/cutscene/cutscenes.test.ts src/quests/stages.test.ts src/stageSets.test.ts
CUTSCENE_REPORT=1 npx vitest run src/cutscene/pacing.test.ts   # prints the report; look at "Key frames" for your scenes
```
(`stageSets.test.ts` has a road-overlap test that fails until issue I3 lands; ignore its failures outside your files.)

### Looking at your scenes (do it; this is the point of the issue)

A dev server already runs at `http://localhost:5505/` (shared; a reload from another worker's edit is retried).
- Scene frames at scene-clock seconds:
  `node C:/Users/cpsai/AppData/Local/Temp/claude/5c6e1ad7636bf755/491bbd90-be40-460d-b246-8599e60336ab/scratchpad/scene-shots.mjs http://localhost:5505/ docs/roadmaps/gta-batch-3/review/shots/FX05/<issue> <scene-id> 4,12.5,20 [--size 390x844] [--params "weather=rain"]`
  (run from the worktree root; each PNG is `<scene-id>-<t>.png`). Find line times with the report, or by reading the
  scene. Add `--params "weather=rain"` once to prove a clear-weather scene stays dry in a rainy world.
- World spots: `node tools/gta-shots.mjs "http://localhost:5505/?stagesets=all" docs/roadmaps/gta-batch-3/review/shots/FX05/<issue> name:x,z,yaw [--size 390x844]`
  (yaw 0 faces +z/south, Math.PI north, PI/2 east; `?stagesets=all` shows every quest-scoped set).
- Open each PNG with the Read tool and judge it as an editor would: is the speaker's face readable, lit, not blocked;
  does the key frame say what the scene is about; would it read on a 390 px phone? Iterate until it does. A scene is
  about 1.5 s of fade + its clock; a 60 s scene takes ~70 s to shoot.

### Report (your final message, <= 15 lines)

Files changed, what you changed per finding, the screenshot paths you judged (and what they show), the check results,
anything you could not fix.
