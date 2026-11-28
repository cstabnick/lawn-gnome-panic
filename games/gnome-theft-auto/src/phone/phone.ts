// The in-game phone, now part of the Gnomlet tablet (gnomlet/). P, the 'phone' action and pad Back open the tablet's
// home screen; `addApp` is a shim onto the Gnomlet app registry, so every module that adds a phone app (taxi, Exchange,
// jobs, Sling-Lift, tubing, Bag, Kiln-Shield, Ledger, and later epics) shows up as a Gnomlet app without changes.
// The "can I use the phone now" check (cutscene, shop open, knocked out) still applies to opening it and to each app.

import { KEYS, isTyping } from '../keys';
import { registerAction } from '../ui/actions';
import { closeGnomlet, isGnomletOpen, openGnomlet } from '../gnomlet/gnomlet';
import { registerGnomletApp, type GnomletGroup } from '../gnomlet/registry';

export interface PhoneApp {
  id: string;
  label: string;
  /** Emoji shown on the app's button. */
  icon: string;
  /** One line under the label (fee, status), re-read every time the menu opens. */
  detail?(): string;
  run(): void;
  /** Home-screen group on the Gnomlet. Default: PHONE_GROUPS[id] or 'phone'. */
  group?: GnomletGroup;
}

export interface PhoneDeps {
  /** Why the phone cannot be used right now (cutscene, shop open, cracked...), or null. */
  blocked(): string | null;
  toast(text: string): void;
}

export interface Phone {
  addApp(app: PhoneApp): void;
  open(): void;
  close(): void;
  toggle(): void;
  isOpen(): boolean;
}

/** Where the phone apps that existed before the Gnomlet sit on its home screen. */
export const PHONE_GROUPS: Readonly<Record<string, GnomletGroup>> = {
  taxi: 'phone',
  'sling-lift': 'phone',
  jobs: 'world',
  tubing: 'world',
  bag: 'money',
  ledger: 'money',
  'kiln-shield': 'money',
  'kerbside-exchange': 'money',
};

export function createPhone(_ui: HTMLElement, deps: PhoneDeps): Phone {
  function open(): void {
    if (isGnomletOpen()) return;
    const why = deps.blocked();
    if (why) {
      deps.toast(why);
      return;
    }
    openGnomlet();
  }
  const close = (): void => closeGnomlet();
  const toggle = (): void => { if (isGnomletOpen()) close(); else open(); };

  window.addEventListener('keydown', (e) => {
    if (e.code === KEYS.phone && !e.repeat && !isTyping(e)) toggle();
  });
  window.addEventListener('gta:phone', toggle);
  registerAction('phone', { run: toggle });

  return {
    addApp(app: PhoneApp): void {
      registerGnomletApp({
        id: app.id,
        label: app.label,
        icon: app.icon,
        group: app.group ?? PHONE_GROUPS[app.id] ?? 'phone',
        detail: app.detail,
        run: () => {
          const why = deps.blocked();
          if (why) deps.toast(why);
          else app.run();
        },
      });
    },
    open,
    close,
    toggle,
    isOpen: isGnomletOpen,
  };
}
