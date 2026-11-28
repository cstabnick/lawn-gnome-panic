/** One player's control input for a tick (keyboard, touch, bot or network). */
export interface PlayerControlInput {
  moveX: number; // -1..1
  moveZ: number; // -1..1
  turbo: boolean;
  shootDown: boolean;
  shootPressed: boolean;
  shootReleased: boolean;
  passPressed: boolean;
  fakePressed: boolean;
}
