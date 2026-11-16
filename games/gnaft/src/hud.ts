// HUD: title screen, inventory and tool readout, mode hints, crosshair, toasts and the craft menu.
// All DOM is appended to ctx.ui; #ui itself is never restyled.
import {
  BUILD_COSTS, DAY, ITEM_IDS, ITEMS, KEYS, RECIPES, RECIPE_ORDER, TOOLS,
  type Ctx, type ItemId, type RecipeId, type System,
} from './config';
import { costText, craft, hasItems, nightAmount } from './rules';
import { sfx, startAudio } from './audio';

const TEXT = 'color:#fff;text-shadow:0 1px 3px #000;font-family:system-ui,sans-serif;';
const PANEL = 'background:rgba(10,30,45,0.75);border-radius:10px;padding:8px 12px;';
const TOAST_SECONDS = 3.5;
const TOAST_FADE_SECONDS = 0.8;
const TOAST_MAX = 5;
const CRAFT_REFRESH_SECONDS = 0.2;
const COST_RED = '#ff5252';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, css: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.style.cssText = css;
  if (text !== undefined) e.textContent = text;
  return e;
}

/** Sets display only when it actually changes. */
function setShown(node: HTMLElement, shown: boolean): void {
  const v = shown ? '' : 'none';
  if (node.style.display !== v) node.style.display = v;
}

/** Sets text only when it actually changes. */
function setText(node: HTMLElement, text: string): void {
  if (node.textContent !== text) node.textContent = text;
}

interface Toast { el: HTMLElement; age: number }

interface CraftCard {
  id: RecipeId;
  costs: { item: ItemId; amount: number; span: HTMLElement }[];
  button: HTMLButtonElement;
}

