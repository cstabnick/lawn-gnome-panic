// Music Room: wires the lobby bar, the stage, the synth and the network, and turns key presses into notes.
import {
  INSTRUMENTS, INSTRUMENT_KEY, INSTRUMENT_KEYS, OCTAVE_DOWN_CODE, OCTAVE_MAX, OCTAVE_MIN, OCTAVE_UP_CODE, OFFLINE_COLOR,
  isInstrument, noteForPad, padForCode, type InstrumentId,
} from './config';
import { playNote, unlockAudio } from './audio';
import { createRoomNet } from './net';
import { createStage } from './stage';
import { createLobby } from './lobby';

const ui = document.getElementById('ui');
if (!ui) throw new Error('#ui missing');

const lobby = createLobby(ui);
const stage = createStage(ui);
const net = createRoomNet();

function loadInstrument(): InstrumentId {
  try {
    const v = localStorage.getItem(INSTRUMENT_KEY);
    if (isInstrument(v)) return v;
  } catch {
    // storage blocked
  }
  return 'keys';
}

let mine: InstrumentId = loadInstrument();
let octave = 0;

/** My colour and name for my own flashes. */
function myLook(): { color: number; name: string } {
  const m = net.state.players.find((p) => p.me);
  return m ? { color: m.color, name: m.name } : { color: OFFLINE_COLOR, name: 'You' };
}

function pick(i: InstrumentId): void {
  if (i === mine) return;
  mine = i;
  try {
    localStorage.setItem(INSTRUMENT_KEY, i);
  } catch {
    // storage blocked
  }
  stage.setMine(i);
  net.setInstrument(i);
}

function play(pad: number): void {
  unlockAudio();
  const n = noteForPad(mine, pad, octave);
  playNote(mine, n);
  const look = myLook();
  stage.flash(mine, n, look.color, look.name);
  net.sendNote(mine, n);
}

function setOctave(o: number): void {
  octave = Math.max(OCTAVE_MIN, Math.min(OCTAVE_MAX, o));
  stage.setOctave(octave);
}

window.addEventListener('keydown', (e) => {
  // Typing a name or room code is not playing.
  const t = e.target as HTMLElement | null;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  for (const i of INSTRUMENTS) {
    if (e.code === INSTRUMENT_KEYS[i]) {
      e.preventDefault();
      pick(i);
      return;
    }
  }
  if (mine === 'keys' && (e.code === OCTAVE_DOWN_CODE || e.code === OCTAVE_UP_CODE)) {
    e.preventDefault();
    if (!e.repeat) setOctave(octave + (e.code === OCTAVE_UP_CODE ? 1 : -1));
    return;
  }
  const pad = padForCode(mine, e.code);
  if (pad < 0) return;
  e.preventDefault(); // Space must not scroll the page
  if (e.repeat) return;
  play(pad);
});

stage.onPad((i, pad) => {
  pick(i);
  play(pad);
});
stage.onPick((i) => {
  unlockAudio();
  pick(i);
});

net.onNote((from, i, n) => {
  playNote(i, n, 0.8);
  const m = net.state.players.find((p) => p.id === from);
  stage.flash(i, n, m ? m.color : 0xffffff, m ? m.name : '?');
});
net.onChange(() => {
  lobby.update(net.state, net.available);
  stage.setPlayers(net.state.players);
});

lobby.onJoin((code, name) => {
  unlockAudio();
  net.join(code, name, mine);
});
lobby.onLeave(() => net.leave());

stage.setMine(mine);
stage.setOctave(octave);
stage.setPlayers(net.state.players);
lobby.update(net.state, net.available);
