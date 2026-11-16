import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS, TUNING } from '../config';
import type { CombatSceneData, GameOverData, SfxName } from '../config';
import { getRun } from '../run';
import type { RunState } from '../run';
import { CombatView } from '../render/combatView';
import { CombatHud } from '../ui/combatHud';
import { makeButton } from '../ui/button';
import { playSfx } from '../audio';
import { playRunMusic, setBattleMusic } from '../music';
import { aliveCrew, jumpReady } from '../sim/queries';
import { createCombat, jumpAway, moveCrew, setSystemPower, setWeaponTarget, stepCombat, toggleWeaponPower } from '../sim/combat';
import { createEnemyBrain, stepEnemyAI } from '../sim/ai';
import type { EnemyBrain } from '../sim/ai';
import { makeEnemyShip, cleanUpAfterCombat } from '../sim/ships';
import type { CombatState, Side, SystemId } from '../sim/types';

const DEFAULT_DATA: CombatSceneData = { tier: 1, isBoss: false };
const PANEL_DEPTH = 40;

// Scene key SCENES.combat. Scenes are restarted, so every field is reset in create().
export class CombatScene extends Phaser.Scene {
  private sceneData!: CombatSceneData;
  private run!: RunState;
  private state!: CombatState;
  private brain!: EnemyBrain;
  private view!: CombatView;
  private hud!: CombatHud;
  private paused!: boolean;
  private aimingWeapon!: number | null;
  private selectedCrewId!: number | null;
  private ended!: boolean;

  constructor() { super(SCENES.combat); }

  init(data: CombatSceneData): void {
    this.sceneData = data ?? DEFAULT_DATA;
  }

