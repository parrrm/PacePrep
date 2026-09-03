'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { SiteLink as Link } from './site-link';
import { Check, Download, RefreshCw, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};
const AppContext = createContext<{
  installed: boolean;
  canPrompt: boolean;
  install: () => Promise<void>;
}>({ installed: false, canPrompt: false, install: async () => {} });

export function PwaProvider({ children }: { children: ReactNode }) {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [offline, setOffline] = useState(false);
  const [update, setUpdate] = useState<ServiceWorker | null>(null);
  useEffect(() => {
    const updateOnline = () => setOffline(!navigator.onLine);
    const installPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallEvent);
    };
    const didInstall = () => {
      setInstalled(true);
      setPrompt(null);
    };
    const standalone = window.matchMedia('(display-mode: standalone)');
    const displayChange = () =>
      setInstalled(
        standalone.matches ||
          !!(navigator as Navigator & { standalone?: boolean }).standalone,
      );
    displayChange();
    updateOnline();
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    window.addEventListener('beforeinstallprompt', installPrompt);
    window.addEventListener('appinstalled', didInstall);
    standalone.addEventListener('change', displayChange);
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .then((registration) => {
          if (registration.waiting) setUpdate(registration.waiting);
          registration.addEventListener('updatefound', () => {
            const worker = registration.installing;
            worker?.addEventListener('statechange', () => {
              if (
                worker.state === 'installed' &&
                navigator.serviceWorker.controller
              )
                setUpdate(worker);
            });
          });
        })
        .catch(() => {
          /* The website still works if installation is unavailable. */
        });
    }
    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
      window.removeEventListener('beforeinstallprompt', installPrompt);
      window.removeEventListener('appinstalled', didInstall);
      standalone.removeEventListener('change', displayChange);
    };
  }, []);
  async function install() {
    if (!prompt) return;
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } catch {
      /* Expired install prompts fall back to the browser-menu guide. */
    } finally {
      setPrompt(null);
    }
  }
  function applyUpdate() {
    if (
      !update ||
      !window.confirm(
        'Reload PacePrep to update? Finish any current drill first. Saved progress is kept.',
      )
    )
      return;
    navigator.serviceWorker.addEventListener(
      'controllerchange',
      () => window.location.reload(),
      { once: true },
    );
    update.postMessage({ type: 'ACTIVATE_UPDATE' });
  }
  return (
    <AppContext.Provider value={{ installed, canPrompt: !!prompt, install }}>
      {children}
      {(offline || update) && (
        <output className="app-status">
          {offline ? (
            <>
              <WifiOff size={17} />
              <span>
                Offline · open drills still work. Reconnect before leaving this
                page or syncing.
              </span>
            </>
          ) : (
            <>
              <RefreshCw size={17} />
              <span>A PacePrep update is ready.</span>
              <button onClick={applyUpdate}>Update after my drill</button>
            </>
          )}
        </output>
      )}
    </AppContext.Provider>
  );
}

export function InstallButton({ compact = false }: { compact?: boolean }) {
  const app = useContext(AppContext);
  if (app.installed)
    return (
      <span className="app-installed">
        <Check size={16} />
        {compact ? 'Installed' : 'PacePrep is installed'}
      </span>
    );
  if (app.canPrompt)
    return (
      <Button
        variant="outline"
        className="install-button"
        onClick={app.install}
      >
        <Download />
        {compact ? 'Get app' : 'Install PacePrep'}
      </Button>
    );
  return (
    <Link className="install-button" href="/install">
      <Download size={17} />
      {compact ? 'Get app' : 'Install PacePrep'}
    </Link>
  );
}
