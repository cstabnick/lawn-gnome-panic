// Turfton FM: the three stations, their hosts and callers, the banter, songs, ads and bulletins. Plain data, no logic
// beyond the traffic line builder. The scheduler (schedule.ts) decides what plays and when.
// Lore: docs/lore/entries/apocrypha/turfton-fm.md (and one entry per host). Story: docs/design/gnome-theft-auto/story.md section 10.
// Rules to keep (R-021, R-016, canon house style): nothing gets wet, soaked, dripping or bloody. Clay cracks and is glued back.

import type { Place } from '../config';

export type StationId = 'blade' | 'fpr' | 'beats';
export type MusicTheme = 'big-beat' | 'lullaby' | 'jazz';

/** One line of talk, a caller's exchange or a bulletin: who is speaking (shown as a label) and what they say. */
export interface Line {
  readonly who: string;
  readonly text: string;
}

export interface Song {
  readonly title: string;
  readonly artist: string;
}

export interface Station {
  readonly id: StationId;
  /** The name on the dial, e.g. "99.3 The Blade". */
  readonly name: string;
  /** Short name for the on-screen label. */
  readonly label: string;
  readonly freq: string;
  readonly theme: MusicTheme;
  readonly sign: Line;
  readonly songs: readonly Song[];
  readonly banter: readonly Line[];
  /** Station-only commercials (shared ones are in ADS). */
  readonly ads: readonly Line[];
  /** Calls and exchanges with callers, one Line each (the whole exchange is in the text). */
  readonly calls: readonly Line[];
}

