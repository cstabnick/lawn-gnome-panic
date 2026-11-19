import * as THREE from 'three';
import { createGnomeModel, GNORMAN_LOOK, type GnomeLook } from '@lawn/gnome';
import { PlayerMode } from './climbing';

export function createFirstPersonHands(look?: GnomeLook): {
  group: THREE.Group;
  update: (mode: PlayerMode, canGrab: boolean, bob: number, stamina: number, dancePhase?: number) => void;
} {
  const group = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({ color: look?.skin ?? '#f2c6a0', roughness: 0.7 });
  const gloveMat = new THREE.MeshStandardMaterial({ color: look?.hat ?? '#e65c4f', roughness: 0.6 });

  const makeHand = (side: -1 | 1) => {
    const arm = new THREE.Group();
    const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.11, 0.36), skinMat);
    forearm.position.set(0, 0, 0.18);
    const glove = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.12, 0.14), gloveMat);
    glove.position.set(0, 0.01, -0.04);
    arm.add(forearm, glove);
    arm.position.set(side * 0.34, -0.34, -0.45);
    return arm;
  };

  const leftHand = makeHand(-1);
  const rightHand = makeHand(1);
  group.add(leftHand, rightHand);

  const update = (mode: PlayerMode, canGrab: boolean, bob: number, stamina: number, dancePhase = 0) => {
    const isClimbing = mode === 'climbing';
    const isDancing = mode === 'dancing';
    const isWaving = mode === 'waving';
    const targetZ = isClimbing ? -0.58 : isDancing ? -0.52 : canGrab ? -0.5 : -0.38;
    const targetY = isClimbing ? -0.16 : isDancing ? -0.18 : canGrab ? -0.25 : -0.38;

    const lBob = isClimbing ? Math.sin(bob) * 0.09 : isDancing ? Math.sin(dancePhase) * 0.14 : 0;
    const rBob = isClimbing ? -Math.sin(bob) * 0.09 : isDancing ? Math.cos(dancePhase) * 0.14 : isWaving ? 0.24 + Math.sin(dancePhase * 1.4) * 0.05 : 0;
    const tremor = stamina < 25 && isClimbing ? (Math.random() - 0.5) * 0.025 : 0;

    leftHand.position.z = THREE.MathUtils.lerp(leftHand.position.z, targetZ, 0.25);
    rightHand.position.z = THREE.MathUtils.lerp(rightHand.position.z, isWaving ? -0.55 : targetZ, 0.25);
    leftHand.position.y = THREE.MathUtils.lerp(leftHand.position.y, targetY + lBob + tremor, 0.25);
    rightHand.position.y = THREE.MathUtils.lerp(rightHand.position.y, (isWaving ? -0.05 : targetY) + rBob + tremor, 0.25);
    rightHand.position.x = THREE.MathUtils.lerp(rightHand.position.x, isWaving ? 0.26 + Math.sin(dancePhase * 1.4) * 0.12 : 0.34, 0.25);

    const rotX = isClimbing ? 0.55 : isDancing ? 0.4 + Math.sin(dancePhase * 2) * 0.35 : canGrab ? 0.3 : 0;
    leftHand.rotation.x = THREE.MathUtils.lerp(leftHand.rotation.x, rotX, 0.2);
    rightHand.rotation.x = THREE.MathUtils.lerp(rightHand.rotation.x, isWaving ? 0.85 : rotX, 0.2);
    leftHand.rotation.z = isDancing ? Math.sin(dancePhase) * 0.4 : 0;
    rightHand.rotation.z = isDancing ? -Math.sin(dancePhase) * 0.4 : isWaving ? Math.sin(dancePhase * 1.4) * 0.55 : 0;
  };

  return { group, update };
}

export class RemoteClimberAvatar {
  readonly group = new THREE.Group();
  readonly targetPos = new THREE.Vector3();
  targetYaw = 0;
  mode = 'grounded';
  name = 'Climber';
  hp = 100;

  private readonly leftArm: THREE.Object3D;
  private readonly rightArm: THREE.Object3D;
  private readonly bodyGroup: THREE.Group;
  private readonly labelSprite: THREE.Sprite;
  private readonly labelCanvas: HTMLCanvasElement;
  private readonly labelCtx: CanvasRenderingContext2D;
  private readonly labelTex: THREE.CanvasTexture;
  private lastLabelText = '';
  private animPhase = Math.random() * 6.28;

