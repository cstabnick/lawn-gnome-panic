// The Save tab of the Save Trainer: cloud sync status, the trainer mark and backup, export / import / reset of the save
// bundle (the same file and format as the old Options > Experimental buttons: gta-save.json, gta-save/v1), and a raw
// editor for each save key.
import { GTA_SAVE_KEYS, exportSaveBundle, importSaveBundle, resetSaveBundle } from '../../saveIO';
import { cloudPaused, cloudStatus, cloudStatusText, onCloudStatus, setCloudPaused } from '../../cloudSave';
import { notifySaveChanged } from '../../saveHook';
import { clearTrainerBackup, markTrainerModified, readTrainerBackup, readTrainerMark } from '../mark';
import { registerTrainerSection } from '../registry';
import {
  button,
  confirmButton,
  grid,
  heading,
  input,
  note,
  reloadSoon,
  row,
  select,
  setButtonText,
  status,
} from '../ui';

const SYNC_SUB = 'Pause it to experiment without touching your cloud save (quest rewinds only stick while paused). Reloads.';
const POLICY =
  'Trainer changes to progress save and sync like normal play. Before the first one, the trainer keeps a backup on this device. Achievements are never changed by the trainer.';
const PASTE_PLACEHOLDER = '{"format":"gta-save/v1","data":{...}}';

function downloadText(name: string, text: string): void {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function localDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString();
}