export const STATIONS: readonly Station[] = [
  {
    id: 'blade',
    name: '99.3 The Blade',
    label: 'The Blade',
    freq: '99.3',
    theme: 'big-beat',
    sign: { who: 'DOCK', text: 'You\'re on 99.3 The Blade, the only station loud enough to drown out an HOA leaf-blower at six in the morning!' },
    songs: [
      { title: 'Born to Be Mowed', artist: 'Lou & the Gravel Boys' },
      { title: 'Don\'t Mow My Baby Down', artist: 'The Velvet Toadstools' },
      { title: 'Two-Stroke Heart', artist: 'Dock Hoewright & the Pull Cords' },
      { title: 'Zero-Turn Me Round', artist: 'The Greenhouse Strip Five' },
      { title: 'Kiln-Born Blues', artist: 'Hob & the Glaze' },
      { title: 'Leaf-Blower Lullaby', artist: 'The Velvet Toadstools' },
      { title: 'Sprinkler Scare', artist: 'Burnet Gravelwright' },
      { title: 'Hat On, Engine Off', artist: 'Ivy Snailwood' },
    ],
    banter: [
      { who: 'DOCK', text: 'Good morning, Turfton! Or afternoon, or whatever the Hat Watch says it is today. This is the Blade, and the machine is running, so you\'re running with it.' },
      { who: 'DOCK', text: 'The beige people have asked me not to say the forbidden word on air, the one with the M in it. So I\'m going to say "machine" a lot, and you\'re going to think I\'ve lost my marbles. I have. It\'s fine.' },
      { who: 'DOCK', text: 'Every hour on the hour I count to three: one, two, Blade. If you didn\'t hear it, check your hat. It\'s slipped over one eye again.' },
      { who: 'DOCK', text: 'Tansy at Side-Valve says her machines are as good as new. Her machines were never new. Her paint is new. Keep that in mind when you\'re buying.' },
      { who: 'DOCK', text: 'I owe my whole career to one bad microphone and one good cough. Long story. Mostly coughing.' },
      { who: 'DOCK', text: 'Traffic on the central lane is a Combine doing thirty. You can\'t pass a Combine. You can only be moved by it. Stay left and say hello.' },
      { who: 'DOCK', text: 'If your grass is over two inches, don\'t cut it. Paint it beige and tell Reginald Vance it\'s a decorative wheat field. Reginald has not, as yet, bought this.' },
      { who: 'DOCK', text: 'Dandelion Fizz want me to say it\'s the best fizz in the Dust Flats. I have had it. It is the best fizz in the Dust Flats. That is not the compliment they think it is.' },
      { who: 'DOCK', text: 'That was the Velvet Toadstools, who are arguing about royalties in the Chirp & Crumb car park as we speak. Two of them are on the line. They would like it noted they are not in the same band any more.' },
      { who: 'DOCK', text: 'Machine tip: if your engine goes "pop", that\'s not a fault. That\'s a feature. It\'s your engine asking to leave the county.' },
      { who: 'DOCK', text: 'Dock\'s Rule of Thumb: the one who drives fastest is always the one who can\'t remember where they parked. So park by the birdbath. Everybody knows where the birdbath is.' },
      { who: 'DOCK', text: 'The Gnomecino still hasn\'t apologised for the chair incident. Chairs, plural, thrown. We\'re moving on. We are not moving on fast enough for the Gnomecino.' },
      { who: 'DOCK', text: 'Side-Valve Salvage are open all night, which is a shame, because the night staff are the ones who sold me this microphone.' },
      { who: 'LAWN-DART', text: 'This is Lawn-Dart. You can\'t see me. That\'s the deal. You can hear me, which is only half of a deal, and I\'m told I\'m the better half.' },
      { who: 'LAWN-DART', text: 'Hat Watch have just moved two cruisers to the Greenhouse Strip. I\'m not saying that because I know. I\'m saying it because you\'ll find out in three minutes anyway.' },
      { who: 'LAWN-DART', text: 'You\'ve asked who I am. I\'m the morning. The morning used to be someone else. Next year it\'ll be someone else again. Your guess is as good as mine, and I\'m sitting in a birdbath.' },
      { who: 'LAWN-DART', text: 'The Watch\'s dispatch is a fine thing to listen to over a cup of acorn tea. It says all kinds of things about who is having a bad morning, and I always find out first.' },
      { who: 'LAWN-DART', text: 'If you\'re driving a borrowed Ride-On with three Hats on your brim, go round the block twice. The block has been waiting for you. It is very patient.' },
      { who: 'LAWN-DART', text: 'Turfton is very quiet this morning. It\'s quiet the way a closed garden shed is quiet. Keep your ears on.' },
    ],
    ads: [
      { who: 'DOCK', text: 'Pip Potsworth has asked us to read this one slowly, so: Potsworth\'s Import-Export. Legitimate gigs. Some of them are legitimate. Ask for Pip. Pip is not available.' },
      { who: 'AD', text: 'Buck-Iron. Heavy green and gold. Tough enough to push a Combine out of the ditch. We\'d say so ourselves, but a Razor-Back is currently sitting on our bonnet.' },
      { who: 'AD', text: 'Razor-Back. Safety orange and matte black. A Zero-Turn that does donuts around a stuck Combine. Still turning since Tuesday.' },
    ],
    calls: [
      { who: 'ROOSTER (on the line)', text: 'THE BAROMETER IS DROPPING! VESPERS IN THE CLOUDS! — DOCK: We\'ll take that as a no, Rooster. — ROOSTER: IT IS A YES!' },
      { who: 'ROOSTER (on the line)', text: 'THE SPRINKLERS ARE TALKING IN A PATTERN, DOCK! THE PATTERN IS SPELLING "GRASS"! — DOCK: That\'s a sprinkler, Rooster. — ROOSTER: THAT IS WHAT THEY WANT YOU TO THINK!' },
      { who: 'CALLER (Greenhouse Strip)', text: 'My Ride-On was borrowed outside the Gnomecino. — DOCK: Was it a good borrowing? — CALLER: Very polite. It left the hat on the seat. — DOCK: Thank you, that\'s the nicest thing I\'ve heard all week.' },
    ],
  },
  {
    id: 'fpr',
    name: '88.7 Fescue Public Radio',
    label: 'Fescue Public',
    freq: '88.7',
    theme: 'lullaby',
    sign: { who: 'SORREL', text: 'Good afternoon. This is Fescue Public Radio, eighty-eight point seven. I am Sorrel Tillbrook, and I used to read the lessons in the Fescue schoolhouse.' },
    songs: [
      { title: 'Rain on Terracotta, Part One', artist: 'Fescue Public Radio Ambience Dept.' },
      { title: 'The Fence Creaks in B Minor', artist: 'Sorrel Tillbrook (recorded at the gap)' },
      { title: 'Kiln Hymn for a Grey Afternoon', artist: 'The Mossy Wood Choir' },
      { title: 'Gnorwin\'s Ledger, Page Nine', artist: 'Read by the Pipewrights\' Youth Band' },
      { title: 'Lullaby for a Lawn Left Alone', artist: 'Ivy Snailwood' },
      { title: 'Stopping Stone Waltz', artist: 'The Unmowed Strings' },
      { title: 'Cloverfield at Dusk', artist: 'Clay Pot Quartet' },
      { title: 'A Gentle Hum (Not the Blade)', artist: 'Fescue Public Radio Ambience Dept.' },
    ],
    banter: [
      { who: 'SORREL', text: 'Today on Kiln & Culture: why Turfton\'s youth insist on strapping twin turbos to sacred garden implements. I have opinions. Let\'s hold them until the end of the programme.' },
      { who: 'SORREL', text: 'A reminder that the Stopping Stone is not a doorstop. I have had letters. Several of them were from doorstops.' },
      { who: 'SORREL', text: 'We\'ll have forty-five minutes of rain on terracotta after this. It isn\'t rain. I recorded it at the Fence, on a damp night, while something on the other side waited with me. You may hear a creak. Don\'t worry about the creak.' },
      { who: 'SORREL', text: 'The old gardeners said: the lawn keeps you, so keep the lawn. Turfton says the lawn keeps the HOA in business. I think they\'re both right, and I\'m sorry about it.' },
      { who: 'SORREL', text: 'If you can hear a note through your dashboard, that is not a fault in your machine. Wait. Yes, it is. It\'s a note, and it\'s flat.' },
      { who: 'SORREL', text: 'Gnorwin Clayfoot, who would surely have hated a three-speed transmission, was an excellent judge of what not to put in the mouth of the one in the Shed. Keep that in mind on the highway.' },
      { who: 'SORREL', text: 'The programme is brought to you by the Fescue Exiles\' Mutual Aid Society, who ask for nothing but a wheelbarrow and a quiet hearth.' },
      { who: 'SORREL', text: 'The Blade\'s presenters have called us dull. Dull is a Fescue word for careful. Careful is how you get to see the next season.' },
      { who: 'SORREL', text: 'You are listening to the most useful twelve minutes of radio in Turfton, which is not saying a great deal, on a station that has been here longer than the highway. We\'ll take one call, then go and check on the kettle.' },
      { who: 'SORREL', text: 'Dear listener who wrote on the tape: yes, I heard the knock too. No, I am not going to open it. Not while the rain is on.' },
      { who: 'SORREL', text: 'Next week on Kiln & Culture: the ledger of Gnorwin Clayfoot, read aloud by a gnome who has read it four times and still does not believe the last page.' },
      { who: 'SORREL', text: 'Turfton, a question. Who laid the grid? Don\'t answer. Our listeners in the Fells say it is the same grid under the snow. We will find out in March.' },
      { who: 'SORREL', text: 'The Fence has a new knot-hole this week. I have not looked through it. I have been asked to tell you not to either, which is the Fescue way of saying: it is very interesting, and you should.' },
      { who: 'SORREL', text: 'Some of you have written asking whether the Fescue Exiles are coming out of Mossy Wood. Nobody has left the Wood. Gnomes have come in. It is a different thing, and I will explain it on Thursday.' },
    ],
    ads: [
      { who: 'AD', text: 'Pure-Loam Co-op: earthy brown and hemp. Honest soil, honest prices, and nobody in our shop has ever asked where it came from. Pure-Loam. It\'s just loam.' },
    ],
    calls: [
      { who: 'SHELLDON "No-Trail" MUCILAGE (on the line)', text: 'THE GRID IS A TALL-ONE CIRCUIT BOARD, MAN! — SORREL: Thank you, Shelldon. Please keep off the lines. — SHELLDON: I\'m going the other way now. Leaving a message on a snail.' },
      { who: 'LISTENER (Mossy Wood)', text: 'Is the knock on the tape real? — SORREL: It is the knock. Whether it is real is a matter for the knocker.' },
    ],
  },
  {
    id: 'beats',
    name: '104.1 HOA Compliance Beats',
    label: 'Compliance Beats',
    freq: '104.1',
    theme: 'jazz',
    sign: { who: 'CRESS', text: 'Welcome back to Compliance Beats, 104.1. Smooth jazz to trim your edges to. I\'m Cress Caliper, and I am still, technically, on the payroll.' },
    songs: [
      { title: 'Verge Walk', artist: 'The Thorne Lawn Trio' },
      { title: 'Compliance Waltz', artist: 'Cress Caliper & Friends' },
      { title: 'Four Hundred Pages on Dandelions', artist: 'Juniper Vance (vocals, reluctantly)' },
      { title: 'Round Pebbles', artist: 'The Gravel Quintet' },
      { title: 'Smooth Trim', artist: 'Obsidian Brass' },
      { title: 'Clipboard Blues', artist: 'Reginald "Quarter-Inch" Vance' },
      { title: 'Permit to Hum', artist: 'The Municipal Strings' },
      { title: 'Last Thursday in Beige', artist: 'Cress Caliper' },
    ],
    banter: [
      { who: 'CRESS', text: 'Reminder: Section 12-C prohibits unlicensed lawn flamingos, unauthorised puddles and smiling without a municipal permit. I wrote that section. I am very sorry. Keep your hats upright.' },
      { who: 'CRESS', text: 'Compliance tip: your grass is not too long. Your grass is exactly as long as Reginald Vance wishes, which is one millimetre under what it is. Trim it. Then stand up straight. Posture is what they check.' },
      { who: 'CRESS', text: 'A listener asks how to get out of a fine. You don\'t. You get a second fine, for being upset about the first. It is very efficient. I designed the form.' },
      { who: 'CRESS', text: 'The Compliance Beats Smile Hotline is closed. Yes, I know. I\'m the one who closed it. No, you can\'t have the permit form.' },
      { who: 'CRESS', text: 'Your Thorne Lawn & Order verge check is due. Please stop what you\'re doing and look at your verge. There. You\'re fine. Mostly. Verge fines are the cheapest kind, and the most avoidable.' },
      { who: 'CRESS', text: 'We\'re going to a jazz standard now. It was written in a flowerpot by a gnome who never once got a citation, and I find that very hard to forgive.' },
      { who: 'CRESS', text: 'I checked last Friday\'s 4:59 PM filing. Four hundred pages. All about dandelions. Juniper Vance calls it a hostile act. She is right, and I would like that on the record.' },
      { who: 'CRESS', text: 'A note from the Clerk\'s office: please do not call the number on the back of the bulletin. It is a lovely number. It rings in the Thorne tower and it never stops ringing.' },
      { who: 'CRESS', text: 'If you are in a Ride-On at three-Hat heat, please pull over, look ashamed, and wave at the camera. There isn\'t a camera. It is a tradition, and the Watch respects a tradition.' },
      { who: 'CRESS', text: 'Traffic on the Greenhouse Strip: a pair of Code-Enforcement Vans have been parked outside Chirp & Crumb since lunch. One of them is the same van as last Tuesday. We do not know how.' },
      { who: 'CRESS', text: 'I used to wear a beige vest. I still have the vest. I put it on Thursdays to remind myself what I stood for, and to see whether it still fits. It does not. I am not sure I\'m sorry.' },
      { who: 'CRESS', text: 'Reginald Vance has asked me to read out the grass heights for Pebble Lane. I have them. Pebble Lane is fine. Reginald has not asked about the other lanes, and I have decided not to mention it.' },
      { who: 'CRESS', text: 'You\'re listening to a station paid for by the HOA. The music is not. The music is by musicians who were not invited to the HOA. Enjoy.' },
    ],
    ads: [
      { who: 'AD', text: 'Thorne Lawn & Order. Obsidian. Gold. Uniformity. Your curb appeal, managed. Your neighbours, also managed. We don\'t see the problem. We see the lawn.' },
      { who: 'AD', text: 'HOA Compliance & Lien Services: think nobody\'s watching your verge? Reginald Vance is. A crooked hat is a cry for foreclosure. Call the Clerk. Do not call the number on the back of the bulletin.' },
      { who: 'AD', text: 'Clay-Mart: blue and yellow, and every basket is one size smaller than you expected. Happy shopping, gnome.' },
    ],
    calls: [
      { who: 'REGINALD VANCE (on the line)', text: 'I measured this studio\'s carpet at three this morning. It is one centimetre too high. — CRESS: Thank you, Reginald. — REGINALD: I will be measuring you next.' },
      { who: 'CALLER (Cloverfield Farms)', text: 'My fence is four inches too short, and I\'m calling to say I\'m delighted. — CRESS: Delighted is not a permitted emotion, sir. Please write it down and give it to the Clerk.' },
      { who: 'ROOSTER (on the line)', text: 'THE HOA IS A BAROMETER, CRESS! — CRESS: It is a clipboard, Rooster. — ROOSTER: THE CLIPBOARD IS DROPPING!' },
    ],
  },
];

