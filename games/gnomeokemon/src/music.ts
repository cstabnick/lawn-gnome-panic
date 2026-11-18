import { createVolumeButton, createVolumeStore } from '@arcade/volume';
import {
  buildGnomomiaTheme,
  buildMeadowWaltz,
  playSong,
  setMusicVolume,
  setMuted,
  stopSong,
} from '@lawn/music';

export type MusicScene = 'snap' | 'menu' | 'grading';

export const volumeStore = createVolumeStore({
  storageKey: 'gnomeokemon.volume.v1',
  defaults: { music: 0.45, sounds: 0.7 },
});

let currentScene: MusicScene | null = null;
let unlocked = false;

function syncVolume(): void {
  const eff = volumeStore.effective('music');
  setMuted(eff <= 0.0001);
  setMusicVolume(eff);
}

volumeStore.subscribe(syncVolume);
syncVolume();

function startScene(scene: MusicScene): void {
  if (scene === 'snap') {
    playSong((T, keep, out) => buildGnomomiaTheme(T, keep, out, 'mossbottom'));
  } else if (scene === 'grading') {
    playSong((T, keep, out) => buildGnomomiaTheme(T, keep, out, 'title'));
  } else {
    playSong((T, keep, out) => buildMeadowWaltz(T, keep, out, 101));
  }
}

export function setMusicScene(scene: MusicScene): void {
  if (currentScene === scene) return;
  currentScene = scene;
  if (unlocked) startScene(scene);
}

export function unlockAndPlayMusic(): void {
  if (unlocked) return;
  unlocked = true;
  if (currentScene) startScene(currentScene);
}

export function stopMusic(): void {
  stopSong();
  currentScene = null;
}

export function mountMusicControl(parent: HTMLElement): void {
  createVolumeButton(parent, volumeStore, { title: 'Audio' });
}
