Epic: 2, Systems
Depends on: none

## Goal
The side panel shows 8 equipment slots, the new stats (class, XP, 4 attributes, 8 skills with caps, defense, armor %), a journal grouped by storyline, and a new Talents tab.

## Read first
- `games/gnomes-of-gnomomia/src/ui/panels.ts` (all: tabs at about line 10, equipment and stats renderers), `src/ui/talents.ts` (stub)
- `src/data/classes.ts` (`CLASSES`, `TALENTS`, `TIER_GATE`, `BRANCHES`), `src/talents.ts` exports (`talentRank`, `canLearn`, `learnTalent`, `respec`, `branchPoints`)
- `src/rules.ts` (`weaponRange`, `armorValue`, `mitigation`), `src/combat.ts` (`playerDefense`, `playerArmor`), `src/progression.ts` (`xpToNext`, `skillCap`)

## Change
- `src/ui/panels.ts`:
  - Add a 6th tab, `talents` (icon 🌱, key `t`), rendering through `renderTalents(container)`.
  - **Equipment:** 8 slots in a gnome-shaped layout: head top; body, hands, offhand and weapon in the middle row; legs, then feet; trinket at the side.
  - **Item tooltips:** name coloured by rarity (plain white, sprouted green, blooming blue, heirloom purple, kilnfired orange), ilvl, then damage `min-max type` for weapons, or armor for armor pieces, plus `stats` lines and `effect`.
  - **Stats tab:**
    - Class name (or "Classless") and level.
    - `XP a / b`.
    - The 4 attributes.
    - 8 skills as `level / cap`.
    - Defense, and armor as `mitigation(playerArmor(), state.level)` %.
    - Skill points unspent, in gold if > 0.
  - **Quests tab:** grouped under `chain` headings (main chapters first, then storylines), with finished quests collapsed.
  - Quest items can't be dropped or sold: no Drop option.
- `src/ui/talents.ts`:
  - `renderTalents(c)`: when classless, show "Choose your Calling in Thatchford (level 5+)."
  - Otherwise show 3 columns (one per branch in `BRANCHES[classId]`) with 6 tier rows. Each talent cell shows its name, `rank/max`, and greys out if `!canLearn` and rank is 0. Click → `learnTalent`. Hover shows `about`.
  - Header: points available and per-branch totals. A Respec button calls `respec()`.
  - Re-render on `talents-changed` and `level-up`.

## Contract
`renderTalents(container: HTMLElement): void`. `createPanels(root)` is unchanged.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia`: no errors in ui/panels.ts or ui/talents.ts.

## Out of scope
talents.ts logic, ui/hud.ts, ui/hotbar.ts.
