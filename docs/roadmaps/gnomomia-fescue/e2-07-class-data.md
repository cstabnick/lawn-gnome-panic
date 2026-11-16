Epic: 2, Systems
Depends on: none

## Goal
`src/data/classes.ts` holds the three classes, every base ability and all 54 talents, transcribed from the design.

## Read first
- `docs/design/gnomomia/classes.md` (all of it: the base kit tables and the 9 talent tables)
- `games/gnomes-of-gnomomia/src/config.ts`: `ClassDef`, `AbilityDef`, `TalentDef`, `StatusId`, `DamageType`
- `src/data/classes.ts` (stub)

## Change
- `src/data/classes.ts`:
  - **`CLASSES`:**

    | Class | Primary | Resource | Armor |
    |---|---|---|---|
    | warden | strength | grit | cloth, leather, plate, shield |
    | slinger | agility | focus | cloth, leather |
    | mage | intelligence | mana | cloth |

  - **`abilities`:** every row of that class's "Base kit" table as an `AbilityDef`.
    - `level` from the Lvl column, and `cost` from the Cost column (number only; 0 if –).
    - `cooldown` and `castTime` in seconds from the text (0 if none).
    - `kind`: attack / spell / buff / heal / move / passive / trap / summon.
    - `damageType`: Bash crush; Aimed Shot follows the ammo, so leave it undefined; Drizzle rain; Sunbeam sun.
    - `power` = the % as a multiplier (130% → 1.3), plus `radius`, `status`, `statusSeconds` where the text gives them.
    - `about` = the "Does" text.
  - **Talent actives** (Shield Slam, Trim, Sod Buster, Topiary, Gnome Smash, Bullseye, Thistle Volley, Burr Trap, Heatwave, Hailstone, Thick Glaze, Thunderhead, Fairy Ring, Midsummer is passive) are also `AbilityDef`s, with `fromTalent` set to the talent id and `level: 1`. Put them in the class's `abilities` list.
  - **Ability ids** are kebab-case names: `bash`, `hedge-charge`, `aimed-shot`, `drizzle`, `shield-slam`, ...
  - **`TALENTS`:** all 54 talents (3 classes × 3 branches × 6). Id `<class>-<kebab name>` (e.g. `warden-thick-clay`). `branch` is the branch name in lower case (`bulwark`, `hedgecutter`, `groundbreaker`, `acorneer`, `thornshot`, `trapper`, `sun`, `rain`, `bloom`). `tier` 1-6, `maxRank` from the Ranks column, `about` = the Effect text, and `grants` = the ability id for actives.
  - **Tier gates:** export `export const TIER_GATE = [0, 0, 2, 4, 6, 8, 12] as const;`, indexed by tier, giving points needed in that branch.
  - **Branches:** export `export const BRANCHES: Record<ClassId, readonly string[]>` in the order of classes.md.

## Contract
The shapes in config.ts exactly. talents.ts and abilities.ts (other workers) read `CLASSES`, `TALENTS`, `TIER_GATE` and `BRANCHES` by these names.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia`: no errors in data/classes.ts.
- 54 talents: `Object.keys(TALENTS).length === 54`.

## Out of scope
Any logic. talents.ts, abilities.ts.
