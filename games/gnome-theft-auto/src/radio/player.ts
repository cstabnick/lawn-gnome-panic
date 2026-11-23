// Turfton FM on the air: floating text on screen, @lawn/music playback synced to a deterministic broadcast clock,
// persistent playback across exiting/re-entering vehicles with spatial speaker attenuation, and multiplayer banger invites.
import {
  buildUndergroundSet,
  playSong,
  setMuteKey,
  setSongMuffled,
  setSongSpatial,
  stopSong,
} from '@lawn/music';
import { liveAt } from './broadcast';
import { playBulletinIntro } from './bulletinAudio';
import { EVENT_BULLETINS, STATIONS, type StationId } from './content';
import { buildRadioSong } from './music/build';
import { RADIO_SONGS } from './music/songs';
import { getRadioText } from './prefs';
import { createProgram, type Segment } from './schedule';
import { computeSpeakerAcoustics } from './spatial';

const DIAL_KEY = 'gta.radio';
/** The same storage key audio.ts uses for the mute toggle (keys.ts KEYS.mute), so one press silences the sound effects and the radio. */
const MUTE_KEY = 'gta.muted';
const DEFAULT_STATION: StationId = 'blade';
/** News that arrives while a bulletin is on air waits behind it, up to this many. */
const QUEUE_MAX = 3;
/** Event news about what the player did, kept while nobody is driving, up to this many. */
const PENDING_MAX = 2;
/** The station label stays on screen this long after a tune or a start. */
const DIAL_SECONDS = 5;
/** A song's credit ("Title, by Artist") stays on screen this long. The music plays on. */
const SONG_CREDIT_SECONDS = 6;
/** How long a multiplayer "banger!" invite pill stays visible. */
const BANGER_SECONDS = 7;

export interface RadioHooks {
  /** The player has heard a song on every main station (not the bonus ones) during one drive. */
  onFullDial?(): void;
  /** An event bulletin (about something the player did) went out on the air. Gets the achievement id. */
  onEventBulletin?(key: string): void;
}

export interface Radio {
  /** The tuned station, or null when the radio is off. */
  readonly station: StationId | null;
  /** Turn the dial one step. */
  cycle(): void;
  /** Tune directly to a station (or off). */
  tune(id: StationId | null, opts?: { save?: boolean; showDial?: boolean }): void;
  /** The player got into a vehicle: resume or start the live broadcast on the tuned station. */
  start(): void;
  /** The player got out (or was cracked): hide HUD text, optionally keeping the vehicle speaker playing. */
  stop(opts?: { keepPlaying?: boolean }): void;
  /** The Pay 'n' Glaze shop opened or closed: while open the radio line is hidden (it would sit over the shop sheet). */
  setShopOpen(open: boolean): void;
  /** Update spatial speaker acoustics while on foot/airborne. */
  setListener(
    listener: { x: number; y: number; z: number; yaw: number },
    speaker: { x: number; y: number; z: number; station: StationId } | null,
  ): void;
  /** Currently airing song on the tuned station, for sharing with other players. */
  currentSong(): { station: StationId; songIndex: number; title: string; artist: string } | null;
  /** Show a clickable/tappable banger shout-out pill above the radio HUD. */
  showBangerInvite(who: string, station: StationId, songTitle: string, onTune: () => void): void;
  /**
   * A Hat Watch level ("heat-1".."heat-4") or an achievement id went out as news. Heat news is only for a driver; event news
   * waits for the next drive. News that arrives while a bulletin is on air waits behind it.
   */
  news(key: string): void;
  /** Advance the programme by a frame. */
  update(dt: number): void;
}

function loadDial(): StationId | null {
  try {
    const v = localStorage.getItem(DIAL_KEY);
    if (v === 'off') return null;
    if (v && STATIONS.some((s) => s.id === v)) return v as StationId;
  } catch {
    /* storage blocked: start on the default station */
  }
  return DEFAULT_STATION;
}

function saveDial(id: StationId | null): void {
  try {
    localStorage.setItem(DIAL_KEY, id ?? 'off');
  } catch {
    /* per-session only */
  }
}

