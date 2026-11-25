// Crisp inline SVG vector icons and accent colors for all 32 hero spells (8 heroes × 4 slots).
import type { AbilitySlot, HeroId } from './sim/config';

export interface SpellIconInfo {
  svg: string;
  color: string;
}

const ICONS: Record<HeroId, Record<AbilitySlot, SpellIconInfo>> = {
  bramble: {
    Q: {
      color: '#ff9f43',
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h12"/><path d="M13 6l6 6-6 6"/><path d="M3 7v10"/></svg>`,
    },
    E: {
      color: '#d9814f',
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M12 3l8 4v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V7l8-4z"/></svg>`,
    },
    F: {
      color: '#5ca844',
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 18c4-6 12-6 16 0"/><path d="M12 4v10"/><path d="M8 9l4 5 4-5"/></svg>`,
    },
    X: {
      color: '#ff6b6b',
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="14" r="5"/><path d="M12 3v4M5 8l3 2M19 8l-3 2M3 19h18"/></svg>`,
    },
  },
  tansy: {
    Q: {
      color: '#f2a3c4',
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 16l6-6-2-4 10 2-2 10-4-2-6 6"/></svg>`,
    },
    E: {
      color: '#7cc44f',
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 19L19 5"/><path d="M4 11l7-7"/><path d="M13 20l7-7"/></svg>`,
    },
    F: {
      color: '#a8b8d0',
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 16a4 4 0 010-8 5 5 0 019.5-1A3.5 3.5 0 0118 16H6z"/></svg>`,
    },
    X: {
      color: '#ffd54f',
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 12h16M7 7l12 5-12 5"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/></svg>`,
    },
  },
  fernwick: {
    Q: {
      color: '#ffa94d',
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M9 3h6v4l4 7a5 5 0 01-4.3 7H9.3A5 5 0 015 14l4-7V3z"/></svg>`,
    },
    E: {
      color: '#4fd8ff',
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg>`,
    },
    F: {
      color: '#ffd54f',
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M5 19l2-2"/></svg>`,
    },
    X: {
      color: '#ff4d6d',
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 3c3 4 5 7 5 11a5 5 0 01-10 0c0-4 2-7 5-11z"/><circle cx="12" cy="14" r="2" fill="currentColor"/></svg>`,
    },
  },
  potsworth: {
    Q: {
      color: '#93c5fd',
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="6" y="13" width="12" height="7" rx="2"/><path d="M12 13V7M12 8h7"/></svg>`,
    },
    E: {
      color: '#4fd8ff',
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="6" cy="18" r="3"/><circle cx="18" cy="6" r="3"/><path d="M8.5 15.5l7-7"/></svg>`,
    },
    F: {
      color: '#a5d8ff',
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 19V5M6 10l6-6 6 6"/><path d="M5 17c3 2 11 2 14 0"/></svg>`,
    },
    X: {
      color: '#ffd54f',
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2" fill="currentColor"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>`,
    },
  },
  hookwort: {
    Q: {
      color: '#ffd54f',
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 5a3 3 0 00-6 0v9a4 4 0 01-8 0v-1"/><path d="M4 13l2-2 2 2"/></svg>`,
    },
    E: {
      color: '#ff9f43',
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 18V9a3 3 0 016 0v3"/><path d="M13 6l4-3 3 4"/></svg>`,
    },
    F: {
      color: '#ff7a1a',
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="14" r="6"/><path d="M15 9l3-3M19 4l1-1"/></svg>`,
    },
    X: {
      color: '#4fd8ff',
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M3 12h18M14 6l7 6-7 6"/><path d="M3 8h9M3 16h9"/></svg>`,
    },
  },
  buckshot: {
    Q: {
      color: '#ffd54f',
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M20 12a8 8 0 11-2.3-5.6"/><path d="M20 4v5h-5"/></svg>`,
    },
    E: {
      color: '#ff7a1a',
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M7 20v-9l5-7 5 7v9H7z"/><path d="M10 15h4"/></svg>`,
    },
    F: {
      color: '#4fd8ff',
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 17l7-10h6l-4 5h6l-9 9 2-4H4z"/></svg>`,
    },
    X: {
      color: '#ff4d6d',
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M8 12a4 4 0 11-8 0 4 4 0 018 0zM16 12a4 4 0 118 0 4 4 0 01-8 0z" transform="translate(0,0)"/><path d="M7 9c2 0 4 6 6 6s4-6 6-6"/></svg>`,
    },
  },
  thistle: {
    Q: {
      color: '#a65cff',
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 20L20 4"/><path d="M13 4h7v7"/></svg>`,
    },
    E: {
      color: '#7cc44f',
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="4"/><circle cx="6" cy="7" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="17" cy="18" r="2"/></svg>`,
    },
    F: {
      color: '#3df5c8',
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 16c2-5 6-8 10-8a4 4 0 014 4"/><path d="M16 14l3-2-2-3"/></svg>`,
    },
    X: {
      color: '#ff6fd0',
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M12 3c2 4 2 7 0 9-2-2-2-5 0-9zM21 12c-4 2-7 2-9 0 2-2 5-2 9 0zM12 21c-2-4-2-7 0-9 2 2 2 5 0 9zM3 12c4-2 7-2 9 0-2 2-5 2-9 0z"/></svg>`,
    },
  },
  loam: {
    Q: {
      color: '#a65cff',
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7" stroke-dasharray="3 2"/><circle cx="12" cy="12" r="10" opacity="0.6"/></svg>`,
    },
    E: {
      color: '#4fd8ff',
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><ellipse cx="7" cy="12" rx="3" ry="6"/><ellipse cx="17" cy="12" rx="3" ry="6"/><path d="M10 12h4"/></svg>`,
    },
    F: {
      color: '#5cff7a',
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/><circle cx="12" cy="12" r="9"/></svg>`,
    },
    X: {
      color: '#c084fc',
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="4" fill="currentColor"/><path d="M12 3a9 9 0 018.5 6M21 12a9 9 0 01-6 8.5M12 21a9 9 0 01-8.5-6M3 12a9 9 0 016-8.5"/></svg>`,
    },
  },
};

export function spellIconSvg(heroId: HeroId, slot: AbilitySlot): SpellIconInfo {
  return ICONS[heroId][slot];
}
