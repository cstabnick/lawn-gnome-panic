// Entry: loads the player's gnome and oakcount wallet first, then starts the table.
import { loadMyGnome } from '@lawn/gnome';
import { loadOakcount } from '@lawn/oakcount';
await loadMyGnome();
await loadOakcount();
await import('./app');
