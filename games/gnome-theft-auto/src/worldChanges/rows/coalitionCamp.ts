// World change W16 (E22, row 64 m64-all-hats): the coalition camp at the Dust Flats overlook; the Bathtub Queen at New
// Puddle. STUB from the E22 setup: the W16 writer fills it (props have no colliders; rules: ../registry.ts). Keep the
// registerWorldChange('W16', ...) call.
import * as THREE from 'three';
import { registerWorldChange } from '../registry';

registerWorldChange('W16', () => ({ root: new THREE.Group() }));
