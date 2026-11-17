// Entry: load the player's own gnome (from the Gnome Creator), then the game.
import { loadMyGnome } from '@lawn/gnome';
await loadMyGnome();
await import('./app');
