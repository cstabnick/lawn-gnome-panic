// Shared Speedway state, written by the race runner (quests/objectivesRace.ts) and read by the track (lap timer, start
// gantry lights, crowd).
let racing = false;
let lights = 0;

/** True while a race objective is running (from arriving at the grid to the result). The free-roam lap timer stands down. */
export const raceActive = (): boolean => racing;
export function setRaceActive(on: boolean): void {
  racing = on;
  if (!on) lights = 0;
}

/** The start gantry's lamps: 0..5 red lamps lit during the countdown, -1 = green (go), 0 = all off. */
export const startLights = (): number => lights;
export function setStartLights(n: number): void {
  lights = n;
}