  constructor(name: string, color: string, look?: GnomeLook) {
    this.name = name;
    const hatRgb = new THREE.Color(color).getHex();
    const gnome = createGnomeModel(
      look ? { ...look, hat: hatRgb } : { ...GNORMAN_LOOK, hat: hatRgb },
      { overrideEquipment: ['back'] },
    );
    const packMat = new THREE.MeshStandardMaterial({ color: '#3b4252', roughness: 0.85 });
    const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.44, 0.18), packMat);
    backpack.position.set(0, 0.52, -0.22);
    gnome.rig.add(backpack);

    this.leftArm = gnome.arms.left;
    this.rightArm = gnome.arms.right;
    this.bodyGroup = gnome.object;
    this.group.add(this.bodyGroup);

    // Floating nametag
    this.labelCanvas = document.createElement('canvas');
    this.labelCanvas.width = 256;
    this.labelCanvas.height = 64;
    this.labelCtx = this.labelCanvas.getContext('2d')!;
    this.labelTex = new THREE.CanvasTexture(this.labelCanvas);
    this.labelSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: this.labelTex, transparent: true, depthTest: false })
    );
    this.labelSprite.position.set(0, 1.55, 0);
    this.labelSprite.scale.set(2.4, 0.6, 1);
    this.group.add(this.labelSprite);
    this.updateLabel();
  }

  private updateLabel(): void {
    const tag =
      this.mode === 'downed'
        ? `${this.name} [DOWNED!]`
        : this.mode === 'summited'
          ? `${this.name} [SUMMIT!]`
          : this.mode === 'dancing'
            ? `${this.name} [DANCING]`
            : this.mode === 'waving'
              ? `${this.name} [WAVING]`
              : `${this.name} (${Math.max(0, Math.round(this.targetPos.y))}m)`;
    if (tag === this.lastLabelText) return;
    this.lastLabelText = tag;

    const ctx = this.labelCtx;
    ctx.clearRect(0, 0, 256, 64);
    ctx.fillStyle = this.mode === 'downed' ? 'rgba(200, 35, 35, 0.85)' : 'rgba(15, 23, 42, 0.72)';
    ctx.beginPath();
    ctx.roundRect(8, 10, 240, 44, 12);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tag, 128, 32);
    this.labelTex.needsUpdate = true;
  }

  update(dt: number): void {
    this.group.position.lerp(this.targetPos, Math.min(1, dt * 14));
    this.group.rotation.y = this.targetYaw;
    this.animPhase += dt * 7;

    if (this.mode === 'downed') {
      this.bodyGroup.rotation.x = Math.PI / 2;
      this.bodyGroup.rotation.z = 0;
      this.bodyGroup.position.y = -0.3;
    } else if (this.mode === 'dancing') {
      this.bodyGroup.rotation.x = 0;
      this.bodyGroup.rotation.z = Math.sin(this.animPhase * 1.4) * 0.16;
      this.bodyGroup.position.y = Math.abs(Math.sin(this.animPhase * 2.8)) * 0.18;
      this.leftArm.rotation.x = -2.4 + Math.sin(this.animPhase * 2.8) * 0.8;
      this.rightArm.rotation.x = -2.4 - Math.sin(this.animPhase * 2.8) * 0.8;
    } else if (this.mode === 'waving') {
      this.bodyGroup.rotation.x = 0;
      this.bodyGroup.rotation.z = 0;
      this.bodyGroup.position.y = 0;
      this.leftArm.rotation.x = 0;
      this.rightArm.rotation.x = -2.6;
      this.rightArm.rotation.z = -0.35 + Math.sin(this.animPhase * 2.6) * 0.45;
    } else {
      this.bodyGroup.rotation.x = 0;
      this.bodyGroup.rotation.z = 0;
      this.bodyGroup.position.y = 0;
      this.rightArm.rotation.z = 0;
      if (this.mode === 'climbing') {
        this.leftArm.rotation.x = -2.1 + Math.sin(this.animPhase) * 0.45;
        this.rightArm.rotation.x = -2.1 - Math.sin(this.animPhase) * 0.45;
      } else {
        this.leftArm.rotation.x = 0;
        this.rightArm.rotation.x = 0;
      }
    }
    this.updateLabel();
  }
}
