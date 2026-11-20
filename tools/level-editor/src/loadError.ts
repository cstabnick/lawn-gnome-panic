/** Pure helpers for the banner shown when the game's content fails to load (see main.ts). */

const HEADER = 'content packs failed to load:';

/** The problem lines in a load error: empty lines and the leading header dropped, the first `max` kept. */
export function loadErrorLines(err: unknown, max = 10): { lines: string[]; more: number } {
  const message = err instanceof Error ? err.message : String(err);
  let lines = message.split('\n').filter((l) => l.trim() !== '');
  if (lines[0] === HEADER) lines = lines.slice(1);
  return { lines: lines.slice(0, max), more: Math.max(0, lines.length - max) };
}

/** Shows the fixed load-error banner (styled by #le-loaderror in style.css) and logs the error. */
export function showLoadError(err: unknown, doc: Document = document): HTMLElement {
  console.error(err);
  const { lines, more } = loadErrorLines(err);
  const el = doc.createElement('div');
  el.id = 'le-loaderror';

  const heading = doc.createElement('h2');
  heading.textContent = "The editor could not load the game's content.";
  const list = doc.createElement('ul');
  for (const line of lines) {
    const li = doc.createElement('li');
    li.textContent = line;
    list.append(li);
  }
  el.append(heading, list);

  if (more > 0) {
    const cut = doc.createElement('p');
    cut.textContent = `and ${more} more (see the terminal)`;
    el.append(cut);
  }
  const fix = doc.createElement('p');
  fix.textContent = 'Fix the content, then restart the editor server (npm run level-editor): a running server keeps the old modules.';
  el.append(fix);

  doc.body.append(el);
  return el;
}
