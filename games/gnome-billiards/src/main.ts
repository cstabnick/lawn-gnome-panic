// Entry: loads the player's gnome first (so every screen can wear it), then starts the table.
import { loadMyGnome } from '@lawn/gnome';
await loadMyGnome();
await import('./app');
