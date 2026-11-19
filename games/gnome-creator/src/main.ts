// Gnome Creator: wires the store, achievements, the preview and the editor.
import { createAchievementStore, getAchievement } from '@lawn/achievements';
import { DEFAULT_LOOK, GnomeStoreError, createGnomeStore, decodeLook, encodeLook, snapLook, toModelLook, type Look } from '@lawn/gnome';
import { EMOTES, emoteAchievementId, loadLoadout, saveLoadout, loadUnlockedEmotes, type EmoteDef } from '@lawn/emotes';
import { checkName } from '@lawn/mp/textFilter';
import { createEditor, type EditorState, type EmoteChoice } from './editor';
import { initCreatorMusic } from './music';
import { createPreview } from './preview';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ui = document.getElementById('ui') as HTMLElement;

initCreatorMusic(ui);

const store = createGnomeStore();
const achievementStore = createAchievementStore();
const preview = createPreview(canvas);

let state: EditorState;

/** Shows a state in the preview and as the share code. The preview gets the snapped look, the code what it encodes to. */
function show(s: EditorState): void {
  preview.setLook(toModelLook(snapLook(s.look)));
  editor.setShareCode(encodeLook(s.look));
}

const editor = createEditor(ui, {
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
      editor.setStatus('Saved. Every game in the arcade now uses this gnome.');
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
});

/** The hint under a locked emote: where to earn it. */
function emoteHint(e: EmoteDef): string {
  if (e.free) return 'Everyone has this one.';
  const id = emoteAchievementId(e.id);
  const a = id === undefined ? undefined : getAchievement(id);
  return a ? `${a.title} (${a.gameTitle}): ${a.description}` : e.label;
}

// Start-up: the saved gnome, or the default when storage is blocked. A `?gnome=` link overrides it until SAVE.
let look: Look = DEFAULT_LOOK;
let name = 'Gnome';
try {
  const me = await store.getMe();
  look = me.look ?? DEFAULT_LOOK;
  name = me.displayName;
} catch {
  editor.setStatus('Browser storage is not available: you can look around, but SAVE will not work.', true);
}

const fromUrl = decodeLook(new URLSearchParams(location.search).get('gnome') ?? '');
if (fromUrl !== null) {
  look = fromUrl;
  editor.setStatus('Opened from a link. Press SAVE to keep it.');
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
show(state);
