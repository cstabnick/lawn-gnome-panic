import { loadMyGnome } from '@lawn/gnome';
await loadMyGnome();
import { mountApp } from './ui/app';
import { createTracking } from './achievements';
const ui = document.getElementById('ui') as HTMLElement;
createTracking(ui);
mountApp(ui);
