// STUB (Epic 2 fills this in): the full game: menu -> countdown -> 3-lap race vs 3 CPUs -> results.
import * as THREE from 'three';
import { buildTrack } from './scene/trackView';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(innerWidth, innerHeight);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 500);
camera.position.set(0, 60, -60);
camera.lookAt(0, 0, 0);
buildTrack(scene);
renderer.setAnimationLoop(() => renderer.render(scene, camera));
