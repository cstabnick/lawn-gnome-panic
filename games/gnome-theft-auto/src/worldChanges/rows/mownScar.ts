// World change W14 (E21, row 52 m52-the-test-cut): the mown scar across Hedgeworth Links. STUB from the E21 setup: the
// row 52 writer fills it (props have no colliders; rules: ../registry.ts). Keep the registerWorldChange('W14', ...) call.
import * as THREE from 'three';
import { registerWorldChange } from '../registry';

registerWorldChange('W14', () => ({ root: new THREE.Group() }));
