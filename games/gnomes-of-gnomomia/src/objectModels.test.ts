// The shared world-object models: every model name has a default colour and builds at least one prefab child.
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildObjectModel, objectModelPrefab, OBJECT_MODEL_COLOR } from './objectModels';

const MODELS = Object.keys(OBJECT_MODEL_COLOR) as (keyof typeof OBJECT_MODEL_COLOR)[];

describe('objectModelPrefab', () => {
  it('names a non-empty prefab id for every model', () => {
    for (const model of MODELS) {
      expect(objectModelPrefab(model).length).toBeGreaterThan(0);
    }
  });

  it('names the prefab the cart builder uses', () => {
    expect(objectModelPrefab('cart')).toBe('wooden-cart');
  });
});

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
