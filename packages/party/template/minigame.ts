// __TITLE__: a Gnome Party slice of __GAME__. Scaffolded by `npm run new-mini -- __GAME__ __ID__` from
// packages/party/template/minigame.ts. Out of the box it is "Mash": press A as often as you can for 15 s.
//
// Rules that keep a slice working in the party (packages/party/README.md):
//  - Build it from this game's own modules (physics, course, models). Never copy game code here.
//  - init/step/cpu/result are pure: no DOM, no three objects in the state, and only the rng argument for randomness.
//  - State S and input I are plain JSON. S stays under 2 KB: store a shot's inputs and start time, not its trajectory.
//  - Input is a level sampled 15 times a second online. One-off actions are counters (presses) the view increments.
//  - CPU memory (wait timers) lives in S and step() updates it.
import * as THREE from 'three';
import { createGnomeModel, type GnomeModel, type PlayerState } from '@lawn/gnome';
import type { MinigameDef, SeatIndex } from '@lawn/party';
import { soleWinner } from '@lawn/party';

const ROUND_S = 15;

interface Seat { presses: number; lastPresses: number; score: number; cpuWait: number }
interface S { t: number; seats: Seat[] }
interface I { presses: number }

const def: MinigameDef<S, I> = {
  meta: {
    id: '__ID__',
    title: '__TITLE__',
    game: '__GAME__',
    goal: 'Press the button more times than anyone in 15 seconds.',
    controls: 'Tap the screen or press Space as fast as you can.',
    maxSeconds: ROUND_S,
  },

  init(seats) {
    return { t: 0, seats: seats.map(() => ({ presses: 0, lastPresses: 0, score: 0, cpuWait: 0 })) };
  },

  step(s, inputs, dt, rng) {
    s.t += dt;
    s.seats.forEach((seat, k) => {
      const i = inputs[k];
      // A counter, not a flag: every press since the last step counts, even if two arrived in one snapshot.
      if (i && i.presses > seat.lastPresses) {
        seat.score += i.presses - seat.lastPresses;
        seat.lastPresses = i.presses;
      }
      seat.cpuWait -= dt;
      if (seat.cpuWait <= 0) seat.cpuWait = 0.12 + rng() * 0.15; // CPUs press 4-8 times a second
    });
  },

  cpu(s, seat) {
    const me = s.seats[seat];
    // Press once each time the wait timer (kept in S by step) wraps.
    return { presses: me.lastPresses + (me.cpuWait <= 1 / 60 ? 1 : 0) };
  },

  result(s, timeUp) {
    if (!timeUp && s.t < ROUND_S) return null;
    const scores = s.seats.map((x) => x.score);
    return scores.map((v) => scores.filter((w) => w > v).length);
  },

  // What the party's results card shows besides the places: self-describing columns (main score first) and a
  // value per seat. Optional, but without it the card can only say who won, not how.
  // `seats` has the names: use the winner's in a headline that says how they won.
  report(s, places, seats) {
    const top = Math.max(...s.seats.map((x) => x.score));
    const w = soleWinner(places);
    const who = w === null ? null : (seats[w]?.name ?? null);
    return {
      headline: who ? `${who} mashed ${top} times` : undefined,
      stats: [{ key: 'presses', label: 'Presses', better: 'higher' }],
      values: s.seats.map((x) => ({ presses: x.score })),
      notes: s.seats.map((x) => (x.score === top && top > 0 ? 'Fastest thumbs' : null)),
    };
  },

  createView(ctx) {
    const { scene, camera, ui, seats, mySeat } = ctx;
    scene.background = new THREE.Color(0x87c8ff);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x447744, 1.4));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(3, 8, 4);
    scene.add(sun);
    const ground = new THREE.Mesh(new THREE.CircleGeometry(6, 32), new THREE.MeshStandardMaterial({ color: 0x5cae4a }));
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
    camera.position.set(0, 3.2, -6);
    camera.lookAt(0, 0.8, 0);

    const gnomes: { model: GnomeModel; pose: PlayerState }[] = seats.map((seat, k) => {
      const model = createGnomeModel(seat.look);
      scene.add(model.object);
      const pose: PlayerState = {
        position: new THREE.Vector3((1.5 - k) * 1.4, 0, 0),
        velocity: new THREE.Vector3(),
        facing: Math.PI,
        grounded: true,
        jumpsUsed: 0,
      };
      return { model, pose };
    });

    const label = document.createElement('div');
    label.style.cssText = 'position:absolute;left:0;right:0;bottom:12%;text-align:center;font:700 28px system-ui;text-shadow:0 2px 4px #000';
    ui.appendChild(label);

    let myPresses = 0;
    return {
      render(s, dt) {
        s.seats.forEach((seat, k) => {
          const g = gnomes[k];
          // Bounce with the score so presses show on every screen.
          g.pose.position.y = Math.abs(Math.sin(seat.score * 0.9)) * 0.25;
          g.model.update(g.pose, dt);
        });
        label.textContent = seats.map((seat, k) => `${seat.name} ${s.seats[k].score}`).join('   ·   ');
      },
      input(pad) {
        if (pad.aPressed) myPresses += 1;
        void mySeat;
        return { presses: myPresses };
      },
    };
  },
};

export default def;
export type { SeatIndex };
