// What Gnoma says. Short, warm, a little bossy, like the cooking mama she is. Keep each line under ~80 characters.

export const INTRO = "Let's bake a cake, sweetie!";

/** Said when a step is finished, by its stars (index 0 = 1 star). */
export const PRAISE = [
  'Oops, a little wobbly. We learn from it!',
  'Not bad at all, my little gnome!',
  'Perfect! Look at you go!',
] as const;

export const CAKE_VERDICT = {
  perfect: 'Gnome-tastic!! I am so proud of you!',
  good: 'You did it, sweetie! Now eat a slice.',
  low: 'Crunchy, but I love you anyway!',
} as const;

export const BAKE_LINES = {
  golden: 'Golden brown! Oh, I could cry!',
  raw: "Hmm, it's still gooey. Bake it a bit longer next time.",
  burnt: 'Oh no, the acorns got crispy! Still a cake.',
} as const;