const CSS = `
@keyframes gr-pop{0%{opacity:0;transform:translateY(8px) scale(.92)}65%{opacity:1;transform:translateY(-1px) scale(1.03)}100%{opacity:1;transform:translateY(0) scale(1)}}
#gta-radio{position:fixed;left:calc(env(safe-area-inset-left) + 16px);right:calc(env(safe-area-inset-right) + 16px);
  bottom:calc(env(safe-area-inset-bottom) + 14px);text-align:center;pointer-events:none;color:#fff;
  font:600 13px/1.3 system-ui,sans-serif;
  /* Floating text: no box. A dark outline and a soft shadow keep it readable over grass, road and sky. */
  text-shadow:0 0 2px #000,0 0 4px #000,1px 1px 0 #000,-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,0 2px 6px rgba(0,0,0,.6);}
#gta-radio .gr-dial{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#ffd23f;}
#gta-radio .gr-line{margin:2px auto 0;max-width:min(340px,70vw);}
#gta-radio .gr-line.gr-pop{animation:gr-pop .32s cubic-bezier(.22,1,.36,1) both;}
#gta-radio .gr-who{margin-right:5px;color:#7cf0ff;font-weight:800;}
#gta-radio .gr-who.gr-talk{color:#ffd23f;}
#gta-radio .gr-who.gr-bulletin{color:#ff8a80;}
#gta-radio-banger{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom) + 74px);
  z-index:25;display:none;align-items:center;gap:8px;max-width:min(92vw,420px);padding:6px 10px 6px 12px;border-radius:999px;
  background:rgba(18,18,22,.86);border:1.5px solid rgba(255,138,61,.75);color:#fff;font:600 12px/1.25 system-ui,sans-serif;
  box-shadow:0 6px 20px rgba(0,0,0,.45);pointer-events:auto;}
#gta-radio-banger .gr-b-msg{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
#gta-radio-banger .gr-b-tune{min-height:44px;padding:0 12px;border-radius:999px;border:0;background:#ff7a33;color:#111;
  font:800 12px system-ui,sans-serif;cursor:pointer;touch-action:manipulation;flex-shrink:0;}
/* Phones in portrait: the touch buttons fill the bottom corners and the toasts sit at the top, so the text goes on the
   left, under the toasts, and smaller. */
@media (max-width:700px){
  #gta-radio{top:calc(env(safe-area-inset-top) + 270px);bottom:auto;text-align:left;font-size:11px;}
  #gta-radio .gr-dial{font-size:9px;}
  #gta-radio .gr-line{margin:1px 0 0;max-width:min(230px,56vw);}
  #gta-radio-banger{top:calc(env(safe-area-inset-top) + 218px);bottom:auto;font-size:11px;}
}
/* Phones in landscape (the HUD's short-screen layout): the vehicle readout and the touch buttons take the bottom, so the
   text sits in the open middle, under the biome name, and smaller. */
@media (max-height:500px){
  #gta-radio{top:calc(env(safe-area-inset-top) + 120px);bottom:auto;font-size:11px;}
  #gta-radio .gr-dial{font-size:9px;}
  #gta-radio .gr-line{max-width:min(260px,44vw);}
  #gta-radio-banger{top:calc(env(safe-area-inset-top) + 68px);bottom:auto;font-size:11px;}
}
`;

