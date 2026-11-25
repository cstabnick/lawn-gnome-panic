// E33: the mountain roads in the road graph (traffic, police and the GPS read world.roads). Every route of kind 'road'
// adds ground nodes along its centre line and joins both ends to the highway it starts on. Pure: no three.js, no DOM.
// FOUNDATION STUB: issue E1 fills it in.
import type { RoadGraph } from '../types';

/** Add every 'road' mountain route to a built road graph (highways/install.ts calls it once, after the skyways). */
export function addMountainRoads(graph: RoadGraph): void {
  void graph;
}
