// Turfton FM: the three stations, their hosts and callers, the banter, songs, ads and bulletins. Plain data, no logic
// beyond the traffic line builder. The scheduler (schedule.ts) decides what plays and when.
// Lore: docs/lore/entries/apocrypha/turfton-fm.md (and one entry per host). Story: docs/design/gnome-theft-auto/story.md section 10.
// Rules to keep (R-021, R-016, canon house style): nothing gets wet, soaked, dripping or bloody. Clay cracks and is glued back.

import type { Place } from '../config';
import { RADIO_SONGS } from './music/songs';
import { ADAGIO_STATION } from './adagioStation';

/** A station's playlist: the titles and artists of its songs (the music itself is songs/<station>.ts). */
const playlist =(id: 'blade' | 'fpr' | 'beats' | 'adagio'): Song[] => RADIO_SONGS[id].map(({ title, artist }) => ({ title, artist }));

export type StationId = 'blade' | 'fpr' | 'beats' | 'under' | 'adagio';
export type MusicTheme = 'big-beat' | 'lullaby' | 'jazz' | 'underground' | 'classical';

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
  /**
   * A bonus station: it is not one of the stations "Drive-Time Regular" asks the player to hear. Its music is also one
   * continuous set, not a song at a time: `songs[i]` is the title of the set's i-th cut (the player shows the one that
   * is on, whatever the programme's own song segment says).
   */
  readonly bonus?: boolean;
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
    songs: playlist('blade'),
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
      { who: 'DOCK', text: 'Vinnie "Turbo-Sod" Delacroix is back in the tabloids after trying to ride a Zero-Turn up the VIP escalator at the Gnomecino. Big Lou put him on the pavement, politely, with both hands.' },
      { who: 'DOCK', text: 'Local 404 Boss "Big Wrench" Grout says the Ring Road potholes are staying right where they are until the HOA pays overtime. Three vans have already lost an axle. Grout sends his regards.' },
      { who: 'LAWN-DART', text: 'Word from the birdbath: Vinnie "Turbo-Sod" Delacroix owes Dandelion Fizz three promotional appearances, and his penthouse flowerpot has a boot on the stem.' },
      { who: 'LAWN-DART', text: 'Local 404 Boss "Big Wrench" Grout was seen outside Side-Valve with an Acorn-Cola and a suspiciously thick wrench. Nobody asked what was in the Cola. Everybody moved their vans.' },
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
      { who: 'CALLER (THE GIANT ARMADILLO)', text: 'IT\'S BACK! THE GIANT ARMADILLO JUST ROLLED OVER THREE PANSIES ON ROUTE SOUTH! — DOCK: That\'s a Combine, sir. — CALLER: IT HAD A SHELL AND AN ATTITUDE!' },
    ],
  },
  {
    id: 'fpr',
    name: '88.7 Fescue Public Radio',
    label: 'Fescue Public',
    freq: '88.7',
    theme: 'lullaby',
    sign: { who: 'SORREL', text: 'Good afternoon. This is Fescue Public Radio, eighty-eight point seven. I am Sorrel Tillbrook, and I used to read the lessons in the Fescue schoolhouse.' },
    songs: playlist('fpr'),
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
      { who: 'SORREL', text: 'Sir Reginald "Left-Click" Clayfoot, formerly of Fescue\'s dramatic stage, is touring Turfton with his one-gnome show, Cracked in the Rain. He also voiced the new Stink-Gro advert. We all pay our kiln bills somehow.' },
      { who: 'SORREL', text: 'Glenda "Matte-Finish" Clay is selling jars of Cloverfield Farms pond-edge mud for four hundred acorns a pot. Back in Fescue we called that Tuesday, and it was free.' },
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
    songs: playlist('beats'),
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
      { who: 'CRESS', text: 'The HOA has fined Glenda "Matte-Finish" Clay for an unpermitted billboard on Pebble Lane. Glenda paid in sample jars of her Unfired Aesthetic mud. Reginald Vance is furious. His complexion, however, has never looked better.' },
      { who: 'CRESS', text: 'A memo from Local 404 Boss "Big Wrench" Grout: highway potholes on the northwest ring are "union-protected heritage craters." Two Code-Enforcement Vans have disappeared into them since noon.' },
      { who: 'CRESS', text: 'Sir Reginald "Left-Click" Clayfoot has been cited for dramatic pausing in a no-loitering zone. He gave a four-minute monologue to the parking meter. The meter remained unmoved.' },
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
  {
    id: 'under',
    name: '108.0 Subsoil Radio',
    label: 'Subsoil',
    freq: '108.0',
    theme: 'underground',
    bonus: true,
    sign: { who: 'MOLEMAN', text: 'You have found the end of the dial. Nobody puts it there. This is Subsoil, and I am DJ Moleman, and the floor you are standing on is the speaker.' },
    // One title per cut of the set, in the order the set plays them (see UNDERGROUND_JOURNEY in @lawn/music).
    songs: [
      { title: 'Burrow Hum', artist: 'DJ Moleman' },
      { title: 'Seven Tunnels, No Windows', artist: 'DJ Moleman' },
      { title: 'Mulch Acid', artist: 'DJ Moleman' },
      { title: 'Clod Percussion', artist: 'DJ Moleman' },
      { title: 'Root Cellar Resonance', artist: 'DJ Moleman' },
      { title: 'Tamping Down', artist: 'DJ Moleman' },
      { title: 'Last Train Under the Lawn', artist: 'DJ Moleman' },
    ],
    banter: [
      { who: 'MOLEMAN', text: 'I don\'t do the weather. I do the ground. The ground says there is a Zero-Turn two streets over, a pigeon on the Tribunal roof, and a gnome in this car who has been tapping the wheel off the beat.' },
      { who: 'MOLEMAN', text: 'People ask how I make it so low. I dig the speakers in. A speaker in the air is a rumour. A speaker in the soil is a fact.' },
      { who: 'MOLEMAN', text: 'You\'re hearing one long record tonight. I don\'t stop it between tunes. A tunnel has no gaps in it, and nor should the music.' },
      { who: 'MOLEMAN', text: 'Up top you have the Blade, the Public and the Beats. Three stations, three opinions. Down here I have one opinion, and it is that you should hold the note a little longer.' },
      { who: 'MOLEMAN', text: 'The Hat Watch has been hunting for this transmitter for six weeks. They keep finding Cress Caliper\'s. I have sent her a card. She has framed it, and refuses to say why.' },
      { who: 'MOLEMAN', text: 'A word for the drivers: you can feel a good kick drum in the seat of a mower. That is not the engine. That is me, and I am sorry about your axle.' },
      { who: 'MOLEMAN', text: 'The trick with a long build is not to rush it. A mole does not rush a tunnel. A mole opens it a little more every night and one day there is a room.' },
      { who: 'MOLEMAN', text: 'Somebody wrote to ask if I am a gnome in a mole costume. I am a mole in no costume. The hat is a different matter. The hat is for the antenna.' },
      { who: 'MOLEMAN', text: 'Under Cloverfield the Dew-Wells hum a steady low B-flat. I have tuned to it for a year. It is the only thing in Turfton that has never once been fined.' },
      { who: 'MOLEMAN', text: 'Tonight\'s guest list is the roots of the Great Oak, a family of beetles, and a very old tin of Acorn-Cola nobody has dared to open. All three are in time.' },
      { who: 'MOLEMAN', text: 'I met a drummer who only plays on the offbeat. He says the on-beat is for the Tall Ones. I told him I would play the on-beat, and he could have the rest, and we have not spoken since. It works very well.' },
      { who: 'MOLEMAN', text: 'If the sound gets thin for a minute, don\'t panic. That is called a breakdown. A tunnel is only a breakdown for the soil, and then it is a road.' },
      { who: 'MOLEMAN', text: 'Turfton has a thousand rules and not one of them is below the surface. That is why the best things in this town are down here. Mind the roots.' },
      { who: 'MOLEMAN', text: 'The Carburettors race above me every midnight. I know every one of them by the thump of their engine. The red one has a loose bolt. Tell her I said so, and tell her I said it kindly.' },
      { who: 'MOLEMAN', text: 'Sorrel Tillbrook sent me a tape of a knock. I played it through the floor. The floor knocked back. We have both agreed to leave it there.' },
    ],
    ads: [
      { who: 'AD', text: 'Deep-Soil Co-op: nothing on the shelf is from this year. Everything in the shop is from underneath. Bring a torch, and a very small cart. Deep-Soil. It was there before you were.' },
      { who: 'AD', text: 'Understory Hardware. Tunnel props, lamp-hooks and a staircase made of one root. We do not deliver. We do not know where you live. We have a rough idea of the direction.' },
    ],
    calls: [
      { who: 'LISTENER (Dust Flats)', text: 'Can you play the one that sounds like a mower going through a pipe? — MOLEMAN: I play the one that sounds like a pipe going through a mower. It is a different record. You will like it more.' },
      { who: 'ROOSTER (on the line)', text: 'THE BASS IS THE TALL ONES\' FOOTSTEPS, MOLEMAN! — MOLEMAN: It is a kick drum, Rooster. — ROOSTER: THEY ARE ON THE BEAT! — MOLEMAN: ...They are on the beat.' },
      { who: 'SHELLDON "No-Trail" MUCILAGE (on the line)', text: 'I\'m leaving a message in your tunnel on a snail. — MOLEMAN: Shelldon, the tunnel is eleven miles long. — SHELLDON: He has a good sense of time.' },
    ],
  },
  // ---- E30: Pardonlin's classical station (radio/adagioStation.ts) ----
  ADAGIO_STATION,
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
  { who: 'AD', text: 'Husky-Blade! Cobalt blue, two-stroke, and loud enough to wake the Tall Ones! If your neighbours can still hear their own sprinklers, you\'re not revving hard enough.' },
  { who: 'AD', text: 'Chirp & Crumb! Hot acorn-waffles, lukewarm coffee, and a drive-through wide enough for a Zero-Turn. Chirp & Crumb: technically food!' },
  { who: 'AD', text: 'Walnut Dinghy rentals at New Puddle Marina! Half a walnut shell, lolly-stick oars, and the first boat any gnome learns to row. Ask at the hut. Life jackets are a suggestion.' },
  { who: 'AD', text: 'The Gravy Boat: white porcelain, one spout, and the fastest thing afloat. Steering is optional. Hold on to your gravy.' },
  { who: 'AD', text: 'Watering-Can Steamer, the Loch Moss ferry! Green tin, paddle wheels, and a whistle that is the watering can\'s own. Boards from the Loch Moss dock every hour, weather permitting. Ask for a window seat.' },
  { who: 'AD', text: 'The Clog Cruiser: a big yellow wooden clog with four seats. The family boat. Room for the whole family, the dog, and one extra cousin. It floats, mostly.' },
];