/** Shared commercials, played in any station's ad break (after its own). */
export const ADS: readonly Line[] = [
  { who: 'AD', text: 'Chipped? Cracked? Got your beard caught in a sprinkler? Come on down to the Glaze Clinic! We\'ll buff your brim and glue your arm back on, no questions asked. Now offering twenty-four-hour kiln-resin express!' },
  { who: 'AD', text: 'Is your mower smoking? Did the Hat Watch ask whose flowerpot you drove through? Bring it to Side-Valve Salvage. Fresh paint in three seconds flat. Is the VIN filed off? Great. We don\'t know what a VIN is.' },
  { who: 'AD', text: 'Come lose your acorns in style at the Gnomecino! Now with one hundred per cent fewer chair-thrown brawls! Tuesdays are half-price acorn-poker night. Big Lou checks your hat at the door.' },
  { who: 'AD', text: 'Hungry after a three-Hat chase? Swing by Gnoma\'s Food Truck outside the Glaze Clinic Hospital! Try our Triple-Acorn Waffle! If you ram the truck, don\'t worry. "Oops, a little wobbly! We learn from it!"' },
  { who: 'AD', text: 'Acorn-Cola. Crimson, crisp, and built to the same recipe since the founding of Thatchford. Same recipe, different pot. Acorn-Cola: now with a little more acorn. Please do not ask how much more.' },
  { who: 'AD', text: 'Dandelion Fizz! Electric yellow! Lightly rebellious! The fizz the Dust Flats can\'t stop talking about! (The Dust Flats are not responsible for any talking.)' },
  { who: 'AD', text: 'Stink-Gro! Neon lime! Makes your lawn greener by making your neighbours\' lawns complain. Use as directed. Do not direct it at the HOA.' },
  { who: 'AD', text: 'Kiln-Shield Insurance. Teal, reliable, and very sorry. We cover everything except the things you did, the things you didn\'t do, and that one time you went to Cloverfield. Claims are a process.' },
  { who: 'AD', text: 'Pay \'n\' Glaze: hot pink, shiny, and happy to take your acorns the moment you tell them your name. Hit the wrong side of a Code-Enforcement Van? Pay \'n\' Glaze.' },
  { who: 'AD', text: 'Pigeon-Drop Couriers: dropped from altitude, good luck. Snail-Mail Express: eventually is still on time. Choose one. Both have a branch in Cloverfield, and both are looking for drivers.' },
  { who: 'AD', text: 'Black Dew. Amber and chrome. Ask for it by its proper name, and nobody in Turfton will be surprised. The Black Dew Co. is not responsible for what you do with it in the Greenhouse Strip.' },
];

