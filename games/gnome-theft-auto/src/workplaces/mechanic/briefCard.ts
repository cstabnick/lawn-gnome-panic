// E24 mechanic: the work-order card (client, brief, wants, parts budget, one "On it" button). DOM only, appended to #ui.
export interface BriefCardView {
  client: string;
  vehicleName: string;
  text: string;
  wants: string[];
  budget: number;
  level: number;
}

const STYLE_ID = 'gta-brief-card-css';
const CSS = `
#gta-brief-card{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom) + 16px);transform:translateX(-50%);z-index:46;width:min(360px,calc(100vw - 24px));box-sizing:border-box;display:flex;flex-direction:column;gap:6px;padding:14px;background:#1b1f24;border:2px solid rgba(255,255,255,.28);border-radius:18px;color:#fff;font-family:system-ui,sans-serif;pointer-events:auto;box-shadow:0 8px 24px rgba(0,0,0,.45);max-height:calc(100vh - 32px);overflow-y:auto;}
#gta-brief-card .bc-title{font-weight:800;font-size:16px;}
#gta-brief-card .bc-who{font-size:13px;color:rgba(255,255,255,.75);}
#gta-brief-card .bc-text{font-style:italic;font-size:15px;}
#gta-brief-card .bc-want{font-size:13px;color:rgba(255,255,255,.88);}
#gta-brief-card .bc-hint{font-size:12px;color:rgba(255,255,255,.7);}
#gta-brief-card button{min-height:44px;border-radius:12px;border:1px solid rgba(255,255,255,.3);background:#2a323a;color:#fff;font:700 15px system-ui,sans-serif;cursor:pointer;touch-action:manipulation;}
`;

/** Show the card (replaces one already up). Closes on "On it", Enter or Escape, then calls `onOk`. */
export function showBriefCard(ui: HTMLElement, v: BriefCardView, onOk?: () => void): { close(): void; isOpen(): boolean } {
  if (typeof document === 'undefined') return { close() {}, isOpen: () => false };
  if (!document.getElementById(STYLE_ID)) {
    const st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  document.getElementById('gta-brief-card')?.querySelector('button')?.click();
  const el = document.createElement('div');
  el.id = 'gta-brief-card';
  el.setAttribute('role', 'dialog');
  const add = (cls: string, text: string): void => {
    const d = document.createElement('div');
    d.className = cls;
    d.textContent = text;
    el.appendChild(d);
  };
  add('bc-title', '🔧 Work order');
  add('bc-who', `${v.client}: ${v.vehicleName}`);
  add('bc-text', `"${v.text}"`);
  if (v.wants.length) add('bc-who', 'They want:');
  for (const w of v.wants) add('bc-want', `• ${w}`);
  add('bc-who', `Parts budget: ${v.budget} 🌰`);
  add('bc-hint', "Drive it into the Pay 'n' Glaze bay and press Glaze.");
  const ok = document.createElement('button');
  ok.type = 'button';
  ok.textContent = 'On it';
  el.appendChild(ok);
  el.addEventListener('pointerdown', (e) => e.stopPropagation());
  let isOpen = true;
  const onKey = (e: KeyboardEvent): void => {
    if (e.code === 'Enter' || e.code === 'Escape') done();
  };
  const done = (): void => {
    if (!isOpen) return;
    isOpen = false;
    window.removeEventListener('keydown', onKey);
    el.remove();
    onOk?.();
  };
  ok.addEventListener('click', done);
  window.addEventListener('keydown', onKey);
  ui.appendChild(el);
  return { close: done, isOpen: () => isOpen };
}
