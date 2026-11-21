import { describe, expect, it } from 'vitest';
import { getPullTabSpec } from './catalog';
import { buyTicket, newPullTabState, pullAllTabs, pullTab, setPullTabTheme, ticketFinished } from './engine';

describe('pulltabs engine', () => {
  it('buys a ticket, peels tabs one by one, and pays out deterministically', () => {
    const st = newPullTabState(12345, 'trollin-gnomes');
    expect(ticketFinished(st)).toBe(true);

    const bad = buyTicket(st, 2);
    expect(bad.ok).toBe(false);

    const bought = buyTicket(st, 50);
    expect(bought).toEqual({ ok: true, cost: 5 });
    expect(ticketFinished(st)).toBe(false);

    // Cannot switch themes mid-ticket
    expect(setPullTabTheme(st, 'goblinomicon')).toBe(false);

    const r0 = pullTab(st, 0);
    expect(r0.ok).toBe(true);
    expect(r0.allPulled).toBe(false);

    const rest = pullAllTabs(st);
    expect(ticketFinished(st)).toBe(true);
    expect(rest.totalNewWin).toBeGreaterThanOrEqual(0);
    expect(setPullTabTheme(st, 'gnome-theft-auto')).toBe(true);
    expect(getPullTabSpec(st.themeId).cost).toBe(25);
  });

  it('produces identical tickets for the same seed', () => {
    const a = newPullTabState(999, 'gnome-theft-auto');
    const b = newPullTabState(999, 'gnome-theft-auto');
    buyTicket(a, 100);
    buyTicket(b, 100);
    expect(a.rows).toEqual(b.rows);
  });
});
