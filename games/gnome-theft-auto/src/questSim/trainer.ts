// Quest sim: the Save Trainer's 'Quest sim' tab (order 75). Pick a quest (and ending), tick cheats, and play it with the
// bot through the real game (browser.ts). Import-light: the browser layer loads only when a button is pressed.
import { QUESTS, questById } from '../quests/defs';
import { registerTrainerSection } from '../trainer/registry';
import type { TrainerCtx } from '../trainer/types';
import { button, grid, heading, note, row, select, status } from '../trainer/ui';
import type { QuestSimApi } from './browser';
import { QUEST_PLANS } from './plans';
import { ALL_CHEATS, CHEAT_IDS } from './types';
import type { CheatId, Cheats, QuestResult } from './types';

const CHEAT_KEY = 'gta-questsim-cheats';

const CHEAT_LABELS: Record<CheatId, string> = {
  infiniteAmmo: 'Infinite water',
  godMode: 'God mode',
  noHeat: 'No heat',
  instantTravel: 'Instant travel',
  skipCutscenes: 'Skip cutscenes',
  freeAcorns: 'Free Acorns',
  noWanted: 'No wanted level',
  unlockAllItems: 'All items unlocked',
  fastClock: 'Fast clock',
  vehicleRepair: 'Vehicle repair',
};

const RESULT_TEXT: Record<QuestResult['status'], string> = { pass: 'PASS', fail: 'FAIL', blocked: 'BLOCKED' };
const RESULT_COLOR: Record<QuestResult['status'], string> = { pass: '#8fff9a', fail: '#ff7a7a', blocked: '#ffd23f' };

/** The runs for one chapter's 'Play chapter': every story plan of chapter n in table order, both endings for variant quests. */
export function chapterRuns(n: number): { questId: string; variant?: 'A' | 'B' }[] {
  const runs: { questId: string; variant?: 'A' | 'B' }[] = [];
  // Story order (E20: rows live in quests/story/, so plan key order is not play order).
  const order = (id: string): number => QUESTS.findIndex((q) => q.id === id);
  const plans = Object.entries(QUEST_PLANS).sort((a, b) => order(a[0]) - order(b[0]));
  for (const [questId, plan] of plans) {
    if (plan.suite !== 'story' || questById(questId)?.chapter !== n) continue;
    if (plan.variants) for (const variant of plan.variants) runs.push({ questId, variant });
    else runs.push({ questId });
  }
  return runs;
}

/** The cheats as last ticked (localStorage); every read is guarded, so a blocked store just keeps the defaults. */
function loadCheats(): Cheats {
  const cheats: Cheats = { ...ALL_CHEATS };
  try {
    const raw = localStorage.getItem(CHEAT_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<Record<CheatId, unknown>>;
      for (const id of CHEAT_IDS) {
        const v = saved[id];
        if (typeof v === 'boolean') cheats[id] = v;
      }
    }
  } catch {
    // Corrupt or blocked storage: keep the defaults.
  }
  return cheats;
}

function saveCheats(cheats: Cheats): void {
  try {
    localStorage.setItem(CHEAT_KEY, JSON.stringify(cheats));
  } catch {
    // Blocked storage: the ticks just do not persist.
  }
}

/** The sim is mounted on first use only (it installs window.__questSim); later calls reuse it. */
let mounting: Promise<QuestSimApi> | null = null;
let mounted: QuestSimApi | null = null;

function getApi(ctx: TrainerCtx): Promise<QuestSimApi> {
  if (!mounting) {
    mounting = import('./browser').then((m) => {
      mounted = m.mountQuestSim(ctx);
      return mounted;
    });
  }
  return mounting;
}

