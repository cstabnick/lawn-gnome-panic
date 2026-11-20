import { el } from '../ui';

/** The title screen: the house from the garden, with the menu floating over the sky. */
export function renderTitle(
  container: HTMLElement,
  actions: { onPlay: () => void; onOptions: () => void; onQuickRide: () => void },
): void {
  container.replaceChildren();
  const wrap = el('div', {
    position: 'absolute',
    inset: '0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'calc(70px + env(safe-area-inset-top)) 16px calc(28px + env(safe-area-inset-bottom))',
    pointerEvents: 'none',
    textAlign: 'center',
  });
  wrap.id = 'title-screen';

  const head = el('div', { textShadow: '0 3px 14px rgba(0,0,0,0.65)' });
  head.append(
    el('div', { fontSize: '13px', fontWeight: '800', letterSpacing: '0.14em', color: '#ffe9a8', textTransform: 'uppercase' }, 'Fescue Field Lab presents'),
    el('h1', { margin: '4px 0 0', fontSize: 'clamp(34px, 7vw, 68px)', lineHeight: '1.02', color: '#fff', letterSpacing: '-0.01em' }, 'Gnomokemon Snap 64'),
    el('div', { marginTop: '8px', fontSize: 'clamp(13px, 2vw, 17px)', color: '#fff7dc' }, 'Ride the Giant Fetch Dog. Photograph every creature. Impress Gnome Jesus.'),
  );

  // A row along the bottom (so the house stays in view), stacking on a narrow screen.
  const menu = el('div', { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px', width: 'min(760px, 100%)', pointerEvents: 'auto' });
  const btn = (label: string, onClick: () => void, primary = false): HTMLButtonElement => {
    const b = el('button', {
      minHeight: '54px',
      flex: primary ? '1.3 1 220px' : '1 1 160px',
      padding: '10px 18px',
      borderRadius: '14px',
      border: `2px solid ${primary ? '#ffcc33' : 'rgba(255,255,255,0.35)'}`,
      background: primary ? '#ffcc33' : 'rgba(18, 28, 20, 0.82)',
      color: primary ? '#18231a' : '#fff',
      fontSize: primary ? '19px' : '15px',
      fontWeight: '800',
      cursor: 'pointer',
      backdropFilter: 'blur(4px)',
    }, label);
    b.type = 'button';
    b.onclick = onClick;
    return b;
  };
  const play = btn('🚪 Enter the Lab', actions.onPlay, true);
  play.id = 'title-play';
  const quick = btn('🐾 Quick Ride', actions.onQuickRide);
  const options = btn('🪞 Options', actions.onOptions);
  quick.style.order = '1';
  play.style.order = '2';
  options.style.order = '3';
  menu.append(play, quick, options);

  wrap.append(head, menu);
  container.append(wrap);
}
