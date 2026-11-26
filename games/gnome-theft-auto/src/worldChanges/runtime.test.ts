import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./rows', () => ({}));
import type { QuestSave } from '../quests/types';
import { installWorldChanges } from './runtime';
import { registerWorldChange } from './registry';

const done: QuestSave = { state: 'done', step: 0, cracked: [] };

function deps(saves: Record<string, QuestSave>, scene = new THREE.Scene()) {
  const news = vi.fn();
  return {
    news,
    scene,
    d: {
      scene,
      saves: () => saves,
      news,
      night: () => 0,
      groundY: () => 0,
    },
  };
}

registerWorldChange('W01', () => ({ root: new THREE.Group() }));

describe('world change runtime', () => {
  it('shows nothing until the quest is done, then shows the group and sends its news once', () => {
    const saves: Record<string, QuestSave> = {};
    const { d, news, scene } = deps(saves);
    const rt = installWorldChanges(d);

    rt.update(0.1);
    expect(scene.children.length).toBe(0);

    saves['m02-roof-on-credit'] = done;
    rt.update(0.6);
    expect(scene.children.length).toBe(1);
    expect(news).toHaveBeenCalledWith('world-W01');
    expect(rt.active()).toEqual(['W01']);

    rt.update(0.6);
    expect(news).toHaveBeenCalledTimes(1);
  });

  it('shows a change that was already done at install without news', () => {
    const { d, news, scene } = deps({ 'm02-roof-on-credit': done });
    const rt = installWorldChanges(d);
    rt.update(0.6);
    expect(scene.children.length).toBe(1);
    expect(news).not.toHaveBeenCalled();
  });
});
