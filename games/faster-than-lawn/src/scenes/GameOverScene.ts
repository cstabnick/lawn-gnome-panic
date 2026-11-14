import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS, STORAGE_KEY_BEST, type GameOverData, type SfxName } from '../config';
import { resetRun } from '../run';
import { playSfx } from '../audio';
import { makeButton } from '../ui/button';

export interface BestRecord { wins: number; bestJumps: number }

const EMPTY_BEST: BestRecord = { wins: 0, bestJumps: 0 };

function nonNegInt(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0;
}

/** Saved best result. Storage can be blocked or corrupt; then this returns zeros. */
export function loadBest(): BestRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BEST);
    if (!raw) return { ...EMPTY_BEST };
    const parsed = JSON.parse(raw) as Partial<BestRecord> | null;
    return { wins: nonNegInt(parsed?.wins), bestJumps: nonNegInt(parsed?.bestJumps) };
  } catch {
    return { ...EMPTY_BEST };
  }
}

function saveBest(best: BestRecord): void {
  try {
    localStorage.setItem(STORAGE_KEY_BEST, JSON.stringify(best));
  } catch {
    // Storage may be unavailable (private window, blocked site data). The game still works.
  }
}

/** Fold one finished run into the saved best and return the new record. */
function recordResult(result: GameOverData): BestRecord {
  const before = loadBest();
  const after: BestRecord = {
    wins: before.wins + (result.victory ? 1 : 0),
    bestJumps: Math.max(before.bestJumps, nonNegInt(result.jumps)),
  };
  saveBest(after);
  return after;
}

export class GameOverScene extends Phaser.Scene {
  private result: GameOverData = { victory: false, jumps: 0, scrap: 0 };
  private best: BestRecord = { ...EMPTY_BEST };

  constructor() { super(SCENES.gameOver); }

  init(data: GameOverData): void {
    this.result = data ?? { victory: false, jumps: 0, scrap: 0 };
    this.best = recordResult(this.result);
  }

  create(): void {
    const { victory, jumps, scrap } = this.result;
    const sfx: SfxName = victory ? 'win' : 'lose';
    playSfx(sfx);

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.lawnDark).setOrigin(0, 0);
    for (let x = 80; x < GAME_WIDTH; x += 160) {
      this.add.rectangle(x, 0, 80, GAME_HEIGHT, COLORS.lawnLight, 0.5).setOrigin(0, 0);
    }

    this.add.text(GAME_WIDTH / 2, 200, victory ? 'THE GARDEN GATE IS YOURS!' : 'YOUR MOWER IS MULCH', {
      color: victory ? COLORS.accent : COLORS.danger,
      fontSize: '48px',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 300, `Jumps ${jumps}   Scrap ${scrap}`, {
      color: COLORS.text,
      fontSize: '24px',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 360, `Wins ${this.best.wins}   Best jumps ${this.best.bestJumps}`, {
      color: COLORS.textDim,
      fontSize: '20px',
    }).setOrigin(0.5);

    // Input is accepted only after a short delay, so a click that ended the last fight is not repeated here.
    let ready = false;
    const goMap = (): void => {
      if (!ready) return;
      playSfx('click');
      resetRun(this);
      this.scene.start(SCENES.map);
    };
    const goTitle = (): void => {
      if (!ready) return;
      this.scene.start(SCENES.title);
    };

    const onEsc = (): void => goTitle();
    const kb = this.input.keyboard;
    kb?.on('keydown-ESC', onEsc);
    this.events.once('shutdown', () => kb?.off('keydown-ESC', onEsc));

    this.time.delayedCall(400, () => {
      ready = true;
      makeButton(this, GAME_WIDTH / 2, 450, 260, 56, 'Mow again', goMap, 22);
      this.add.text(GAME_WIDTH / 2, 510, 'ESC: title screen', {
        color: COLORS.textDim,
        fontSize: '14px',
      }).setOrigin(0.5);
    });
  }
}
