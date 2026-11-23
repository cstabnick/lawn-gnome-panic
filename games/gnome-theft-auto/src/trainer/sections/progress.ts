// The Character tab's save-backed editors: the story and quests (quest save), and hunting (the hunting save). Each action
// edits the save with the pure functions in progressEdit.ts, writes it back to localStorage, marks the trainer as used,
// tells the save hook, then reloads so every system reads the new save.
import { cloudPaused, cloudSignedIn } from '../../cloudSave';
import { SAVE_KEY } from '../../quests/quests';
import { parseSavesJson } from '../../quests/questSave';
import { QUESTS } from '../../quests/defs';
import { HUNT_KEY, parseHuntSave } from '../../hunting/huntSave';
import type { HuntSaveData } from '../../hunting/huntSave';
import { SPECIES } from '../../hunting/species';
import { notifySaveChanged } from '../../saveHook';
import { markTrainerModified } from '../mark';
import {
  clearJournal,
  completeQuest,
  emptyBag,
  fillJournal,
  questState,
  resetQuest,
  setLicensed,
  storyStartAt,
  storyStartOfChapter,
  type Saves,
} from '../progressEdit';
import type { TrainerCtx } from '../types';
import { button, confirmButton, grid, heading, note, row, select, status, reloadSoon } from '../ui';

/** Reads a save key; null when storage throws (private windows, blocked site data). */
function readKey(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Writes a save key and reports the outcome; false (with a reason) when storage refuses. */
function writeKey(key: string, value: string): string | null {
  try {
    localStorage.setItem(key, value);
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : 'storage is not available';
  }
}

const CHAPTERS = [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `Chapter ${n}` }));
const ALL_DONE = '6';

/** Quests and story chapter: set / reset in the quest save, then reload. */
export function buildStoryEditor(el: HTMLElement, _ctx: TrainerCtx): void {
  const st = status();
  const applyQuests = (edit: (saves: Saves) => Saves, what: string): void => {
    const next = edit(parseSavesJson(readKey(SAVE_KEY)));
    const err = writeKey(SAVE_KEY, JSON.stringify(next));
    if (err) {
      st.set('Could not save: ' + err, true);
      return;
    }
    markTrainerModified('quests: ' + what);
    notifySaveChanged();
    st.set('Saved. Reloading...');
    reloadSoon();
  };

  el.append(heading('Story & quests'));
  el.append(note('Changes rewrite the quest save and reload the game.'));
  if (cloudSignedIn() && !cloudPaused()) {
    el.append(note('Signed in: the cloud keeps the furthest quest progress, so a rewind comes back. Pause cloud sync in the Save tab first.'));
  }

  const chapterSel = select([...CHAPTERS, { value: ALL_DONE, label: 'All done' }], '1');
  el.append(
    row(
      'Start of chapter',
      chapterSel,
      button('Go', () => {
        const n = Number(chapterSel.value);
        const label = n === Number(ALL_DONE) ? 'all story done' : `start of chapter ${n}`;
        applyQuests((s) => storyStartOfChapter(s, QUESTS, n), label);
      }),
    ),
  );

  const questSaves = parseSavesJson(readKey(SAVE_KEY));
  const questOptions = QUESTS.map((q) => {
    const state = questState(questSaves, q.id);
    const tag = q.chapter !== undefined ? `[ch ${q.chapter}] ` : '[side] ';
    const suffix = state === 'none' ? '' : ` (${state})`;
    return { value: q.id, label: `${tag}${q.title}${suffix}` };
  });
  const questSel = select(questOptions, QUESTS[0]?.id);
  const picked = () => QUESTS.find((q) => q.id === questSel.value);

  el.append(row('Quest', questSel));
  el.append(
    grid(
      button('Start story here', () => {
        const q = picked();
        if (!q) return;
        if (q.chapter === undefined) {
          st.set('Only story quests can be started from here.', true);
          return;
        }
        applyQuests((s) => storyStartAt(s, QUESTS, q.id), `start at ${q.id}`);
      }),
      button('Complete', () => {
        const q = picked();
        if (!q) return;
        applyQuests((s) => completeQuest(s, q), `complete ${q.id}`);
      }),
      button('Reset', () => {
        const q = picked();
        if (!q) return;
        applyQuests((s) => resetQuest(s, q.id), `reset ${q.id}`);
      }),
    ),
  );

  el.append(heading('Reset everything'));
  el.append(
    row(
      null,
      confirmButton('Reset all quests', () => applyQuests(() => ({}), 'reset all'), 'Removes every quest entry'),
    ),
  );
  el.append(st.el);
}

function parseHunt(): HuntSaveData {
  return parseHuntSave(readKey(HUNT_KEY));
}

/** Tuft License, species journal and game bag: set / reset in the hunting save, then reload. */
export function buildHuntEditor(el: HTMLElement, _ctx: TrainerCtx): void {
  const st = status();
  const applyHunt = (edit: (d: HuntSaveData) => HuntSaveData, what: string): void => {
    const next = edit(parseHunt());
    const err = writeKey(HUNT_KEY, JSON.stringify(next));
    if (err) {
      st.set('Could not save: ' + err, true);
      return;
    }
    markTrainerModified('hunting: ' + what);
    notifySaveChanged();
    st.set('Saved. Reloading...');
    reloadSoon();
  };

  const d = parseHunt();
  const bagCount = Object.values(d.bag).reduce((sum, n) => sum + n, 0);
  const journalCount = SPECIES.filter((s) => d.journal[s.id] !== undefined).length;

  el.append(heading('Hunting'));
  el.append(
    note(
      `Tuft License: ${d.licensed ? 'yes' : 'no'}. Species in journal: ${journalCount} / ${SPECIES.length}. Items in bag: ${bagCount}.`,
    ),
  );

  const licOn = button('License on', () => applyHunt((h) => setLicensed(h, true), 'license on'));
  const licOff = button('License off', () => applyHunt((h) => setLicensed(h, false), 'license off'));
  licOn.classList.toggle('on', d.licensed);
  licOff.classList.toggle('on', !d.licensed);
  el.append(grid(licOn, licOff));

  el.append(
    grid(
      button('Fill species journal', () => {
        const today = new Date().toISOString().slice(0, 10);
        applyHunt((h) => fillJournal(h, SPECIES.map((s) => s.id), today), 'fill journal');
      }),
      confirmButton('Clear species journal', () => applyHunt(clearJournal, 'clear journal')),
      button('Empty game bag', () => applyHunt(emptyBag, 'empty bag')),
    ),
  );
  el.append(st.el);
}
