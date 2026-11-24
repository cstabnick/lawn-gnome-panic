// The shapes every portal shares. Pure data: no DOM, no storage.

/** A door into a building, in one game. */
export interface PortalDoor {
  /** Workspace folder name of the game the door stands in ('gnome-theft-auto', 'club-gnome'). */
  game: string;
  /**
   * 'native': the building's interior is this game's own (Club Gnome's Gnomecino map); walking in is the game's own
   * business and pushes no frame. 'visit': the door opens the host game's interior over this game (push a frame).
   */
  mode: 'native' | 'visit';
  /** Shown on the door prompt: "Enter The Gnomecino". */
  label: string;
}

/** The game that runs the building's interior. Its page is opened (framed) with the visit in the query string. */
export interface PortalHostGame {
  /** Workspace folder name; on the built site the page is ../<game>/. */
  game: string;
  /** Its Vite dev-server port (games/<game>/vite.config.ts), used while the visiting game runs on a dev server. */
  devPort: number;
  /** Extra query for the host page, without '?' ('' for none). */
  query: string;
  /** Title on the portal bar: "The Gnomecino". */
  title: string;
}

/** One building that more than one game can walk into: always the same shared interior (one instance). */
export interface PortalDef {
  /** Lower-case id, [a-z0-9-]: 'gnomecino'. Also the `portal=` value in the host page's URL. */
  id: string;
  /** Display name: 'The Gnomecino'. */
  building: string;
  host: PortalHostGame;
  doors: PortalDoor[];
}

/** Where to put the player back when they walk out: the origin game's own coordinates. extra = any JSON the game needs. */
export interface ReturnPose {
  x: number;
  y: number;
  z: number;
  yaw: number;
  extra?: Record<string, unknown>;
}

/** One entry on the portal stack: everything needed to put the player back exactly where they came from. */
export interface PortalFrame {
  /** Unique id of this visit (newVisitId): ledger entries carry it. */
  visit: string;
  /** PortalDef.id. */
  portal: string;
  /** The origin game (where the player returns). */
  from: string;
  /** The host game (whose interior was opened). */
  to: string;
  /** 0 for a visit from a top-level page, 1 for a visit opened from inside a visit, ... */
  depth: number;
  /** Date.now() when the player walked in. */
  enteredAt: number;
  ret: ReturnPose;
  /** The origin game's room code (null: the public room). The visit joins the host game's room of the same code. */
  room: string | null;
}

/** What a ledger entry records. */
export type LedgerKind = 'chips' | 'acorns' | 'item' | 'achievement' | 'note';

/**
 * One thing the player gained (or spent) inside a building. Written by the host page while it happens, applied to the
 * origin game once (by id).
 */
export interface LedgerEntry {
  /** `${visit}:${seq}`; unique for ever. */
  id: string;
  visit: string;
  portal: string;
  kind: LedgerKind;
  /** chips / acorns: signed delta. */
  amount?: number;
  /** item: the Oakcount item id; achievement: the achievement id. */
  ref?: string;
  /** note: a line for the journal / summary. */
  text?: string;
  /** Date.now() when it happened. */
  at: number;
  /**
   * location.origin of the page that already wrote the effect into its own storage. When the origin game runs on the
   * same origin (the built site) its storage already holds it, so applying it again would count it twice: settle()
   * then only records it. On a different origin (two dev servers) settle() applies it.
   */
  store: string;
}
