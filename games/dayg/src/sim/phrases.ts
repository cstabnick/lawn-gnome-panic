// Dialogue phrases (quests.md "Talking to NPCs", lore ruling "DayG speech"): dry, plain, one or two sentences.
// Vars: {name} the NPC, {player}, {region}, {danger}, {price}, {resource}, {count}, {size}, {faction}, {title}, {other}.
// Gnomes are "shattered", Hatless are "put down", acorns are counted.
import type { PhraseLine } from './types';

export const PHRASES: Record<string, readonly string[]> = {
  'talk.away': ['{name} is not within reach.', 'There is no one called {name} here.', '{name} is somewhere else, out of earshot.'],
  'talk.hostile': ['{name} backs off, eyes on the trowel.', '"Don\'t," {name} says, and turns away.', '{name} will not speak to you.'],
  'talk.short': ['"You don\'t have that on you," {name} says.', '{name} looks at your empty hands.', '"Show me what you\'ve got," says {name}.'],

  'greet.hostile': ['{name} does not look up.', '"Keep walking," {name} says.', '{name} spits in the moss and goes back to work.'],
  'greet.wary': ['{name} keeps a hand on the trowel. "Morning."', '"Mm," says {name}, watching your hands.', '{name} nods once, not all the way.'],
  'greet.neutral': ['{name} nods.', '"Morning," {name} says.', '{name} lifts a hand off the wall and puts it back.'],
  'greet.friendly': ['{name} grins. "Good to see you, {player}."', '"Morning, {player}," {name} says. "Mind the ivy."', '{name} saves you the good spot by the tap.'],
  'greet.close': ['{name} shoves a cup of water at you. "Sit a minute."', '"{player}. Thought you were shattered," says {name}, pleased.', '{name} hands you the spare trowel without a word.'],

  'ask.place': ['"{region}? {danger}, last I looked."', '"{region}. {danger}. Keep to the edges."', '"Ask me about {region} tomorrow. It was {danger} today."'],
  'ask.gnome': ['"{other} was last in {region}. Or what\'s left of them."', '"{other}? Up in {region}, I think."', '"{other} went to {region}. Don\'t quote me."'],
  'ask.unknown': ['"Haven\'t seen them. Don\'t ask me."', '{name} shakes their head. "No idea."', '"Not a clue," says {name}.'],
  'ask.price': ['"{resource} is {price} acorns a unit this week."', '"Two acorns and a bit for {resource}. Up, down, who knows."', '"{price} acorns for {resource}. Take it or leave it."'],
  'ask.herd': ['"About {size} of them in {region}. Moving slow."', '"{size} in {region}, last count. Don\'t go near."', '"Herd of {size} down by {region}. They walk in a line."'],
  'ask.noherd': ['"Nothing big nearby. Yet."', '"Quiet lately. Quiet is the good kind."', '"No herds I\'d name."'],
  'ask.refuse': ['"Not telling you that," {name} says.', '{name} looks away. "Ask someone else."', '"Why would I say?" says {name}.'],

  'trade.accept': ['"Fair," says {name}. Hands over {count} {resource}.', '{name} takes it and counts out the rest. "Done."', '"Good. {count} {resource} it is."'],
  'trade.refuse': ['"Not for that," {name} says.', '{name} shakes their head at the pile.', '"Bring more than that," says {name}.'],

  'help.quest': ['"There\'s a job. {title}."', '"You could do me a favour. {title}."', '"{title}. Pays what I\'ve got."'],
  'help.none': ['"Nothing going spare," {name} says.', '"No work for you right now."', '{name} waves you off. "Come back later."'],

  'askhelp.give': ['{name} presses a bit of food into your hand. "Pay me back when you can."', '"Here. Don\'t make a habit of it," says {name}.', '{name} tips a handful of food into your pack. "Square it later."'],
  'askhelp.refuse': ['"Can\'t spare it," says {name}.', '{name} pats the pack shut. "Sorry."', '"Not this week," says {name}, not looking up.'],

  'recruit.ok': ['{name} pulls on a {faction} hat. "Alright, then."', '"I\'ll come with you to {faction}," says {name}.', '{name} ties the {faction} cord on. "Lead on."'],
  'recruit.refuse': ['"Not yet," says {name}.', '{name} looks at the hat, then at the ground.', '"Ask me when I know you better," says {name}.'],
  'join.ok': ['You are {faction} now. {name} nods you in.', '"Welcome to {faction}," says {name}.', '{name} marks you down in the {faction} book.'],
  'join.refuse': ['"They won\'t have you," says {name}.', '{name} shrugs. "Not my call."', '"Not today," says {name}.'],

  'threaten.give': ['{name} drops a {resource} at your feet and backs off.', '"Take it and go," says {name}, and hands over a {resource}.', '{name} throws down a {resource} and runs.'],
  'threaten.fight': ['{name} swings the trowel. Then it is a fight.', '"Try it," says {name}, and does not back down.', '{name} grabs a rake and comes at you.'],
  'rob.ok': ['{name} is not quick enough. You take {count} {resource}.', 'You get {count} {resource} before {name} can shout.', '{name} looks the other way for a moment. You take {count} {resource}.'],
  'rob.caught': ['{name} shouts for the others. Everyone is looking now.', '"Thief!" {name} yells, and it carries.', '{name} has your sleeve, and does not let go.'],

  'share.thanks': ['"Thanks, {player}. That was a long day," says {name}.', '{name} eats the first bite standing up, then sits down.', '"You didn\'t have to," says {name}. "You did."'],
  'warn.thanks': ['"Right. I\'ll keep my eyes open," says {name}.', '{name} nods slowly and goes home.', '"Good. Now go and tell the others," says {name}.'],
  'warn.none': ['"Warn who?" says {name}.', '{name} waits for you to say something.', '"Warn me of what?" says {name}.'],
};

export function renderLine(line: PhraseLine, pick: number): string {
  const options = PHRASES[line.key] ?? [line.key];
  const text = options[Math.abs(pick) % options.length];
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in line.vars ? String(line.vars[k]) : m));
}
export function renderLines(lines: readonly PhraseLine[], seed: number): string[] {
  return lines.map((l, i) => renderLine(l, seed + i));
}
