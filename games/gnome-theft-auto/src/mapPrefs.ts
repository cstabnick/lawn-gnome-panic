// Whether other online players show on the minimap and the big map: on (default) or off. Kept per browser. Changing it
// fires `gta:map-players`. The value is read once and kept, so the per-frame map code never touches storage.

const KEY = 'gta.mapPlayers';

function readStored(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
}

let showPlayers = readStored();

export function getMapPlayers(): boolean {
  return showPlayers;
}

export function setMapPlayers(on: boolean): void {
  showPlayers = on;
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    /* per-session only */
  }
  window.dispatchEvent(new Event('gta:map-players'));
}
