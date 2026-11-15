# Gnomes of Gnomomia

An old-school, click-to-move 3D RPG with gnomes: Elder Scrolls rules (skills that grow when you use them, ten skill-ups to a level) with a RuneScape feel (click to walk, right-click menus, hitsplats, a 28-slot inventory).

The question it answers: is a small, quest-driven gnome RPG fun to click around in?

## Run

```
npm install
npm run dev -w games/gnomes-of-gnomomia   # http://localhost:5291
```

## Play

- **Left-click** the ground to walk; click an enemy to attack, an NPC to talk, a loot pile to take it.
- **Right-click** anything for its menu (Attack, Talk-to, Take, Examine, Walk here).
- **Arrow keys** or **middle-drag** turn the camera; the **wheel** zooms.
- **1** casts Flare at your target, **2** casts Mend on yourself.
- The side panel has tabs for the inventory, worn gear, stats, quests and spells.

Start by talking to Elder Fernwick by the well in Mossbottom.

## Rules (src/rules.ts)

- Attack: d20 + skill bonus (skill / 10) + agility modifier ≥ 10 + target armor. A natural 20 always hits; a natural 1 always misses.
- Damage: the weapon's dice (fists 1d2) + strength modifier.
- Skills level by use: a hit trains the weapon skill, being hit trains Armor, a blocked blow trains Block, spells train Destruction and Restoration.
- Ten skill increases raise your level: +1 to every attribute, more HP, a full heal.

## Files

`config.ts` holds every type, number and data table (items, enemies, NPCs, dialogue, quests, map). Each system is one file; `main.ts` only wires them.
