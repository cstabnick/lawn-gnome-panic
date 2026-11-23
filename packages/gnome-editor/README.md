# @lawn/gnome-editor: one code path for editing a gnome

The Gnome Creator's editing panel (`editor.ts`), its turntable preview (`preview.ts`) and the whole creator flow
(`studio.ts`: load my gnome, preview, achievement gear, emotes, hair styles, SAVE through the gnome store). The Gnome
Creator page and Club Gnome's dressing room and salon all call `createGnomeStudio`, so there is one way to edit and
save a gnome. Modes only choose which sections show:

| Mode | Sections | Used by |
|---|---|---|
| `full` | name, tips, colours, skin, hair (beard, hair colour, hair style), features, gear, emotes, share code | `games/gnome-creator` |
| `dressing` | colours, features, gear | Club Gnome's dressing room (Gnome Market) |
| `salon` | hair | Club Gnome's Gnome Salon (sells hair styles for acorns via `hairPrices`) |

```ts
import { createGnomeStudio } from '@lawn/gnome-editor';

const studio = await createGnomeStudio({ canvas, ui, mode: 'salon', hairPrices: { bun: 150 }, onClose, onSaved });
studio.dispose();
```

Hair styles other than pigtails are bought with acorns (`@lawn/oakcount`, item id `hair:<style>`); the look stores
the chosen one as `Look.hairStyle` (`packages/gnome`).
