// Title screen: decorative mower chain, a DOM name field and PLAY button (appended to #ui).
import Phaser from 'phaser';
import { SCENES, TEX } from '../config';

const NAME_KEY = 'mower-chain-name';
const CHAIN_COLORS = [0xff5a5a, 0x5ab0ff, 0xffd34d, 0xb36bff];
const CHAIN_GAP = 36;

const SKELETON = `
<style>
.mc-title { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center;
  justify-content:center; gap:14px; padding:16px; box-sizing:border-box; pointer-events:none;
  text-align:center; color:#fff; font-family:system-ui,sans-serif; text-shadow:0 2px 3px rgba(0,0,0,.85); }
.mc-title > * { pointer-events:auto; }
.mc-title h1 { margin:0; font-weight:900; font-size:clamp(40px,11vw,84px); line-height:1; letter-spacing:2px; }
.mc-title p { margin:0; font-size:clamp(16px,4vw,22px); color:#e9ffd9; max-width:520px; }
.mc-title input { font:600 20px system-ui,sans-serif; padding:12px 16px; border-radius:12px;
  border:2px solid #fff; width:min(80vw,320px); text-align:center; background:rgba(0,0,0,.45);
  color:#fff; outline:none; box-sizing:border-box; }
.mc-title input::placeholder { color:#cfe8c4; }
.mc-title button { font:900 26px system-ui,sans-serif; padding:16px 44px; min-height:56px; border-radius:14px;
  border:0; background:#f2c230; color:#1a1a1a; cursor:pointer; }
</style>
<h1>MOWER CHAIN</h1>
<p>Mow grass. Grow your chain. Don't hit anyone else's.</p>
<input type="text" maxlength="14" placeholder="Your name" autocomplete="off" />
<button type="button">PLAY</button>
`;

export class TitleScene extends Phaser.Scene {
  private dom: HTMLDivElement | null = null;
  private nameField: HTMLInputElement | null = null;
  private playBtn: HTMLButtonElement | null = null;
  private lawn: Phaser.GameObjects.TileSprite | null = null;
  private chainImgs: Phaser.GameObjects.Image[] = [];
  private playStarted = false;

  private readonly onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Enter') this.play();
  };
  private readonly onPlayClick = (): void => this.play();

  constructor() { super(SCENES.title); }

  create(): void {
    this.playStarted = false;
    this.cameras.main.setBackgroundColor('#1d3d1d');

    this.lawn = this.add
      .tileSprite(0, 0, this.scale.width, this.scale.height, TEX.tile)
      .setOrigin(0, 0)
      .setAlpha(0.3);

    // Decorative chain of four mowers, head first, wiggling across the screen.
    this.chainImgs = CHAIN_COLORS.map((color, i) =>
      this.add
        .image(0, 0, i === 0 ? TEX.head : TEX.body)
        .setTint(color)
        .setScale(i === 0 ? 1.2 : 1.0)
        .setAlpha(0.9),
    );

    this.buildDom();
    this.events.once('shutdown', () => this.teardown());
  }

  update(time: number): void {
    if (this.playStarted) return;
    const w = this.scale.width;
    const h = this.scale.height;
    this.lawn?.setSize(w, h);

    const span = w + 240;
    const headX = ((time * 0.05) % span) - 120;
    this.chainImgs.forEach((img, i) => {
      const wig = Math.sin(time / 400 - i * 0.6);
      img.x = headX - i * CHAIN_GAP;
      img.y = h * 0.8 + wig * 18;
      img.rotation = wig * 0.15;
    });
  }

  private buildDom(): void {
    const ui = document.getElementById('ui') ?? document.body;
    const dom = document.createElement('div');
    dom.className = 'mc-title';
    dom.innerHTML = SKELETON;
    ui.appendChild(dom);
    this.dom = dom;

    this.nameField = dom.querySelector<HTMLInputElement>('input');
    this.playBtn = dom.querySelector<HTMLButtonElement>('button');
    if (this.nameField) {
      try {
        this.nameField.value = localStorage.getItem(NAME_KEY) ?? '';
      } catch {
        // Storage blocked (private window): just leave the field empty.
      }
    }
    this.playBtn?.addEventListener('click', this.onPlayClick);
    window.addEventListener('keydown', this.onKey);
    this.nameField?.focus({ preventScroll: true });
  }

  private play(): void {
    if (this.playStarted) return;
    this.playStarted = true;
    const name = (this.nameField?.value ?? '').trim() || 'Mower';
    try {
      localStorage.setItem(NAME_KEY, name);
    } catch {
      // Storage blocked: the name simply is not remembered.
    }
    this.teardown();
    this.scene.start(SCENES.game, { name });
  }

  private teardown(): void {
    window.removeEventListener('keydown', this.onKey);
    this.playBtn?.removeEventListener('click', this.onPlayClick);
    this.dom?.remove();
    this.dom = null;
    this.nameField = null;
    this.playBtn = null;
  }
}
