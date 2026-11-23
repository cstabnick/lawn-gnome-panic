// The gnome studio: the whole Gnome Creator flow (load my gnome, live preview, achievements gear, emotes, hair styles,
// SAVE) in one function, so the creator page and Club Gnome's dressing room and salon run the same code path.
// Modes only choose which editor sections show; saving always goes through the gnome store.
import type { HairStyle, Look } from '@lawn/gnome';
import type { EditorSection } from './editor';

export type StudioMode = 'full' | 'dressing' | 'salon';

/** Which editor sections each mode shows. */
export const STUDIO_SECTIONS: Record<StudioMode, readonly EditorSection[]> = {
  full: ['name', 'guide', 'colours', 'skin', 'hair', 'toggles', 'equipment', 'emotes', 'share'],
  dressing: ['colours', 'toggles', 'equipment'],
  salon: ['hair'],
};

/** The Oakcount id of a bought hair style ('pigtails' is free and never stored). */
export function hairItemId(style: HairStyle): string {
  return `hair:${style}`;
}

export interface StudioOptions {
  /** The canvas the turntable preview draws on (it fills the window). */
  canvas: HTMLCanvasElement;
  /** Where the editor panel is appended (the page's #ui, or a container inside it). */
  ui: HTMLElement;
  mode: StudioMode;
  /** Panel heading. Default: 'GNOME CREATOR' (full), 'DRESSING ROOM', 'GNOME SALON'. */
  title?: string;
  /** Adds a ✕ CLOSE button to the panel that calls this (Club Gnome closes the studio). */
  onClose?: () => void;
  /** Called after every successful SAVE with what was saved. */
  onSaved?: (saved: { name: string; look: Look }) => void;
  /**
   * Acorn prices of the hair styles that can be bought here (the salon). A locked style with a price shows
   * "🌰 <price>" and buys it with the Oakcount (buyItem(hairItemId(id), price, 'acorns')) when tapped; a locked style
   * without a price shows "Salon". Absent: nothing is for sale.
   */
  hairPrices?: Partial<Record<HairStyle, number>>;
  /** Called after a hair style was bought here (Club Gnome counts it as a purchase). */
  onHairBought?: (style: HairStyle) => void;
}

export interface Studio {
  /** Stops the preview, removes the panel. The canvas is left as it was (the caller owns it). */
  dispose(): void;
}

/** Builds the studio. Resolves once my gnome is loaded and shown. Never rejects (problems show on the status line). */
export async function createGnomeStudio(opts: StudioOptions): Promise<Studio> {
  void opts; // TODO(issue 2B): the creator's main.ts flow moves here
  return { dispose() {} };
}
