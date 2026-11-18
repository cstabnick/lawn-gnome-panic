import { createVolumeButton, createVolumeStore } from '@arcade/volume';
import { playSong, setMusicVolume, setMuted, stopSong } from '@lawn/music';
import {
  buildGnomokemonDesertTrack,
  buildGnomokemonGradingTrack,
  buildGnomokemonLawnTrack,
  buildGnomokemonMenuTrack,
  buildGnomokemonTranceDesert,
  buildGnomokemonTranceLawn,
} from './music/tracks';

export type MusicScene = 'snap' | 'desert' | 'menu' | 'grading';
export type MusicStyle = 'trance' | 'acoustic';

export const volumeStore = createVolumeStore({
  storageKey: 'gnomeokemon.volume.v1',
  defaults: { music: 0.45, sounds: 0.7 },
});

let currentScene: MusicScene | null = null;
let currentStyle: MusicStyle = 'trance';
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
    playSong(currentStyle === 'trance' ? buildGnomokemonTranceLawn : buildGnomokemonLawnTrack);
  } else if (scene === 'desert') {
    playSong(currentStyle === 'trance' ? buildGnomokemonTranceDesert : buildGnomokemonDesertTrack);
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

export function getMusicStyle(): MusicStyle {
  return currentStyle;
}

export function toggleMusicStyle(): MusicStyle {
  currentStyle = currentStyle === 'trance' ? 'acoustic' : 'trance';
  if (unlocked && currentScene) startScene(currentScene);
  return currentStyle;
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
  const styleBtn = document.createElement('button');
  styleBtn.type = 'button';
  const syncLabel = (): void => {
    styleBtn.textContent = currentStyle === 'trance' ? '🎶 Trance' : '🎻 Acoustic';
  };
  Object.assign(styleBtn.style, {
    minHeight: '44px',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid var(--line)',
    background: 'var(--panel)',
    color: 'var(--ink)',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  });
  syncLabel();
  styleBtn.onclick = () => {
    toggleMusicStyle();
    syncLabel();
  };
  parent.append(styleBtn);
  createVolumeButton(parent, volumeStore, { title: 'Audio' });
}