  create(): void {
    this.run = getRun(this);
    playRunMusic(this.run.musicSeed);
    setBattleMusic(true);
    const enemy = makeEnemyShip(this.sceneData.tier, Math.random, this.sceneData.isBoss);
    this.state = createCombat(this.run.ship, enemy);
    this.brain = createEnemyBrain();
    this.view = new CombatView(this, this.state);
    this.paused = false;
    this.aimingWeapon = null;
    this.selectedCrewId = this.run.ship.crew[0]?.id ?? null;
    this.ended = false;

    this.view.onRoomClicked = (side, roomId) => this.onRoomClicked(side, roomId);
    this.view.onCrewClicked = (side, crewId) => {
      if (side === 'player') this.selectCrew(crewId);
    };
    this.view.setSelectedCrew(this.selectedCrewId);

    this.hud = new CombatHud(this, this.state, {
      onSystemPower: (id: Exclude<SystemId, 'weapons'>, delta: 1 | -1) => {
        const sys = this.state.player.systems[id];
        setSystemPower(this.state.player, id, sys.power + delta);
        playSfx('click');
      },
      onWeaponToggle: (index) => { toggleWeaponPower(this.state.player, index); },
      onWeaponAim: (index) => {
        this.aimingWeapon = index;
        this.view.setTargeting(true);
      },
      onCrewSelect: (crewId) => this.selectCrew(crewId),
      onJump: () => { jumpAway(this.state); },
    });

    const kb = this.input.keyboard!;
    const onSpace = (): void => { this.paused = !this.paused; };
    const onEsc = (): void => this.cancelAim();
    const weaponKeys = ['keydown-ONE', 'keydown-TWO', 'keydown-THREE', 'keydown-FOUR'] as const;
    const onWeaponKey = (index: number) => (): void => {
      if (index < this.state.player.weapons.length) {
        this.aimingWeapon = index;
        this.view.setTargeting(true);
      }
    };
    kb.on('keydown-SPACE', onSpace);
    kb.on('keydown-ESC', onEsc);
    weaponKeys.forEach((key, i) => kb.on(key, onWeaponKey(i)));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      kb.off('keydown-SPACE', onSpace);
      kb.off('keydown-ESC', onEsc);
      weaponKeys.forEach((key, i) => kb.off(key, onWeaponKey(i)));
    });
  }

  update(_t: number, delta: number): void {
    const state = this.state;
    if (!this.paused && !this.ended) {
      const dt = Math.min(delta, 100);
      stepEnemyAI(state, this.brain, dt);
      stepCombat(state, dt);
    }

    // At most one sound of each kind per frame.
    const sounds = new Set<SfxName>();
    for (const ev of state.log) {
      if (ev.type === 'fired') sounds.add('fire');
      else if (ev.type === 'hit') sounds.add('hit');
      else if (ev.type === 'shieldBlock') sounds.add('shieldBlock');
      else if (ev.type === 'miss') sounds.add('miss');
    }
    for (const name of sounds) playSfx(name);

    if (this.selectedCrewId !== null && !aliveCrew(state.player).some((c) => c.id === this.selectedCrewId)) {
      this.selectCrew(aliveCrew(state.player)[0]?.id ?? null);
    }

    this.view.update(state);
    this.hud.update(state, { paused: this.paused, aimingWeapon: this.aimingWeapon, selectedCrewId: this.selectedCrewId });
    state.log.length = 0;

    if (state.outcome !== 'ongoing' && !this.ended) this.endCombat();
  }

  private selectCrew(crewId: number | null): void {
    this.selectedCrewId = crewId;
    this.view.setSelectedCrew(crewId);
  }

  private cancelAim(): void {
    this.aimingWeapon = null;
    this.view.setTargeting(false);
  }

  private onRoomClicked(side: Side, roomId: number): void {
    if (this.aimingWeapon !== null && side === 'enemy') {
      setWeaponTarget(this.state.player, this.aimingWeapon, roomId);
      this.cancelAim();
      playSfx('click');
    } else if (side === 'player' && this.selectedCrewId !== null) {
      moveCrew(this.state.player, this.selectedCrewId, roomId);
      playSfx('click');
    }
  }

  private endCombat(): void {
    this.ended = true;
    this.cancelAim();
    const run = this.run;
    const tier = this.sceneData.tier;

    if (this.state.outcome === 'won') {
      const reward = TUNING.scrapPerWinBase + TUNING.scrapPerWinPerTier * tier + Math.floor(Math.random() * 10);
      run.scrap += reward;
      cleanUpAfterCombat(run.ship);
      setBattleMusic(false); // the fight is over: back to the explore arrangement
      playSfx('win');
      this.showPanel('ENEMY MOWER MULCHED!', `+${reward} scrap`, 'Continue', () => {
        if (this.sceneData.isBoss) {
          const over: GameOverData = { victory: true, jumps: run.jumps, scrap: run.scrap };
          this.scene.start(SCENES.gameOver, over);
        } else {
          this.scene.start(SCENES.map);
        }
      });
    } else if (this.state.outcome === 'fled') {
      cleanUpAfterCombat(run.ship);
      setBattleMusic(false);
      playSfx('jump');
      this.showPanel('You mowed away!', '', 'Continue', () => this.scene.start(SCENES.map));
    } else {
      playSfx('lose');
      this.time.delayedCall(1500, () => {
        const over: GameOverData = { victory: false, jumps: run.jumps, scrap: run.scrap };
        this.scene.start(SCENES.gameOver, over);
      });
    }
  }

  private showPanel(title: string, detail: string, buttonText: string, onContinue: () => void): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2 - 100;
    this.add.rectangle(cx, cy, 520, 200, 0x000000, 0.9).setStrokeStyle(2, 0xffd54f);
    this.add.text(cx, cy - 60, title, { color: COLORS.accent, fontSize: '28px' }).setOrigin(0.5).setDepth(PANEL_DEPTH + 1);
    this.add.text(cx, cy - 15, detail, { color: COLORS.text, fontSize: '20px' }).setOrigin(0.5).setDepth(PANEL_DEPTH + 1);
    const button = makeButton(this, cx, cy + 60, 160, 40, buttonText, onContinue);
    button.container.setDepth(PANEL_DEPTH + 1);
  }
}
