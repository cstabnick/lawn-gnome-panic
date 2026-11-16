import { testMinigame } from '@lawn/party/testkit';
import { minigames } from '.';

for (const m of minigames) testMinigame(m);