export function registerSaveSection(): void {
  registerTrainerSection({
    id: 'save',
    label: 'Save',
    order: 10,
    build(el) {
      const st = status();
      el.append(st.el);

      // 1. Cloud save.
      el.append(heading('Cloud save'));
      const cloudNote = note(cloudStatusText(cloudStatus()));
      el.append(cloudNote);
      const unsubscribe = onCloudStatus((s) => {
        if (!cloudNote.isConnected) {
          unsubscribe();
          return;
        }
        cloudNote.textContent = cloudStatusText(s);
      });

      const syncBtn = button('', () => {
        setCloudPaused(!cloudPaused());
        paintSync();
        st.set(cloudPaused() ? 'Sync paused. Reloading...' : 'Sync on. Reloading...');
        reloadSoon();
      });
      const paintSync = (): void => {
        const paused = cloudPaused();
        setButtonText(syncBtn, paused ? 'Cloud sync: paused' : 'Cloud sync: on', SYNC_SUB);
        syncBtn.classList.toggle('on', paused);
      };
      paintSync();
      el.append(syncBtn);

      // 2. Trainer mark.
      el.append(heading('Trainer mark'));
      const mark = readTrainerMark();
      if (mark === null) {
        el.append(note('Untouched by the trainer.'));
      } else {
        el.append(note(`Changed by the trainer ${mark.count} times since ${localDate(mark.first)}.`));
        if (mark.what.length > 0) el.append(note(mark.what.slice(-5).join(', ')));
      }
      el.append(note(POLICY));

      // 3. Pre-trainer backup.
      const backup = readTrainerBackup();
      if (backup !== null) {
        el.append(
          confirmButton(
            'Restore pre-trainer backup',
            () => {
              try {
                const res = importSaveBundle(backup);
                if (res.ok) {
                  clearTrainerBackup();
                  st.set('Restored. Reloading...');
                  reloadSoon();
                } else {
                  st.set(`Restore failed: ${res.error}`, true);
                }
              } catch {
                st.set('Restore failed.', true);
              }
            },
            'Puts back the save from before the first trainer change.',
          ),
          button('Download backup', () => {
            downloadText('gta-save-backup.json', backup);
            st.set('Downloaded gta-save-backup.json.');
          }),
        );
      }

      // 4. Export / import.
      el.append(heading('Export / import'));

      const applyImport = (text: string): void => {
        try {
          const res = importSaveBundle(text);
          if (res.ok) {
            st.set(`Imported ${res.keys.length} key(s). Reloading...`);
            reloadSoon();
          } else {
            st.set(`Import failed: ${res.error}`, true);
          }
        } catch {
          st.set('Import failed: storage is blocked.', true);
        }
      };

      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'application/json,.json';
      fileInput.style.display = 'none';
      fileInput.addEventListener('change', async () => {
        const file = fileInput.files?.[0];
        fileInput.value = '';
        if (!file) return;
        applyImport(await file.text());
      });

      // Plain div (no inline display style, so the hidden attribute toggles it).
      const pasteBox = document.createElement('div');
      pasteBox.hidden = true;
      const pasteArea = input({ rows: 5, placeholder: PASTE_PLACEHOLDER });
      const applyPaste = button('Apply pasted JSON', () => applyImport(pasteArea.value), 'Overwrite local save and reload.');
      pasteBox.append(pasteArea, applyPaste);

      el.append(
        grid(
          button('Export save', () => {
            try {
              const json = JSON.stringify(exportSaveBundle(), null, 2);
              downloadText('gta-save.json', json);
              st.set('Exported gta-save.json.');
            } catch {
              st.set('Export failed.', true);
            }
          }, 'Downloads gta-save.json'),
          button('Copy to clipboard', async () => {
            try {
              const json = JSON.stringify(exportSaveBundle(), null, 2);
              if (!navigator.clipboard) throw new Error('no clipboard');
              await navigator.clipboard.writeText(json);
              st.set('Copied.');
            } catch {
              st.set('Clipboard blocked: use Export.', true);
            }
          }),
          button('Import save (file)', () => fileInput.click(), 'Load a gta-save.json file and reload.'),
          button('Paste save JSON', () => {
            pasteBox.hidden = !pasteBox.hidden;
          }, 'Toggle a JSON text box for quick edits.'),
        ),
        fileInput,
        pasteBox,
      );

      // 5. Reset.
      el.append(
        confirmButton(
          'Reset save',
          () => {
            try {
              resetSaveBundle();
              clearTrainerBackup();
              st.set('Save wiped. Reloading...');
              reloadSoon();
            } catch {
              st.set('Reset failed: storage is blocked.', true);
            }
          },
          'Wipe all Turfton progress (and the cloud copy) and reload',
        ),
      );

      // 6. Raw save keys.
      el.append(heading('Raw save keys'), note('Edit one save key as JSON, then reload.'));
      const keySel = select(GTA_SAVE_KEYS.map((k) => ({ value: k, label: k })));
      const area = input({ rows: 8 }) as HTMLTextAreaElement;
      const fill = (key: string): void => {
        let text = '';
        try {
          const raw = localStorage.getItem(key);
          if (raw !== null) {
            try {
              text = JSON.stringify(JSON.parse(raw), null, 2);
            } catch {
              text = raw;
            }
          }
        } catch {
          text = '';
        }
        area.value = text;
      };
      keySel.addEventListener('change', () => fill(keySel.value));
      fill(keySel.value);

      el.append(
        keySel,
        area,
        row(
          null,
          button('Apply & reload', () => {
            const key = keySel.value;
            let parsed: unknown;
            try {
              parsed = JSON.parse(area.value);
            } catch {
              st.set('Not valid JSON.', true);
              return;
            }
            try {
              localStorage.setItem(key, JSON.stringify(parsed));
              markTrainerModified('raw ' + key);
              notifySaveChanged();
              st.set('Saved. Reloading...');
              reloadSoon();
            } catch {
              st.set('Save failed: storage is blocked.', true);
            }
          }),
          confirmButton('Delete key & reload', () => {
            const key = keySel.value;
            try {
              localStorage.removeItem(key);
              markTrainerModified('raw ' + key);
              notifySaveChanged();
              st.set('Deleted. Reloading...');
              reloadSoon();
            } catch {
              st.set('Delete failed: storage is blocked.', true);
            }
          }),
        ),
      );
    },
  });
}
