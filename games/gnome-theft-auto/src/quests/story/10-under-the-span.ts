// Story row 10 (docs/design/gnome-theft-auto/story-outline.md): Under the Span. Pip needs a radio jammer for a plan he will
// not explain; three scrap bins downtown, Hogweed Sprocket's yard under the Unfinished Span (the Dewdrop rolls past, Grout
// brings the citation), and the jammer into Pip's toolbox. Scenes: cutscene/scenes/story/m10-under-the-span.ts.
import { SIDE_VALVE } from '../../config';
import { brief, call, type StoryFile } from './kit';

export const STORY: StoryFile = {
  quests: [
    {
      id: 'm10-under-the-span',
      title: 'Under the Span',
      giver: 'side-valve',
      prereq: 'm09-where-asphalt-sleeps',
      chapter: 1,
      rewardAcorns: 300,
      radioBulletin: 'm10-under-the-span',
      // Errands on foot and a shed of inventors: no Hat Watch.
      hoa: 'off',
      cutscene: { kind: 'script', script: 'under-the-span-intro' },
      outro: { kind: 'script', script: 'under-the-span-outro' },
      objectives: [
        {
          kind: 'inspect',
          text: 'Search the three scrap bins in the downtown alley for a spring, a bolt and a panel',
          verb: 'Search',
          hint: 'Scrap bins, downtown alley',
          points: [
            { at: [-103, 84], label: 'Scrap bin 1 of 3', prop: 'gta-wheelie-bin', note: 'A seat spring, still springy. Somebody threw away a good spring.' },
            { at: [-92, 104.5], label: 'Scrap bin 2 of 3', prop: 'gta-wheelie-bin', note: 'One loose bolt, big as a thumb. Hogweed will cry.' },
            { at: [-77, 90], label: 'Scrap bin 3 of 3', prop: 'gta-wheelie-bin', note: 'A mower panel with a dent the shape of a hat. Three parts: done.' },
          ],
        },
        {
          kind: 'visit',
          text: "Trade the three parts for Hogweed's jammer at the Underspan",
          at: [578, -18],
          radius: 8,
          hint: 'The Underspan, under the Unfinished Span',
          scene: 'under-the-span-mid',
        },
        {
          kind: 'visit',
          text: "Deliver the radio jammer to Pip at Side-Valve Salvage",
          at: [SIDE_VALVE.bay.x, SIDE_VALVE.bay.z],
          radius: 8,
          hint: 'Side-Valve Salvage bay',
        },
      ],
      doneText: 'Jammer delivered. Pip has a plan, a toolbox that shuts very firmly, and a new way of not answering.',
    },
  ],
  comms: {
    'm10-under-the-span': {
      0: brief(
        ['pip', 'I need a radio jammer. Hogweed Sprocket builds anything for scrap, under the Unfinished Span.'],
        ['pip', "Search three scrap bins downtown for parts first. Don't ask what it's for. Three hundred acorns."],
      ),
      1: call(
        ['hogweed', 'A spring, a bolt, a panel! Bring them to the Underspan and the jammer is yours.'],
      ),
      2: call(
        ['grout', 'Local 404 says: ladders under the Span are union work. The Union does not approve.'],
        ['pip', 'Jammer! Bring it to Side-Valve Salvage. Quick, before Tansy asks what it is.'],
      ),
    },
  },
  bulletins: {
    'm10-under-the-span': [
      'Underspan update: a clear rolling ball was seen crossing the yard at speed with a gnome running inside. Hogweed Sprocket says it is "going as planned".',
      'Local 404 has served another citation for unauthorised verticality on the Underspan. The workshop says it will frame this one too.',
    ],
  },
  plans: {
    'm10-under-the-span': { suite: 'story', expect: 'pass' },
  },
};
