// The gnome studio: the whole Gnome Creator flow (load my gnome, live preview, achievements gear, emotes, hair styles,
// SAVE) in one function, so the creator page and Club Gnome's dressing room and salon run the same code path.
// Modes only choose which editor sections show; saving always goes through the gnome store.
import { createAchievementStore, getAchievement } from '@lawn/achievements';
import {
  DEFAULT_LOOK, GnomeStoreError, HAIR_STYLES, PALETTE, createGnomeStore, decodeLook, encodeLook, snapLook, toModelLook,
  type HairStyle, type Look,
} from '@lawn/gnome';
import { EMOTES, emoteAchievementId, loadLoadout, saveLoadout, loadUnlockedEmotes, type EmoteDef } from '@lawn/emotes';
import { loadOakcount, buyItem, getAcorns, owns } from '@lawn/oakcount';
import { checkName } from '@lawn/mp/textFilter';
import { createEditor, type EditorState, type EditorSection, type EmoteChoice, type HairStyleChoice } from './editor';
import { createPreview } from './preview';

export type StudioMode = 'full' | 'dressing' | 'salon';

/** Which editor sections each mode shows. */
export const STUDIO_SECTIONS: Record<StudioMode, readonly EditorSection[]> = {
  full: ['name', 'guide', 'colours', 'skin', 'hair', 'toggles', 'equipment', 'emotes', 'share'],
  dressing: ['colours', 'toggles', 'equipment'],
  salon: ['hair'],
};

/** The Oakcount id of a bought hair style ('pigtails' is free and never stored). */
export function hairItemId(style: HairStyle): string {
  return `hair:${style}`;
}

export interface StudioOptions {
  /** The canvas the turntable preview draws on (it fills the window). */
  canvas: HTMLCanvasElement;
  /** Where the editor panel is appended (the page's #ui, or a container inside it). */
  ui: HTMLElement;
  mode: StudioMode;
  /** Panel heading. Default: 'GNOME CREATOR' (full), 'DRESSING ROOM', 'GNOME SALON'. */
  title?: string;
  /** Adds a ✕ CLOSE button to the panel that calls this (Club Gnome closes the studio). */
  onClose?: () => void;
  /** Called after every successful SAVE with what was saved. */
  onSaved?: (saved: { name: string; look: Look }) => void;
  /**
   * Acorn prices of the hair styles that can be bought here (the salon). A locked style with a price shows
   * "🌰 <price>" and buys it with the Oakcount (buyItem(hairItemId(id), price, 'acorns')) when tapped; a locked style
   * without a price shows "Salon". Absent: nothing is for sale.
   */
  hairPrices?: Partial<Record<HairStyle, number>>;
  /** Called after a hair style was bought here (Club Gnome counts it as a purchase). */
  onHairBought?: (style: HairStyle) => void;
}

export interface Studio {
  /** Stops the preview, removes the panel. The canvas is left as it was (the caller owns it). */
  dispose(): void;
}

/** The hint under a locked emote: where to earn it. */
function emoteHint(e: EmoteDef): string {
  if (e.free) return 'Everyone has this one.';
  const id = emoteAchievementId(e.id);
  const a = id === undefined ? undefined : getAchievement(id);
  return a ? `${a.title} (${a.gameTitle}): ${a.description}` : e.label;
}

