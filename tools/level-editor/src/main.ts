import './style.css';
import { showLoadError } from './loadError';

// The editor is loaded on demand: if the game's content throws while loading, the page shows the banner instead of nothing.
import('./editor').catch((e: unknown) => { showLoadError(e); });
