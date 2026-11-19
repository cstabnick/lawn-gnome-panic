import type { EntityId, LorePack, ScamEntryDef, ServerSource, TributeItemDef, WhisperDef } from './types';

function hashStr(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

/**
 * Strips Discord export chrome (timestamps, "whalebot", "whalebot-dev", "view prompt")
 * so pasted server responses become clean, eerie in-game lines.
 */
export function extractShitpostLines(rawText: string): string[] {
  const normalized = rawText
    .replace(/\r\n/g, '\n')
    .replace(/view prompt/gi, '\n')
    .replace(/\[\d{1,2}:\d{2}\s*(?:AM|PM)\]/gi, '\n')
    .replace(/\bwhalebot(?:-dev)?\b/gi, '\n');

  const lines: string[] = [];
  for (const chunk of normalized.split('\n')) {
    const cleaned = chunk.replace(/\s+/g, ' ').trim();
    if (cleaned.length < 14) continue;
    if (/^(joined #|Shitposter is now on here|Persona suggestion|React to back it|You created this channel)/i.test(cleaned)) {
      continue;
    }
    lines.push(cleaned);
  }
  return Array.from(new Set(lines));
}

function classifyEntity(line: string): EntityId {
  const l = line.toLowerCase();
  if (/\b(cone|kebab|shawarma|oregano|garlic sauce|rotat|kin)\b/.test(l)) return 'cone';
  if (/\b(microwave|burrito|defrost|thaw)\b/.test(l)) return 'microwave';
  if (/\b(fridge|four notes|five notes|six notes|seven notes|setlist|jingle|clap|nod)\b/.test(l)) return 'fridge';
  if (/\b(smoke detector|blink|chirp|moth|soon)\b/.test(l)) return 'smoke_detector';
  if (/\b(toaster|toast|eject)\b/.test(l)) return 'toaster';
  if (/\b(printer|ink|cartridge|scam|price point|ledger|fee|gym|hotel|kibble|artisan|bread|maccas|spring water)\b/.test(l)) return 'printer';
  if (/\b(horse hockey|penalty box|foal)\b/.test(l)) return 'tv';
  return 'apartment';
}

/**
 * Converts pasted Discord/whalebot responses into a playable LorePack.
 * Automatically routes lines into Scam Ledger entries, Tribute reactions, and Entity Whispers.
 */
export function parseRawShitposts(rawText: string, source: ServerSource = 'custom', label = 'Pasted Responses'): LorePack {
  const lines = extractShitpostLines(rawText);
  const whispers: WhisperDef[] = [];
  const scams: ScamEntryDef[] = [];
  const tributes: TributeItemDef[] = [];

  lines.forEach((line, idx) => {
    const idBase = `${source}-${hashStr(line)}-${idx}`;
    const entity = classifyEntity(line);
    const lower = line.toLowerCase();

    if (/scammed|price point|ledger|fee|subscription|kibble|artisan|printer/.test(lower)) {
      const itemMatch = line.match(/\b(dog's kibble|cat(?:'s)? food|artisan(?:al)? bread|printer(?:\s+ink)?|gym|hotel|spring water|oat milk|coffee|toothpaste|mattress|parking|maccas)\b/i);
      scams.push({
        id: `scam-${idBase}`,
        pricePoint: 2 + (scams.length % 6),
        item: itemMatch ? itemMatch[1] : 'Household Expense',
        scamText: line,
        sourceServer: source,
      });
    }

    if (/offering|tribute/.test(lower) && /accepted|returned|declined|doubled/.test(lower)) {
      const rejected = /returned|declined/.test(lower);
      tributes.push({
        id: `trib-${idBase}`,
        name: line.slice(0, 26),
        shortLabel: rejected ? 'Suspect Paper' : 'Custom Tribute',
        accepted: !rejected,
        dreadDelta: rejected ? 14 : -10,
        devotionDelta: rejected ? -8 : 12,
        coneReaction: line,
        color: rejected ? 0xc84b4b : 0xd6a85a,
        sourceServer: source,
      });
    }

    whispers.push({
      id: `whisp-${idBase}`,
      entity,
      text: line,
      minHour: Math.min(5, Math.floor((idx / Math.max(1, lines.length)) * 5)),
      triggerKind: /escalat|warn|threat|countdown|soon|twice/.test(lower) ? 'warning' : 'ambient',
      sourceServer: source,
    });
  });

  return {
    id: `pack-${source}-${hashStr(rawText)}`,
    label,
    sourceServer: source,
    tributes,
    scams,
    whispers,
  };
}
