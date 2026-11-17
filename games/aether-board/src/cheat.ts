// Rolling-buffer cheat code matcher for menu keyboard input.
export const DENSHATTACK_CODE = 'denshattack';

export interface CheatBuffer {
  /** Feeds one key string (e.g. KeyboardEvent.key). Returns true when the code completes. */
  feed(key: string): boolean;
  reset(): void;
}

export function createCheatBuffer(code: string, onTrigger: () => void): CheatBuffer {
  const target = code.toLowerCase();
  let buf = '';
  return {
    feed(key: string): boolean {
      if (key.length !== 1) return false;
      buf = (buf + key.toLowerCase()).slice(-target.length);
      if (buf === target) {
        buf = '';
        onTrigger();
        return true;
      }
      return false;
    },
    reset(): void {
      buf = '';
    },
  };
}
