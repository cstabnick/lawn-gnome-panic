// Shared Speedway state: whether a race objective is running (the free-roam lap timer stands down meanwhile).
let racing = false;
export const raceActive = (): boolean => racing;
export function setRaceActive(on: boolean): void {
  racing = on;
}
