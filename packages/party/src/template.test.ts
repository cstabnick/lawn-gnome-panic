// The template slice must always pass the contract test it hands to games (with its placeholders filled in).
import { testMinigame } from './testkit';
import template from '../template/minigame';

testMinigame({ ...template, meta: { ...template.meta, id: 'template-mash', title: 'Mash', game: 'template' } });
