// Gnome Creator: the page around the gnome studio (@lawn/gnome-editor), which runs the whole flow.
import { createGnomeStudio } from '@lawn/gnome-editor';
import { initCreatorMusic } from './music';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ui = document.getElementById('ui') as HTMLElement;

initCreatorMusic(ui);
await createGnomeStudio({ canvas, ui, mode: 'full' });