/** Hat Watch bulletins, by heat level (1-Hat, 2-Hat, 3-Hat). The Watch tops out at three (MAX_HEAT). */
export const HEAT_BULLETINS: Readonly<Record<1 | 2 | 3, readonly Line[]>> = {
  1: [
    { who: 'BULLETIN', text: 'Traffic alert: a gnome in a suspiciously shiny hat has been spotted "aggressively borrowing" a Push-Mower Bike. Keep your keys out of your flowerpots.' },
    { who: 'BULLETIN', text: 'The Hat Watch reminds drivers that keys go in the ignition, not the flowerpot. Yes, Gerald, we know. Please get off the roof.' },
    { who: 'BULLETIN', text: 'A pedestrian on the Greenhouse Strip reports a "metallic hat-glint". Officers are advised to look up, then look at the Strip, then look a bit more.' },
    { who: 'BULLETIN', text: 'A Ride-On has gone missing from the kerb outside the east shops. Its owner says they are "just going to have a word with the Watch". The Watch is busy.' },
  ],
  2: [
    { who: 'BULLETIN', text: 'Two-Hat alert: an unidentified gnome has been seen leaving the Mulch Club by the back door, which is not the door for leaving. Bodyguards are asked to stop pointing.' },
    { who: 'BULLETIN', text: 'Two-Hat advisory: the Watch is asking the public not to honk at the officers. They are doing their best. Their best has a siren, which is the problem.' },
    { who: 'BULLETIN', text: 'Hat Watch units have been pulled from the Glaze Clinic queue to deal with a driver who is, in their words, "really quite annoying about it".' },
    { who: 'BULLETIN', text: 'Two Hats on the brim of a suspect vehicle, reports the Watch. Witnesses describe the vehicle as "a Ride-On doing a very confident impression of a Zero-Turn".' },
  ],
  3: [
    { who: 'BULLETIN', text: 'BREAKING NEWS: an unidentified maniac is drifting a Zero-Turn Racer through downtown Turfton while launching acorns at municipal property! Hat Watch units are advised to... actually, they are all behind Gnoma\'s Food Truck.' },
    { who: 'BULLETIN', text: 'Three-Hat alert: the Watch has requested every cruiser in the city. Eleven have replied. Four are at the Gnomecino, and one is "working on it".' },
    { who: 'BULLETIN', text: 'The Watch\'s public statement reads: "We have the gnome." The gnome has, however, the Watch\'s cruiser. Stay tuned.' },
    { who: 'BULLETIN', text: 'Three-Hat warning: all cruisers are asked to stop scrubbing the Greenhouse Strip. The Strip is not a car wash, and nobody has asked for one.' },
  ],
};

