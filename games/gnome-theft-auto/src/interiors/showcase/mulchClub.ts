// The Mulch Club lobby (E05 showcase interior), through the members' side door on the south face. The quest giver at
// the front door (east face, quests/defs.ts 'mulch-club') is unchanged. Lore: docs/lore/entries/apocrypha/the-mulch-club.md.
import { defineInterior } from '../registry';

export const MULCH_LOBBY_INTERIOR = 'mulch-club-lobby';

// Table top (0.6 m) and billiard felt (about 0.93 m) heights, from the prefab parts.
const TABLE_TOP = 0.6;
const FELT_TOP = 0.93;
const VELVET = 0x6a1b2a;

defineInterior({
  id: MULCH_LOBBY_INTERIOR,
  name: 'the Mulch Club lobby',
  prompt: "Enter the Mulch Club (members' side door)",
  door: { x: -30, z: -17.5, yaw: Math.PI },
  exit: { x: -30, z: -16, yaw: 0 },
  size: { w: 14, d: 12, h: 4.2 },
  theme: 'club',
  ambience: 'silent',
  build(kit) {
    kit.room();
    kit.door(0, 5.8, Math.PI);

    // The long runner down the middle of the room.
    kit.put('rug', 0, 1.5, 0, { solid: false, size: 6, tint: 0x7b1a24 });

    // Two velvet booths, mirrored.
    kit.put('table', -4.6, -1.5, 0, { size: 1.4 });
    kit.put('armchair', -4.6, -2.6, 0, { tint: VELVET });
    kit.put('armchair', -4.6, -0.4, Math.PI, { tint: VELVET });
    kit.put('candelabra', -4.6, -1.5, 0, { solid: false, y: TABLE_TOP });

    kit.put('table', 4.6, -1.5, 0, { size: 1.4 });
    kit.put('candelabra', 4.6, -1.5, 0, { solid: false, y: TABLE_TOP });
    kit.put('armchair', 4.6, -0.4, Math.PI, { tint: VELVET });

    // Vignette 1: the card game abandoned the moment somebody spoke.
    kit.put('card-fan', 4.4, -1.6, 0, { solid: false, y: TABLE_TOP });
    kit.put('chip-stack-tower', 4.9, -1.2, 0, { solid: false, y: TABLE_TOP });
    kit.put('cigar-box', 4.6, -1.9, 0, { solid: false, y: TABLE_TOP });
    kit.put('armchair', 4.6, -2.6, 2.2, { tint: VELVET });
    kit.sign('HOUSE RULE: A HAND ENDS\nWHEN SOMEBODY SPEAKS.', 6.95, 2.0, -1.5, -Math.PI / 2, { w: 1.6, h: 0.6, bg: 0x1a0a0c, fg: 0xc9a227 });

    // Vignette 2: the wanted posters slid across the felt.
    kit.put('billiard-table', 0, -3.4, 0);
    kit.put('wanted-poster', -0.6, -3.5, 0.3, { solid: false, y: FELT_TOP });
    kit.put('wanted-poster', 0.1, -3.2, -0.2, { solid: false, y: FELT_TOP });
    kit.put('wanted-poster', 0.7, -3.6, 0.1, { solid: false, y: FELT_TOP });

    // Vignette 3: the cloakroom and the wet-hat bin.
    kit.put('wardrobe', -6.4, 3.8, Math.PI / 2);
    kit.put('barrel', -6.3, 2.4, 0);
    kit.sign('CONFISCATED: WET HATS', -6.95, 1.8, 2.4, Math.PI / 2, { w: 1.2, h: 0.4 });
    kit.sign('NO SIRENS.\nNO WET HATS.\nNO TALKING.', -6.95, 1.6, 4.2, Math.PI / 2, { w: 1.0, h: 0.7, bg: 0xc9a227, fg: 0x2a1810 });

    // The back-room door (north wall, it does not open): a dais, a sign, and the bodyguard.
    kit.block(3, 0.3, 1.2, 0, -5.3, { color: 0x2a1810 });
    kit.sign('MEMBERS BEYOND THIS POINT:\nNOBODY', 0, 2.6, -5.95, 0, { w: 2.2, h: 0.6, bg: 0x1a0a0c, fg: 0xc9a227 });
    kit.put('painting', -4.2, -5.9, 0, { solid: false });

    const say = (line: string) => {
      window.dispatchEvent(new CustomEvent('gta:interior-say', { detail: { name: 'Bodyguard', line } }));
    };
    const knocks = ['...', '(He points at the plaque.)', '(He points at the plaque harder.)'];
    let knock = 0;
    kit.spot({
      id: 'back-room',
      x: 0,
      z: -4.2,
      prompt: 'Knock on the back-room door',
      run() {
        say(knocks[Math.min(knock, knocks.length - 1)]);
        knock += 1;
      },
    });

    kit.npc({ id: 'guard', name: 'Bodyguard', x: 1.6, z: -4.6, yaw: 0, look: { hat: 0x1b1b1b, shirt: 0x263238, beard: 0x5d4037 }, line: '(He says nothing, very firmly.)' });
    kit.npc({ id: 'hatcheck', name: 'Hat-check gnome', x: -5.2, z: 4.4, yaw: -Math.PI / 2, look: { hat: 0x4a1218, shirt: 0xc9a227 }, line: 'Your hat is dry. You may keep it. This time.' });

    kit.put('grandfather-clock', 6.4, 4.2, -Math.PI / 2);
  },
});
