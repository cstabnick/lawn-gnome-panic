// Dark theme, large type, mobile-first. Injected once; scoped under .gm so nothing outside the app is touched.
const CSS = `
.gm { box-sizing: border-box; min-height: 100vh; min-height: 100dvh; color: #f3efe4; background: #10131a;
  font: 18px/1.45 system-ui, -apple-system, "Segoe UI", sans-serif;
  padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right))
    max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left)); }
.gm * { box-sizing: border-box; }
.gm .card { max-width: 560px; margin: 0 auto; }
.gm h1 { font-size: 34px; line-height: 1.15; margin: 8px 0 12px; }
.gm h2 { font-size: 22px; margin: 24px 0 8px; color: #e9c46a; }
.gm .sub { color: #aab2c5; margin: 0 0 12px; }
.gm .prompt { font-size: 30px; }
.gm .hint { color: #aab2c5; font-size: 16px; word-break: break-all; }
.gm .link { color: #9ecbff; }
.gm label { display: block; margin: 12px 0; }
.gm label > span { display: block; color: #aab2c5; margin-bottom: 6px; }
.gm input { width: 100%; min-height: 48px; font-size: 16px; padding: 0 12px; border-radius: 10px;
  border: 1px solid #3a4152; background: #1b1f2a; color: #fff; }
.gm input:focus { outline: 3px solid #e9c46a; outline-offset: 1px; }
.gm button { min-height: 48px; min-width: 44px; padding: 0 18px; margin: 6px 6px 6px 0; border: 0; border-radius: 12px;
  font: inherit; font-weight: 700; color: #fff; background: #2d6a4f; cursor: pointer; touch-action: manipulation; }
.gm button.alt { background: #2a2f3d; }
.gm button.wide { display: block; width: 100%; margin: 12px 0; }
.gm button[aria-pressed="true"] { background: #e9c46a; color: #111; }
.gm button:disabled { opacity: .5; cursor: default; }
.gm .choices { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.gm .choices button { margin: 0; }
.gm .code { font: 800 46px/1.2 ui-monospace, Consolas, monospace; letter-spacing: .2em; text-align: center; margin: 12px 0; }
.gm .error { color: #ff8a80; margin: 12px 0; }
.gm .notice { color: #b7e4c7; margin: 8px 0; }
.gm .banner { background: #4a3b12; color: #ffe8a3; border-radius: 10px; padding: 10px 14px; margin: 0 auto 12px; max-width: 560px; }
.gm ul { list-style: none; padding: 0; margin: 0; }
.gm li { padding: 8px 0; border-bottom: 1px solid #222838; display: flex; justify-content: space-between; gap: 12px; }
.gm .tag { color: #aab2c5; font-size: 15px; }
.gm .clock { font: 700 26px ui-monospace, Consolas, monospace; color: #9ecbff; }
.gm .bucket { background: #1b1f2a; border-radius: 12px; padding: 12px 14px; margin: 10px 0; border-left: 6px solid #444; }
.gm .bucket.mine { outline: 2px solid #e9c46a; }
.gm .bucket .tier { font-size: 15px; display: flex; justify-content: space-between; font-weight: 700; }
.gm .bucket .ans { font-size: 22px; margin: 4px 0; }
.gm .bucket .who { color: #aab2c5; font-size: 16px; }
.gm form.answer { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
.gm form.answer button { align-self: stretch; }
@media (orientation: landscape) and (max-height: 500px) {
  .gm { font-size: 16px; }
  .gm h1 { font-size: 26px; }
  .gm .prompt { font-size: 24px; }
  .gm .code { font-size: 34px; }
}
`;

/** Adds the app stylesheet to the document head once. */
export function injectStyle(): void {
  if (document.getElementById('gnomillion-style')) return;
  const el = document.createElement('style');
  el.id = 'gnomillion-style';
  el.textContent = CSS;
  document.head.appendChild(el);
}