/** Hat Watch bulletins, by heat level (1-Hat, 2-Hat, 3-Hat, 4-Hat "THE HOA"). The Watch tops out at four (MAX_HEAT). */
export const HEAT_BULLETINS: Readonly<Record<1 | 2 | 3 | 4, readonly Line[]>> = {
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
  4: [
    { who: 'BULLETIN', text: 'FOUR-HAT ALERT — THE HOA: Code-Enforcement Vans are rolling down the central avenue! Reginald Vance is leaning out the passenger window with a brass megaphone issuing triple-rate verge citations at forty miles an hour!' },
    { who: 'BULLETIN', text: 'Code Red, or rather Code Beige: THE HOA has scrambled its armoured Code-Enforcement Vans! Reginald Vance is booming through his megaphone: "Pull over! Measure your turf! Straighten that hat!"' },
    { who: 'BULLETIN', text: 'Four-Hat Emergency: every Code-Enforcement Van in Thorne Tower\'s basement has hit the grid. Watch for Reginald Vance\'s megaphone citations — he just fined a pigeon for an unapproved nest trim.' },
    { who: 'BULLETIN', text: 'THE HOA has locked down downtown with heavy Code-Enforcement Vans! Hat Watch cruisers have stepped aside to let Reginald Vance\'s megaphone convoy pass. Keep your brim level and stay off the grass.' },
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
  'gta-fresh-kiln': [
    { who: 'BULLETIN', text: 'Turfton welcomes a brand-new gnome off the snail-coach today — and immediately loses track of a borrowed mower outside the bus stop. Side-Valve Salvage has opened a tab.' },
    { who: 'BULLETIN', text: 'Fresh out the kiln and already on Hat Watch dispatch: a newly arrived gnome has reached Side-Valve Salvage in record time with half the block\'s paint on their bumper.' },
  ],
  'gta-boot-legger': [
    { who: 'BULLETIN', text: 'The Founder\'s Trim Day parade has ended early after Gnorwin Clayfoot\'s thirty-foot papier-mache Boot Float went sideways through three acorn-pretzel carts and straight into the HOA Tribunal!' },
    { who: 'BULLETIN', text: 'A rogue driver has hijacked Gnorwin\'s Boot Parade Float and parked it on the Tribunal\'s gavel. Red Caps and Blue Caps stopped throwing acorns long enough to applaud.' },
  ],
  'gta-turf-violator': [
    { who: 'BULLETIN', text: 'Turf-Code Alert: an HOA Code-Enforcement Van has been reduced to beige scrap in the middle of the avenue! Reginald Vance\'s brass calipers were last seen spinning into a hedge.' },
    { who: 'BULLETIN', text: 'Four-Hat stand-off downtown! Someone just shoved a Code-Enforcement Van clear through a hedge and walked off with the HOA\'s favourite measuring brass.' },
  ],
  'gta-mid-air-jack': [
    { who: 'BULLETIN', text: 'Unbelievable scenes above the Dust Flats: a pilot bailed out of a Crop Duster at altitude and hijacked Fort Sandpit\'s Whirligig off the pad before the Spade Guard could even finish saluting!' },
    { who: 'BULLETIN', text: 'Air-traffic control in the Dust Flats has resigned after watching a gnome parachute out of a Crop Duster straight onto a spinning Whirligig rotor. "Not in the manual," says control.' },
  ],
  'gta-snail-saboteur': [
    { who: 'BULLETIN', text: 'Upset in the Turfton alley races! The rival syndicate\'s undefeated Espresso-Fed Slugs abruptly fell asleep at the starting chalk, leaving Shelldon\'s courier snails to sweep the podium.' },
    { who: 'BULLETIN', text: 'Mystery in the back alleys: someone swapped the racing slugs\' romaine for decaf dandelion greens and vanished in a dandelion puff-cloud. Shelldon "No-Trail" Mucilage denies everything.' },
  ],
  'gta-dry-bone': [
    { who: 'BULLETIN', text: 'Big Lou has reopened the Gnomecino VIP velvet rope after a spotless Zero-Turn courier delivered his high-roller bowler without a single sprinkler smudge on the felt!' },
    { who: 'BULLETIN', text: 'Downtown miracle: a VIP bowler hat crossed four blocks of active lawn sprinklers in an open Zero-Turn and arrived bone-dry. Big Lou nearly smiled.' },
  ],
  'gta-even-cut': [
    { who: 'BULLETIN', text: 'BREAKING NEWS: The Grand Combine has ground to a halt in downtown Turfton with an ancient Fescue Stopping Stone wedged in its intake! Vesper Thorne\'s beige empire is over!' },
    { who: 'BULLETIN', text: 'Turfton is cheering from every porch! The skyscraper harvester is jammed silent, the Golden Acorn is free, and the lawn belongs to the gnomes again.' },
  ],
  'prologue-fresh-kiln': [
    { who: 'BULLETIN', text: 'A freshly fired newcomer stepped off the snail-coach at dawn and immediately led Hat Watch on a three-block chase straight to Side-Valve Salvage.' },
    { who: 'BULLETIN', text: 'Tansy at Side-Valve Salvage has taken in a new driver after a loud, smoky arrival in a borrowed mower. The Watch says they\'re "keeping an eye on the glaze".' },
  ],
  'ch1-mowers-keepers': [
    { who: 'BULLETIN', text: 'Three clamped Push-Mower Bikes have vanished from HOA impound lots around Cloverfield and downtown. Side-Valve Salvage claims the locks "fell off by themselves".' },
    { who: 'BULLETIN', text: 'Cloverfield farmers report their repossessed push-bikes are back in their sheds, minus two very confused HOA enforcers left standing in the ditch.' },
  ],
  'ch1-two-coat-tail': [
    { who: 'BULLETIN', text: 'City Hall gossip: Mayor Barnaby "Two-Coat" Mulch was spotted behind the gazebo handing median deeds to Vesper Thorne\'s courier. The Mayor says "that was a different glaze".' },
    { who: 'BULLETIN', text: 'Councilwoman Juniper Vance has filed a fresh stack of photographs with the Zoning Board, showing Mayor Mulch shaking hands with Thorne Lawn & Order behind City Hall.' },
  ],
  'ch1-tax-break-in': [
    { who: 'BULLETIN', text: 'Security at the Turfton Glaze & Tax Office reports a missing foreclosure deed and a shattered filing cabinet. Auditors Crumb and Silt say they "heard a noise and sat down".' },
    { who: 'BULLETIN', text: 'Someone has liberated Side-Valve Salvage\'s deed from Thorne Tower\'s tax vault — along with blueprints for something called "The Grand Combine".' },
  ],
  'ch1-founders-boot': [
    { who: 'BULLETIN', text: 'Chaos at the Turfton Amphitheater! Gnorwin Clayfoot\'s Boot Parade Float crashed straight through the HOA Tribunal\'s jury box while Reginald Vance dived behind a potted fern.' },
    { who: 'BULLETIN', text: 'The Founder\'s Trim Day Tribunal has adjourned indefinitely after a thirty-foot papier-mache boot flattened the prosecution\'s clipboard.' },
  ],
  'ch2-dew-run': [
    { who: 'BULLETIN', text: 'A Black Dew tanker convoy has been relieved of its cargo on the South Highway! The driver says the hijackers were "very polite about the horn".' },
    { who: 'BULLETIN', text: 'Route South traffic note: an empty HOA convoy escort is parked sideways near Cloverfield while a certain green tanker heads north at alarming speed.' },
  ],
  'ch2-sprinkler-gauntlet': [
    { who: 'BULLETIN', text: 'Granny Gnertrude\'s armored acorn silo has been spotted tearing across Cloverfield Farms on a flatbed, dodging laser-level surveyors and high-pressure garden sprinklers!' },
    { who: 'BULLETIN', text: 'Three HOA surveyors in Cloverfield report their tripods were flattened by a fast-moving acorn silo towing itself through the sprinkler lines.' },
  ],
  'ch2-vespers-offer': [
    { who: 'BULLETIN', text: 'Commotion at the South Highway diner: Vesper Thorne\'s Porcelain Guard drew rifles in the car park after someone turned down a penthouse patio offer.' },
    { who: 'BULLETIN', text: 'Witnesses at the highway diner say Vesper Thorne walked out without the Golden Acorn, muttering about "ungrateful earthenware".' },
  ],
  'ch2-unmowed-tablet': [
    { who: 'BULLETIN', text: 'Smoke rising over the Compost Heap! Unmowed scouts and an unknown driver clashed with HOA welders armouring giant steel plates in the woods.' },
    { who: 'BULLETIN', text: 'Rangers in Mossy Wood report heavy engine rumbles near the Compost Heap, where Elder Bracken says an ancient Fescue warning has just come true.' },
  ],
  'ch3-salvage-raid': [
    { who: 'BULLETIN', text: 'Raid on Side-Valve Salvage! HOA forces hosed down the garage and seized the Golden Acorn, while Tansy vanished into the Under-Deck drain and a fugitive fled north!' },
    { who: 'BULLETIN', text: 'Local 404 potholes on the northwest Ring Road claimed two pursuing HOA cruisers tonight as an injured crew fled toward Frostbite Fells.' },
  ],
  'ch3-kiln-resin-ice': [
    { who: 'BULLETIN', text: 'Reports from Frostbite Fells say an abandoned hillside shrine was raided for warm Kiln-Resin tonight — and Pip Potsworth\'s cracked arm is back in one piece.' },
    { who: 'BULLETIN', text: 'Father Loam confirms fresh resin footprints near the Frozen Birdbath Basin. "Nothing stays cracked forever in the Fells," he told callers.' },
  ],
  'ch3-tundra-drift-run': [
    { who: 'BULLETIN', text: 'Motorists in Frostbite Fells witnessed a Zero-Turn drifting sideways across the frozen duck pond with volatile Black Dew barrels strapped to the bonnet!' },
    { who: 'BULLETIN', text: 'HOA snowplows failed to salt the ice fast enough tonight as smugglers completed a high-speed tundra run for the Carburettors.' },
  ],
  'ch4-runway-flares': [
    { who: 'BULLETIN', text: 'A stolen Crop Duster buzzed the Dust Flats desert at treetop height, dropping signal flares across the alkali pan before vanishing toward Fort Sandpit.' },
    { who: 'BULLETIN', text: 'Ground crew at the Desert Airfield say someone took the red Crop Duster without filing a flight plan — again — and left flares blinking in the cacti.' },
  ],
  'ch4-sandpit-drop': [
    { who: 'BULLETIN', text: 'Fort Sandpit is at full scramble! A parachutist dropped straight onto the sandbox perimeter wall and lifted the Whirligig right off its pad!' },
    { who: 'BULLETIN', text: 'Commander Diggs was seen chasing the stolen Whirligig down the sand dunes in a Zero-Turn before his own radio crackled with bad news from Thorne Tower.' },
  ],
  'ch4-spade-truce': [
    { who: 'BULLETIN', text: 'Shocking reversal at Fort Sandpit! Vesper\'s HOA goons tried to lock the Spade Guard armory, and Commander Diggs joined the rebels instead. "Nobody fires the Guard!"' },
    { who: 'BULLETIN', text: 'Fort Sandpit\'s gates are wide open after Commander Diggs cleared out HOA lockout enforcers with a Whirligig flyover and pledged the Guard to Turfton.' },
  ],
  'ch5-even-cut': [
    { who: 'BULLETIN', text: 'THE EVEN CUT: The Grand Combine rolled down the central avenue under air assault until the Fescue Stopping Stone jammed its blades for good!' },
    { who: 'BULLETIN', text: 'Turfton\'s skyline is quiet at last — Side-Valve Salvage is sweeping out the bay, Mayor Mulch is ordering fresh red paint, and the Grand Combine sits silent in the canal.' },
  ],
  'sq-grid-truthers': [
    { who: 'BULLETIN', text: 'Downtown traffic note: Mossley "Plumb-Line" Inkcap has unearthed a redwood-sized Tall-One Pencil under Center Datum (0, 0) and is selling the graphite as artisan eyebrow pencil.' },
    { who: 'BULLETIN', text: 'Survey crews confirm Turfton is laid out on a suspiciously exact sixty-unit grid. The HOA has declined to comment on why the pencil is yellow.' },
  ],
  'sq-porcelain-blues': [
    { who: 'BULLETIN', text: 'Three stolen wax lanterns have been returned to the Tall House Porch after a quiet skirmish in Mossy Wood. Clara says the porcelain glaze is safe for another night.' },
    { who: 'BULLETIN', text: 'HOA scavengers in Mossy Wood report being chased off the Tall House Porch by an unnamed clay courier. The lanterns are lit once more.' },
  ],
  'sq-fescue-fugitive': [
    { who: 'BULLETIN', text: 'Patio Heights gossip: Vesper Thorne\'s patio door keeps slamming shut after someone liberated the Replica Stopping Stone he was using as a doorstop.' },
    { who: 'BULLETIN', text: 'Whether it\'s back in Unmowed Hollow or sitting on Granny Gnertrude\'s scale, the Replica Stopping Stone is officially out of Patio Heights.' },
  ],
  'sq-hoa-audit': [
    { who: 'BULLETIN', text: 'Scandal at Thorne Tower! Five HOA citation inspectors across all five biomes have been cracked and their clipboards leaked—proving the Tall Ones aren\'t even on the board.' },
    { who: 'BULLETIN', text: 'Former clerk Burt has released the HOA overtime ledgers. Highlights include a 40-Acorn fine issued to a Dust Flats cactus for "unruly needles."' },
  ],
  'sq-castaway-drydock': [
    { who: 'BULLETIN', text: 'Maritime bulletin on the Southern Drainage Canal: Driftwood\'s turf-raft has been hauled across Cloverfield by a Combine and moored safely at (55, 230).' },
    { who: 'BULLETIN', text: 'Canal traffic alert: Driftwood is back on the water, warning passersby about "forged lawn sharks" near the south culvert.' },
  ],
  'sq-mulch-pyramid': [
    { who: 'BULLETIN', text: 'Consumer alert in Patio Heights: "Artisanal Miracle Mulch" is actually dyed sawdust and craft glitter, and the wasps are furious. Cedric "Double-Bag" Peat is unavailable for comment.' },
    { who: 'BULLETIN', text: 'The Chapel of Mulch\'s glitter-sawdust pyramid scheme has collapsed after a rogue driver repoed the spreader back to Side-Valve Salvage.' },
  ],
  'sq-biscuit-hotdog': [
    { who: 'BULLETIN', text: 'Cloverfield Farms update: a Combine Harvester was seen dragging a bus-sized rubber hotdog out of Biscuit\'s Nap crater, squeaking loud enough to scatter two Hat Watch cruisers.' },
    { who: 'BULLETIN', text: 'Farmer Bramble\'s barn is safe tonight after Biscuit\'s giant squeaky hotdog was winched out of the crater and parked indoors.' },
  ],
  'sq-snail-rigging': [
    { who: 'BULLETIN', text: 'Turfton alley bookies are howling after the Espresso-Fed Slugs nodded off mid-sprint, handing the underground Snail Derby to Shelldon "No-Trail" Mucilage\'s team!' },
    { who: 'BULLETIN', text: 'A Dandelion Puff-Grenade cleared out the rival slug paddock behind the alley dumpsters tonight. Shelldon\'s courier snails are back on schedule.' },
  ],
  'sq-porcelain-support': [
    { who: 'BULLETIN', text: 'A shock-absorbed Ride-On Lowrider was spotted hopping over Mossy Wood roots tonight, ferrying four porcelain refugees to a padded bunker without a single chip.' },
    { who: 'BULLETIN', text: 'Clara\'s Porcelain Support Group has reached Unmowed Hollow safely. Witnesses say the passengers spent the entire ride arguing about toaster theology.' },
  ],
  'sq-hose-revolt': [
    { who: 'BULLETIN', text: 'Baroness Brenda of the Vinyl Lounge has declared the southern canal "The Sovereign Republic of New Puddle" after four kinked garden hoses flooded Vesper\'s putting green!' },
    { who: 'BULLETIN', text: 'HOA country-club greenskeepers are in panic as pressurized Tall-One hoses turn the fairways into a duck pond. Brenda refuses all tax notices.' },
  ],
  'sq-big-lou-embargo': [
    { who: 'BULLETIN', text: 'Big Lou has lifted the Gnomecino\'s hat embargo after a crate of microfiber towels was recovered from Red Cap hooligans and a VIP bowler arrived spotless!' },
    { who: 'BULLETIN', text: 'High-rollers are cheering outside the Gnomecino tonight — Big Lou inspected the VIP\'s bowler hat with a magnifying glass and waved the whole table inside.' },
  ],
  // The Kerbside Exchange city contracts (quests/cityQuests.ts).
  'city-kerbside-rounds': [
    { who: 'BULLETIN', text: 'Dot Pennywort\'s Kerbside Exchange has a new name on its books. The board by the Central Bus Stop says the newcomer delivers, and delivers on time.' },
    { who: 'BULLETIN', text: 'Today\'s Tattler reached Bodega & Sons, the Greenhouse Strip and the City Hall steps before lunch. Councilwoman Vance asks everyone to bring a chair on Thursday.' },
  ],
  'city-impound-run': [
    { who: 'BULLETIN', text: 'The HOA impound in the Clay-Mart returns yard is one Zero-Turn short this afternoon. The clerks say the paperwork is in order. The Zero-Turn is not.' },
    { who: 'BULLETIN', text: 'Pay \'n\' Glaze reports a rush job: one Zero-Turn, one fresh coat, one HOA tag gone for good. Pip Potsworth denies everything, loudly.' },
  ],
  'city-glow-band-express': [
    { who: 'BULLETIN', text: 'The Velvet Toadstools played the Amphitheater to a crowd of glowing hats tonight. Neon-Moth Nina says every band arrived with seconds to spare.' },
    { who: 'BULLETIN', text: 'A push-bike courier was clocked crossing Turfton from the Greenhouse Strip to Park & Arts in record time. The Hat Watch would like a word, eventually.' },
  ],
  'city-penthouse-exclusive': [
    { who: 'BULLETIN', text: 'The Turfton Tattler\'s front page: VESPER\'S PENTHOUSE HAS NO GRASS. Thorne Lawn & Order calls the photo "unflattering to the drapes".' },
    { who: 'BULLETIN', text: 'Watch officers report a Sycamore Copter circling Thorne Tower at roof height this evening. The Tattler declines to name its photographer.' },
  ],
  'city-skyway-robbery': [
    { who: 'BULLETIN', text: 'An HOA van was found parked outside the Local 404 Union Hall in Clay-Mart Industrial with its cargo missing. Big Wrench Grout says the Skyway is paid for.' },
    { who: 'BULLETIN', text: 'Local 404 calls the Turfton Skyway "the only road the HOA won\'t drive". Somebody drove it very fast today, eastbound, ahead of a van.' },
  ],
  'gta-tessie-rumour': [
    { who: 'BULLETIN', text: 'BREAKING: something big in Loch Moss. A ferry passenger saw a hump the size of a Watering-Can Steamer roll under the surface at dusk, then say "oh, that\'s not right" and sit down.' },
    { who: 'BULLETIN', text: 'Driftwood has been seen on the loch shore telling anyone who will listen "I told you so". Nobody has yet asked him what he told them.' },
  ],
  'sq-tessie': [
    { who: 'BULLETIN', text: 'The HOA dredger has withdrawn from Loch Moss. The golf development is "under review", and the review is expected to take a very long time.' },
    { who: 'BULLETIN', text: 'Reports of a gnome riding something enormous across the loch at dusk, with a sailor\'s hat held on by one hand and a shout of "Full ahead!" Turfton FM cannot confirm the shout.' },
  ],
  'gta-tessie-tabloid': [
    { who: 'BULLETIN', text: 'The Turfton Tattler\'s front page has a photo of the loch. Experts call the shape in the middle a log, a hat, or a very large shoe.' },
    { who: 'BULLETIN', text: 'The Tattler is selling out at every stall in Turfton. The Tattler\'s editor says the photo is "probably real", which is the most honest thing the Tattler has said all year.' },
  ],
  'tessie-surfaced': [
    { who: 'BULLETIN', text: 'Loch Moss has a new sighting: something enormous and calm surfaced off the dock this afternoon, looked at the Steamer for a while, and went back under. Ferry timetables are unaffected.' },
    { who: 'BULLETIN', text: 'Driftwood says it is "the usual one". He has not said which usual one, and he has not come down from his raft.' },
  ],
  'cow-tipped': [
    { who: 'BULLETIN', text: 'A gnome on foot walked straight into a standing cow in Cloverfield Farms and tipped it over. The cow got up, shook itself off and wandered away, unbothered.' },
    { who: 'BULLETIN', text: 'Cloverfield Farms reports a gnome has knocked over a cow. The cow has asked for no statement and has gone back to grazing.' },
  ],
  'herd-herded': [
    { who: 'BULLETIN', text: 'A Combine drove a whole herd of cows, sheep and pigs across Cloverfield Farms like a sheepdog. Farmer Bramble is unsure whether to thank them.' },
    { who: 'BULLETIN', text: 'A Mulch Spreader has herded the Cloverfield animals into the north field in under four minutes. The animals are fine. Farmer Bramble is still counting.' },
  ],
  'drey-raid': [
    { who: 'BULLETIN', text: 'The Drey Gang mobbed a gnome on foot in Cloverfield Farms, pinched his Acorns and pelted more at him from the hedgerows. The squirrels deny it, and are keeping the acorns.' },
    { who: 'BULLETIN', text: 'Hedgerow report: the Drey Gang ambushed a gnome from the old silo, nicked a pocketful of Acorns and retreated, chattering, into the hedge.' },
  ],
  'drey-mower-stolen': [
    { who: 'BULLETIN', text: 'Two squirrels of the Drey Gang drove a parked mower into the hedgerows and on to another den. The squirrels say they are not car thieves. They are car borrowers. The mower has been returned, roughly.' },
    { who: 'BULLETIN', text: 'A parked mower has gone missing from a Cloverfield lay-by. Witnesses saw two squirrels at the wheel, looking very pleased with themselves and very short of a licence.' },
  ],
  'drey-scattered': [
    { who: 'BULLETIN', text: 'Someone opened fire on a Drey Gang den in Cloverfield Farms and the squirrels scattered into the hedges. They say they will regroup, and they have said so loudly.' },
    { who: 'BULLETIN', text: 'The Drey Gang has been scattered from its silo. Witnesses say the squirrels have gone to ground and are regrouping by the hedgerow. Please do not go looking.' },
  ],
  'snowman-smashed': [
    { who: 'BULLETIN', text: 'A snowman in Frostbite Fells has been smashed to bits. It will be rebuilt overnight. Nobody says by whom.' },
    { who: 'BULLETIN', text: 'Frostbite Fells police are looking into a smashed snowman on the duck pond. Its head has been found, and is being put back the usual way.' },
  ],
  'bear-shrug': [
    { who: 'BULLETIN', text: 'WEATHER REPORT, FROSTBITE FELLS: polar bears lounging in deck chairs, sunglasses on, were shot at and rammed this afternoon. They shrugged. Conditions: chill.' },
    { who: 'BULLETIN', text: 'Fells forecast: a Zero-Turn rammed the polar bears\' deck and was ignored. Visibility good. Patience, high. Conditions: chill.' },
  ],
  'hive-knocked': [
    { who: 'BULLETIN', text: 'A straw hive in Tallgrass Commons, where the grass is taller than a gnome, has been knocked over. The bees are out. Please walk, do not run, and do not wave.' },
    { who: 'BULLETIN', text: 'Tallgrass Commons reports a tipped-over hive. The bees are out and looking for whoever did it. The bees would like to be called "the committee".' },
  ],
  'swarm-escaped': [
    { who: 'BULLETIN', text: 'A gnome outran a bee swarm through Tallgrass Commons and got clear. The bees have gone home. Nobody is hurt, and nobody is sure whose hat was in the hive.' },
    { who: 'BULLETIN', text: 'Good news from the Commons: the swarm lost interest at the far fence and went home. The gnome who outran them is asking for a bigger hat.' },
  ],
};

/** Traffic reports built from the map's places (the errands from R-026), so the report is always somewhere the player can go. */
export function trafficLine(p: Place): Line {
  return { who: 'TRAFFIC', text: `Reports of a Ride-On ${p.reason}, moving at a stately pace. Please let it past, and wave.` };
}

/** Traffic on the five river bridges: one line per bridge, named verbatim. The scheduler adds them to the traffic pool. */
export const BRIDGE_TRAFFIC: readonly Line[] = [
  { who: 'TRAFFIC', text: 'Fellsmelt Bridge is clear, though a slow Combine is taking the deck at walking pace. A boat is passing underneath on the upper river. Mind the gap, and mind the Combine.' },
  { who: 'TRAFFIC', text: 'Ravine Bridge on Highway West: a Watering-Can Steamer is passing beneath in the Mossy Wood ravine. Traffic is slowing to look. Please keep moving, Turfton.' },
  { who: 'TRAFFIC', text: 'Bracken Bridge, Ring Road South-West: a Clog Cruiser has asked for the bridge to be "a bit higher, please". The bridge has declined to comment. Expect delays.' },
  { who: 'TRAFFIC', text: 'Culvert Bridge on Highway South is clear. A Walnut Dinghy is drifting under the Southern Drainage Canal, rowed by a gnome who is not in charge of it.' },
  { who: 'TRAFFIC', text: 'Clover Bridge, Ring Road South-East: one slow Combine on the deck and a boat underneath on the farm river. Drivers are asked to stay calm and let the Combine finish its sentence.' },
];

/** Every line a station can say, for checks (the content test walks these). */
export function allLines(): Line[] {
  return [
    ...STATIONS.flatMap((s) => [s.sign, ...s.banter, ...s.ads, ...s.calls]),
    ...ADS,
    ...Object.values(HEAT_BULLETINS).flat(),
    ...Object.values(EVENT_BULLETINS).flat(),
    ...BRIDGE_TRAFFIC,
  ];
}
