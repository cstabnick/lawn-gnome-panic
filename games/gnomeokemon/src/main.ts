import { mountApp } from './app';
import { renderContactSheet } from './screens/gnomokedex';
import { photoCloud } from './snap/cloud';

const ui = document.getElementById('ui')!;
const params = new URLSearchParams(location.search);

if (params.has('sheet')) renderContactSheet(ui);
else {
  // Pulls and merges the account's best photos in the background. The darkroom reads the photos each time it is
  // shown, so a pull that lands later is picked up the next time the player opens it; nothing re-renders here.
  void photoCloud.syncAtStartup();
  mountApp(ui, params);
}
