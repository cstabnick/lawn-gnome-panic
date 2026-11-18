import { createVolumeButton, createVolumeStore } from '@arcade/volume';
import { playSong, setMusicVolume, setMuted, stopSong } from '@lawn/music';
import {
  buildGnomokemonDesertTrack,
  buildGnomokemonGradingTrack,
  buildGnomokemonLawnTrack,
  buildGnomokemonMenuTrack,
} from './music/tracks';

export type MusicScene = 'snap' | 'desert' | 'menu' | 'grading';

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
    playSong(buildGnomokemonLawnTrack);
  } else if (scene === 'desert') {
    playSong(buildGnomokemonDesertTrack);
  } else if (scene === 'grading') {
    playSong(buildGnomokemonGradingTrack);
  } else {
    playSong(buildGnomokemonMenuTrack);
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