export function createHud(ctx: Ctx): System {
  const { state, input, ui } = ctx;

  // ------------------------------------------------------------ title overlay
  const title = el(
    'div',
    `position:absolute;inset:0;pointer-events:auto;box-sizing:border-box;padding:16px;` +
      `background:rgba(10,40,70,0.88);display:flex;flex-direction:column;align-items:center;` +
      `justify-content:center;gap:14px;text-align:center;${TEXT}`,
  );
  const titleText = el('h1', 'margin:0;font-size:56px;letter-spacing:3px;', 'GNAFT');
  const tagline = el(
    'p',
    'margin:0;font-size:18px;max-width:560px;',
    'Adrift on a patch of grass. Fish junk, grow your lawn-boat, find the islands.',
  );
  const controlLines = [
    'WASD + mouse: move / look',
    'Space: jump',
    'LMB hold + release: throw hook, hold: reel',
    'E: grab nearby junk / cut grass / open crate',
    'Walk off the edge to swim',
    'Q: switch mower',
    'B: build',
    'Tab: craft',
    'T: telescope',
    'C: chart course / cast off',
    'Shift: sprint',
    'Mouse wheel: zoom',
    'F: bonk a shark or seagull',
    'R in build mode: turf / seeded dirt / sprinkler / flamingo',
    'M: music on/off',
  ];
  const controls = el('ul', 'margin:0;padding:0;list-style:none;font-size:15px;line-height:1.6;');
  for (const line of controlLines) controls.append(el('li', '', line));
  // A save was loaded when the HUD is created if game time has already advanced.
  const hasSave = state.time > 0;
  const startButton = el(
    'button',
    `pointer-events:auto;${TEXT}font-size:20px;margin-top:8px;padding:10px 28px;cursor:pointer;` +
      'border:2px solid #fff;border-radius:10px;background:rgba(47,143,196,0.9);',
    hasSave ? 'Continue' : 'Click to start',
  );
  startButton.onclick = () => {
    state.mode = 'play';
    startAudio();
    sfx('click');
    input.requestLock();
    title.remove();
  };
  title.append(titleText, tagline, controls, startButton);

  // ------------------------------------------------------------ HUD root
  const hud = el('div', `position:absolute;inset:0;pointer-events:none;display:none;${TEXT}`);

  const invBox = el('div', `position:absolute;left:12px;bottom:12px;min-width:180px;${PANEL}${TEXT}`);
  const clockLine = el('div', 'margin-bottom:6px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.2);');
  invBox.append(clockLine);
  const itemRows = {} as Record<ItemId, HTMLElement>;
  for (const id of ITEM_IDS) {
    const row = el('div', '');
    itemRows[id] = row;
    invBox.append(row);
  }
  const toolLine = el('div', 'margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.2);');
  const telescopeLine = el('div', '', '🔭 Telescope');
  const raftLine = el('div', '');
  invBox.append(toolLine, telescopeLine, raftLine);

  const hint = el(
    'div',
    'position:absolute;left:50%;bottom:24px;transform:translateX(-50%);white-space:nowrap;font-size:15px;',
  );

  const crosshair = el(
    'div',
    'position:absolute;left:50%;top:50%;width:6px;height:6px;margin:-3px 0 0 -3px;border-radius:50%;background:#fff;',
  );

  const lookNote = el(
    'div',
    'position:absolute;left:50%;top:62%;transform:translateX(-50%);white-space:nowrap;font-size:18px;',
    'Click to look around',
  );

  const toastBox = el('div', 'position:absolute;left:12px;top:70px;display:flex;flex-direction:column;gap:6px;max-width:360px;');

  hud.append(invBox, hint, crosshair, lookNote, toastBox);

  // ------------------------------------------------------------ craft menu
  const craftPanel = el(
    'div',
    `position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);pointer-events:auto;display:none;` +
      `box-sizing:border-box;width:min(640px,calc(100% - 32px));max-height:calc(100% - 32px);overflow:auto;` +
      `${PANEL}padding:14px 16px;${TEXT}`,
  );
  const craftHeader = el('div', 'display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;');
  craftHeader.append(el('div', 'font-size:22px;font-weight:bold;', 'Craft'));
  const closeButton = el(
    'button',
    `pointer-events:auto;${TEXT}font-size:14px;padding:6px 12px;cursor:pointer;` +
      'border:2px solid #fff;border-radius:8px;background:rgba(10,30,45,0.9);',
    'Close (Tab)',
  );
  closeButton.onclick = () => {
    state.mode = 'play';
  };
  craftHeader.append(closeButton);

  const grid = el('div', 'display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;');
  const cards: CraftCard[] = [];

  function refreshCraft(): void {
    for (const card of cards) {
      const id = card.id;
      const owned = id === 'telescope' ? state.hasTelescope : state.tools[id];
      for (const c of card.costs) {
        const color = state.inv[c.item] < c.amount ? COST_RED : '#fff';
        if (c.span.style.color !== color) c.span.style.color = color;
      }
      const disabled = owned || !hasItems(state, RECIPES[id].cost);
      setText(card.button, owned ? 'Owned' : 'Craft');
      card.button.disabled = disabled;
      const opacity = disabled ? '0.5' : '1';
      if (card.button.style.opacity !== opacity) card.button.style.opacity = opacity;
      const cursor = disabled ? 'default' : 'pointer';
      if (card.button.style.cursor !== cursor) card.button.style.cursor = cursor;
    }
  }

  for (const id of RECIPE_ORDER) {
    const recipe = RECIPES[id];
    const card = el(
      'div',
      'background:rgba(20,50,75,0.85);border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:6px;',
    );
    card.append(el('div', 'font-weight:bold;font-size:17px;', recipe.name));
    card.append(el('div', 'font-size:13px;opacity:0.9;', recipe.desc));

    const costLine = el('div', 'font-size:14px;line-height:1.5;');
    const costs: CraftCard['costs'] = [];
    let first = true;
    for (const item of ITEM_IDS) {
      const amount = recipe.cost[item];
      if (!amount) continue;
      const span = el('span', '', `${amount} ${ITEMS[item].name}`);
      if (!first) costLine.append(', ');
      first = false;
      costLine.append(span);
      costs.push({ item, amount, span });
    }
    card.append(costLine);

    const button = el(
      'button',
      `pointer-events:auto;${TEXT}font-size:15px;margin-top:auto;padding:6px 10px;cursor:pointer;` +
        'border:2px solid #fff;border-radius:8px;background:rgba(47,143,196,0.9);',
      'Craft',
    );
    button.onclick = () => {
      if (craft(state, id)) sfx('craft');
      else sfx('error');
      refreshCraft();
    };
    card.append(button);

    grid.append(card);
    cards.push({ id, costs, button });
  }

  craftPanel.append(craftHeader, grid);
  title.id = 'rg-title';
  hud.id = 'rg-hud';
  craftPanel.id = 'rg-craft';
  ui.append(title, hud, craftPanel);

  // ------------------------------------------------------------ per-frame state
  let toasts: Toast[] = [];
  let craftTimer = 0;
  let wasCrafting = false;

  let lastClockKey = '';

  /** Clock line: day number, hh:mm (dayTime 0 = 06:00), weather and night icon. */
  function updateClock(): void {
    const hours = (6 + state.dayTime * 24) % 24;
    const hh = Math.floor(hours);
    const mm = Math.floor((hours - hh) * 60);
    const day = Math.floor((state.time + DAY.startTime * DAY.lengthSeconds) / DAY.lengthSeconds) + 1;
    const night = nightAmount(state) > 0.5;
    const icon = state.raining ? '🌧️' : night ? '🌙' : '☀️';
    const key = `${day}|${hh}|${mm}|${icon}|${state.raining}`;
    if (key === lastClockKey) return;
    lastClockKey = key;
    const time = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    const rain = state.raining ? ' · Rain: grass x2' : '';
    setText(clockLine, `${icon} Day ${day} · ${time}${rain}`);
  }

  function updateInventory(): void {
    updateClock();
    for (const id of ITEM_IDS) {
      const n = state.inv[id];
      const row = itemRows[id];
      setShown(row, id === 'grass' || n > 0);
      const value = id === 'fuel' ? n.toFixed(1) : String(Math.floor(n));
      setText(row, `${ITEMS[id].icon} ${ITEMS[id].name} ${value}`);
    }
    setText(toolLine, `Tool: ${TOOLS[state.equipped].name}`);
    setShown(telescopeLine, state.hasTelescope);
    setText(raftLine, `Raft: ${state.tiles.size} tiles`);
  }

  function hintText(): string {
    switch (state.mode) {
      case 'play':
        return 'LMB fish · E grab/cut · F bonk · B build · Tab craft · Q tool · T telescope';
      case 'build': {
        const def = BUILD_COSTS[state.buildKind];
        return `Building ${def.name} (${costText(def.cost)}) · R switch · RMB remove · B exit`;
      }
      case 'craft':
        return 'Tab to close';
      default:
        return '';
    }
  }

  function updateToasts(dt: number): void {
    for (const m of state.messages.splice(0)) {
      const t = el('div', `${PANEL}${TEXT}font-size:14px;`, m);
      toastBox.append(t);
      toasts.push({ el: t, age: 0 });
    }
    while (toasts.length > TOAST_MAX) toasts.shift()!.el.remove();

    const alive: Toast[] = [];
    for (const t of toasts) {
      t.age += dt;
      if (t.age >= TOAST_SECONDS) {
        t.el.remove();
        continue;
      }
      const opacity = Math.min(1, (TOAST_SECONDS - t.age) / TOAST_FADE_SECONDS).toFixed(2);
      if (t.el.style.opacity !== opacity) t.el.style.opacity = opacity;
      alive.push(t);
    }
    toasts = alive;
  }

  return {
    update(dt: number) {
      // Mode switches: open with Tab from play, close with Tab or Escape from craft.
      if (state.mode === 'play' && input.pressed(KEYS.craft)) {
        state.mode = 'craft';
        input.exitLock();
      } else if (state.mode === 'craft' && (input.pressed(KEYS.craft) || input.pressed('Escape'))) {
        state.mode = 'play';
      }

      const crafting = state.mode === 'craft';
      // Co-op can start the game without the start button (joining a friend's raft).
      if (state.mode !== 'title' && title.isConnected) title.remove();
      setShown(hud, state.mode !== 'title');
      setShown(craftPanel, crafting);
      if (crafting && !wasCrafting) {
        craftTimer = 0;
        refreshCraft();
      }
      wasCrafting = crafting;
      if (crafting) {
        craftTimer -= dt;
        if (craftTimer <= 0) {
          craftTimer = CRAFT_REFRESH_SECONDS;
          refreshCraft();
        }
      }

      updateInventory();
      const hintNow = hintText();
      setText(hint, hintNow);
      setShown(hint, hintNow !== '');

      const building = state.mode === 'play' || state.mode === 'build';
      setShown(crosshair, building);
      setShown(lookNote, building && !input.locked());

      updateToasts(dt);
    },
  };
}
