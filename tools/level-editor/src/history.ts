import type { Emitter, History, HistoryEntry } from './context';

export function createEmitter<T>(): Emitter<T> {
  const fns = new Set<(v: T) => void>();
  return {
    on(fn) {
      fns.add(fn);
      return () => { fns.delete(fn); };
    },
    emit(v) {
      for (const fn of [...fns]) fn(v);
    },
  };
}

const LIMIT = 200;

export function createHistory(): History {
  const undos: HistoryEntry[] = [];
  const redos: HistoryEntry[] = [];
  const onChange = createEmitter<void>();
  return {
    push(e) {
      undos.push(e);
      if (undos.length > LIMIT) undos.shift();
      redos.length = 0;
      onChange.emit();
    },
    undo() {
      const e = undos.pop();
      if (!e) return;
      e.undo();
      redos.push(e);
      onChange.emit();
    },
    redo() {
      const e = redos.pop();
      if (!e) return;
      e.redo();
      undos.push(e);
      onChange.emit();
    },
    get canUndo() { return undos.length > 0; },
    get canRedo() { return redos.length > 0; },
    get nextUndo() { return undos.length ? undos[undos.length - 1].label : ''; },
    onChange,
  };
}
