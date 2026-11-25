// Loading-screen "concept art" pages (L87): small hand-written SVG sketches, drawn in code, no external files.
// Each svg is a 320x200 pencil-on-paper drawing. Later epics may append pages.
export interface LoadingPage {
  title: string;
  caption: string;
  svg: string;
}

const HEAD = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" role="img" aria-label="Concept art sketch">';
const PAPER = '<rect width="320" height="200" fill="#f4ead2"/><rect x="6" y="6" width="308" height="188" fill="none" stroke="#b9a77d" stroke-width="1" stroke-dasharray="4 3"/>';
const INK = 'fill="none" stroke="#4a3b2a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';
const TXT = 'font-family="\'Bradley Hand\',\'Segoe Print\',\'Comic Sans MS\',cursive" font-size="10" fill="#6b4f2d"';

export const LOADING_PAGES: readonly LoadingPage[] = [
  {
    title: 'Turfton at golden hour',
    caption: 'Pot towers, a perfect grid, and one very long shadow.',
    svg: HEAD + PAPER +
      '<rect x="6" y="120" width="308" height="74" fill="#e6d3a0"/>' +
      '<circle cx="256" cy="52" r="22" fill="#f6c453" opacity=".85"/>' +
      '<path d="M20 120 H300" ' + INK + '/>' +
      '<path d="M40 120 V84 H62 V120 M46 84 L51 72 L56 84 M80 120 V60 H108 V120 M84 60 L94 44 L104 60 M130 120 V92 H150 V120 M178 120 V70 H206 V120 M182 70 L192 54 L202 70" ' + INK + '/>' +
      '<path d="M96 124 L50 192 M150 124 L150 192 M205 124 L250 192 M20 150 H300 M20 172 H300" ' + INK + ' opacity=".5"/>' +
      '<text x="14" y="22" ' + TXT + '>TURFTON, 60 paces a block</text>' +
      '<text x="196" y="108" ' + TXT + '>Thorne Tower?</text></svg>',
  },
  {
    title: 'The Fescue Kiln',
    caption: 'Where every gnome gets fired. Newcomers are billed.',
    svg: HEAD + PAPER +
      '<path d="M100 170 V100 Q100 56 160 56 Q220 56 220 100 V170 Z" fill="#d9b48a" stroke="#4a3b2a" stroke-width="1.6"/>' +
      '<path d="M138 170 V124 Q138 104 160 104 Q182 104 182 124 V170" fill="#6b3a1d" stroke="#4a3b2a" stroke-width="1.6"/>' +
      '<path d="M150 150 Q160 126 170 150 Q160 160 150 150" fill="#f08a2c"/>' +
      '<rect x="146" y="22" width="28" height="36" ' + INK + '/>' +
      '<path d="M152 14 q-6 -8 2 -12 M164 16 q8 -8 0 -14" ' + INK + ' opacity=".6"/>' +
      '<path d="M90 170 H230 M110 78 H210 M104 92 H216" ' + INK + '/>' +
      '<text x="16" y="30" ' + TXT + '>Kilnworks (invoice follows)</text>' +
      '<text x="232" y="126" ' + TXT + '>Kiln-Debt</text></svg>',
  },
  {
    title: 'A ride-on mower, exploded view',
    caption: 'Clay and iron, bolted and glued. Runs on Black Dew.',
    svg: HEAD + PAPER +
      '<rect x="92" y="98" width="130" height="30" rx="8" fill="#c8402f" stroke="#4a3b2a" stroke-width="1.6"/>' +
      '<rect x="120" y="58" width="44" height="26" rx="5" fill="#8a5a2b" stroke="#4a3b2a" stroke-width="1.6"/>' +
      '<path d="M178 70 L196 52 M190 48 H204" ' + INK + '/>' +
      '<circle cx="110" cy="154" r="20" fill="#3a3a3a" stroke="#4a3b2a" stroke-width="1.6"/><circle cx="110" cy="154" r="7" fill="#c9c9c9"/>' +
      '<circle cx="214" cy="158" r="14" fill="#3a3a3a" stroke="#4a3b2a" stroke-width="1.6"/><circle cx="214" cy="158" r="5" fill="#c9c9c9"/>' +
      '<path d="M146 134 V146 M168 134 V146 M110 134 L110 128" ' + INK + ' stroke-dasharray="3 3"/>' +
      '<rect x="240" y="146" width="48" height="14" rx="3" fill="#9aa3ad" stroke="#4a3b2a" stroke-width="1.6"/>' +
      '<path d="M222 112 H238 M238 112 L238 146" ' + INK + ' stroke-dasharray="3 3"/>' +
      '<text x="14" y="26" ' + TXT + '>seat (cushion springs)</text>' +
      '<text x="14" y="188" ' + TXT + '>wheels, bolted</text>' +
      '<text x="230" y="178" ' + TXT + '>blade (mind it)</text>' +
      '<text x="206" y="94" ' + TXT + '>Black Dew tank</text></svg>',
  },
  {
    title: 'Know your gnome: hat, beard, coat',
    caption: 'Fired clay. Chips, cracks, never bleeds. The hat is who you are.',
    svg: HEAD + PAPER +
      '<path d="M118 78 L160 14 L202 78 Z" fill="#c8402f" stroke="#4a3b2a" stroke-width="1.6"/>' +
      '<ellipse cx="160" cy="82" rx="46" ry="8" fill="#a8321f" stroke="#4a3b2a" stroke-width="1.6"/>' +
      '<circle cx="160" cy="100" r="20" fill="#f0c9a0" stroke="#4a3b2a" stroke-width="1.6"/>' +
      '<circle cx="152" cy="96" r="2" fill="#4a3b2a"/><circle cx="168" cy="96" r="2" fill="#4a3b2a"/>' +
      '<path d="M140 104 Q160 176 180 104 Q160 118 140 104 Z" fill="#fbfbf6" stroke="#4a3b2a" stroke-width="1.6"/>' +
      '<path d="M126 150 Q160 126 194 150 V188 H126 Z" fill="#3a6fb0" stroke="#4a3b2a" stroke-width="1.6" opacity=".9"/>' +
      '<path d="M190 120 l8 6 l-6 4 l8 6" ' + INK + '/>' +
      '<text x="16" y="34" ' + TXT + '>HAT = who you are</text>' +
      '<text x="212" y="128" ' + TXT + '>a crack (glue it)</text>' +
      '<text x="14" y="124" ' + TXT + '>beard</text>' +
      '<text x="14" y="172" ' + TXT + '>coat</text></svg>',
  },
  {
    title: 'Loch Moss, with company',
    caption: 'Tessie is nine metres long and has asked to be left alone.',
    svg: HEAD + PAPER +
      '<path d="M20 120 Q60 100 110 118 T210 116 T300 120 V186 H20 Z" fill="#a9d1c6" stroke="#4a3b2a" stroke-width="1.6"/>' +
      '<path d="M70 150 q10 -5 20 0 M200 160 q10 -5 20 0 M130 176 q10 -5 20 0" ' + INK + ' opacity=".6"/>' +
      '<path d="M120 124 Q160 78 214 124 Z" fill="#5f8a4f" stroke="#4a3b2a" stroke-width="1.6"/>' +
      '<path d="M146 112 L164 100 L182 112 M156 124 L170 108" ' + INK + ' opacity=".7"/>' +
      '<ellipse cx="226" cy="116" rx="12" ry="9" fill="#7da56a" stroke="#4a3b2a" stroke-width="1.6"/>' +
      '<circle cx="231" cy="113" r="1.8" fill="#4a3b2a"/>' +
      '<path d="M24 120 V80 M34 120 V70 M44 120 V84" ' + INK + '/>' +
      '<text x="14" y="26" ' + TXT + '>Loch Moss (do not drain)</text>' +
      '<text x="150" y="70" ' + TXT + '>shell: 5 gnome-lengths</text></svg>',
  },
];
