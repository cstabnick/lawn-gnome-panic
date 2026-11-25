// Unified DayG UI design system: CSS custom properties and shared baseline rules for all panels and overlays.
export const DAYG_THEME_CSS = `
:root{
  --dg-bg:rgba(14,18,13,0.94);
  --dg-surface:rgba(23,30,21,0.96);
  --dg-surface-2:#1f281c;
  --dg-surface-hover:#2c3827;
  --dg-border:#485640;
  --dg-border-strong:#6f8262;
  --dg-accent:#e8c35a;
  --dg-accent-dim:rgba(232,195,90,0.18);
  --dg-ok:#7fa35a;
  --dg-warn:#d9a441;
  --dg-danger:#c75342;
  --dg-text:#eef2e8;
  --dg-muted:#a6b29d;
  --dg-radius:10px;
  --dg-shadow:0 12px 32px rgba(0,0,0,0.55);
  --dg-font:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
}
#dayg-inv,#dayg-map,#dayg-audio,#dayg-ledger,#dayg-talk,#dayg-board,#dayg-room,#dayg-recap,#dayg-trainer,#dayg-chest{
  font-family:var(--dg-font);
  color:var(--dg-text);
  box-sizing:border-box;
}
#dayg-inv button,#dayg-map button,#dayg-audio button,#dayg-ledger button,#dayg-talk button,
#dayg-board button,#dayg-room button,#dayg-recap button,#dayg-trainer button,#dayg-chest button{
  font-family:var(--dg-font);
  transition:background-color .14s ease,border-color .14s ease,transform .08s ease;
}
#dayg-inv button:focus-visible,#dayg-map button:focus-visible,#dayg-audio button:focus-visible,
#dayg-ledger button:focus-visible,#dayg-talk button:focus-visible,#dayg-board button:focus-visible,
#dayg-room button:focus-visible,#dayg-recap button:focus-visible,#dayg-trainer button:focus-visible,
#dayg-chest button:focus-visible{
  outline:2px solid var(--dg-accent);
  outline-offset:2px;
}
#dayg-inv ::-webkit-scrollbar,#dayg-ledger ::-webkit-scrollbar,#dayg-talk ::-webkit-scrollbar,
#dayg-board ::-webkit-scrollbar,#dayg-room ::-webkit-scrollbar,#dayg-trainer ::-webkit-scrollbar{
  width:6px;height:6px;
}
#dayg-inv ::-webkit-scrollbar-thumb,#dayg-ledger ::-webkit-scrollbar-thumb,#dayg-talk ::-webkit-scrollbar-thumb,
#dayg-board ::-webkit-scrollbar-thumb,#dayg-room ::-webkit-scrollbar-thumb,#dayg-trainer ::-webkit-scrollbar-thumb{
  background:var(--dg-border);border-radius:3px;
}
.dg-pill{
  display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;
  font-size:11px;line-height:1.3;background:rgba(14,18,13,0.78);border:1px solid var(--dg-border);color:var(--dg-text);
  white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis;
}
.dg-pill-accent{border-color:var(--dg-accent);color:var(--dg-accent);background:var(--dg-accent-dim);}
`;

export function installDaygTheme(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById('dayg-theme')) return;
  const style = document.createElement('style');
  style.id = 'dayg-theme';
  style.textContent = DAYG_THEME_CSS;
  document.head.appendChild(style);
}
