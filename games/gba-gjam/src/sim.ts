// The simulation lives in @lawn/jam; this keeps the game's old import path working.
import './ai'; // registers the game's bot factory (scripts, Worker, remote) before any match is built
export { JamSimulation } from '@lawn/jam';
export type { DunkState, SimBall, SimCallbacks, SimPlayer } from '@lawn/jam';
