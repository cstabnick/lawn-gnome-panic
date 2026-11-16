import * as THREE from 'three';
import { PlayerMode } from './climbing';

export function createFirstPersonHands(): {
  group: THREE.Group;
  update: (mode: PlayerMode, canGrab: boolean, bob: number, stamina: number) => void;
} {
  const group = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({ color: '#f2c6a0', roughness: 0.7 });
  const gloveMat = new THREE.MeshStandardMaterial({ color: '#e65c4f', roughness: 0.6 });

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

  const update = (mode: PlayerMode, canGrab: boolean, bob: number, stamina: number) => {
    const isClimbing = mode === 'climbing';
    const targetZ = isClimbing ? -0.58 : canGrab ? -0.5 : -0.38;
    const targetY = isClimbing ? -0.16 : canGrab ? -0.25 : -0.38;

    const lBob = isClimbing ? Math.sin(bob) * 0.09 : 0;
    const rBob = isClimbing ? -Math.sin(bob) * 0.09 : 0;
    const tremor = stamina < 25 && isClimbing ? (Math.random() - 0.5) * 0.025 : 0;

    leftHand.position.z = THREE.MathUtils.lerp(leftHand.position.z, targetZ, 0.25);
    rightHand.position.z = THREE.MathUtils.lerp(rightHand.position.z, targetZ, 0.25);
    leftHand.position.y = THREE.MathUtils.lerp(leftHand.position.y, targetY + lBob + tremor, 0.25);
    rightHand.position.y = THREE.MathUtils.lerp(rightHand.position.y, targetY + rBob + tremor, 0.25);

    const rotX = isClimbing ? 0.55 : canGrab ? 0.3 : 0;
    leftHand.rotation.x = THREE.MathUtils.lerp(leftHand.rotation.x, rotX, 0.2);
    rightHand.rotation.x = THREE.MathUtils.lerp(rightHand.rotation.x, rotX, 0.2);
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

  private readonly leftArm: THREE.Mesh;
  private readonly rightArm: THREE.Mesh;
  private readonly bodyGroup = new THREE.Group();
  private readonly labelSprite: THREE.Sprite;
  private readonly labelCanvas: HTMLCanvasElement;
  private readonly labelCtx: CanvasRenderingContext2D;
  private readonly labelTex: THREE.CanvasTexture;
  private lastLabelText = '';
  private animPhase = Math.random() * 6.28;

  constructor(name: string, color: string) {
    this.name = name;
    const suitMat = new THREE.MeshStandardMaterial({ color, roughness: 0.75 });
    const packMat = new THREE.MeshStandardMaterial({ color: '#3b4252', roughness: 0.85 });
    const skinMat = new THREE.MeshStandardMaterial({ color: '#f2c6a0', roughness: 0.7 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.72, 0.32), suitMat);
    torso.position.y = 0.25;
    torso.castShadow = true;

    const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.52, 0.22), packMat);
    backpack.position.set(0, 0.28, 0.24);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.38), skinMat);
    head.position.y = 0.84;
    head.castShadow = true;

    const beanie = new THREE.Mesh(new THREE.BoxGeometry(0.41, 0.16, 0.41), suitMat);
    beanie.position.y = 1.02;

    const legGeo = new THREE.BoxGeometry(0.2, 0.55, 0.22);
    const leftLeg = new THREE.Mesh(legGeo, packMat);
    leftLeg.position.set(-0.14, -0.35, 0);
    const rightLeg = new THREE.Mesh(legGeo, packMat);
    rightLeg.position.set(0.14, -0.35, 0);

    const armGeo = new THREE.BoxGeometry(0.16, 0.56, 0.16);
    this.leftArm = new THREE.Mesh(armGeo, suitMat);
    this.leftArm.position.set(-0.38, 0.32, 0);
    this.rightArm = new THREE.Mesh(armGeo, suitMat);
    this.rightArm.position.set(0.38, 0.32, 0);

    this.bodyGroup.add(torso, backpack, head, beanie, leftLeg, rightLeg, this.leftArm, this.rightArm);
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
      this.bodyGroup.position.y = -0.3;
    } else {
      this.bodyGroup.rotation.x = 0;
      this.bodyGroup.position.y = 0;
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
