import { createVolumeButton, createVolumeStore } from '@arcade/volume';
import { playSong, setMusicVolume, setMuted, stopSong } from '@lawn/music';
import {
  buildGnomokemonDesertTrack,
  buildGnomokemonFrostTrack,
  buildGnomokemonGradingTrack,
  buildGnomokemonLawnTrack,
  buildGnomokemonMenuTrack,
  buildGnomokemonNightNocturne,
  buildGnomokemonOceanBossa,
  buildGnomokemonTranceDepths,
  buildGnomokemonTranceDesert,
  buildGnomokemonTranceKiln,
  buildGnomokemonTranceLawn,
  buildGnomokemonTranceOcean,
} from './music/tracks';

export type MusicScene = 'snap' | 'desert' | 'depths' | 'kiln' | 'ocean' | 'night' | 'frost' | 'menu' | 'grading';
export type MusicStyle = 'world' | 'trance';

export const volumeStore = createVolumeStore({
  storageKey: 'gnomeokemon.volume.v1',
  defaults: { music: 0.45, sounds: 0.7 },
});

let currentScene: MusicScene | null = null;
let currentStyle: MusicStyle = 'world';
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
    // World 1: bouncy acoustic safari by default
    playSong(currentStyle === 'trance' ? buildGnomokemonTranceLawn : buildGnomokemonLawnTrack);
  } else if (scene === 'desert') {
    // World 2: desert sitar groove by default
    playSong(currentStyle === 'trance' ? buildGnomokemonTranceDesert : buildGnomokemonDesertTrack);
  } else if (scene === 'depths') {
    // World 3: subterranean pipe trance
    playSong(buildGnomokemonTranceDepths);
  } else if (scene === 'kiln') {
    // World 4: high-energy Kiln climax trance
    playSong(buildGnomokemonTranceKiln);
  } else if (scene === 'ocean') {
    // World 5: breezy underwater bossa-nova by default
    playSong(currentStyle === 'trance' ? buildGnomokemonTranceOcean : buildGnomokemonOceanBossa);
  } else if (scene === 'night') {
    // World 6: dreamy midnight greenhouse nocturne
    playSong(buildGnomokemonNightNocturne);
  } else if (scene === 'frost') {
    // World 7: sparkling winter music-box
    playSong(buildGnomokemonFrostTrack);
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
  currentStyle = currentStyle === 'world' ? 'trance' : 'world';
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
    styleBtn.textContent = currentStyle === 'world' ? '🎵 World Mix' : '⚡ All Trance';
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