function errorText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function build(el: HTMLElement, ctx: TrainerCtx): void {
  const cheats = loadCheats();
  const progress = status();
  const message = status();

  // Quest and ending. The ending select shows only for quests that have both endings.
  const questSel = select(Object.keys(QUEST_PLANS).map((id) => ({
    value: id,
    label: `${questById(id)?.title ?? id} (${id})`,
  })));
  const endingSel = select([{ value: 'A', label: 'Ending A' }, { value: 'B', label: 'Ending B' }]);
  const endingRow = row('Ending', endingSel);
  const syncEnding = (): void => {
    endingRow.style.display = QUEST_PLANS[questSel.value]?.variants ? '' : 'none';
  };
  questSel.addEventListener('change', syncEnding);
  syncEnding();

  // Cheats, one 44 px row each, remembered between visits.
  const cheatRows = CHEAT_IDS.map((id) => {
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = cheats[id];
    box.addEventListener('change', () => {
      cheats[id] = box.checked;
      saveCheats(cheats);
    });
    const label = document.createElement('label');
    label.style.cssText = 'display:flex;align-items:center;gap:8px;min-height:44px;font-weight:600;';
    label.append(box, CHEAT_LABELS[id]);
    return label;
  });

  // The results table: last 12 runs, rebuilt only when they change.
  const table = document.createElement('table');
  table.style.cssText = 'width:100%;border-collapse:collapse;font-size:12px;margin-top:4px;';
  let lastKey = '';

  const renderResults = (results: QuestResult[]): void => {
    const key = results.map((r) => `${r.questId}|${r.variant ?? ''}|${r.status}|${r.reason}`).join(';');
    if (key === lastKey) return;
    lastKey = key;
    const head = document.createElement('tr');
    for (const h of ['Quest', 'Ending', 'Result', 'Reason']) {
      const th = document.createElement('th');
      th.style.cssText = 'text-align:left;padding:4px;border-bottom:1px solid rgba(255,255,255,.25);';
      th.textContent = h;
      head.append(th);
    }
    const rows = results.map((r) => {
      const tr = document.createElement('tr');
      const cells: [string, string?][] = [
        [questById(r.questId)?.title ?? r.questId],
        [r.variant ?? '-'],
        [RESULT_TEXT[r.status], RESULT_COLOR[r.status]],
        [r.reason],
      ];
      for (const [text, color] of cells) {
        const td = document.createElement('td');
        td.style.cssText = 'padding:4px;vertical-align:top;border-bottom:1px solid rgba(255,255,255,.1);';
        td.textContent = text;
        if (color) td.style.color = color;
        tr.append(td);
      }
      return tr;
    });
    table.replaceChildren(head, ...rows);
  };

  const refresh = (): void => {
    if (!mounted) return;
    const s = mounted.status();
    progress.set(s.line || (s.running ? 'Running...' : 'Idle.'));
    renderResults(mounted.results().slice(-12));
  };

  // Mounts the sim on first use, shows the busy line, runs `go`, then shows its outcome and refreshes the progress.
  const perform = (busy: string, go: (api: QuestSimApi) => Promise<void>): void => {
    message.set(busy);
    void getApi(ctx)
      .then(go)
      .catch((e: unknown) => message.set(errorText(e), true))
      .finally(refresh);
  };

  const chapterSel = select([1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `Chapter ${n}` })));

  el.append(
    heading('Quest bot'),
    note('Plays a quest through the real game. Cheats only for travel, health, heat, money and cutscenes. '
      + 'A run may reload the page once.'),
    row('Quest', questSel),
    endingRow,
    heading('Cheats'),
    ...cheatRows,
    heading('Play'),
    grid(
      button('Play this quest with the bot', () => {
        const questId = questSel.value;
        const variant = QUEST_PLANS[questId]?.variants ? (endingSel.value as 'A' | 'B') : undefined;
        perform('Starting the quest...', async (api) => {
          const r = await api.run(questId, { variant, cheats: { ...cheats } });
          const tail = r.reason ? `: ${r.reason}` : '';
          message.set(`${RESULT_TEXT[r.status]} ${r.title}${tail}`, r.status !== 'pass');
        });
      }),
    ),
    row(
      'Chapter',
      chapterSel,
      button('Play chapter', () => {
        const n = Number(chapterSel.value);
        perform(`Queueing chapter ${n}...`, async (api) => {
          const results = await api.queue(chapterRuns(n), { ...cheats });
          const passed = results.filter((r) => r.status === 'pass').length;
          message.set(`Chapter ${n}: ${passed} of ${results.length} passed`, passed < results.length);
        });
      }),
    ),
    row(null, button('Stop', () => {
      if (!mounted) {
        message.set('Nothing is running.');
        return;
      }
      mounted.stop();
      message.set('Stopping at the next step...');
    })),
    progress.el,
    message.el,
    table,
  );

  refresh();
  // Keep the progress live while the tab is on screen; stop once the panel rebuilds or closes the container.
  const timer = window.setInterval(() => {
    if (!el.isConnected) {
      window.clearInterval(timer);
      return;
    }
    refresh();
  }, 500);
}

export function registerQuestSimSection(): void {
  registerTrainerSection({
    id: 'quest-sim',
    label: 'Quest sim',
    order: 75,
    build,
  });
}
