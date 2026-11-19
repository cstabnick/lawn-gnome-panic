import { formatBotReport, runBot } from './bots.ts';

const clicker = runBot('clicker');
const idle = runBot('idle');

console.log(formatBotReport(clicker));
console.log(formatBotReport(idle));