/** Bulletins for things the player does, keyed by the achievement id that marks it. The radio plays them only while on. */
export const EVENT_BULLETINS: Readonly<Record<string, readonly Line[]>> = {
  'gta-borrowed': [
    { who: 'BULLETIN', text: 'A Ride-On has been "borrowed" from outside the Gnomecino. The owner says the borrower was very polite and took the hat with them.' },
    { who: 'BULLETIN', text: 'A Push-Mower Bike has left the Greenhouse Strip at a speed the owner describes as "considerate". The owner would like the bike back.' },
  ],
  'gta-whirligig': [
    { who: 'BULLETIN', text: 'The Spade Guard confirms the Whirligig is not where they left it. They are looking into the possibility of a sandbox in the Dust Flats.' },
    { who: 'BULLETIN', text: 'Fort Sandpit has issued a statement: "The Whirligig is on leave." Nobody has been able to find out who approved the leave.' },
  ],
  'gta-kaboom': [
    { who: 'BULLETIN', text: 'A mower has exploded outside the Glaze Clinic. Its driver is in fine shape, for a gnome in pieces. The Clinic has added a waiting-list charge.' },
    { who: 'BULLETIN', text: 'A Zero-Turn has gone up in a fireball on the ring road. The fire crew says it was "only a little bit of a fireball, but a lot of charcoal".' },
  ],
  'gta-pilot': [
    { who: 'BULLETIN', text: 'A Crop Duster has taken off from the desert airfield with no ground crew, no clearance and a very confident passenger. The airfield calls it "a change of plan".' },
    { who: 'BULLETIN', text: 'The airfield asks that the next Crop Duster be returned to the runway, and the gnome returned to the ground, in that order.' },
  ],
  'gta-skydiver': [
    { who: 'BULLETIN', text: 'A gnome has landed in Turfton Park under an open parachute and the approval of a pigeon. Park staff ask that the pigeon be put back in its box.' },
    { who: 'BULLETIN', text: 'A gnome has bailed out of a Crop Duster over the Dust Flats and is walking back, with a parachute on, and a very good story.' },
  ],
  'gta-first-contract': [
    { who: 'BULLETIN', text: 'Mulch Club sources report a new member has collected a contract. Several gold hats in three biomes are looking nervous this afternoon.' },
    { who: 'BULLETIN', text: 'The Mulch Club has issued a new wanted poster. The poster has no words on it, only a red cross and a very polite pointing finger.' },
  ],
  'gta-ragdoll': [
    { who: 'BULLETIN', text: 'A Ride-On has run over a townsgnome on the Greenhouse Strip. The townsgnome says he is fine, and is "mostly the hat". The Glaze Clinic ambulance is en route.' },
    { who: 'BULLETIN', text: 'A townsgnome has been sent flying over a hedge by a Push-Mower Bike. Witnesses say he landed "very neatly, for a gnome of his shape".' },
  ],
  'gta-drifter': [
    { who: 'BULLETIN', text: 'A mower was seen drifting across the Frostbite Fells, and a snowman has filed a complaint. The snowman says it was not his fault.' },
    { who: 'BULLETIN', text: 'A Zero-Turn has done a full circle on the Cloverfield road and left a perfect ring in the verge. The verge has asked for a crop circle permit.' },
  ],
  'gta-washed-out': [
    { who: 'BULLETIN', text: 'A gnome has been cracked in the middle of Turfton and collected by the Glaze Clinic. Their clay was described as "rather a lot of pieces". Nobody has been asked to pick them up.' },
    { who: 'BULLETIN', text: 'The Glaze Clinic reports a busy day. Several cracked gnomes have been brought in. All of them are being glued back together and asked, politely, to be more careful.' },
  ],
};

/** Traffic reports built from the map's places (the errands from R-026), so the report is always somewhere the player can go. */
export function trafficLine(p: Place): Line {
  return { who: 'TRAFFIC', text: `Reports of a Ride-On ${p.reason}, moving at a stately pace. Please let it past, and wave.` };
}

/** Every line a station can say, for checks (the content test walks these). */
export function allLines(): Line[] {
  return [
    ...STATIONS.flatMap((s) => [s.sign, ...s.banter, ...s.ads, ...s.calls]),
    ...ADS,
    ...Object.values(HEAT_BULLETINS).flat(),
    ...Object.values(EVENT_BULLETINS).flat(),
  ];
}