export function createRadio(ui: HTMLElement, hooks: RadioHooks = {}): Radio {
  // The music's own mute reads the same storage key as the game's mute toggle (see audio.ts).
  setMuteKey(MUTE_KEY);

  if (!document.getElementById('gta-radio-css')) {
    const style = document.createElement('style');
    style.id = 'gta-radio-css';
    style.textContent = CSS;
    document.head.appendChild(style);
  }
  const root = document.createElement('div');
  root.id = 'gta-radio';
  root.setAttribute('aria-live', 'polite');
  root.style.display = 'none';
  const dial = document.createElement('div');
  dial.className = 'gr-dial';
  const line = document.createElement('div');
  line.className = 'gr-line';
  const who = document.createElement('b');
  who.className = 'gr-who';
  const text = document.createElement('span');
  line.append(who, text);
  root.append(dial, line);

  const bangerPill = document.createElement('div');
  bangerPill.id = 'gta-radio-banger';
  const bangerMsg = document.createElement('span');
  bangerMsg.className = 'gr-b-msg';
  const bangerTuneBtn = document.createElement('button');
  bangerTuneBtn.type = 'button';
  bangerTuneBtn.className = 'gr-b-tune';
  bangerTuneBtn.textContent = 'Tune in';
  bangerPill.append(bangerMsg, bangerTuneBtn);

  ui.append(root, bangerPill);
  window.addEventListener('gta:radio-text', () => render());

  const program = createProgram();
  program.tune(loadDial());

  let current: Segment | null = null;
  let remaining = 0;
  let inVehicle = false;
  /** The Pay 'n' Glaze shop is open: its sheet covers the radio line, so the radio hides until it closes. */
  let shopOpen = false;
  let heard = new Set<StationId>();
  let fullDialSent = false;
  /** Seconds left for the station label and for the text line. The programme itself does not wait for them. */
  let dialLeft = 0;
  let textLeft = 0;
  /** Currently playing audio stream key (`station:seed` or `under:blockId:seed`), so re-entering a car doesn't restart it. */
  let activeTrackKey: string | null = null;
  /** External speaker station when listening on foot. */
  let externalStation: StationId | null = null;
  let lastSpatialGain = 1;
  let lastSpatialPan = 0;
  /**
   * When the on-foot radio went inaudible (performance.now ms), or 0. A song nobody can hear still costs its full
   * synthesis (about 10 % of a phone's frame, perf pass 2), so after SILENT_STOP_MS it is stopped; coming back in range
   * re-syncs to the broadcast clock, so it plays exactly where it would have been.
   */
  let silentSince = 0;
  const SILENT_STOP_MS = 3000;
  function silent(): void {
    if (!activeTrackKey) return;
    setSongSpatial({ gain: 0, rampS: 0.15 });
    const now = performance.now();
    if (!silentSince) silentSince = now;
    else if (now - silentSince > SILENT_STOP_MS) {
      silentSince = 0;
      activeTrackKey = null;
      stopSong();
    }
  }

  /** Bulletin waiting for the chime + SamJs "News bulletin" intro to finish before popping up. */
  let bulletinPending: { key: string; seg: Segment } | null = null;
  let bulletinRevealLeft = 0;

  let bangerLeft = 0;
  let bangerOnTune: (() => void) | null = null;
  bangerTuneBtn.addEventListener('click', () => {
    const fn = bangerOnTune;
    bangerLeft = 0;
    bangerOnTune = null;
    bangerPill.style.display = 'none';
    fn?.();
  });

  /** Event news that happened with nobody driving, kept until the next drive (oldest first). */
  const pending: string[] = [];
  /** News that arrived while a bulletin was on air (oldest first). */
  const queued: string[] = [];

  const stationOf = (id: StationId): (typeof STATIONS)[number] => STATIONS.find((s) => s.id === id)!;
  const mainStations = STATIONS.filter((s) => !s.bonus).length;

  function triggerPop(): void {
    line.classList.remove('gr-pop');
    void line.offsetWidth;
    line.classList.add('gr-pop');
  }

  function render(): void {
    root.style.display = inVehicle && !shopOpen ? '' : 'none';
    const on = getRadioText();
    const id = program.station;
    dial.textContent = id ? `${stationOf(id).freq} ${stationOf(id).label}` : 'Radio off (N to tune)';
    dial.style.display = on && dialLeft > 0 ? '' : 'none';
    line.style.display = on && current && textLeft > 0 ? '' : 'none';
    if (current) {
      if (current.kind === 'song') {
        who.textContent = 'Now playing';
        who.className = 'gr-who';
      } else {
        who.textContent = current.who;
        who.className = `gr-who ${current.kind === 'bulletin' ? 'gr-bulletin' : 'gr-talk'}`;
      }
      text.textContent = current.text;
    }
  }

  /** Count the text timers down; repaint only when one of them runs out. */
  function tick(dt: number): void {
    const before = [dialLeft > 0, textLeft > 0];
    dialLeft = Math.max(0, dialLeft - dt);
    textLeft = Math.max(0, textLeft - dt);
    if (before[0] !== dialLeft > 0 || before[1] !== textLeft > 0) render();
  }

  function ensureStream(station: StationId, trackKey: string, songSeed: number, songOffsetSec: number, songIndex: number): void {
    if (activeTrackKey === trackKey) return;
    activeTrackKey = trackKey;
    if (station === 'under') {
      playSong(
        (T, keep, out) =>
          buildUndergroundSet(T, keep, out, songSeed, {
            offsetSeconds: songOffsetSec,
            onCut: (index) => {
              if (current?.kind === 'song' && current.station === 'under') {
                const songs = stationOf('under').songs;
                const song = songs[Math.min(songs.length - 1, index)];
                current = { ...current, who: song.artist, text: `${song.title}, by ${song.artist}` };
                textLeft = SONG_CREDIT_SECONDS;
                render();
              }
            },
          }),
        { offsetSeconds: songOffsetSec },
      );
    } else {
      // Every other station plays its song's own spec through the Subsoil-style mix (music/build.ts). The song is the
      // same every time it airs; the broadcast clock only says where in it we are.
      const songs = RADIO_SONGS[station];
      const spec = songs[Math.max(0, Math.min(songs.length - 1, songIndex))];
      playSong((T, keep, out) => buildRadioSong(T, keep, out, spec, { offsetSeconds: songOffsetSec }), { offsetSeconds: songOffsetSec });
    }
  }

  function syncLive(station: StationId | null): void {
    if (!station) {
      current = null;
      remaining = 0;
      activeTrackKey = null;
      setSongMuffled(false);
      stopSong();
      render();
      return;
    }
    const slot = liveAt(station, Date.now() / 1000);
    current = slot.segment;
    remaining = slot.remainingSec;
    textLeft = slot.segment.kind === 'song' ? SONG_CREDIT_SECONDS : slot.remainingSec;
    ensureStream(station, slot.trackKey, slot.songSeed, slot.songOffsetSec, slot.songIndex);

    if (slot.segment.kind === 'song') {
      setSongMuffled(false);
      if (inVehicle && !stationOf(station).bonus) {
        heard.add(station);
        if (!fullDialSent && heard.size === mainStations) {
          fullDialSent = true;
          hooks.onFullDial?.();
        }
      }
    } else {
      // Talk and bulletins sit on top of whatever is playing, so the music drops back under them.
      setSongMuffled(true);
    }
    render();
  }

  /** Put an event or heat bulletin on air: chime + SamJs "News bulletin" first, then pop up the text. */
  function playBulletin(key: string): boolean {
    const seg = program.bulletin(key);
    if (!seg) return false;
    setSongMuffled(true);
    bulletinPending = { key, seg };
    bulletinRevealLeft = playBulletinIntro({
      gain: inVehicle ? 1 : lastSpatialGain,
      pan: inVehicle ? 0 : lastSpatialPan,
      muffled: !inVehicle,
    });
    return true;
  }

  function revealBulletin(key: string, seg: Segment): void {
    current = seg;
    remaining = seg.seconds;
    textLeft = seg.seconds;
    setSongMuffled(true);
    render();
    triggerPop();
    if (!key.startsWith('heat-')) hooks.onEventBulletin?.(key);
  }

  /** Keep event news for the next drive. Heat news is only for a driver, and an event with no bulletin is not kept at all. */
  function keepPending(key: string): void {
    if (key.startsWith('heat-') || !EVENT_BULLETINS[key]) return;
    pending.push(key);
    if (pending.length > PENDING_MAX) pending.shift();
  }

  function advance(): void {
    // A bulletin that was waiting behind the one that just ended goes out first.
    while (queued.length) {
      if (playBulletin(queued.shift()!)) return;
    }
    syncLive(inVehicle ? program.station : externalStation);
  }

  const news = (key: string): void => {
    if (!inVehicle) {
      keepPending(key);
      return;
    }
    if (!program.station) return;
    if (bulletinPending || current?.kind === 'bulletin') {
      // Heat rising during a bulletin about something the player just did must not cut it off: it waits its turn.
      if (queued.length < QUEUE_MAX) queued.push(key);
      return;
    }
    playBulletin(key);
  };

  function tuneTo(id: StationId | null, opts: { save?: boolean; showDial?: boolean } = {}): void {
    program.tune(id);
    if (opts.save) saveDial(program.station);
    current = null;
    bulletinPending = null;
    bulletinRevealLeft = 0;
    queued.length = 0;
    if (opts.showDial ?? true) dialLeft = DIAL_SECONDS;
    if (inVehicle) syncLive(program.station);
    else render();
  }

  return {
    get station() { return program.station; },
    cycle() {
      program.cycle();
      saveDial(program.station);
      current = null;
      bulletinPending = null;
      bulletinRevealLeft = 0;
      queued.length = 0;
      dialLeft = DIAL_SECONDS;
      if (inVehicle) syncLive(program.station);
      else render();
    },
    tune(id, opts) {
      tuneTo(id, opts);
    },
    start() {
      inVehicle = true;
      silentSince = 0;
      externalStation = null;
      setSongSpatial(null);
      heard = new Set();
      fullDialSent = false;
      dialLeft = DIAL_SECONDS;
      current = null;
      bulletinPending = null;
      bulletinRevealLeft = 0;
      if (program.station) syncLive(program.station);
      else render();
      // Everything kept from before goes out, oldest first: the first now, the rest queued behind it.
      const [first, ...rest] = pending.splice(0);
      queued.push(...rest);
      if (first) news(first);
    },
    setShopOpen(open) {
      shopOpen = open;
      render();
    },
    stop(opts) {
      inVehicle = false;
      current = null;
      bulletinPending = null;
      bulletinRevealLeft = 0;
      dialLeft = 0;
      textLeft = 0;
      // Whatever was waiting to go out is still news: event news is kept for the next drive, heat news is dropped.
      for (const key of queued.splice(0)) keepPending(key);
      if (!opts?.keepPlaying) {
        externalStation = null;
        activeTrackKey = null;
        setSongSpatial(null);
        setSongMuffled(false);
        stopSong();
      }
      render();
    },
    setListener(listener, speaker) {
      if (inVehicle) return;
      if (!speaker) {
        externalStation = null;
        lastSpatialGain = 0;
        lastSpatialPan = 0;
        silent();
        return;
      }
      const ac = computeSpeakerAcoustics(listener, speaker);
      lastSpatialGain = ac.gain;
      lastSpatialPan = ac.pan;
      if (!ac.audible) {
        silent();
        return;
      }
      silentSince = 0;
      externalStation = speaker.station;
      program.tune(speaker.station);
      if (!bulletinPending && current?.kind !== 'bulletin') {
        const slot = liveAt(speaker.station, Date.now() / 1000);
        if (activeTrackKey !== slot.trackKey || !current) {
          syncLive(speaker.station);
        }
      }
      setSongSpatial({
        gain: ac.gain,
        pan: ac.pan,
        cutoffHz: ac.cutoffHz,
        reverbWet: ac.reverbWet,
        rampS: 0.08,
      });
    },
    currentSong() {
      const id = program.station;
      if (!id) return null;
      const slot = liveAt(id, Date.now() / 1000);
      const st = stationOf(id);
      const song = st.songs[slot.songIndex] ?? st.songs[0];
      return { station: id, songIndex: slot.songIndex, title: song.title, artist: song.artist };
    },
    showBangerInvite(whoName, stationId, songTitle, onTune) {
      const st = stationOf(stationId);
      bangerMsg.textContent = `🔥 ${whoName}: "Yeah, this is a banger!" — ${songTitle} (${st.freq} ${st.label})`;
      bangerOnTune = onTune;
      bangerTuneBtn.style.display = inVehicle && program.station !== stationId ? '' : 'none';
      bangerLeft = BANGER_SECONDS;
      bangerPill.style.display = 'flex';
    },
    news,
    update(dt) {
      if (bangerLeft > 0) {
        bangerLeft = Math.max(0, bangerLeft - dt);
        if (bangerLeft <= 0) {
          bangerOnTune = null;
          bangerPill.style.display = 'none';
        }
      }
      if (inVehicle) tick(dt);
      if (bulletinPending) {
        bulletinRevealLeft -= dt;
        if (bulletinRevealLeft <= 0) {
          const { key, seg } = bulletinPending;
          bulletinPending = null;
          revealBulletin(key, seg);
        }
        return;
      }
      const activeSt = inVehicle ? program.station : externalStation;
      if (!activeSt || !current) return;
      remaining -= dt;
      if (remaining <= 0) advance();
    },
  };
}
