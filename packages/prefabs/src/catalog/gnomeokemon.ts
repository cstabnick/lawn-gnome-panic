// 42 Gnomokemon creature prefabs themed off Gnomomia and Lawn Gnome Panic lore.
import type { PrefabDef } from '../types';

export const GNOMEOKEMON: readonly PrefabDef[] = [
  {
    "id": "sproutling",
    "name": "Sproutling",
    "category": "gnomeokemon",
    "uses": [
      "place",
      "collect"
    ],
    "tags": [
      "gnomeokemon",
      "bloom",
      "mossbottom",
      "starter",
      "sprout",
      "plant"
    ],
    "emoji": [
      "🌱",
      "🌿"
    ],
    "tint": "moss",
    "trim": "leaf",
    "pivots": {
      "head": [
        0,
        0.36,
        0
      ],
      "sprout": [
        0,
        0.62,
        0
      ]
    },
    "about": "Bloom starter: a plump moss-glazed clay bulb with a twin-leaf sprout crest.",
    "examine": [
      "Its mossy glaze stays cool even at noon; kilnwrights swear it grew legs on its own.",
      "When startled, it tucks its stubby feet in and pretends to be an ordinary turnip.",
      "Old Mossbottom rhyme: \"Two leaves up, rain on the way; three leaves curled, Frost is at play.\"",
      "Do not water it after dusk unless you want it humming at your windowsill until dawn."
    ],
    "parts": [
      {
        "s": "ball",
        "d": [
          0.075
        ],
        "at": [
          0.11,
          0.06,
          0.05
        ],
        "scale": [
          1,
          0.8,
          1.3
        ],
        "c": "dirt",
        "mirror": true,
        "name": "foot"
      },
      {
        "s": "ball",
        "d": [
          0.22
        ],
        "at": [
          0,
          0.24,
          0
        ],
        "scale": [
          1,
          0.92,
          0.96
        ],
        "c": "tint",
        "name": "body"
      },
      {
        "s": "ball",
        "d": [
          0.15
        ],
        "at": [
          0,
          0.21,
          0.11
        ],
        "scale": [
          0.95,
          0.9,
          0.6
        ],
        "c": "mushroom-stem",
        "name": "belly"
      },
      {
        "s": "ball",
        "d": [
          0.18
        ],
        "at": [
          0,
          0.44,
          0.02
        ],
        "scale": [
          1.05,
          0.9,
          0.95
        ],
        "c": "tint",
        "group": "head",
        "name": "head"
      },
      {
        "s": "wedge",
        "d": [
          0.06,
          0.12,
          0.16
        ],
        "at": [
          0.18,
          0.47,
          -0.02
        ],
        "rot": [
          -15,
          25,
          -45
        ],
        "c": "trim",
        "mirror": true,
        "group": "head",
        "name": "ear"
      },
      {
        "s": "ball",
        "d": [
          0.042
        ],
        "at": [
          0.075,
          0.45,
          0.16
        ],
        "c": "black",
        "mirror": true,
        "group": "head",
        "name": "eye"
      },
      {
        "s": "ball",
        "d": [
          0.016
        ],
        "at": [
          0.085,
          0.465,
          0.195
        ],
        "c": "white",
        "glow": true,
        "mirror": true,
        "group": "head",
        "name": "eye-shine"
      },
      {
        "s": "ball",
        "d": [
          0.03
        ],
        "at": [
          0,
          0.41,
          0.19
        ],
        "c": "clay",
        "group": "head",
        "name": "nose"
      },
      {
        "s": "cyl",
        "d": [
          0.022,
          0.028,
          0.14
        ],
        "at": [
          0,
          0.66,
          0
        ],
        "c": "leaf-dark",
        "group": "sprout",
        "name": "stem"
      },
      {
        "s": "ball",
        "d": [
          0.075
        ],
        "at": [
          0.075,
          0.74,
          0
        ],
        "rot": [
          0,
          0,
          -25
        ],
        "scale": [
          1.3,
          0.3,
          0.75
        ],
        "c": "trim",
        "mirror": true,
        "group": "sprout",
        "name": "leaf"
      }
    ]
  },
  {
    "id": "kilnpup",
    "name": "Kilnpup",
    "category": "gnomeokemon",
    "uses": [
      "place",
      "collect"
    ],
    "tags": [
      "gnomeokemon",
      "sun",
      "rockery",
      "starter",
      "fire",
      "clay"
    ],
    "emoji": [
      "🔥",
      "🐕"
    ],
    "tint": "terracotta",
    "trim": "flame",
    "pivots": {
      "head": [
        0,
        0.34,
        0.14
      ],
      "tail": [
        0,
        0.28,
        -0.22
      ]
    },
    "about": "Sun starter: a stout terracotta hound-gnome with a chimney collar and ember tail.",
    "examine": [
      "Shaped from Rockery red clay and fired twice so its belly stays warm to the touch.",
      "Kilnkeepers keep one near the drying racks; it barks softly whenever a pot is about to crack.",
      "Its tail is not real fire, just a spark-glaze bead that refuses to cool down.",
      "Give it a cold turnip and it will stare at you until you toast it."
    ],
    "parts": [
      {
        "s": "cyl",
        "d": [
          0.045,
          0.055,
          0.14
        ],
        "at": [
          0.1,
          0.07,
          0.13
        ],
        "c": "clay-dark",
        "mirror": true,
        "name": "front-leg"
      },
      {
        "s": "cyl",
        "d": [
          0.048,
          0.058,
          0.14
        ],
        "at": [
          0.1,
          0.07,
          -0.14
        ],
        "c": "clay-dark",
        "mirror": true,
        "name": "back-leg"
      },
      {
        "s": "pill",
        "d": [
          0.13,
          0.22
        ],
        "at": [
          0,
          0.22,
          -0.01
        ],
        "rot": [
          90,
          0,
          0
        ],
        "c": "tint",
        "name": "body"
      },
      {
        "s": "ring",
        "d": [
          0.13,
          0.032
        ],
        "at": [
          0,
          0.31,
          0.11
        ],
        "rot": [
          55,
          0,
          0
        ],
        "c": "iron-dark",
        "name": "collar"
      },
      {
        "s": "ball",
        "d": [
          0.15
        ],
        "at": [
          0,
          0.39,
          0.18
        ],
        "scale": [
          1,
          0.95,
          1.05
        ],
        "c": "tint",
        "group": "head",
        "name": "head"
      },
      {
        "s": "box",
        "d": [
          0.11,
          0.08,
          0.11
        ],
        "at": [
          0,
          0.35,
          0.3
        ],
        "c": "clay",
        "group": "head",
        "name": "snout"
      },
      {
        "s": "ball",
        "d": [
          0.028
        ],
        "at": [
          0,
          0.38,
          0.355
        ],
        "c": "black",
        "group": "head",
        "name": "nose"
      },
      {
        "s": "cone",
        "d": [
          0.05,
          0.13
        ],
        "at": [
          0.11,
          0.52,
          0.15
        ],
        "rot": [
          0,
          0,
          -18
        ],
        "c": "clay-dark",
        "mirror": true,
        "group": "head",
        "name": "ear"
      },
      {
        "s": "ball",
        "d": [
          0.03
        ],
        "at": [
          0.065,
          0.42,
          0.3
        ],
        "c": "trim",
        "glow": true,
        "mirror": true,
        "group": "head",
        "name": "eye"
      },
      {
        "s": "cone",
        "d": [
          0.055,
          0.16
        ],
        "at": [
          0,
          0.35,
          -0.28
        ],
        "rot": [
          -45,
          0,
          0
        ],
        "c": "trim",
        "glow": true,
        "group": "tail",
        "name": "tail-flame"
      },
      {
        "s": "ball",
        "d": [
          0.045
        ],
        "at": [
          0,
          0.31,
          -0.24
        ],
        "c": "spark",
        "glow": true,
        "group": "tail",
        "name": "tail-core"
      }
    ]
  },
  {
    "id": "dewdrop",
    "name": "Dewdrop",
    "category": "gnomeokemon",
    "uses": [
      "place",
      "collect"
    ],
    "tags": [
      "gnomeokemon",
      "rain",
      "thatchford",
      "starter",
      "water",
      "frog"
    ],
    "emoji": [
      "💧",
      "🐸"
    ],
    "tint": "glaze-blue",
    "trim": "leaf",
    "pivots": {
      "head": [
        0,
        0.32,
        0.02
      ],
      "cap": [
        0,
        0.5,
        0
      ]
    },
    "about": "Rain starter: a round glaze-blue pond-sprite wearing a lily-pad cap.",
    "examine": [
      "Puffed up like a raindrop about to fall off a cabbage leaf.",
      "Thatchford anglers carry one in a bucket; it croaks louder whenever the Hose pressure rises.",
      "Its translucent cheek-sacs shimmer with cool cistern water.",
      "If it sits on your boot, you are legally required to wait until it hops off."
    ],
    "parts": [
      {
        "s": "box",
        "d": [
          0.1,
          0.04,
          0.14
        ],
        "at": [
          0.13,
          0.02,
          0.07
        ],
        "rot": [
          0,
          -15,
          0
        ],
        "c": "water",
        "mirror": true,
        "name": "foot"
      },
      {
        "s": "ball",
        "d": [
          0.21
        ],
        "at": [
          0,
          0.21,
          0
        ],
        "scale": [
          1.1,
          0.88,
          1
        ],
        "c": "tint",
        "name": "body"
      },
      {
        "s": "ball",
        "d": [
          0.15
        ],
        "at": [
          0,
          0.18,
          0.09
        ],
        "scale": [
          1,
          0.85,
          0.65
        ],
        "c": "glass",
        "alpha": 0.65,
        "name": "belly"
      },
      {
        "s": "ball",
        "d": [
          0.065
        ],
        "at": [
          0.14,
          0.3,
          0.12
        ],
        "c": "water",
        "alpha": 0.7,
        "mirror": true,
        "group": "head",
        "name": "cheek"
      },
      {
        "s": "ball",
        "d": [
          0.055
        ],
        "at": [
          0.085,
          0.42,
          0.11
        ],
        "c": "tint",
        "mirror": true,
        "group": "head",
        "name": "eye-bump"
      },
      {
        "s": "ball",
        "d": [
          0.032
        ],
        "at": [
          0.09,
          0.425,
          0.155
        ],
        "c": "black",
        "mirror": true,
        "group": "head",
        "name": "eye"
      },
      {
        "s": "ball",
        "d": [
          0.014
        ],
        "at": [
          0.095,
          0.44,
          0.18
        ],
        "c": "spark",
        "glow": true,
        "mirror": true,
        "group": "head",
        "name": "eye-glint"
      },
      {
        "s": "cyl",
        "d": [
          0.21,
          0.22,
          0.035
        ],
        "at": [
          0,
          0.49,
          -0.01
        ],
        "rot": [
          -8,
          0,
          0
        ],
        "c": "trim",
        "group": "cap",
        "name": "lilypad"
      },
      {
        "s": "cone",
        "d": [
          0.045,
          0.09
        ],
        "at": [
          0.07,
          0.55,
          0.03
        ],
        "rot": [
          0,
          0,
          -12
        ],
        "c": "petal",
        "group": "cap",
        "name": "bud"
      }
    ]
  },
  {
    "id": "mossback",
    "name": "Mossback",
    "category": "gnomeokemon",
    "uses": [
      "place",
      "collect"
    ],
    "tags": [
      "gnomeokemon",
      "bloom",
      "mossbottom",
      "snail",
      "mushroom"
    ],
    "emoji": [
      "🍄",
      "🐌"
    ],
    "tint": "mushroom-cap",
    "trim": "moss",
    "pivots": {
      "head": [
        0,
        0.14,
        0.2
      ],
      "cap": [
        0,
        0.36,
        -0.04
      ]
    },
    "about": "A Mossbottom garden snail that carries a living red toadstool on its mossy shell.",
    "examine": [
      "Its shell is half limestone, half moss, and topped with a plump spotted cap.",
      "Mossbottom villagers follow its slime trail to find the best shade on hot afternoons.",
      "When threatened, it pulls its eyestalks in and looks exactly like a harmless mushroom.",
      "Never mistake it for a stool; it hates being sat on and slides away at two inches a minute."
    ],
    "parts": [
      {
        "s": "pill",
        "d": [
          0.1,
          0.36
        ],
        "at": [
          0,
          0.08,
          0.04
        ],
        "rot": [
          90,
          0,
          0
        ],
        "c": "shell",
        "name": "foot"
      },
      {
        "s": "ball",
        "d": [
          0.095
        ],
        "at": [
          0,
          0.15,
          0.25
        ],
        "c": "shell",
        "group": "head",
        "name": "head"
      },
      {
        "s": "cyl",
        "d": [
          0.014,
          0.016,
          0.12
        ],
        "at": [
          0.05,
          0.26,
          0.28
        ],
        "rot": [
          15,
          0,
          -14
        ],
        "c": "shell",
        "mirror": true,
        "group": "head",
        "name": "stalk"
      },
      {
        "s": "ball",
        "d": [
          0.025
        ],
        "at": [
          0.065,
          0.32,
          0.3
        ],
        "c": "black",
        "mirror": true,
        "group": "head",
        "name": "eye"
      },
      {
        "s": "ball",
        "d": [
          0.18
        ],
        "at": [
          0,
          0.22,
          -0.05
        ],
        "scale": [
          1,
          0.85,
          1.15
        ],
        "c": "trim",
        "name": "shell"
      },
      {
        "s": "cyl",
        "d": [
          0.075,
          0.095,
          0.14
        ],
        "at": [
          0,
          0.37,
          -0.05
        ],
        "c": "mushroom-stem",
        "group": "cap",
        "name": "stem"
      },
      {
        "s": "cone",
        "d": [
          0.24,
          0.18
        ],
        "at": [
          0,
          0.5,
          -0.05
        ],
        "c": "tint",
        "group": "cap",
        "name": "cap"
      },
      {
        "s": "ball",
        "d": [
          0.032
        ],
        "at": [
          0.1,
          0.49,
          0.06
        ],
        "c": "white",
        "mirror": true,
        "group": "cap",
        "name": "spot-front"
      },
      {
        "s": "ball",
        "d": [
          0.028
        ],
        "at": [
          0.09,
          0.5,
          -0.14
        ],
        "c": "white",
        "mirror": true,
        "group": "cap",
        "name": "spot-back"
      },
      {
        "s": "ball",
        "d": [
          0.03
        ],
        "at": [
          0,
          0.56,
          -0.04
        ],
        "c": "white",
        "group": "cap",
        "name": "spot-top"
      }
    ]
  },
  {
    "id": "staghorn",
    "name": "Staghorn",
    "category": "gnomeokemon",
    "uses": [
      "place",
      "collect"
    ],
    "tags": [
      "gnomeokemon",
      "bloom",
      "mossbottom",
      "beetle",
      "shelled"
    ],
    "emoji": [
      "🪲"
    ],
    "tint": "chitin",
    "trim": "brass",
    "pivots": {
      "head": [
        0,
        0.2,
        0.18
      ]
    },
    "about": "A heavy-shelled log-mound stag beetle with brass-tinted pincer mandibles.",
    "examine": [
      "Its dark carapace is tougher than oak bark and shines like oiled iron.",
      "Young Wardens test their shields by letting a Staghorn charge them once.",
      "It clicks its mandibles in rhythm whenever two beetles argue over a fallen log.",
      "Drop a dab of honey nearby and it forgets all about pinching your shins."
    ],
    "parts": [
      {
        "s": "cyl",
        "d": [
          0.022,
          0.018,
          0.14
        ],
        "at": [
          0.18,
          0.07,
          0.14
        ],
        "rot": [
          0,
          0,
          -30
        ],
        "c": "chitin",
        "mirror": true,
        "name": "leg-f"
      },
      {
        "s": "cyl",
        "d": [
          0.022,
          0.018,
          0.14
        ],
        "at": [
          0.21,
          0.07,
          0
        ],
        "rot": [
          0,
          0,
          -30
        ],
        "c": "chitin",
        "mirror": true,
        "name": "leg-m"
      },
      {
        "s": "cyl",
        "d": [
          0.022,
          0.018,
          0.14
        ],
        "at": [
          0.18,
          0.07,
          -0.14
        ],
        "rot": [
          0,
          0,
          -30
        ],
        "c": "chitin",
        "mirror": true,
        "name": "leg-b"
      },
      {
        "s": "ball",
        "d": [
          0.2
        ],
        "at": [
          0,
          0.21,
          -0.06
        ],
        "scale": [
          1.05,
          0.72,
          1.35
        ],
        "c": "tint",
        "name": "abdomen"
      },
      {
        "s": "box",
        "d": [
          0.24,
          0.14,
          0.18
        ],
        "at": [
          0,
          0.22,
          0.12
        ],
        "c": "wood-dark",
        "name": "thorax"
      },
      {
        "s": "box",
        "d": [
          0.18,
          0.11,
          0.12
        ],
        "at": [
          0,
          0.21,
          0.25
        ],
        "c": "tint",
        "group": "head",
        "name": "head"
      },
      {
        "s": "ball",
        "d": [
          0.028
        ],
        "at": [
          0.085,
          0.23,
          0.29
        ],
        "c": "honey",
        "glow": true,
        "mirror": true,
        "group": "head",
        "name": "eye"
      },
      {
        "s": "pill",
        "d": [
          0.022,
          0.18
        ],
        "at": [
          0.1,
          0.22,
          0.39
        ],
        "rot": [
          75,
          -18,
          0
        ],
        "c": "trim",
        "mirror": true,
        "group": "head",
        "name": "horn-base"
      },
      {
        "s": "cone",
        "d": [
          0.024,
          0.1
        ],
        "at": [
          0.065,
          0.24,
          0.49
        ],
        "rot": [
          80,
          35,
          0
        ],
        "c": "trim",
        "mirror": true,
        "group": "head",
        "name": "horn-tip"
      }
    ]
  },
  {
    "id": "thimblekin",
    "name": "Thimblekin",
    "category": "gnomeokemon",
    "uses": [
      "place",
      "collect"
    ],
    "tags": [
      "gnomeokemon",
      "clay",
      "mossbottom",
      "feral",
      "thimble",
      "gnome"
    ],
    "emoji": [
      "🪖",
      "🍄"
    ],
    "tint": "red",
    "trim": "brass",
    "pivots": {
      "head": [
        0,
        0.46,
        0
      ],
      "arm": [
        -0.2,
        0.36,
        0.05
      ]
    },
    "about": "A wild clay-gnome skirmisher crowned with a Tall One brass thimble helm.",
    "examine": [
      "Feral gnomes never bother with town kilns; they bake themselves in bonfires and wear whatever fits.",
      "Its helm is a dimpled brass fortress—though nobody in Fescue knows what a sewing needle is.",
      "That wool beard hides three stolen buttons and half a dried apple.",
      "If you hear tinny clanking in the tall grass, count your coins."
    ],
    "parts": [
      {
        "s": "box",
        "d": [
          0.08,
          0.08,
          0.13
        ],
        "at": [
          0.09,
          0.04,
          0.03
        ],
        "c": "leather-dark",
        "mirror": true,
        "name": "boot"
      },
      {
        "s": "cyl",
        "d": [
          0.12,
          0.17,
          0.32
        ],
        "at": [
          0,
          0.24,
          0
        ],
        "c": "tint",
        "name": "tunic"
      },
      {
        "s": "cyl",
        "d": [
          0.155,
          0.16,
          0.05
        ],
        "at": [
          0,
          0.2,
          0
        ],
        "c": "leather",
        "name": "belt"
      },
      {
        "s": "box",
        "d": [
          0.06,
          0.06,
          0.03
        ],
        "at": [
          0,
          0.2,
          0.16
        ],
        "c": "trim",
        "name": "buckle"
      },
      {
        "s": "ball",
        "d": [
          0.13
        ],
        "at": [
          0,
          0.5,
          0
        ],
        "c": "terracotta",
        "group": "head",
        "name": "head"
      },
      {
        "s": "ball",
        "d": [
          0.035
        ],
        "at": [
          0,
          0.49,
          0.13
        ],
        "c": "clay",
        "group": "head",
        "name": "nose"
      },
      {
        "s": "ball",
        "d": [
          0.02
        ],
        "at": [
          0.055,
          0.52,
          0.115
        ],
        "c": "black",
        "mirror": true,
        "group": "head",
        "name": "eye"
      },
      {
        "s": "cone",
        "d": [
          0.11,
          0.2
        ],
        "at": [
          0,
          0.38,
          0.1
        ],
        "rot": [
          165,
          0,
          0
        ],
        "c": "wool",
        "group": "head",
        "name": "beard"
      },
      {
        "s": "cyl",
        "d": [
          0.13,
          0.15,
          0.2
        ],
        "at": [
          0,
          0.62,
          0
        ],
        "c": "trim",
        "group": "head",
        "name": "thimble-helm"
      },
      {
        "s": "ring",
        "d": [
          0.15,
          0.02
        ],
        "at": [
          0,
          0.53,
          0
        ],
        "rot": [
          90,
          0,
          0
        ],
        "c": "gold",
        "group": "head",
        "name": "helm-rim"
      },
      {
        "s": "cyl",
        "d": [
          0.032,
          0.02,
          0.32
        ],
        "at": [
          -0.22,
          0.38,
          0.14
        ],
        "rot": [
          35,
          0,
          12
        ],
        "c": "wood",
        "group": "arm",
        "name": "club"
      }
    ]
  },
  {
    "id": "hoseleech",
    "name": "Hoseleech",
    "category": "gnomeokemon",
    "uses": [
      "place",
      "collect"
    ],
    "tags": [
      "gnomeokemon",
      "rain",
      "thatchford",
      "hose",
      "serpent",
      "water"
    ],
    "emoji": [
      "🐍",
      "🚿"
    ],
    "tint": "leaf",
    "trim": "brass",
    "pivots": {
      "head": [
        0,
        0.42,
        0.18
      ]
    },
    "about": "A coiled green-rubber river serpent with a tarnished brass nozzle snout.",
    "examine": [
      "Pipewrights swear the first Hoseleeches pinched off from the Great Green River itself.",
      "It sprays cold cistern mist when cornered, soaking anything within two paces.",
      "The brass ring on its snout clicks softly—twist it left for spray, right for stream.",
      "A thirsty gnome can drink from it, provided you ask politely first."
    ],
    "parts": [
      {
        "s": "ring",
        "d": [
          0.22,
          0.065
        ],
        "at": [
          0,
          0.065,
          0
        ],
        "rot": [
          90,
          0,
          0
        ],
        "c": "tint",
        "name": "coil-1"
      },
      {
        "s": "ring",
        "d": [
          0.17,
          0.06
        ],
        "at": [
          0,
          0.16,
          -0.01
        ],
        "rot": [
          88,
          5,
          0
        ],
        "c": "leaf-dark",
        "name": "coil-2"
      },
      {
        "s": "ring",
        "d": [
          0.12,
          0.055
        ],
        "at": [
          0,
          0.25,
          0.01
        ],
        "rot": [
          85,
          -5,
          0
        ],
        "c": "tint",
        "name": "coil-3"
      },
      {
        "s": "cyl",
        "d": [
          0.055,
          0.065,
          0.22
        ],
        "at": [
          0,
          0.36,
          0.1
        ],
        "rot": [
          22,
          0,
          0
        ],
        "c": "tint",
        "name": "neck"
      },
      {
        "s": "ball",
        "d": [
          0.085
        ],
        "at": [
          0,
          0.46,
          0.18
        ],
        "scale": [
          1,
          0.85,
          1.2
        ],
        "c": "tint",
        "group": "head",
        "name": "head"
      },
      {
        "s": "cyl",
        "d": [
          0.052,
          0.068,
          0.1
        ],
        "at": [
          0,
          0.45,
          0.29
        ],
        "rot": [
          90,
          0,
          0
        ],
        "c": "trim",
        "group": "head",
        "name": "nozzle"
      },
      {
        "s": "ring",
        "d": [
          0.06,
          0.015
        ],
        "at": [
          0,
          0.45,
          0.25
        ],
        "c": "gold",
        "group": "head",
        "name": "nozzle-ring"
      },
      {
        "s": "ball",
        "d": [
          0.024
        ],
        "at": [
          0.06,
          0.49,
          0.22
        ],
        "c": "glaze-blue",
        "glow": true,
        "mirror": true,
        "group": "head",
        "name": "eye"
      }
    ]
  },
  {
    "id": "strawight",
    "name": "Strawight",
    "category": "gnomeokemon",
    "uses": [
      "place",
      "collect"
    ],
    "tags": [
      "gnomeokemon",
      "sun",
      "cloverfield",
      "straw",
      "scarecrow",
      "plant"
    ],
    "emoji": [
      "🌾",
      "🎃"
    ],
    "tint": "straw",
    "trim": "burlap",
    "pivots": {
      "head": [
        0,
        0.62,
        0
      ],
      "arms": [
        0,
        0.46,
        0
      ]
    },
    "about": "A Cloverfield scarecrow-wight bound in dry straw and a stitched burlap hood.",
    "examine": [
      "Made to frighten Old Gleaner away from the grain; nobody knows who taught it to walk.",
      "Its burlap sack head smells faintly of oats and dry summer lightning.",
      "Spark-bright eyes flare inside the hood whenever a crow crosses the fence.",
      "Keep Sun-magic away from it—straw burns faster than a dry apology."
    ],
    "parts": [
      {
        "s": "cyl",
        "d": [
          0.035,
          0.045,
          0.3
        ],
        "at": [
          0,
          0.15,
          0
        ],
        "c": "wood-dark",
        "name": "post"
      },
      {
        "s": "cone",
        "d": [
          0.18,
          0.38
        ],
        "at": [
          0,
          0.41,
          0
        ],
        "c": "tint",
        "name": "straw-coat"
      },
      {
        "s": "ring",
        "d": [
          0.12,
          0.022
        ],
        "at": [
          0,
          0.35,
          0
        ],
        "rot": [
          90,
          0,
          0
        ],
        "c": "bark",
        "name": "belt"
      },
      {
        "s": "cyl",
        "d": [
          0.025,
          0.025,
          0.66
        ],
        "at": [
          0,
          0.48,
          0
        ],
        "rot": [
          0,
          0,
          90
        ],
        "c": "wood",
        "group": "arms",
        "name": "crossbar"
      },
      {
        "s": "cone",
        "d": [
          0.06,
          0.14
        ],
        "at": [
          0.33,
          0.48,
          0
        ],
        "rot": [
          0,
          0,
          -90
        ],
        "c": "tint",
        "mirror": true,
        "group": "arms",
        "name": "cuff"
      },
      {
        "s": "ball",
        "d": [
          0.13
        ],
        "at": [
          0,
          0.66,
          0
        ],
        "scale": [
          0.95,
          1.1,
          0.95
        ],
        "c": "trim",
        "group": "head",
        "name": "head"
      },
      {
        "s": "cone",
        "d": [
          0.18,
          0.24
        ],
        "at": [
          0,
          0.84,
          -0.02
        ],
        "rot": [
          -10,
          0,
          8
        ],
        "c": "leather-dark",
        "group": "head",
        "name": "hat"
      },
      {
        "s": "ball",
        "d": [
          0.025
        ],
        "at": [
          0.05,
          0.67,
          0.115
        ],
        "c": "spark",
        "glow": true,
        "mirror": true,
        "group": "head",
        "name": "eye"
      }
    ]
  },
  {
    "id": "paperwasp",
    "name": "Paperwasp",
    "category": "gnomeokemon",
    "uses": [
      "place",
      "collect"
    ],
    "tags": [
      "gnomeokemon",
      "sun",
      "hedgewood",
      "wasp",
      "winged",
      "flying"
    ],
    "emoji": [
      "🐝",
      "🪽"
    ],
    "tint": "yellow",
    "trim": "black",
    "pivots": {
      "wings": [
        0,
        0.42,
        0
      ]
    },
    "about": "A striped Hedgewood spire-sentinel with papery translucent wings and a brass-sharp sting.",
    "examine": [
      "Its nest is chewed bark pressed thinner than parchment, yet harder than fired brick.",
      "Hedgewood loggers listen for the high buzz before they swing an axe.",
      "It hovers on a single point of air, watching for anyone carrying sap or honey.",
      "Despite the fierce sting, it never chases a gnome past the shade of its own tree."
    ],
    "parts": [
      {
        "s": "cyl",
        "d": [
          0.014,
          0.01,
          0.18
        ],
        "at": [
          0.07,
          0.09,
          0.06
        ],
        "rot": [
          15,
          0,
          -15
        ],
        "c": "trim",
        "mirror": true,
        "name": "leg-f"
      },
      {
        "s": "cyl",
        "d": [
          0.014,
          0.01,
          0.18
        ],
        "at": [
          0.08,
          0.09,
          -0.04
        ],
        "rot": [
          -15,
          0,
          -15
        ],
        "c": "trim",
        "mirror": true,
        "name": "leg-b"
      },
      {
        "s": "ball",
        "d": [
          0.14
        ],
        "at": [
          0,
          0.28,
          -0.14
        ],
        "scale": [
          0.85,
          0.85,
          1.35
        ],
        "c": "tint",
        "name": "abdomen"
      },
      {
        "s": "ring",
        "d": [
          0.115,
          0.024
        ],
        "at": [
          0,
          0.28,
          -0.1
        ],
        "c": "trim",
        "name": "stripe-1"
      },
      {
        "s": "ring",
        "d": [
          0.1,
          0.022
        ],
        "at": [
          0,
          0.28,
          -0.19
        ],
        "c": "trim",
        "name": "stripe-2"
      },
      {
        "s": "cone",
        "d": [
          0.035,
          0.13
        ],
        "at": [
          0,
          0.25,
          -0.35
        ],
        "rot": [
          -95,
          0,
          0
        ],
        "c": "iron-dark",
        "name": "stinger"
      },
      {
        "s": "ball",
        "d": [
          0.11
        ],
        "at": [
          0,
          0.34,
          0.06
        ],
        "c": "trim",
        "name": "thorax"
      },
      {
        "s": "ball",
        "d": [
          0.095
        ],
        "at": [
          0,
          0.37,
          0.2
        ],
        "c": "tint",
        "name": "head"
      },
      {
        "s": "ball",
        "d": [
          0.036
        ],
        "at": [
          0.065,
          0.39,
          0.25
        ],
        "c": "ruby",
        "glow": true,
        "mirror": true,
        "name": "eye"
      },
      {
        "s": "cyl",
        "d": [
          0.01,
          0.01,
          0.12
        ],
        "at": [
          0.04,
          0.47,
          0.27
        ],
        "rot": [
          40,
          0,
          -15
        ],
        "c": "trim",
        "mirror": true,
        "name": "antenna"
      },
      {
        "s": "box",
        "d": [
          0.28,
          0.012,
          0.12
        ],
        "at": [
          0.18,
          0.45,
          0
        ],
        "rot": [
          12,
          -15,
          22
        ],
        "c": "parchment",
        "alpha": 0.5,
        "mirror": true,
        "group": "wings",
        "name": "wing"
      }
    ]
  },
  {
    "id": "unfired",
    "name": "The Unfired",
    "category": "gnomeokemon",
    "uses": [
      "place",
      "collect"
    ],
    "tags": [
      "gnomeokemon",
      "clay",
      "rockery",
      "unfired",
      "kiln",
      "elite"
    ],
    "emoji": [
      "🏺",
      "🕯"
    ],
    "tint": "chalk",
    "trim": "flame",
    "pivots": {
      "head": [
        0,
        0.56,
        0
      ],
      "core": [
        0,
        0.34,
        0.04
      ]
    },
    "about": "A pale raw-clay gnome that left the Kiln too early, holding a warm ember core inside.",
    "examine": [
      "Its damp chalky skin still shows thumbprints where a potter stopped halfway.",
      "Through the crack in its chest, a patient ember waits for a proper firing.",
      "It never drops coin—only a soft sigh like wet clay settling on a wheel.",
      "Rain makes it heavy and slow; Sun hardens its outer shell for a moment."
    ],
    "parts": [
      {
        "s": "cyl",
        "d": [
          0.06,
          0.075,
          0.14
        ],
        "at": [
          0.1,
          0.07,
          0.02
        ],
        "c": "sand",
        "mirror": true,
        "name": "leg"
      },
      {
        "s": "box",
        "d": [
          0.13,
          0.3,
          0.2
        ],
        "at": [
          0.095,
          0.29,
          0
        ],
        "c": "tint",
        "mirror": true,
        "name": "torso-half"
      },
      {
        "s": "box",
        "d": [
          0.16,
          0.3,
          0.1
        ],
        "at": [
          0,
          0.29,
          -0.07
        ],
        "c": "stone",
        "name": "backplate"
      },
      {
        "s": "ball",
        "d": [
          0.075
        ],
        "at": [
          0,
          0.31,
          0.04
        ],
        "c": "trim",
        "glow": true,
        "group": "core",
        "name": "ember-core"
      },
      {
        "s": "pill",
        "d": [
          0.045,
          0.18
        ],
        "at": [
          0.21,
          0.3,
          0.04
        ],
        "rot": [
          15,
          0,
          -18
        ],
        "c": "tint",
        "name": "arm-right"
      },
      {
        "s": "cyl",
        "d": [
          0.04,
          0.05,
          0.18
        ],
        "at": [
          -0.2,
          0.32,
          0.02
        ],
        "rot": [
          0,
          0,
          22
        ],
        "c": "sand",
        "name": "arm-left"
      },
      {
        "s": "ball",
        "d": [
          0.14
        ],
        "at": [
          0,
          0.56,
          0
        ],
        "scale": [
          0.95,
          1.05,
          0.95
        ],
        "c": "tint",
        "group": "head",
        "name": "head"
      },
      {
        "s": "cone",
        "d": [
          0.13,
          0.22
        ],
        "at": [
          0.01,
          0.75,
          -0.01
        ],
        "rot": [
          -6,
          0,
          -10
        ],
        "c": "sand",
        "group": "head",
        "name": "hat"
      },
      {
        "s": "ball",
        "d": [
          0.026
        ],
        "at": [
          0.055,
          0.57,
          0.125
        ],
        "c": "stone-dark",
        "mirror": true,
        "group": "head",
        "name": "eye"
      }
    ]
  },
  {
    "id": "grubthorn",
    "name": "Grubthorn",
    "category": "gnomeokemon",
    "uses": [
      "place",
      "collect"
    ],
    "tags": [
      "gnomeokemon",
      "clay",
      "mossbottom",
      "mole",
      "boss",
      "king"
    ],
    "emoji": [
      "👑",
      "🐾"
    ],
    "tint": "fur",
    "trim": "gold",
    "pivots": {
      "head": [
        0,
        0.42,
        0.14
      ],
      "claws": [
        0,
        0.22,
        0.22
      ]
    },
    "about": "Mole King of Mossbottom: broad-shouldered burrower with iron digging claws and a brass crown.",
    "examine": [
      "His crooked crown is a dented brass curtain ring he won from a magpie.",
      "Each shovel-paw can tunnel through packed clay faster than three Wardens with spades.",
      "He only fought the villages because the northern tremors drove his whole clan underground.",
      "Last words at the burrow mouth: \"We weren't attacking. We were running.\""
    ],
    "parts": [
      {
        "s": "box",
        "d": [
          0.12,
          0.07,
          0.16
        ],
        "at": [
          0.14,
          0.035,
          -0.04
        ],
        "c": "leather-dark",
        "mirror": true,
        "name": "foot"
      },
      {
        "s": "ball",
        "d": [
          0.27
        ],
        "at": [
          0,
          0.28,
          -0.02
        ],
        "scale": [
          1.1,
          0.95,
          1.05
        ],
        "c": "tint",
        "name": "body"
      },
      {
        "s": "ball",
        "d": [
          0.19
        ],
        "at": [
          0,
          0.25,
          0.12
        ],
        "scale": [
          0.95,
          0.9,
          0.65
        ],
        "c": "burlap",
        "name": "belly"
      },
      {
        "s": "ball",
        "d": [
          0.16
        ],
        "at": [
          0,
          0.48,
          0.12
        ],
        "scale": [
          1.05,
          0.9,
          1.1
        ],
        "c": "tint",
        "group": "head",
        "name": "head"
      },
      {
        "s": "cone",
        "d": [
          0.06,
          0.12
        ],
        "at": [
          0,
          0.46,
          0.29
        ],
        "rot": [
          90,
          0,
          0
        ],
        "c": "petal",
        "group": "head",
        "name": "snout"
      },
      {
        "s": "ball",
        "d": [
          0.02
        ],
        "at": [
          0.065,
          0.52,
          0.25
        ],
        "c": "black",
        "mirror": true,
        "group": "head",
        "name": "eye"
      },
      {
        "s": "ring",
        "d": [
          0.1,
          0.024
        ],
        "at": [
          0,
          0.63,
          0.1
        ],
        "rot": [
          82,
          0,
          10
        ],
        "c": "trim",
        "group": "head",
        "name": "crown"
      },
      {
        "s": "cone",
        "d": [
          0.025,
          0.065
        ],
        "at": [
          0.07,
          0.67,
          0.1
        ],
        "c": "trim",
        "mirror": true,
        "group": "head",
        "name": "crown-spike"
      },
      {
        "s": "box",
        "d": [
          0.11,
          0.06,
          0.16
        ],
        "at": [
          0.24,
          0.16,
          0.18
        ],
        "rot": [
          20,
          -20,
          0
        ],
        "c": "iron-dark",
        "mirror": true,
        "group": "claws",
        "name": "paw"
      },
      {
        "s": "cone",
        "d": [
          0.02,
          0.11
        ],
        "at": [
          0.22,
          0.13,
          0.3
        ],
        "rot": [
          95,
          -15,
          0
        ],
        "c": "steel",
        "mirror": true,
        "group": "claws",
        "name": "claw-inner"
      },
      {
        "s": "cone",
        "d": [
          0.02,
          0.11
        ],
        "at": [
          0.28,
          0.13,
          0.28
        ],
        "rot": [
          95,
          -25,
          0
        ],
        "c": "steel",
        "mirror": true,
        "group": "claws",
        "name": "claw-outer"
      }
    ]
  },
  {
    "id": "minimower",
    "name": "Pocket Rumble",
    "category": "gnomeokemon",
    "uses": [
      "place",
      "collect"
    ],
    "tags": [
      "gnomeokemon",
      "iron",
      "verge",
      "mower",
      "boss",
      "metal"
    ],
    "emoji": [
      "⚙",
      "🔴"
    ],
    "tint": "red",
    "trim": "steel",
    "pivots": {
      "blade": [
        0,
        0.1,
        0
      ],
      "rope": [
        0,
        0.34,
        -0.18
      ]
    },
    "about": "A pocket-sized effigy of Old Rumble: red iron deck, four wheels, Heartspark, and spinning blade.",
    "examine": [
      "Even Cut acolytes build tiny iron effigies of the Turning Blade to guard their shrines.",
      "At one gnome tall, it is forty times smaller than the real Mower—and still terrifying.",
      "Its Heartspark hums with Black Dew; Rain magic sputters it out twice as fast.",
      "Do not pull the Waking Rope unless you brought a Stopping Stone."
    ],
    "parts": [
      {
        "s": "cyl",
        "d": [
          0.11,
          0.11,
          0.06
        ],
        "at": [
          0.24,
          0.11,
          0.2
        ],
        "rot": [
          0,
          0,
          90
        ],
        "c": "black",
        "mirror": true,
        "name": "wheel-front"
      },
      {
        "s": "cyl",
        "d": [
          0.12,
          0.12,
          0.065
        ],
        "at": [
          0.25,
          0.12,
          -0.2
        ],
        "rot": [
          0,
          0,
          90
        ],
        "c": "black",
        "mirror": true,
        "name": "wheel-back"
      },
      {
        "s": "box",
        "d": [
          0.42,
          0.12,
          0.5
        ],
        "at": [
          0,
          0.16,
          0
        ],
        "c": "tint",
        "name": "deck"
      },
      {
        "s": "box",
        "d": [
          0.36,
          0.018,
          0.06
        ],
        "at": [
          0,
          0.08,
          0
        ],
        "c": "trim",
        "group": "blade",
        "name": "blade"
      },
      {
        "s": "cyl",
        "d": [
          0.11,
          0.13,
          0.14
        ],
        "at": [
          0,
          0.29,
          0.02
        ],
        "c": "iron-dark",
        "name": "engine"
      },
      {
        "s": "cyl",
        "d": [
          0.032,
          0.032,
          0.09
        ],
        "at": [
          0,
          0.4,
          0.05
        ],
        "c": "spark",
        "glow": true,
        "name": "heartspark"
      },
      {
        "s": "box",
        "d": [
          0.12,
          0.03,
          0.03
        ],
        "at": [
          0,
          0.39,
          -0.2
        ],
        "c": "wood-light",
        "group": "rope",
        "name": "waking-rope"
      },
      {
        "s": "ball",
        "d": [
          0.15
        ],
        "at": [
          0,
          0.28,
          -0.28
        ],
        "scale": [
          1,
          0.85,
          1.15
        ],
        "c": "burlap",
        "name": "belly-bag"
      },
      {
        "s": "cyl",
        "d": [
          0.016,
          0.016,
          0.36
        ],
        "at": [
          0.17,
          0.38,
          -0.32
        ],
        "rot": [
          -35,
          0,
          0
        ],
        "c": "iron",
        "mirror": true,
        "name": "handle-bar"
      },
      {
        "s": "cyl",
        "d": [
          0.02,
          0.02,
          0.36
        ],
        "at": [
          0,
          0.52,
          -0.42
        ],
        "rot": [
          0,
          0,
          90
        ],
        "c": "black",
        "name": "handle-grip"
      }
    ]
  },
  {
    "id": "armadillan",
    "name": "Armadillan",
    "category": "gnomeokemon",
    "uses": [
      "place",
      "collect"
    ],
    "tags": [
      "gnomeokemon",
      "clay",
      "desert",
      "armadillo",
      "shelled",
      "world2"
    ],
    "emoji": [
      "🦔",
      "🛡"
    ],
    "tint": "terracotta",
    "trim": "sand",
    "pivots": {
      "head": [
        0,
        0.22,
        0.2
      ],
      "tail": [
        0,
        0.16,
        -0.24
      ]
    },
    "about": "Desert Yard armored digger with banded terracotta shell plates and stout claws.",
    "examine": [
      "In the dry yard beyond the Fence, armadillos took over the Mower's old patrol routes.",
      "When startled by a Pester Clod, it tucks into a clay bowling ball.",
      "Its shell bands rattle like stacked flowerpots whenever it trots across flagstones.",
      "Drop a treat in the sand and it snuffles it up before you can blink."
    ],
    "parts": [
      {
        "s": "cyl",
        "d": [
          0.04,
          0.045,
          0.1
        ],
        "at": [
          0.11,
          0.05,
          0.12
        ],
        "c": "clay-dark",
        "mirror": true,
        "name": "leg-f"
      },
      {
        "s": "cyl",
        "d": [
          0.04,
          0.045,
          0.1
        ],
        "at": [
          0.11,
          0.05,
          -0.12
        ],
        "c": "clay-dark",
        "mirror": true,
        "name": "leg-b"
      },
      {
        "s": "ball",
        "d": [
          0.21
        ],
        "at": [
          0,
          0.22,
          -0.02
        ],
        "scale": [
          0.95,
          0.8,
          1.25
        ],
        "c": "tint",
        "name": "shell"
      },
      {
        "s": "ring",
        "d": [
          0.18,
          0.024
        ],
        "at": [
          0,
          0.21,
          0.05
        ],
        "c": "trim",
        "name": "band-1"
      },
      {
        "s": "ring",
        "d": [
          0.19,
          0.024
        ],
        "at": [
          0,
          0.21,
          -0.06
        ],
        "c": "trim",
        "name": "band-2"
      },
      {
        "s": "cone",
        "d": [
          0.09,
          0.2
        ],
        "at": [
          0,
          0.2,
          0.28
        ],
        "rot": [
          82,
          0,
          0
        ],
        "c": "trim",
        "group": "head",
        "name": "snout"
      },
      {
        "s": "ball",
        "d": [
          0.025
        ],
        "at": [
          0,
          0.21,
          0.375
        ],
        "c": "black",
        "group": "head",
        "name": "nose"
      },
      {
        "s": "cone",
        "d": [
          0.035,
          0.11
        ],
        "at": [
          0.07,
          0.3,
          0.21
        ],
        "rot": [
          15,
          0,
          -18
        ],
        "c": "clay-dark",
        "mirror": true,
        "group": "head",
        "name": "ear"
      },
      {
        "s": "ball",
        "d": [
          0.02
        ],
        "at": [
          0.055,
          0.24,
          0.28
        ],
        "c": "black",
        "mirror": true,
        "group": "head",
        "name": "eye"
      },
      {
        "s": "cone",
        "d": [
          0.045,
          0.22
        ],
        "at": [
          0,
          0.15,
          -0.32
        ],
        "rot": [
          -78,
          0,
          0
        ],
        "c": "tint",
        "group": "tail",
        "name": "tail"
      }
    ]
  },
  {
    "id": "sunlizard",
    "name": "Sunlizard",
    "category": "gnomeokemon",
    "uses": [
      "place",
      "collect"
    ],
    "tags": [
      "gnomeokemon",
      "sun",
      "desert",
      "lizard",
      "reptile",
      "world2"
    ],
    "emoji": [
      "🦎",
      "☀"
    ],
    "tint": "orange",
    "trim": "gold",
    "pivots": {
      "head": [
        0,
        0.24,
        0.2
      ],
      "tail": [
        0,
        0.14,
        -0.22
      ]
    },
    "about": "A quick-footed desert basking lizard with a sun-frill collar and amber eyes.",
    "examine": [
      "Basks on adobe steps until its orange scales shimmer like kiln-glaze.",
      "When you blow the Gnome Flute, it puffs out its golden neck frill and bobs its head.",
      "Older gnomes call them \"Little Sun-Keepers\" because they always face the warmest wall.",
      "It can dart across a mesa shadow faster than a dropped marble."
    ],
    "parts": [
      {
        "s": "cyl",
        "d": [
          0.03,
          0.035,
          0.14
        ],
        "at": [
          0.14,
          0.06,
          0.12
        ],
        "rot": [
          0,
          0,
          -35
        ],
        "c": "tint",
        "mirror": true,
        "name": "leg-f"
      },
      {
        "s": "cyl",
        "d": [
          0.03,
          0.035,
          0.14
        ],
        "at": [
          0.14,
          0.06,
          -0.12
        ],
        "rot": [
          0,
          0,
          -35
        ],
        "c": "tint",
        "mirror": true,
        "name": "leg-b"
      },
      {
        "s": "pill",
        "d": [
          0.1,
          0.24
        ],
        "at": [
          0,
          0.16,
          0
        ],
        "rot": [
          82,
          0,
          0
        ],
        "c": "tint",
        "name": "body"
      },
      {
        "s": "cyl",
        "d": [
          0.17,
          0.12,
          0.03
        ],
        "at": [
          0,
          0.23,
          0.16
        ],
        "rot": [
          65,
          0,
          0
        ],
        "c": "trim",
        "group": "head",
        "name": "frill"
      },
      {
        "s": "box",
        "d": [
          0.13,
          0.09,
          0.17
        ],
        "at": [
          0,
          0.25,
          0.25
        ],
        "c": "tint",
        "group": "head",
        "name": "head"
      },
      {
        "s": "ball",
        "d": [
          0.025
        ],
        "at": [
          0.06,
          0.27,
          0.28
        ],
        "c": "spark",
        "glow": true,
        "mirror": true,
        "group": "head",
        "name": "eye"
      },
      {
        "s": "cone",
        "d": [
          0.028,
          0.08
        ],
        "at": [
          0,
          0.28,
          0.05
        ],
        "c": "trim",
        "name": "spike-1"
      },
      {
        "s": "cone",
        "d": [
          0.025,
          0.07
        ],
        "at": [
          0,
          0.26,
          -0.05
        ],
        "c": "trim",
        "name": "spike-2"
      },
      {
        "s": "cone",
        "d": [
          0.05,
          0.34
        ],
        "at": [
          0,
          0.15,
          -0.32
        ],
        "rot": [
          -75,
          0,
          0
        ],
        "c": "tint",
        "group": "tail",
        "name": "tail"
      }
    ]
  },
  {
    "id": "cactuskin",
    "name": "Cactuskin",
    "category": "gnomeokemon",
    "uses": [
      "place",
      "collect"
    ],
    "tags": [
      "gnomeokemon",
      "bloom",
      "desert",
      "cactus",
      "plant",
      "world2"
    ],
    "emoji": [
      "🌵",
      "🌺"
    ],
    "tint": "leaf",
    "trim": "petal",
    "pivots": {
      "head": [
        0,
        0.55,
        0
      ],
      "arms": [
        0,
        0.38,
        0
      ]
    },
    "about": "A prickly saguaro-gnome wearing clay boots and a bright desert blossom.",
    "examine": [
      "Where moss-gnomes grow toadstools, Desert Yard gnomes sprout stubborn cacti.",
      "Its arms stay raised in permanent surprise, even when it is just taking a nap.",
      "The pink blossom on top opens widest right after a Gnome Flute tune.",
      "Do not hug it—not even if it looks lonely."
    ],
    "parts": [
      {
        "s": "box",
        "d": [
          0.08,
          0.08,
          0.12
        ],
        "at": [
          0.08,
          0.04,
          0.02
        ],
        "c": "clay",
        "mirror": true,
        "name": "boot"
      },
      {
        "s": "pill",
        "d": [
          0.13,
          0.36
        ],
        "at": [
          0,
          0.34,
          0
        ],
        "c": "tint",
        "name": "trunk"
      },
      {
        "s": "cyl",
        "d": [
          0.05,
          0.05,
          0.18
        ],
        "at": [
          0.19,
          0.36,
          0
        ],
        "rot": [
          0,
          0,
          90
        ],
        "c": "tint",
        "mirror": true,
        "group": "arms",
        "name": "arm-horiz"
      },
      {
        "s": "pill",
        "d": [
          0.05,
          0.14
        ],
        "at": [
          0.26,
          0.45,
          0
        ],
        "c": "tint",
        "mirror": true,
        "group": "arms",
        "name": "arm-up"
      },
      {
        "s": "ball",
        "d": [
          0.024
        ],
        "at": [
          0.055,
          0.48,
          0.125
        ],
        "c": "black",
        "mirror": true,
        "group": "head",
        "name": "eye"
      },
      {
        "s": "box",
        "d": [
          0.06,
          0.015,
          0.02
        ],
        "at": [
          0,
          0.42,
          0.13
        ],
        "c": "wood-dark",
        "group": "head",
        "name": "mouth"
      },
      {
        "s": "cone",
        "d": [
          0.08,
          0.1
        ],
        "at": [
          0,
          0.67,
          0
        ],
        "rot": [
          180,
          0,
          0
        ],
        "c": "trim",
        "group": "head",
        "name": "flower"
      },
      {
        "s": "ball",
        "d": [
          0.032
        ],
        "at": [
          0,
          0.72,
          0
        ],
        "c": "yellow",
        "glow": true,
        "group": "head",
        "name": "pollen"
      }
    ]
  },
  {
    "id": "tumblewight",
    "name": "Tumblewight",
    "category": "gnomeokemon",
    "uses": [
      "place",
      "collect"
    ],
    "tags": [
      "gnomeokemon",
      "sun",
      "desert",
      "tumbleweed",
      "wind",
      "world2"
    ],
    "emoji": [
      "🌾",
      "💨"
    ],
    "tint": "straw",
    "trim": "spark",
    "pivots": {
      "core": [
        0,
        0.36,
        0
      ]
    },
    "about": "A rolling thicket of dry desert brush with two glowing spark eyes inside.",
    "examine": [
      "Nobody knows whether a gnome lives inside the twigs or the twigs learned to roll on their own.",
      "It drifts across the sand whenever the afternoon wind rises off the mesas.",
      "Throw a Pester Clod nearby and it spins like a wheel until it hits a cactus.",
      "Keep sparks away—it is basically a walking bundle of kindling."
    ],
    "parts": [
      {
        "s": "ring",
        "d": [
          0.27,
          0.03
        ],
        "at": [
          0,
          0.36,
          0
        ],
        "rot": [
          15,
          0,
          0
        ],
        "c": "tint",
        "group": "core",
        "name": "twig-1"
      },
      {
        "s": "ring",
        "d": [
          0.26,
          0.028
        ],
        "at": [
          0,
          0.36,
          0
        ],
        "rot": [
          75,
          45,
          0
        ],
        "c": "wood-light",
        "group": "core",
        "name": "twig-2"
      },
      {
        "s": "ring",
        "d": [
          0.25,
          0.028
        ],
        "at": [
          0,
          0.36,
          0
        ],
        "rot": [
          -45,
          70,
          20
        ],
        "c": "bark",
        "group": "core",
        "name": "twig-3"
      },
      {
        "s": "ring",
        "d": [
          0.2,
          0.024
        ],
        "at": [
          0,
          0.36,
          0
        ],
        "rot": [
          40,
          -50,
          60
        ],
        "c": "tint",
        "group": "core",
        "name": "twig-4"
      },
      {
        "s": "ball",
        "d": [
          0.13
        ],
        "at": [
          0,
          0.36,
          0
        ],
        "c": "wood-dark",
        "group": "core",
        "name": "heart"
      },
      {
        "s": "ball",
        "d": [
          0.032
        ],
        "at": [
          0.06,
          0.38,
          0.14
        ],
        "c": "trim",
        "glow": true,
        "mirror": true,
        "group": "core",
        "name": "eye"
      }
    ]
  },
  {
    "id": "clogmaw",
    "name": "Clogmaw",
    "category": "gnomeokemon",
    "uses": [
      "place",
      "collect"
    ],
    "tags": [
      "gnomeokemon",
      "rain",
      "deeps",
      "slime",
      "boss",
      "gutter"
    ],
    "emoji": [
      "🫧",
      "🐊"
    ],
    "tint": "glaze-green",
    "trim": "moss",
    "pivots": {
      "head": [
        0,
        0.34,
        0.14
      ],
      "core": [
        0,
        0.24,
        0
      ]
    },
    "about": "A living gutter-blockage of translucent cistern ooze, moss, and lost brass buttons.",
    "examine": [
      "It is not malicious—just thirty years of leaves, hairpins, and rainwater trying to get unstuck.",
      "Through its translucent belly, you can see a swallowed brass button gleaming.",
      "Blow the Gnome Flute and it ripples like a pond after a pebble drop.",
      "Sun magic dries it out; Rain magic makes it twice as bouncy."
    ],
    "parts": [
      {
        "s": "cyl",
        "d": [
          0.34,
          0.42,
          0.14
        ],
        "at": [
          0,
          0.07,
          0
        ],
        "c": "tint",
        "alpha": 0.72,
        "name": "base"
      },
      {
        "s": "ball",
        "d": [
          0.28
        ],
        "at": [
          0,
          0.24,
          -0.02
        ],
        "scale": [
          1.15,
          0.9,
          1.1
        ],
        "c": "tint",
        "alpha": 0.78,
        "group": "core",
        "name": "body"
      },
      {
        "s": "cyl",
        "d": [
          0.07,
          0.07,
          0.03
        ],
        "at": [
          0,
          0.22,
          0.02
        ],
        "rot": [
          75,
          0,
          15
        ],
        "c": "brass",
        "group": "core",
        "name": "button"
      },
      {
        "s": "ball",
        "d": [
          0.14
        ],
        "at": [
          0.06,
          0.44,
          -0.06
        ],
        "scale": [
          1.2,
          0.6,
          1.1
        ],
        "c": "trim",
        "name": "moss-top"
      },
      {
        "s": "ball",
        "d": [
          0.045
        ],
        "at": [
          0.11,
          0.34,
          0.22
        ],
        "c": "spark",
        "glow": true,
        "mirror": true,
        "group": "head",
        "name": "eye"
      },
      {
        "s": "box",
        "d": [
          0.24,
          0.06,
          0.1
        ],
        "at": [
          0,
          0.18,
          0.28
        ],
        "c": "slate",
        "group": "head",
        "name": "jaw"
      }
    ]
  },
  {
    "id": "rustcrab",
    "name": "Rustcrab",
    "category": "gnomeokemon",
    "uses": [
      "place",
      "collect"
    ],
    "tags": [
      "gnomeokemon",
      "iron",
      "deeps",
      "crab",
      "metal",
      "rust"
    ],
    "emoji": [
      "🦀",
      "🔩"
    ],
    "tint": "rust",
    "trim": "copper",
    "pivots": {
      "claws": [
        0,
        0.22,
        0.18
      ]
    },
    "about": "A scuttling Backflow crab armored in a rusted copper pipe-cap and wrench claws.",
    "examine": [
      "Its shell is an old copper drain cap polished orange by thirty years of drip.",
      "Pipewrights leave spare washers out so Rustcrabs will not pinch their boots.",
      "It clicks its iron claws in time whenever water hammers through the cistern.",
      "A single Rain spell turns its joints squeaky and slow."
    ],
    "parts": [
      {
        "s": "cyl",
        "d": [
          0.018,
          0.014,
          0.16
        ],
        "at": [
          0.22,
          0.08,
          0.1
        ],
        "rot": [
          0,
          0,
          -32
        ],
        "c": "iron-dark",
        "mirror": true,
        "name": "leg-f"
      },
      {
        "s": "cyl",
        "d": [
          0.018,
          0.014,
          0.16
        ],
        "at": [
          0.25,
          0.08,
          0
        ],
        "rot": [
          0,
          0,
          -32
        ],
        "c": "iron-dark",
        "mirror": true,
        "name": "leg-m"
      },
      {
        "s": "cyl",
        "d": [
          0.018,
          0.014,
          0.16
        ],
        "at": [
          0.22,
          0.08,
          -0.1
        ],
        "rot": [
          0,
          0,
          -32
        ],
        "c": "iron-dark",
        "mirror": true,
        "name": "leg-b"
      },
      {
        "s": "cyl",
        "d": [
          0.18,
          0.24,
          0.16
        ],
        "at": [
          0,
          0.2,
          0
        ],
        "c": "tint",
        "name": "shell"
      },
      {
        "s": "ring",
        "d": [
          0.21,
          0.025
        ],
        "at": [
          0,
          0.16,
          0
        ],
        "rot": [
          90,
          0,
          0
        ],
        "c": "trim",
        "name": "rim"
      },
      {
        "s": "cyl",
        "d": [
          0.016,
          0.016,
          0.1
        ],
        "at": [
          0.07,
          0.32,
          0.12
        ],
        "c": "iron",
        "mirror": true,
        "name": "stalk"
      },
      {
        "s": "ball",
        "d": [
          0.028
        ],
        "at": [
          0.07,
          0.38,
          0.13
        ],
        "c": "spark",
        "glow": true,
        "mirror": true,
        "name": "eye"
      },
      {
        "s": "box",
        "d": [
          0.09,
          0.06,
          0.16
        ],
        "at": [
          0.2,
          0.2,
          0.24
        ],
        "rot": [
          0,
          -25,
          0
        ],
        "c": "steel",
        "mirror": true,
        "group": "claws",
        "name": "claw"
      }
    ]
  },
  {
    "id": "kilnwarden",
    "name": "Kiln Warden",
    "category": "gnomeokemon",
    "uses": [
      "place",
      "collect"
    ],
    "tags": [
      "gnomeokemon",
      "sun",
      "kiln",
      "boss",
      "clay",
      "warden"
    ],
    "emoji": [
      "🗿",
      "🔥"
    ],
    "tint": "clay-dark",
    "trim": "flame",
    "pivots": {
      "head": [
        0,
        0.72,
        0
      ],
      "core": [
        0,
        0.44,
        0.08
      ]
    },
    "about": "Ancient fired-clay sentinel of the Rockery Kiln with a blazing furnace chest.",
    "examine": [
      "Shaped when the First Kiln was still hot; its glaze has never chipped in three millennia.",
      "At the center of its chest burns a grate of living coals.",
      "Legend says it still kneels if it spots a Clayfoot trowel.",
      "Throw Bait to watch it salute, or Pester to make its furnace roar."
    ],
    "parts": [
      {
        "s": "cyl",
        "d": [
          0.075,
          0.09,
          0.24
        ],
        "at": [
          0.12,
          0.12,
          0
        ],
        "c": "tint",
        "mirror": true,
        "name": "leg"
      },
      {
        "s": "box",
        "d": [
          0.36,
          0.42,
          0.26
        ],
        "at": [
          0,
          0.44,
          0
        ],
        "c": "tint",
        "name": "torso"
      },
      {
        "s": "ball",
        "d": [
          0.11
        ],
        "at": [
          0,
          0.44,
          0.1
        ],
        "c": "trim",
        "glow": true,
        "group": "core",
        "name": "furnace"
      },
      {
        "s": "box",
        "d": [
          0.14,
          0.34,
          0.14
        ],
        "at": [
          0.27,
          0.45,
          0
        ],
        "rot": [
          0,
          0,
          -10
        ],
        "c": "stone-dark",
        "mirror": true,
        "name": "arm"
      },
      {
        "s": "box",
        "d": [
          0.2,
          0.22,
          0.2
        ],
        "at": [
          0,
          0.76,
          0
        ],
        "c": "tint",
        "group": "head",
        "name": "head"
      },
      {
        "s": "cone",
        "d": [
          0.06,
          0.16
        ],
        "at": [
          0,
          0.94,
          0
        ],
        "c": "trim",
        "glow": true,
        "group": "head",
        "name": "crest"
      },
      {
        "s": "ball",
        "d": [
          0.028
        ],
        "at": [
          0.055,
          0.78,
          0.1
        ],
        "c": "spark",
        "glow": true,
        "mirror": true,
        "group": "head",
        "name": "eye"
      }
    ]
  },
  {
    "id": "glowmoth",
    "name": "Glowmoth",
    "category": "gnomeokemon",
    "uses": [
      "place",
      "collect"
    ],
    "tags": [
      "gnomeokemon",
      "bloom",
      "verge",
      "moth",
      "winged",
      "twilight"
    ],
    "emoji": [
      "🦋",
      "✨"
    ],
    "tint": "emerald",
    "trim": "spark",
    "pivots": {
      "wings": [
        0,
        0.42,
        0
      ]
    },
    "about": "A luminous Grass-Bag Moth that flutters out of the Shed at twilight.",
    "examine": [
      "Its dusty emerald wings glow softly like moonlight through a greenhouse pane.",
      "At dusk, dozens of Glowmoths spiral around the Kiln chimney and Mushroom Lamps.",
      "Blow the Gnome Flute and it loops in joyful figure-eights.",
      "The Order of the Even Cut tries to shoo them away from the Shed, never with much luck."
    ],
    "parts": [
      {
        "s": "cyl",
        "d": [
          0.012,
          0.01,
          0.22
        ],
        "at": [
          0.05,
          0.11,
          0
        ],
        "rot": [
          0,
          0,
          -12
        ],
        "c": "wood-dark",
        "mirror": true,
        "name": "leg"
      },
      {
        "s": "pill",
        "d": [
          0.075,
          0.22
        ],
        "at": [
          0,
          0.36,
          0
        ],
        "rot": [
          75,
          0,
          0
        ],
        "c": "wool",
        "name": "body"
      },
      {
        "s": "cone",
        "d": [
          0.025,
          0.12
        ],
        "at": [
          0.05,
          0.48,
          0.14
        ],
        "rot": [
          35,
          0,
          -18
        ],
        "c": "trim",
        "glow": true,
        "mirror": true,
        "name": "antenna"
      },
      {
        "s": "box",
        "d": [
          0.34,
          0.012,
          0.22
        ],
        "at": [
          0.22,
          0.42,
          0.02
        ],
        "rot": [
          12,
          -10,
          18
        ],
        "c": "tint",
        "glow": true,
        "alpha": 0.78,
        "mirror": true,
        "group": "wings",
        "name": "forewing"
      },
      {
        "s": "box",
        "d": [
          0.24,
          0.012,
          0.16
        ],
        "at": [
          0.16,
          0.38,
          -0.14
        ],
        "rot": [
          8,
          15,
          14
        ],
        "c": "trim",
        "glow": true,
        "alpha": 0.72,
        "mirror": true,
        "group": "wings",
        "name": "hindwing"
      }
    ]
  },
  {
    "id": "seamower",
    "name": "Sea Mower",
    "category": "gnomeokemon",
    "uses": [
      "place",
      "collect"
    ],
    "tags": [
      "gnomeokemon",
      "rain",
      "water",
      "ocean",
      "mower",
      "underwater",
      "boss"
    ],
    "emoji": [
      "🌊",
      "⚙"
    ],
    "tint": "glaze-blue",
    "trim": "petal",
    "pivots": {
      "blade": [
        0,
        0.1,
        0
      ],
      "prop": [
        0,
        0.28,
        -0.34
      ]
    },
    "about": "Underwater water-type Mower encrusted in sea-glass glaze, barnacles, and a spinning propeller.",
    "examine": [
      "When an old Mower tumbled into the flooded Cistern, the water-glaze claimed it.",
      "Instead of grass, its spinning blade whips up whirlpools of silver bubbles.",
      "Barnacles and pink coral cling to its deck like medals from the deep.",
      "Its Heartspark glows aqua-bright—throw Bait to watch it chomp floating kelp!"
    ],
    "parts": [
      {
        "s": "cyl",
        "d": [
          0.11,
          0.11,
          0.06
        ],
        "at": [
          0.24,
          0.11,
          0.2
        ],
        "rot": [
          0,
          0,
          90
        ],
        "c": "slate",
        "mirror": true,
        "name": "wheel-front"
      },
      {
        "s": "cyl",
        "d": [
          0.12,
          0.12,
          0.065
        ],
        "at": [
          0.25,
          0.12,
          -0.2
        ],
        "rot": [
          0,
          0,
          90
        ],
        "c": "slate",
        "mirror": true,
        "name": "wheel-back"
      },
      {
        "s": "box",
        "d": [
          0.42,
          0.12,
          0.5
        ],
        "at": [
          0,
          0.16,
          0
        ],
        "c": "tint",
        "name": "deck"
      },
      {
        "s": "box",
        "d": [
          0.36,
          0.018,
          0.06
        ],
        "at": [
          0,
          0.08,
          0
        ],
        "c": "water",
        "group": "blade",
        "name": "blade"
      },
      {
        "s": "cyl",
        "d": [
          0.11,
          0.13,
          0.14
        ],
        "at": [
          0,
          0.29,
          0.02
        ],
        "c": "glaze-green",
        "name": "engine"
      },
      {
        "s": "cyl",
        "d": [
          0.032,
          0.032,
          0.09
        ],
        "at": [
          0,
          0.4,
          0.05
        ],
        "c": "glass",
        "glow": true,
        "name": "heartspark"
      },
      {
        "s": "cone",
        "d": [
          0.04,
          0.08
        ],
        "at": [
          0.14,
          0.26,
          0.14
        ],
        "c": "sand",
        "mirror": true,
        "name": "barnacle"
      },
      {
        "s": "cone",
        "d": [
          0.035,
          0.11
        ],
        "at": [
          -0.12,
          0.27,
          -0.1
        ],
        "rot": [
          0,
          0,
          15
        ],
        "c": "petal",
        "name": "coral"
      },
      {
        "s": "box",
        "d": [
          0.22,
          0.04,
          0.02
        ],
        "at": [
          0,
          0.28,
          -0.34
        ],
        "c": "brass",
        "group": "prop",
        "name": "prop-h"
      },
      {
        "s": "box",
        "d": [
          0.04,
          0.22,
          0.02
        ],
        "at": [
          0,
          0.28,
          -0.34
        ],
        "c": "brass",
        "group": "prop",
        "name": "prop-v"
      },
      {
        "s": "ball",
        "d": [
          0.032
        ],
        "at": [
          0.12,
          0.2,
          0.26
        ],
        "c": "spark",
        "glow": true,
        "mirror": true,
        "name": "eye"
      }
    ]
  },
  {
    "id": "cisterneel",
    "name": "Cistern Eel",
    "category": "gnomeokemon",
    "uses": [
      "place",
      "collect"
    ],
    "tags": [
      "gnomeokemon",
      "rain",
      "water",
      "ocean",
      "eel",
      "underwater"
    ],
    "emoji": [
      "🐍",
      "💧"
    ],
    "tint": "glaze-blue",
    "trim": "spark",
    "pivots": {
      "head": [
        0,
        0.38,
        0.2
      ],
      "tail": [
        0,
        0.2,
        -0.22
      ]
    },
    "about": "A sinuous underwater cistern eel with a glowing dorsal fin.",
    "examine": [
      "Its lantern-bright fin lights the flooded arches of the Cistern Reef.",
      "It weaves effortlessly between sunken garden hoses and brass valves.",
      "Play the Gnome Flute and it spirals in graceful water-ribbons.",
      "Nobody has ever measured how long the biggest Cistern Eel really is."
    ],
    "parts": [
      {
        "s": "ring",
        "d": [
          0.18,
          0.055
        ],
        "at": [
          0,
          0.055,
          -0.04
        ],
        "rot": [
          90,
          0,
          0
        ],
        "c": "tint",
        "name": "coil"
      },
      {
        "s": "pill",
        "d": [
          0.06,
          0.26
        ],
        "at": [
          0,
          0.24,
          0.06
        ],
        "rot": [
          22,
          0,
          0
        ],
        "c": "tint",
        "name": "torso"
      },
      {
        "s": "wedge",
        "d": [
          0.02,
          0.16,
          0.12
        ],
        "at": [
          0,
          0.32,
          -0.02
        ],
        "c": "trim",
        "glow": true,
        "name": "fin"
      },
      {
        "s": "ball",
        "d": [
          0.085
        ],
        "at": [
          0,
          0.42,
          0.18
        ],
        "scale": [
          0.95,
          0.85,
          1.3
        ],
        "c": "tint",
        "group": "head",
        "name": "head"
      },
      {
        "s": "ball",
        "d": [
          0.026
        ],
        "at": [
          0.06,
          0.44,
          0.24
        ],
        "c": "trim",
        "glow": true,
        "mirror": true,
        "group": "head",
        "name": "eye"
      },
      {
        "s": "cone",
        "d": [
          0.04,
          0.18
        ],
        "at": [
          0,
          0.14,
          -0.28
        ],
        "rot": [
          -75,
          0,
          0
        ],
        "c": "glaze-green",
        "group": "tail",
        "name": "tail-tip"
      }
    ]
  },
  {
    "id": "drownedtoad",
    "name": "Drowned Toad",
    "category": "gnomeokemon",
    "uses": [
      "place",
      "collect"
    ],
    "tags": [
      "gnomeokemon",
      "rain",
      "water",
      "ocean",
      "toad",
      "underwater"
    ],
    "emoji": [
      "🐸",
      "🫧"
    ],
    "tint": "sapphire",
    "trim": "glaze-green",
    "pivots": {
      "head": [
        0,
        0.34,
        0.1
      ]
    },
    "about": "A heavy deep-water cistern toad with luminous bubble-cheeks.",
    "examine": [
      "Its croak sounds like a distant gong echoing through flooded drainpipes.",
      "Glowing bubble-sacs let it stay submerged for weeks at a time.",
      "Toss a Pester Clod and it puffs up twice as wide in indignation.",
      "Young Dewdrops look up to it like a grumpy uncle."
    ],
    "parts": [
      {
        "s": "box",
        "d": [
          0.12,
          0.04,
          0.16
        ],
        "at": [
          0.16,
          0.02,
          0.08
        ],
        "rot": [
          0,
          -15,
          0
        ],
        "c": "trim",
        "mirror": true,
        "name": "foot"
      },
      {
        "s": "ball",
        "d": [
          0.24
        ],
        "at": [
          0,
          0.22,
          -0.02
        ],
        "scale": [
          1.15,
          0.86,
          1.05
        ],
        "c": "tint",
        "name": "body"
      },
      {
        "s": "ball",
        "d": [
          0.11
        ],
        "at": [
          0,
          0.22,
          0.18
        ],
        "c": "glass",
        "alpha": 0.65,
        "group": "head",
        "name": "throat"
      },
      {
        "s": "ball",
        "d": [
          0.055
        ],
        "at": [
          0.1,
          0.4,
          0.12
        ],
        "c": "tint",
        "mirror": true,
        "group": "head",
        "name": "eye-bump"
      },
      {
        "s": "ball",
        "d": [
          0.032
        ],
        "at": [
          0.11,
          0.41,
          0.165
        ],
        "c": "spark",
        "glow": true,
        "mirror": true,
        "group": "head",
        "name": "eye"
      }
    ]
  },
  {
    "id": "barnacleknight",
    "name": "Barnacle Knight",
    "category": "gnomeokemon",
    "uses": [
      "place",
      "collect"
    ],
    "tags": [
      "gnomeokemon",
      "iron",
      "water",
      "ocean",
      "knight",
      "underwater"
    ],
    "emoji": [
      "🛡",
      "🐚"
    ],
    "tint": "steel",
    "trim": "petal",
    "pivots": {
      "head": [
        0,
        0.52,
        0
      ],
      "arm": [
        -0.22,
        0.34,
        0.06
      ]
    },
    "about": "A sunken tin-can gnome knight encrusted with pink barnacles and a bottlecap shield.",
    "examine": [
      "Its armor is an old Tall One soup tin covered in reef shells.",
      "It guards the sunken Birdbath steps even though the war ended centuries ago.",
      "When you blow the Gnome Flute, it taps its bottlecap shield in rhythm.",
      "Salt and water turned its hinges stiff, but its spirit is pure iron."
    ],
    "parts": [
      {
        "s": "box",
        "d": [
          0.09,
          0.08,
          0.13
        ],
        "at": [
          0.1,
          0.04,
          0.02
        ],
        "c": "iron-dark",
        "mirror": true,
        "name": "boot"
      },
      {
        "s": "cyl",
        "d": [
          0.16,
          0.17,
          0.34
        ],
        "at": [
          0,
          0.25,
          0
        ],
        "c": "tint",
        "name": "cuirass"
      },
      {
        "s": "cone",
        "d": [
          0.045,
          0.08
        ],
        "at": [
          0.12,
          0.35,
          0.12
        ],
        "rot": [
          40,
          0,
          -25
        ],
        "c": "trim",
        "name": "barnacle-1"
      },
      {
        "s": "cone",
        "d": [
          0.038,
          0.07
        ],
        "at": [
          -0.13,
          0.24,
          0.11
        ],
        "rot": [
          45,
          0,
          20
        ],
        "c": "sand",
        "name": "barnacle-2"
      },
      {
        "s": "cyl",
        "d": [
          0.14,
          0.15,
          0.22
        ],
        "at": [
          0,
          0.54,
          0
        ],
        "c": "iron",
        "group": "head",
        "name": "helm"
      },
      {
        "s": "box",
        "d": [
          0.16,
          0.03,
          0.04
        ],
        "at": [
          0,
          0.54,
          0.14
        ],
        "c": "spark",
        "glow": true,
        "group": "head",
        "name": "visor"
      },
      {
        "s": "cyl",
        "d": [
          0.14,
          0.14,
          0.03
        ],
        "at": [
          -0.24,
          0.32,
          0.08
        ],
        "rot": [
          90,
          0,
          20
        ],
        "c": "glaze-blue",
        "group": "arm",
        "name": "shield"
      }
    ]
  },
  {
    "id": "kelpsprite",
    "name": "Kelp Sprite",
    "category": "gnomeokemon",
    "uses": [
      "place",
      "collect"
    ],
    "tags": [
      "gnomeokemon",
      "bloom",
      "water",
      "ocean",
      "kelp",
      "underwater"
    ],
    "emoji": [
      "🌿",
      "🫧"
    ],
    "tint": "emerald",
    "trim": "white",
    "pivots": {
      "head": [
        0,
        0.44,
        0
      ],
      "sprout": [
        0,
        0.62,
        0
      ]
    },
    "about": "A drifting underwater sea-moss spirit crowned with a glowing pearl.",
    "examine": [
      "Its leafy ribbons sway even when the cistern water is completely still.",
      "At night, Kelp Sprites gather around sunken lanterns like green fireflies.",
      "Throw Bait and it twirls gracefully down to nibble.",
      "Gnomes say a pearl from a Kelp Sprite keeps clay from ever cracking."
    ],
    "parts": [
      {
        "s": "cone",
        "d": [
          0.16,
          0.32
        ],
        "at": [
          0,
          0.16,
          0
        ],
        "c": "leaf-dark",
        "name": "skirt"
      },
      {
        "s": "ball",
        "d": [
          0.15
        ],
        "at": [
          0,
          0.36,
          0
        ],
        "c": "tint",
        "group": "head",
        "name": "head"
      },
      {
        "s": "ball",
        "d": [
          0.025
        ],
        "at": [
          0.06,
          0.38,
          0.13
        ],
        "c": "black",
        "mirror": true,
        "group": "head",
        "name": "eye"
      },
      {
        "s": "ball",
        "d": [
          0.055
        ],
        "at": [
          0,
          0.56,
          0
        ],
        "c": "trim",
        "glow": true,
        "group": "sprout",
        "name": "pearl"
      },
      {
        "s": "box",
        "d": [
          0.05,
          0.22,
          0.02
        ],
        "at": [
          0.1,
          0.54,
          0
        ],
        "rot": [
          0,
          0,
          -25
        ],
        "c": "tint",
        "mirror": true,
        "group": "sprout",
        "name": "frond"
      }
    ]
  },
  {
    "id": "magpiethief",
    "name": "Magpie Thief",
    "category": "gnomeokemon",
    "uses": [
      "place",
      "collect"
    ],
    "tags": [
      "gnomeokemon",
      "clay",
      "thatchford",
      "bird",
      "magpie",
      "winged"
    ],
    "emoji": [
      "🐦",
      "🔮"
    ],
    "tint": "black",
    "trim": "white",
    "pivots": {
      "head": [
        0,
        0.42,
        0.12
      ],
      "wings": [
        0,
        0.32,
        0
      ]
    },
    "about": "A cheeky black-and-white Thatchford magpie clutching a stolen Tall-eye marble.",
    "examine": [
      "If you drop a coin or a Tall-eye chip, a Magpie Thief spots it before it hits the grass.",
      "It hoards shiny glass marbles in the eaves of the Thatchford market stalls.",
      "Throw a Pester Clod to make it squawk and flap its wings!",
      "Surprisingly polite if you offer it an acorn treat instead."
    ],
    "parts": [
      {
        "s": "cyl",
        "d": [
          0.015,
          0.015,
          0.14
        ],
        "at": [
          0.06,
          0.07,
          0
        ],
        "c": "iron-dark",
        "mirror": true,
        "name": "leg"
      },
      {
        "s": "pill",
        "d": [
          0.12,
          0.22
        ],
        "at": [
          0,
          0.26,
          0
        ],
        "rot": [
          55,
          0,
          0
        ],
        "c": "tint",
        "name": "body"
      },
      {
        "s": "ball",
        "d": [
          0.1
        ],
        "at": [
          0,
          0.23,
          0.06
        ],
        "c": "trim",
        "name": "chest"
      },
      {
        "s": "box",
        "d": [
          0.22,
          0.02,
          0.14
        ],
        "at": [
          0.16,
          0.3,
          -0.02
        ],
        "rot": [
          10,
          0,
          18
        ],
        "c": "tint",
        "mirror": true,
        "group": "wings",
        "name": "wing"
      },
      {
        "s": "ball",
        "d": [
          0.09
        ],
        "at": [
          0,
          0.44,
          0.12
        ],
        "c": "tint",
        "group": "head",
        "name": "head"
      },
      {
        "s": "cone",
        "d": [
          0.03,
          0.1
        ],
        "at": [
          0,
          0.43,
          0.24
        ],
        "rot": [
          90,
          0,
          0
        ],
        "c": "iron-dark",
        "group": "head",
        "name": "beak"
      },
      {
        "s": "ball",
        "d": [
          0.035
        ],
        "at": [
          0,
          0.42,
          0.29
        ],
        "c": "sapphire",
        "glow": true,
        "group": "head",
        "name": "marble"
      },
      {
        "s": "ball",
        "d": [
          0.018
        ],
        "at": [
          0.06,
          0.46,
          0.17
        ],
        "c": "white",
        "mirror": true,
        "group": "head",
        "name": "eye"
      }
    ]
  },
  {
    "id": "hedgewright",
    "name": "Hedgewright",
    "category": "gnomeokemon",
    "uses": [
      "place",
      "collect"
    ],
    "tags": [
      "gnomeokemon",
      "bloom",
      "hedgewood",
      "ranger",
      "gnome"
    ],
    "emoji": [
      "🏹",
      "🍃"
    ],
    "tint": "leaf-dark",
    "trim": "wood",
    "pivots": {
      "head": [
        0,
        0.5,
        0
      ],
      "arm": [
        -0.2,
        0.36,
        0.08
      ]
    },
    "about": "A leaf-cloaked Hedgewood clay-gnome ranger carrying an acorn-twig bow.",
    "examine": [
      "Hedgewrights carve their hats to match oak leaves so they vanish into the canopy.",
      "They have argued with the Wildlings for three hundred years over one old hedge.",
      "Play the Gnome Flute and it lowers its bow to tap its boot.",
      "Never ask a Hedgewright how old their beard is."
    ],
    "parts": [
      {
        "s": "box",
        "d": [
          0.08,
          0.08,
          0.12
        ],
        "at": [
          0.09,
          0.04,
          0.02
        ],
        "c": "leather-dark",
        "mirror": true,
        "name": "boot"
      },
      {
        "s": "cyl",
        "d": [
          0.12,
          0.16,
          0.32
        ],
        "at": [
          0,
          0.24,
          0
        ],
        "c": "tint",
        "name": "cloak"
      },
      {
        "s": "ball",
        "d": [
          0.12
        ],
        "at": [
          0,
          0.5,
          0
        ],
        "c": "terracotta",
        "group": "head",
        "name": "head"
      },
      {
        "s": "cone",
        "d": [
          0.14,
          0.26
        ],
        "at": [
          0,
          0.68,
          0
        ],
        "c": "tint",
        "group": "head",
        "name": "hat"
      },
      {
        "s": "cone",
        "d": [
          0.09,
          0.18
        ],
        "at": [
          0,
          0.38,
          0.1
        ],
        "rot": [
          165,
          0,
          0
        ],
        "c": "wool",
        "group": "head",
        "name": "beard"
      },
      {
        "s": "ball",
        "d": [
          0.02
        ],
        "at": [
          0.05,
          0.52,
          0.11
        ],
        "c": "black",
        "mirror": true,
        "group": "head",
        "name": "eye"
      },
      {
        "s": "ring",
        "d": [
          0.18,
          0.018,
          180
        ],
        "at": [
          -0.22,
          0.36,
          0.12
        ],
        "rot": [
          0,
          90,
          -90
        ],
        "c": "trim",
        "group": "arm",
        "name": "bow"
      }
    ]
  },
  {
    "id": "acorndrake",
    "name": "Acorn Drake",
    "category": "gnomeokemon",
    "uses": [
      "place",
      "collect"
    ],
    "tags": [
      "gnomeokemon",
      "sun",
      "hedgewood",
      "dragon",
      "acorn",
      "winged"
    ],
    "emoji": [
      "🐉",
      "🌰"
    ],
    "tint": "wood",
    "trim": "flame",
    "pivots": {
      "head": [
        0,
        0.44,
        0.18
      ],
      "wings": [
        0,
        0.4,
        0
      ]
    },
    "about": "A tiny pine-cone and acorn-capped wyrmling with warm ember wings.",
    "examine": [
      "Its scales are overlapping pine-cone bracts that rattle like dry leaves.",
      "A tiny spark in its belly keeps it warm even during frost.",
      "It swoops between Hedgewood branches looking for roasted acorns.",
      "When startled, it puffs a harmless cloud of cinnamon-smelling smoke."
    ],
    "parts": [
      {
        "s": "cyl",
        "d": [
          0.03,
          0.035,
          0.14
        ],
        "at": [
          0.1,
          0.07,
          0.04
        ],
        "c": "wood-dark",
        "mirror": true,
        "name": "leg"
      },
      {
        "s": "pill",
        "d": [
          0.12,
          0.24
        ],
        "at": [
          0,
          0.28,
          0
        ],
        "rot": [
          55,
          0,
          0
        ],
        "c": "tint",
        "name": "body"
      },
      {
        "s": "ball",
        "d": [
          0.11
        ],
        "at": [
          0,
          0.45,
          0.18
        ],
        "c": "tint",
        "group": "head",
        "name": "head"
      },
      {
        "s": "cone",
        "d": [
          0.12,
          0.1
        ],
        "at": [
          0,
          0.56,
          0.16
        ],
        "c": "bark",
        "group": "head",
        "name": "acorn-cap"
      },
      {
        "s": "ball",
        "d": [
          0.025
        ],
        "at": [
          0.06,
          0.47,
          0.25
        ],
        "c": "trim",
        "glow": true,
        "mirror": true,
        "group": "head",
        "name": "eye"
      },
      {
        "s": "box",
        "d": [
          0.32,
          0.015,
          0.16
        ],
        "at": [
          0.22,
          0.42,
          0
        ],
        "rot": [
          15,
          -10,
          20
        ],
        "c": "trim",
        "alpha": 0.8,
        "mirror": true,
        "group": "wings",
        "name": "wing"
      }
    ]
  },
  {
    "id": "bellrat",
    "name": "Bellrat",
    "category": "gnomeokemon",
    "uses": [
      "place",
      "collect"
    ],
    "tags": [
      "gnomeokemon",
      "clay",
      "keep",
      "rat",
      "bell",
      "furred"
    ],
    "emoji": [
      "🐀",
      "🔔"
    ],
    "tint": "fur",
    "trim": "gold",
    "pivots": {
      "head": [
        0,
        0.26,
        0.16
      ],
      "tail": [
        0,
        0.16,
        -0.22
      ]
    },
    "about": "A plump Birdbath Keep rat wearing a stolen brass dinner-bell around its neck.",
    "examine": [
      "Gnomes tied a bell on it so they could hear it coming; the rat decided it liked the music.",
      "It scurries along the Keep ledges looking for dropped crumbs.",
      "Blow the Gnome Flute and it jingles its bell in time.",
      "Despite its reputation, it never steals from a sleeping gnome."
    ],
    "parts": [
      {
        "s": "box",
        "d": [
          0.07,
          0.05,
          0.11
        ],
        "at": [
          0.09,
          0.025,
          0.05
        ],
        "c": "petal",
        "mirror": true,
        "name": "foot"
      },
      {
        "s": "ball",
        "d": [
          0.18
        ],
        "at": [
          0,
          0.19,
          -0.02
        ],
        "scale": [
          0.95,
          0.85,
          1.2
        ],
        "c": "tint",
        "name": "body"
      },
      {
        "s": "ball",
        "d": [
          0.11
        ],
        "at": [
          0,
          0.26,
          0.17
        ],
        "c": "tint",
        "group": "head",
        "name": "head"
      },
      {
        "s": "cyl",
        "d": [
          0.05,
          0.05,
          0.02
        ],
        "at": [
          0.08,
          0.35,
          0.14
        ],
        "rot": [
          90,
          0,
          15
        ],
        "c": "petal",
        "mirror": true,
        "group": "head",
        "name": "ear"
      },
      {
        "s": "ball",
        "d": [
          0.02
        ],
        "at": [
          0.05,
          0.28,
          0.26
        ],
        "c": "black",
        "mirror": true,
        "group": "head",
        "name": "eye"
      },
      {
        "s": "cone",
        "d": [
          0.045,
          0.07
        ],
        "at": [
          0,
          0.14,
          0.22
        ],
        "c": "trim",
        "group": "head",
        "name": "bell"
      },
      {
        "s": "cone",
        "d": [
          0.025,
          0.26
        ],
        "at": [
          0,
          0.15,
          -0.3
        ],
        "rot": [
          -80,
          0,
          0
        ],
        "c": "petal",
        "group": "tail",
        "name": "tail"
      }
    ]
  },
  {
    "id": "gnomespirit",
    "name": "First Glaze Spirit",
    "category": "gnomeokemon",
    "uses": [
      "place",
      "collect"
    ],
    "tags": [
      "gnomeokemon",
      "bloom",
      "mossbottom",
      "spirit",
      "glaze",
      "boss"
    ],
    "emoji": [
      "✨",
      "🧙"
    ],
    "tint": "emerald",
    "trim": "gold",
    "pivots": {
      "head": [
        0,
        0.56,
        0
      ],
      "core": [
        0,
        0.36,
        0
      ]
    },
    "about": "A luminous emerald-glaze spirit from the Planting era, floating above a golden ring.",
    "examine": [
      "Legends say it is the echo of the very first gnome fired in the Rockery Kiln.",
      "It appears only where moss, water, and warm sunlight meet in peace.",
      "Its translucent emerald cloak shimmers like stained garden glass.",
      "Snap its picture and Gnome Jesus himself will bow his clay head."
    ],
    "parts": [
      {
        "s": "ring",
        "d": [
          0.22,
          0.025
        ],
        "at": [
          0,
          0.04,
          0
        ],
        "rot": [
          90,
          0,
          0
        ],
        "c": "trim",
        "glow": true,
        "name": "base-ring"
      },
      {
        "s": "cone",
        "d": [
          0.22,
          0.48
        ],
        "at": [
          0,
          0.32,
          0
        ],
        "c": "tint",
        "glow": true,
        "alpha": 0.78,
        "group": "core",
        "name": "robe"
      },
      {
        "s": "ball",
        "d": [
          0.13
        ],
        "at": [
          0,
          0.62,
          0
        ],
        "c": "glass",
        "glow": true,
        "alpha": 0.85,
        "group": "head",
        "name": "head"
      },
      {
        "s": "cone",
        "d": [
          0.15,
          0.28
        ],
        "at": [
          0,
          0.84,
          0
        ],
        "c": "tint",
        "glow": true,
        "group": "head",
        "name": "hat"
      },
      {
        "s": "ball",
        "d": [
          0.025
        ],
        "at": [
          0.05,
          0.64,
          0.11
        ],
        "c": "spark",
        "glow": true,
        "mirror": true,
        "group": "head",
        "name": "eye"
      }
    ]
  },
  {
    "id": "mooncap",
    "name": "Mooncap",
    "category": "gnomeokemon",
    "uses": [
      "place",
      "collect"
    ],
    "tags": [
      "gnomeokemon",
      "bloom",
      "night",
      "greenhouse",
      "mushroom",
      "glow"
    ],
    "emoji": [
      "🍄",
      "🌙"
    ],
    "tint": "glaze-blue",
    "trim": "spark",
    "pivots": {
      "head": [
        0,
        0.36,
        0
      ],
      "cap": [
        0,
        0.54,
        0
      ]
    },
    "about": "A bioluminescent night-mushroom gnome whose azure cap lights the Starlight Greenhouse.",
    "examine": [
      "By day it looks like an ordinary clay pot; by midnight its cap glows electric blue.",
      "Greenhouse keepers read their almanacs by Mooncap light.",
      "Blow the Gnome Flute and its glowing spots pulse in gentle waves.",
      "It dislikes bright Sun-magic and hides under ferns at dawn."
    ],
    "parts": [
      {
        "s": "cyl",
        "d": [
          0.05,
          0.06,
          0.12
        ],
        "at": [
          0.08,
          0.06,
          0.02
        ],
        "c": "mushroom-stem",
        "mirror": true,
        "name": "foot"
      },
      {
        "s": "cyl",
        "d": [
          0.11,
          0.13,
          0.28
        ],
        "at": [
          0,
          0.24,
          0
        ],
        "c": "mushroom-stem",
        "name": "stem"
      },
      {
        "s": "ball",
        "d": [
          0.025
        ],
        "at": [
          0.055,
          0.32,
          0.11
        ],
        "c": "black",
        "mirror": true,
        "group": "head",
        "name": "eye"
      },
      {
        "s": "cone",
        "d": [
          0.26,
          0.22
        ],
        "at": [
          0,
          0.52,
          0
        ],
        "c": "tint",
        "glow": true,
        "group": "cap",
        "name": "cap"
      },
      {
        "s": "ball",
        "d": [
          0.032
        ],
        "at": [
          0.11,
          0.49,
          0.09
        ],
        "c": "trim",
        "glow": true,
        "mirror": true,
        "group": "cap",
        "name": "spot-f"
      },
      {
        "s": "ball",
        "d": [
          0.028
        ],
        "at": [
          0.1,
          0.5,
          -0.1
        ],
        "c": "trim",
        "glow": true,
        "mirror": true,
        "group": "cap",
        "name": "spot-b"
      }
    ]
  },
  {
    "id": "starbeetle",
    "name": "Starbeetle",
    "category": "gnomeokemon",
    "uses": [
      "place",
      "collect"
    ],
    "tags": [
      "gnomeokemon",
      "sun",
      "night",
      "greenhouse",
      "beetle",
      "amethyst"
    ],
    "emoji": [
      "🪲",
      "✨"
    ],
    "tint": "amethyst",
    "trim": "gold",
    "pivots": {
      "head": [
        0,
        0.22,
        0.18
      ]
    },
    "about": "An iridescent amethyst jewel-scarab with golden horn-crests.",
    "examine": [
      "Its shell glints violet and gold like a Tall One marble.",
      "It polishes its carapace against dry greenhouse moss every evening.",
      "Throw Bait and it scuttles over, gleaming like a moving lantern.",
      "Staghorns consider Starbeetles unnecessarily flashy."
    ],
    "parts": [
      {
        "s": "cyl",
        "d": [
          0.02,
          0.016,
          0.14
        ],
        "at": [
          0.18,
          0.07,
          0.12
        ],
        "rot": [
          0,
          0,
          -30
        ],
        "c": "iron-dark",
        "mirror": true,
        "name": "leg-f"
      },
      {
        "s": "cyl",
        "d": [
          0.02,
          0.016,
          0.14
        ],
        "at": [
          0.2,
          0.07,
          -0.1
        ],
        "rot": [
          0,
          0,
          -30
        ],
        "c": "iron-dark",
        "mirror": true,
        "name": "leg-b"
      },
      {
        "s": "ball",
        "d": [
          0.2
        ],
        "at": [
          0,
          0.21,
          -0.04
        ],
        "scale": [
          1.05,
          0.75,
          1.3
        ],
        "c": "tint",
        "glow": true,
        "name": "shell"
      },
      {
        "s": "box",
        "d": [
          0.16,
          0.1,
          0.12
        ],
        "at": [
          0,
          0.21,
          0.22
        ],
        "c": "tint",
        "group": "head",
        "name": "head"
      },
      {
        "s": "cone",
        "d": [
          0.03,
          0.14
        ],
        "at": [
          0,
          0.28,
          0.29
        ],
        "rot": [
          55,
          0,
          0
        ],
        "c": "trim",
        "glow": true,
        "group": "head",
        "name": "horn"
      },
      {
        "s": "ball",
        "d": [
          0.024
        ],
        "at": [
          0.07,
          0.23,
          0.26
        ],
        "c": "spark",
        "glow": true,
        "mirror": true,
        "group": "head",
        "name": "eye"
      }
    ]
  },
  {
    "id": "dewghost",
    "name": "Dewghost",
    "category": "gnomeokemon",
    "uses": [
      "place",
      "collect"
    ],
    "tags": [
      "gnomeokemon",
      "rain",
      "night",
      "greenhouse",
      "wisp",
      "glass"
    ],
    "emoji": [
      "👻",
      "🏮"
    ],
    "tint": "glass",
    "trim": "spark",
    "pivots": {
      "core": [
        0,
        0.36,
        0
      ]
    },
    "about": "A misty glass-lantern wisp that drifts silently between night-blooming ferns.",
    "examine": [
      "Half mist, half captured lantern-glow—nobody knows if it is a gnome or a daydream.",
      "It floats just above the greenhouse flagstones without making a sound.",
      "Play the Gnome Flute and its inner flame spins like a tiny sun.",
      "Gnomes hang empty jars outside hoping a Dewghost will move in."
    ],
    "parts": [
      {
        "s": "ring",
        "d": [
          0.16,
          0.022
        ],
        "at": [
          0,
          0.04,
          0
        ],
        "rot": [
          90,
          0,
          0
        ],
        "c": "brass",
        "name": "ring"
      },
      {
        "s": "cyl",
        "d": [
          0.14,
          0.18,
          0.34
        ],
        "at": [
          0,
          0.34,
          0
        ],
        "c": "tint",
        "alpha": 0.45,
        "group": "core",
        "name": "glass-cloak"
      },
      {
        "s": "ball",
        "d": [
          0.09
        ],
        "at": [
          0,
          0.36,
          0
        ],
        "c": "trim",
        "glow": true,
        "group": "core",
        "name": "flame"
      },
      {
        "s": "cone",
        "d": [
          0.17,
          0.12
        ],
        "at": [
          0,
          0.56,
          0
        ],
        "c": "iron-dark",
        "group": "core",
        "name": "cap"
      },
      {
        "s": "ball",
        "d": [
          0.025
        ],
        "at": [
          0.055,
          0.38,
          0.14
        ],
        "c": "spark",
        "glow": true,
        "mirror": true,
        "group": "core",
        "name": "eye"
      }
    ]
  },
  {
    "id": "bonsaititan",
    "name": "Bonsai Titan",
    "category": "gnomeokemon",
    "uses": [
      "place",
      "collect"
    ],
    "tags": [
      "gnomeokemon",
      "bloom",
      "night",
      "greenhouse",
      "bonsai",
      "boss"
    ],
    "emoji": [
      "🌳",
      "🏮"
    ],
    "tint": "leaf",
    "trim": "glaze-blue",
    "pivots": {
      "head": [
        0,
        0.52,
        0.05
      ],
      "arms": [
        0,
        0.48,
        0
      ]
    },
    "about": "An ancient potted-cypress guardian with hanging glow-lanterns on its boughs.",
    "examine": [
      "Its porcelain pot is older than Birdbath Keep, glazed in deep royal blue.",
      "Two tiny lantern-fruits hang from its branches to light the midnight paths.",
      "When startled, it stamps its pot with a resonant ceramic thud.",
      "Gnomes say it remembers what the Tall Ones looked like."
    ],
    "parts": [
      {
        "s": "cyl",
        "d": [
          0.26,
          0.2,
          0.22
        ],
        "at": [
          0,
          0.11,
          0
        ],
        "c": "trim",
        "name": "pot"
      },
      {
        "s": "cyl",
        "d": [
          0.08,
          0.12,
          0.36
        ],
        "at": [
          0,
          0.38,
          0
        ],
        "rot": [
          0,
          0,
          8
        ],
        "c": "bark",
        "name": "trunk"
      },
      {
        "s": "ball",
        "d": [
          0.22
        ],
        "at": [
          0,
          0.66,
          0
        ],
        "scale": [
          1.3,
          0.75,
          1.1
        ],
        "c": "tint",
        "group": "head",
        "name": "canopy-top"
      },
      {
        "s": "ball",
        "d": [
          0.15
        ],
        "at": [
          0.24,
          0.52,
          0
        ],
        "scale": [
          1.2,
          0.75,
          1
        ],
        "c": "leaf-dark",
        "mirror": true,
        "group": "arms",
        "name": "bough"
      },
      {
        "s": "ball",
        "d": [
          0.045
        ],
        "at": [
          0.28,
          0.39,
          0.04
        ],
        "c": "spark",
        "glow": true,
        "mirror": true,
        "group": "arms",
        "name": "lantern"
      },
      {
        "s": "ball",
        "d": [
          0.028
        ],
        "at": [
          0.06,
          0.46,
          0.1
        ],
        "c": "gold",
        "glow": true,
        "mirror": true,
        "group": "head",
        "name": "eye"
      }
    ]
  },
  {
    "id": "clockworkfrog",
    "name": "Clockwork Frog",
    "category": "gnomeokemon",
    "uses": [
      "place",
      "collect"
    ],
    "tags": [
      "gnomeokemon",
      "iron",
      "night",
      "greenhouse",
      "frog",
      "clockwork"
    ],
    "emoji": [
      "🐸",
      "🔑"
    ],
    "tint": "brass",
    "trim": "emerald",
    "pivots": {
      "head": [
        0,
        0.3,
        0.04
      ],
      "blade": [
        0,
        0.28,
        -0.22
      ]
    },
    "about": "A brass wind-up garden frog with emerald glass eyes and a spinning key.",
    "examine": [
      "Built by a forgotten Pipewright clockmaker to keep company with the greenhouse frogs.",
      "Every hop ends with a cheerful brass *tick-tock-ribbit*.",
      "Throw a Pester Clod and its wind-up key spins twice as fast!",
      "Dewdrops treat it like a very shiny, slightly noisy cousin."
    ],
    "parts": [
      {
        "s": "box",
        "d": [
          0.1,
          0.04,
          0.14
        ],
        "at": [
          0.14,
          0.02,
          0.06
        ],
        "c": "copper",
        "mirror": true,
        "name": "foot"
      },
      {
        "s": "ball",
        "d": [
          0.2
        ],
        "at": [
          0,
          0.2,
          0
        ],
        "scale": [
          1.1,
          0.88,
          1.05
        ],
        "c": "tint",
        "name": "body"
      },
      {
        "s": "ball",
        "d": [
          0.05
        ],
        "at": [
          0.09,
          0.38,
          0.1
        ],
        "c": "tint",
        "mirror": true,
        "group": "head",
        "name": "eye-bump"
      },
      {
        "s": "ball",
        "d": [
          0.03
        ],
        "at": [
          0.095,
          0.39,
          0.145
        ],
        "c": "trim",
        "glow": true,
        "mirror": true,
        "group": "head",
        "name": "eye"
      },
      {
        "s": "cyl",
        "d": [
          0.02,
          0.02,
          0.12
        ],
        "at": [
          0,
          0.28,
          -0.22
        ],
        "rot": [
          90,
          0,
          0
        ],
        "c": "gold",
        "group": "blade",
        "name": "key-shaft"
      },
      {
        "s": "ring",
        "d": [
          0.07,
          0.018
        ],
        "at": [
          0,
          0.28,
          -0.3
        ],
        "c": "gold",
        "group": "blade",
        "name": "key-bow"
      }
    ]
  },
  {
    "id": "gnomejesus",
    "name": "Gnome Jesus",
    "category": "gnomeokemon",
    "uses": [
      "place",
      "collect"
    ],
    "tags": [
      "gnomeokemon",
      "sun",
      "night",
      "greenhouse",
      "mythic",
      "jesus"
    ],
    "emoji": [
      "✝",
      "🌟"
    ],
    "tint": "white",
    "trim": "gold",
    "pivots": {
      "head": [
        0,
        0.68,
        0
      ],
      "core": [
        0,
        0.9,
        -0.14
      ]
    },
    "about": "The radiant, golden-haloed patron of the Scale—rarely glimpsed roaming the Starlight Greenhouse.",
    "examine": [
      "Usually he waits at Camp to grade your film, yet on clear nights he strolls among the ferns.",
      "His white glaze and crimson sash glow softly under the greenhouse stars.",
      "Blow the Gnome Flute and he nods in approval, halo shining bright.",
      "Snapping a photo of Gnome Jesus himself is the highest honor in Fescue."
    ],
    "parts": [
      {
        "s": "cyl",
        "d": [
          0.18,
          0.28,
          0.56
        ],
        "at": [
          0,
          0.28,
          0
        ],
        "c": "tint",
        "name": "robe"
      },
      {
        "s": "box",
        "d": [
          0.1,
          0.52,
          0.42
        ],
        "at": [
          0.06,
          0.28,
          0.02
        ],
        "rot": [
          0,
          0,
          12
        ],
        "c": "red",
        "name": "sash"
      },
      {
        "s": "ball",
        "d": [
          0.17
        ],
        "at": [
          0,
          0.68,
          0
        ],
        "c": "terracotta",
        "group": "head",
        "name": "head"
      },
      {
        "s": "cone",
        "d": [
          0.14,
          0.26
        ],
        "at": [
          0,
          0.52,
          0.12
        ],
        "rot": [
          180,
          0,
          0
        ],
        "c": "wool",
        "group": "head",
        "name": "beard"
      },
      {
        "s": "ball",
        "d": [
          0.04
        ],
        "at": [
          0,
          0.67,
          0.17
        ],
        "c": "terracotta",
        "group": "head",
        "name": "nose"
      },
      {
        "s": "ball",
        "d": [
          0.022
        ],
        "at": [
          0.06,
          0.71,
          0.15
        ],
        "c": "black",
        "mirror": true,
        "group": "head",
        "name": "eye"
      },
      {
        "s": "cone",
        "d": [
          0.17,
          0.34
        ],
        "at": [
          0,
          0.94,
          0
        ],
        "c": "tint",
        "group": "head",
        "name": "hat"
      },
      {
        "s": "ring",
        "d": [
          0.24,
          0.025
        ],
        "at": [
          0,
          0.9,
          -0.14
        ],
        "rot": [
          12,
          0,
          0
        ],
        "c": "trim",
        "glow": true,
        "group": "core",
        "name": "halo"
      }
    ]
  },
  {
    "id": "snowcap",
    "name": "Snowcap",
    "category": "gnomeokemon",
    "uses": [
      "place",
      "collect"
    ],
    "tags": [
      "gnomeokemon",
      "rain",
      "frost",
      "winter",
      "snow",
      "gnome"
    ],
    "emoji": [
      "☃",
      "🧣"
    ],
    "tint": "glaze-blue",
    "trim": "wool",
    "pivots": {
      "head": [
        0,
        0.48,
        0
      ]
    },
    "about": "A bundled-up winter clay-gnome wearing a thick wool scarf and frosted blue cap.",
    "examine": [
      "When the first frost coats the Basin, Snowcaps come out to sweep the stepping stones.",
      "Its rosy clay nose glows warm against the winter chill.",
      "Blow the Gnome Flute and it hops from boot to boot to stay warm.",
      "Never challenge a Snowcap to a snowball fight—its aim is unnervingly accurate."
    ],
    "parts": [
      {
        "s": "box",
        "d": [
          0.09,
          0.08,
          0.13
        ],
        "at": [
          0.09,
          0.04,
          0.02
        ],
        "c": "leather-dark",
        "mirror": true,
        "name": "boot"
      },
      {
        "s": "cyl",
        "d": [
          0.14,
          0.18,
          0.3
        ],
        "at": [
          0,
          0.23,
          0
        ],
        "c": "tint",
        "name": "coat"
      },
      {
        "s": "ring",
        "d": [
          0.14,
          0.04
        ],
        "at": [
          0,
          0.39,
          0
        ],
        "rot": [
          90,
          0,
          0
        ],
        "c": "red",
        "name": "scarf"
      },
      {
        "s": "ball",
        "d": [
          0.13
        ],
        "at": [
          0,
          0.5,
          0
        ],
        "c": "sand",
        "group": "head",
        "name": "head"
      },
      {
        "s": "ball",
        "d": [
          0.032
        ],
        "at": [
          0,
          0.49,
          0.13
        ],
        "c": "petal",
        "group": "head",
        "name": "nose"
      },
      {
        "s": "ball",
        "d": [
          0.02
        ],
        "at": [
          0.055,
          0.52,
          0.115
        ],
        "c": "black",
        "mirror": true,
        "group": "head",
        "name": "eye"
      },
      {
        "s": "cone",
        "d": [
          0.16,
          0.28
        ],
        "at": [
          0,
          0.7,
          0
        ],
        "c": "tint",
        "group": "head",
        "name": "hat"
      },
      {
        "s": "ball",
        "d": [
          0.045
        ],
        "at": [
          0,
          0.84,
          0
        ],
        "c": "trim",
        "group": "head",
        "name": "pom"
      }
    ]
  },
  {
    "id": "icicleimp",
    "name": "Icicle Imp",
    "category": "gnomeokemon",
    "uses": [
      "place",
      "collect"
    ],
    "tags": [
      "gnomeokemon",
      "rain",
      "frost",
      "winter",
      "ice",
      "imp"
    ],
    "emoji": [
      "🧊",
      "❄"
    ],
    "tint": "glass",
    "trim": "glaze-blue",
    "pivots": {
      "head": [
        0,
        0.4,
        0
      ]
    },
    "about": "A mischievous translucent ice-crystal sprite with twin frost horns.",
    "examine": [
      "Formed from frozen Rain-magic dripping off the Birdbath rim.",
      "It chimes like a wind-bell whenever it giggles.",
      "Throw Bait and it skates across the snow to inspect it.",
      "Sun-magic turns it into a puddle—though it always freezes back by midnight."
    ],
    "parts": [
      {
        "s": "cone",
        "d": [
          0.16,
          0.34
        ],
        "at": [
          0,
          0.17,
          0
        ],
        "c": "tint",
        "alpha": 0.72,
        "name": "body"
      },
      {
        "s": "ball",
        "d": [
          0.13
        ],
        "at": [
          0,
          0.42,
          0
        ],
        "c": "tint",
        "alpha": 0.78,
        "group": "head",
        "name": "head"
      },
      {
        "s": "cone",
        "d": [
          0.035,
          0.16
        ],
        "at": [
          0.08,
          0.56,
          0
        ],
        "rot": [
          0,
          0,
          -18
        ],
        "c": "trim",
        "glow": true,
        "mirror": true,
        "group": "head",
        "name": "horn"
      },
      {
        "s": "ball",
        "d": [
          0.025
        ],
        "at": [
          0.05,
          0.43,
          0.11
        ],
        "c": "spark",
        "glow": true,
        "mirror": true,
        "group": "head",
        "name": "eye"
      }
    ]
  },
  {
    "id": "pinego",
    "name": "Pinego",
    "category": "gnomeokemon",
    "uses": [
      "place",
      "collect"
    ],
    "tags": [
      "gnomeokemon",
      "bloom",
      "frost",
      "winter",
      "hedgehog",
      "pinecone"
    ],
    "emoji": [
      "🦔",
      "🌲"
    ],
    "tint": "leaf-dark",
    "trim": "white",
    "pivots": {
      "head": [
        0,
        0.18,
        0.18
      ]
    },
    "about": "A round snow-dusted evergreen hedgehog covered in pine-needle quills.",
    "examine": [
      "Its quills smell like winter pine resin and fresh snow.",
      "When startled, it curls up and looks exactly like a fallen spruce cone.",
      "Drop a treat nearby and its little pink snout pokes right out.",
      "Gnomes use shed Pinego needles to brew winter tea."
    ],
    "parts": [
      {
        "s": "box",
        "d": [
          0.07,
          0.05,
          0.1
        ],
        "at": [
          0.1,
          0.025,
          0.08
        ],
        "c": "wood-dark",
        "mirror": true,
        "name": "foot-f"
      },
      {
        "s": "box",
        "d": [
          0.07,
          0.05,
          0.1
        ],
        "at": [
          0.1,
          0.025,
          -0.08
        ],
        "c": "wood-dark",
        "mirror": true,
        "name": "foot-b"
      },
      {
        "s": "ball",
        "d": [
          0.21
        ],
        "at": [
          0,
          0.2,
          -0.04
        ],
        "scale": [
          1,
          0.9,
          1.15
        ],
        "c": "tint",
        "name": "quills"
      },
      {
        "s": "ball",
        "d": [
          0.12
        ],
        "at": [
          0,
          0.28,
          -0.04
        ],
        "scale": [
          1,
          0.7,
          1.1
        ],
        "c": "trim",
        "name": "snow-cap"
      },
      {
        "s": "cone",
        "d": [
          0.08,
          0.16
        ],
        "at": [
          0,
          0.18,
          0.22
        ],
        "rot": [
          82,
          0,
          0
        ],
        "c": "sand",
        "group": "head",
        "name": "snout"
      },
      {
        "s": "ball",
        "d": [
          0.024
        ],
        "at": [
          0,
          0.19,
          0.3
        ],
        "c": "black",
        "group": "head",
        "name": "nose"
      },
      {
        "s": "ball",
        "d": [
          0.02
        ],
        "at": [
          0.055,
          0.22,
          0.2
        ],
        "c": "black",
        "mirror": true,
        "group": "head",
        "name": "eye"
      }
    ]
  },
  {
    "id": "frosthound",
    "name": "Frosthound",
    "category": "gnomeokemon",
    "uses": [
      "place",
      "collect"
    ],
    "tags": [
      "gnomeokemon",
      "rain",
      "frost",
      "winter",
      "hound",
      "dog"
    ],
    "emoji": [
      "🐺",
      "❄"
    ],
    "tint": "glaze-blue",
    "trim": "white",
    "pivots": {
      "head": [
        0,
        0.36,
        0.15
      ],
      "tail": [
        0,
        0.28,
        -0.22
      ]
    },
    "about": "A sleek pale-blue glazed winter hound with a snow-white ruff and crystal tail.",
    "examine": [
      "Kilnpup's northern cousin, glazed in cool cistern ice instead of kiln fire.",
      "Its paws leave tiny frost-prints on flagstones.",
      "It barks happily at the Giant Fetch Dog whenever they cross paths.",
      "Throw Bait and it catches it mid-leap!"
    ],
    "parts": [
      {
        "s": "cyl",
        "d": [
          0.04,
          0.05,
          0.16
        ],
        "at": [
          0.1,
          0.08,
          0.13
        ],
        "c": "tint",
        "mirror": true,
        "name": "leg-f"
      },
      {
        "s": "cyl",
        "d": [
          0.04,
          0.05,
          0.16
        ],
        "at": [
          0.1,
          0.08,
          -0.13
        ],
        "c": "tint",
        "mirror": true,
        "name": "leg-b"
      },
      {
        "s": "pill",
        "d": [
          0.12,
          0.24
        ],
        "at": [
          0,
          0.24,
          0
        ],
        "rot": [
          90,
          0,
          0
        ],
        "c": "tint",
        "name": "body"
      },
      {
        "s": "ring",
        "d": [
          0.13,
          0.035
        ],
        "at": [
          0,
          0.32,
          0.11
        ],
        "rot": [
          55,
          0,
          0
        ],
        "c": "trim",
        "name": "ruff"
      },
      {
        "s": "ball",
        "d": [
          0.14
        ],
        "at": [
          0,
          0.4,
          0.18
        ],
        "c": "tint",
        "group": "head",
        "name": "head"
      },
      {
        "s": "box",
        "d": [
          0.09,
          0.07,
          0.11
        ],
        "at": [
          0,
          0.37,
          0.29
        ],
        "c": "trim",
        "group": "head",
        "name": "snout"
      },
      {
        "s": "cone",
        "d": [
          0.045,
          0.13
        ],
        "at": [
          0.1,
          0.53,
          0.15
        ],
        "rot": [
          0,
          0,
          -15
        ],
        "c": "tint",
        "mirror": true,
        "group": "head",
        "name": "ear"
      },
      {
        "s": "ball",
        "d": [
          0.026
        ],
        "at": [
          0.06,
          0.43,
          0.29
        ],
        "c": "spark",
        "glow": true,
        "mirror": true,
        "group": "head",
        "name": "eye"
      },
      {
        "s": "cone",
        "d": [
          0.05,
          0.18
        ],
        "at": [
          0,
          0.34,
          -0.28
        ],
        "rot": [
          -45,
          0,
          0
        ],
        "c": "glass",
        "glow": true,
        "group": "tail",
        "name": "tail"
      }
    ]
  },
  {
    "id": "chimneyowl",
    "name": "Chimney Owl",
    "category": "gnomeokemon",
    "uses": [
      "place",
      "collect"
    ],
    "tags": [
      "gnomeokemon",
      "sun",
      "frost",
      "winter",
      "owl",
      "winged"
    ],
    "emoji": [
      "🦉",
      "🔥"
    ],
    "tint": "terracotta",
    "trim": "feather",
    "pivots": {
      "head": [
        0,
        0.44,
        0
      ],
      "wings": [
        0,
        0.32,
        0
      ]
    },
    "about": "A cozy winter owl roosting atop a warm terracotta chimney pot.",
    "examine": [
      "It carries its favorite warm chimney pot wherever it nests for the winter.",
      "Its amber eyes glow like hearth-coals through falling snow.",
      "Blow the Gnome Flute and it swivels its head in curiosity.",
      "Gnomes consider a Chimney Owl on your roof the best luck in Fescue."
    ],
    "parts": [
      {
        "s": "cyl",
        "d": [
          0.16,
          0.18,
          0.18
        ],
        "at": [
          0,
          0.09,
          0
        ],
        "c": "tint",
        "name": "pot"
      },
      {
        "s": "ball",
        "d": [
          0.16
        ],
        "at": [
          0,
          0.3,
          0
        ],
        "scale": [
          1,
          1.1,
          0.95
        ],
        "c": "fur",
        "name": "body"
      },
      {
        "s": "ball",
        "d": [
          0.12
        ],
        "at": [
          0,
          0.28,
          0.06
        ],
        "c": "trim",
        "name": "belly"
      },
      {
        "s": "box",
        "d": [
          0.24,
          0.14,
          0.04
        ],
        "at": [
          0.18,
          0.3,
          0
        ],
        "rot": [
          0,
          15,
          -20
        ],
        "c": "fur",
        "mirror": true,
        "group": "wings",
        "name": "wing"
      },
      {
        "s": "ball",
        "d": [
          0.13
        ],
        "at": [
          0,
          0.48,
          0.02
        ],
        "c": "fur",
        "group": "head",
        "name": "head"
      },
      {
        "s": "cone",
        "d": [
          0.03,
          0.08
        ],
        "at": [
          0.09,
          0.59,
          0.02
        ],
        "rot": [
          0,
          0,
          -25
        ],
        "c": "fur",
        "mirror": true,
        "group": "head",
        "name": "tuft"
      },
      {
        "s": "ball",
        "d": [
          0.032
        ],
        "at": [
          0.055,
          0.5,
          0.12
        ],
        "c": "spark",
        "glow": true,
        "mirror": true,
        "group": "head",
        "name": "eye"
      },
      {
        "s": "cone",
        "d": [
          0.025,
          0.06
        ],
        "at": [
          0,
          0.46,
          0.15
        ],
        "rot": [
          95,
          0,
          0
        ],
        "c": "gold",
        "group": "head",
        "name": "beak"
      }
    ]
  },
  {
    "id": "frostking",
    "name": "Frost King",
    "category": "gnomeokemon",
    "uses": [
      "place",
      "collect"
    ],
    "tags": [
      "gnomeokemon",
      "rain",
      "frost",
      "winter",
      "boss",
      "king"
    ],
    "emoji": [
      "👑",
      "❄"
    ],
    "tint": "glaze-blue",
    "trim": "gold",
    "pivots": {
      "head": [
        0,
        0.72,
        0
      ],
      "arms": [
        0,
        0.48,
        0
      ]
    },
    "about": "Towering ice-armored guardian of the frozen Birdbath Keep with a golden Basin crown.",
    "examine": [
      "Every January, frost binds the Birdbath stones into a single walking giant.",
      "Its golden crown is a frozen lily-ring from the Basin.",
      "Throw a Pester Clod to watch it roar and slam its icy fists!",
      "When spring arrives, it quietly melts back into the keep fountain."
    ],
    "parts": [
      {
        "s": "cyl",
        "d": [
          0.08,
          0.1,
          0.24
        ],
        "at": [
          0.13,
          0.12,
          0
        ],
        "c": "stone",
        "mirror": true,
        "name": "leg"
      },
      {
        "s": "box",
        "d": [
          0.4,
          0.44,
          0.28
        ],
        "at": [
          0,
          0.46,
          0
        ],
        "c": "tint",
        "name": "torso"
      },
      {
        "s": "box",
        "d": [
          0.14,
          0.36,
          0.14
        ],
        "at": [
          0.29,
          0.46,
          0
        ],
        "rot": [
          0,
          0,
          -12
        ],
        "c": "glass",
        "alpha": 0.85,
        "mirror": true,
        "group": "arms",
        "name": "arm"
      },
      {
        "s": "box",
        "d": [
          0.2,
          0.22,
          0.2
        ],
        "at": [
          0,
          0.78,
          0
        ],
        "c": "tint",
        "group": "head",
        "name": "head"
      },
      {
        "s": "ring",
        "d": [
          0.12,
          0.025
        ],
        "at": [
          0,
          0.92,
          0
        ],
        "rot": [
          90,
          0,
          0
        ],
        "c": "trim",
        "group": "head",
        "name": "crown"
      },
      {
        "s": "ball",
        "d": [
          0.03
        ],
        "at": [
          0.06,
          0.8,
          0.1
        ],
        "c": "spark",
        "glow": true,
        "mirror": true,
        "group": "head",
        "name": "eye"
      }
    ]
  }
];
