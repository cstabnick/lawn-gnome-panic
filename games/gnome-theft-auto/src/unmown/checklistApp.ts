// The Unmown checklist as a Gnomlet app (E31): a touch-friendly list of the twelve entries, ticked or not, with the
// rangers' hints. Built inside the tablet screen each time it opens, so it always shows the latest ticks.
import { registerGnomletApp } from '../gnomlet/registry';
import { CHECKLIST, type ChecklistStore, type ChecklistKind } from './checklist';

const KIND_LABEL: Record<ChecklistKind, string> = { bird: 'Bird', animal: 'Animal', plant: 'Plant' };

const CSS = `
.uc-root{display:flex;flex-direction:column;gap:10px;padding:12px;box-sizing:border-box;width:100%;color:#fff;font:500 14px system-ui,sans-serif;overflow-y:auto;-webkit-overflow-scrolling:touch;}
.uc-title{font:700 18px system-ui,sans-serif;margin:0;}
.uc-note{margin:0;opacity:.85;line-height:1.35;}
.uc-bar{height:10px;border-radius:5px;background:rgba(255,255,255,.18);overflow:hidden;}
.uc-fill{height:100%;background:#7fd16a;border-radius:5px;}
.uc-count{font:600 13px system-ui,sans-serif;opacity:.9;}
.uc-list{display:flex;flex-direction:column;gap:6px;}
.uc-row{display:flex;align-items:flex-start;gap:10px;min-height:44px;padding:8px 10px;box-sizing:border-box;border-radius:10px;background:rgba(255,255,255,.08);}
.uc-row.uc-done{opacity:.55;background:rgba(127,209,106,.12);}
.uc-box{flex:0 0 22px;width:22px;height:22px;margin-top:1px;border:2px solid #fff;border-radius:5px;box-sizing:border-box;text-align:center;line-height:18px;font-weight:700;}
.uc-done .uc-box{background:#7fd16a;border-color:#7fd16a;color:#14331a;}
.uc-text{flex:1;min-width:0;}
.uc-name{font-weight:700;}
.uc-kind{font-size:11px;text-transform:uppercase;letter-spacing:.06em;opacity:.7;margin-left:6px;}
.uc-hint{font-size:12px;opacity:.8;margin-top:2px;line-height:1.35;}
`;

/** Registers the 'unmown-checklist' Gnomlet app (group 'journals'). Called once from living/runtime.ts. */
export function registerChecklistApp(store: ChecklistStore): void {
  registerGnomletApp({
    id: 'unmown-checklist',
    label: 'Unmown Checklist',
    icon: '🦆',
    group: 'journals',
    detail: () => `${store.seen().size}/${CHECKLIST.length} ticked`,
    open(root) {
      const seen = store.seen();
      const n = CHECKLIST.filter((e) => seen.has(e.id)).length;
      const total = CHECKLIST.length;

      const style = document.createElement('style');
      style.textContent = CSS;

      const wrap = document.createElement('div');
      wrap.className = 'uc-root';

      const title = document.createElement('h2');
      title.className = 'uc-title';
      title.textContent = 'Spot the Species — the Unmown';

      const note = document.createElement('p');
      note.className = 'uc-note';
      note.textContent = 'Look, don\'t mow. Ticks happen by themselves when you see something; birds count once they are in your binocular journal.';

      const bar = document.createElement('div');
      bar.className = 'uc-bar';
      const fill = document.createElement('div');
      fill.className = 'uc-fill';
      fill.style.width = `${Math.round((n / total) * 100)}%`;
      bar.append(fill);

      const count = document.createElement('div');
      count.className = 'uc-count';
      count.textContent = `${n} of ${total} spotted`;

      const list = document.createElement('div');
      list.className = 'uc-list';
      for (const e of CHECKLIST) {
        const done = seen.has(e.id);
        const row = document.createElement('div');
        row.className = 'uc-row' + (done ? ' uc-done' : '');

        const box = document.createElement('div');
        box.className = 'uc-box';
        box.textContent = done ? '✓' : '';
        box.setAttribute('aria-hidden', 'true');

        const text = document.createElement('div');
        text.className = 'uc-text';
        const name = document.createElement('span');
        name.className = 'uc-name';
        name.textContent = e.name;
        const kind = document.createElement('span');
        kind.className = 'uc-kind';
        kind.textContent = KIND_LABEL[e.kind];
        const hint = document.createElement('div');
        hint.className = 'uc-hint';
        hint.textContent = e.hint;
        text.append(name, kind, hint);

        row.append(box, text);
        list.append(row);
      }

      wrap.append(title, note, bar, count, list);
      root.replaceChildren(style, wrap);
    },
  });
}
