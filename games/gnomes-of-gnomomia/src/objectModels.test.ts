// The shared world-object models: every model name has a default colour and builds at least one prefab child.
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildObjectModel, OBJECT_MODEL_COLOR } from './objectModels';

const MODELS = Object.keys(OBJECT_MODEL_COLOR) as (keyof typeof OBJECT_MODEL_COLOR)[];

describe('OBJECT_MODEL_COLOR', () => {
  it('has a default colour for every model name', () => {
    expect(MODELS.length).toBeGreaterThan(0);
    for (const model of MODELS) {
      expect(Number.isInteger(OBJECT_MODEL_COLOR[model])).toBe(true);
    }
  });
});

describe('buildObjectModel', () => {
  it.each(MODELS)('adds at least one child for the %s model', (model) => {
    const parent = new THREE.Group();
    buildObjectModel(model, OBJECT_MODEL_COLOR[model], parent);
    expect(parent.children.length).toBeGreaterThanOrEqual(1);
  });
});