/** Builds the studio. Resolves once my gnome is loaded and shown. Never rejects (problems show on the status line). */
export async function createGnomeStudio(opts: StudioOptions): Promise<Studio> {
  try {
    await loadOakcount();
  } catch {
    // Acorns are unavailable: the studio still works, nothing can be bought.
  }

  const store = createGnomeStore();
  const achievementStore = createAchievementStore();
  const preview = createPreview(opts.canvas);
  const saveLabel = opts.mode === 'full' ? 'SAVE' : 'SAVE MY LOOK';
  const defaultTitle =
    opts.mode === 'full' ? 'GNOME CREATOR' : opts.mode === 'dressing' ? 'DRESSING ROOM' : 'GNOME SALON';

  let state: EditorState;
  /** The hair style tapped once; a second tap on it buys it. */
  let pendingHair: HairStyle | null = null;

  /** Shows a state in the preview and as the share code. The preview gets the snapped look, the code what it encodes to. */
  function show(s: EditorState): void {
    preview.setLook(toModelLook(snapLook(s.look)));
    editor.setShareCode(encodeLook(s.look));
  }

  /** Rebuilds the HAIR STYLE buttons from what is owned and what is for sale. */
  function refreshHair(): void {
    const choices: HairStyleChoice[] = HAIR_STYLES.map(({ id, label }) => {
      const owned = id === 'pigtails' || owns(hairItemId(id));
      if (owned) return { id, label, owned };
      const price = opts.hairPrices?.[id];
      return { id, label, owned, price: price !== undefined ? `🌰 ${price}` : 'Salon' };
    });
    editor.setHairStyles(choices);
  }

  const editor = createEditor(
    opts.ui,
    {
      onChange(s) {
        state = s;
        editor.setStatus('');
        show(s);
      },
      async onSave(s) {
        // The name is checked here too: the editor only edits text, the store is the one that must refuse bad names.
        const r = checkName(s.name);
        if (!r.ok) {
          editor.setStatus(r.reason, true);
          return;
        }
        try {
          await store.updateGnome({ displayName: r.name, look: snapLook(s.look) });
          editor.setStatus(
            opts.mode === 'full'
              ? 'Saved. Every game in the arcade now uses this gnome.'
              : 'Saved. Everyone in Club Gnome sees your new look.',
          );
          opts.onSaved?.({ name: r.name, look: snapLook(s.look) });
        } catch (error) {
          if (error instanceof GnomeStoreError) editor.setStatus(error.message, true);
          else editor.setStatus('Could not save.', true);
        }
      },
      onImport(code) {
        const look = decodeLook(code.trim());
        if (look === null) {
          editor.setStatus('That is not a gnome code.', true);
          return;
        }
        state = { name: state.name, look };
        editor.setState(state);
        show(state);
        editor.setStatus('Imported. Press SAVE to keep it.');
      },
      onEmotesChange(ids) {
        // Saved at once; SAVE only stores the look and the name.
        saveLoadout(ids);
        editor.setStatus('Emotes saved.');
      },
      onEmotePreview(id) {
        preview.playEmote(id);
      },
      onHairStyleLocked(id) {
        const price = opts.hairPrices?.[id];
        if (price === undefined) {
          pendingHair = null;
          editor.setStatus('Buy this style at the Gnome Salon in Club Gnome.');
          return;
        }
        const label = HAIR_STYLES.find((h) => h.id === id)?.label ?? id;
        if (pendingHair !== id) {
          pendingHair = id;
          editor.setStatus(`Buy ${label} for 🌰 ${price}? Tap it again to buy.`);
          return;
        }
        pendingHair = null;
        if (getAcorns() < price || !buyItem(hairItemId(id), price, 'acorns')) {
          editor.setStatus(`You need 🌰 ${price}; you have 🌰 ${getAcorns()}.`, true);
          return;
        }
        refreshHair();
        const look: Look = { ...state.look, hairStyle: id };
        if (look.hairRgb === undefined) look.hairRgb = PALETTE[18];
        state = { name: state.name, look };
        editor.setState(state);
        show(state);
        editor.setStatus(`Yours! Press ${saveLabel} to keep it.`);
        opts.onHairBought?.(id);
      },
    },
    {
      sections: STUDIO_SECTIONS[opts.mode],
      title: opts.title ?? defaultTitle,
      onClose: opts.onClose,
      saveLabel,
    },
  );

  // Start-up: the saved gnome, or the default when storage is blocked. A `?gnome=` link overrides it until SAVE (full only).
  let look: Look = DEFAULT_LOOK;
  let name = 'Gnome';
  try {
    const me = await store.getMe();
    look = me.look ?? DEFAULT_LOOK;
    name = me.displayName;
  } catch {
    editor.setStatus('Browser storage is not available: you can look around, but SAVE will not work.', true);
  }

  if (opts.mode === 'full') {
    const fromUrl = decodeLook(new URLSearchParams(location.search).get('gnome') ?? '');
    if (fromUrl !== null) {
      look = fromUrl;
      editor.setStatus('Opened from a link. Press SAVE to keep it.');
    }
  }

  state = { name, look };
  editor.setState(state);
  try {
    const achState = await achievementStore.getState();
    const unlocked = new Set(Object.entries(achState.records).filter(([, r]) => r.unlockedAt).map(([id]) => id));
    editor.setUnlocked(unlocked);
  } catch {
    // Ignore if storage is unavailable.
  }

  // Emotes: every one, locked or not; free ones are always unlocked.
  let haveEmotes: Set<string>;
  try {
    haveEmotes = new Set(await loadUnlockedEmotes(achievementStore));
  } catch {
    haveEmotes = new Set(EMOTES.filter((e) => e.free).map((e) => e.id));
  }
  const emoteChoices: EmoteChoice[] = EMOTES.map((e) => ({
    id: e.id,
    label: e.label,
    icon: e.icon,
    unlocked: haveEmotes.has(e.id),
    hint: emoteHint(e),
  }));
  editor.setEmotes(emoteChoices, loadLoadout().filter((id) => haveEmotes.has(id)));
  refreshHair();
  show(state);

  return {
    dispose() {
      preview.dispose();
      editor.dispose();
    },
  };
}
