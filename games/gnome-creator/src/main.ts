// Gnome Creator: wires the store, the preview and the editor.
import { DEFAULT_LOOK, GnomeStoreError, createGnomeStore, decodeLook, encodeLook, snapLook, toModelLook, type Look } from '@lawn/gnome';
import { checkName } from '@lawn/mp/textFilter';
import { createEditor, type EditorState } from './editor';
import { createPreview } from './preview';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ui = document.getElementById('ui') as HTMLElement;

const store = createGnomeStore();
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
});

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
show(state);
