export interface LocationToastHandle {
  show(badge: string, title: string, subtitle: string, accentColor: string): void;
}

export function createLocationToast(container: HTMLElement): LocationToastHandle {
  const el = document.createElement('div');
  el.id = 'gsr-location-toast';
  el.style.cssText = `
    position:fixed; left:50%; top:68px; transform:translateX(-50%) skewX(-8deg) translateY(-14px);
    z-index:24; pointer-events:none; opacity:0; transition:opacity 0.25s ease, transform 0.25s ease;
    background:rgba(18,8,34,0.94); border:2px solid #00e5ff; border-radius:12px;
    padding:8px 18px; text-align:center; color:#fff; font-family:"Arial Black",Impact,system-ui,sans-serif;
    box-shadow:5px 5px 0 #ff4ecd; min-width:220px; max-width:90vw;
  `;
  container.appendChild(el);

  let hideTimer: ReturnType<typeof setTimeout> | null = null;

  return {
    show(badge, title, subtitle, accentColor) {
      if (hideTimer) clearTimeout(hideTimer);
      el.style.borderColor = accentColor;
      el.innerHTML = `
        <div style="font-size:10px; font-weight:900; color:${accentColor}; letter-spacing:1px; font-family:system-ui,sans-serif;">${badge}</div>
        <div style="font-size:18px; font-weight:900; color:#ffd740; line-height:1.15;">${title}</div>
        <div style="font-size:11px; font-weight:700; color:#dfd3f7; font-family:system-ui,sans-serif;">${subtitle}</div>
      `;
      el.style.opacity = '1';
      el.style.transform = 'translateX(-50%) skewX(-8deg) translateY(0)';
      hideTimer = setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateX(-50%) skewX(-8deg) translateY(-14px)';
      }, 2800);
    },
  };
}
