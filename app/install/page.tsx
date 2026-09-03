import type { Metadata } from 'next';
import Image from 'next/image';
import { InfoShell } from '@/app/info-shell';
import { InstallButton } from '@/app/pwa-provider';

export const metadata: Metadata = {
  title: 'Install the PacePrep app',
  description:
    'Add PacePrep to your Android or iPhone home screen. The same recall training, without a separate app download.',
  alternates: { canonical: '/install' },
};

export default function InstallPage() {
  return (
    <InfoShell
      eyebrow="PACEPREP ON YOUR PHONE"
      title="One tap closer to your next drill."
      intro="Install the lightweight web app on your home screen. Same practice, same progress, no app-store download required."
    >
      <section className="install-callout">
        <Image
          src="/icons/icon-192.png"
          width={64}
          height={64}
          alt="PacePrep app icon"
          unoptimized
        />
        <div>
          <h2>PacePrep</h2>
          <p>Android · iPhone · supported desktop browsers</p>
          <InstallButton />
        </div>
      </section>
      <section>
        <h2>Android</h2>
        <ol>
          <li>Open PacePrep in Chrome.</li>
          <li>
            Tap “Install PacePrep” when available, or open Chrome’s menu and
            choose “Add to Home screen” / “Install app”.
          </li>
          <li>Open PacePrep from its new icon.</li>
        </ol>
      </section>
      <section>
        <h2>iPhone or iPad</h2>
        <ol>
          <li>Open this website in Safari.</li>
          <li>Tap Share, then “Add to Home Screen”.</li>
          <li>Keep “Open as Web App” enabled if shown, then tap Add.</li>
        </ol>
        <p>
          iOS uses Safari’s install menu rather than an automatic install
          prompt.
        </p>
      </section>
      <section>
        <h2>What works without a connection?</h2>
        <p>
          A drill you have already opened continues in the browser if your
          connection drops. Guest answers are saved locally. Reopening the full
          trainer offline is not supported yet; you’ll see a clear reconnect
          screen instead of a blank page. Sign-in and cross-device sync need a
          connection.
        </p>
      </section>
      <section>
        <h2>Your progress stays yours</h2>
        <p>
          Guest data belongs to the browser and device where you practised. An
          installed app may use separate storage on some devices, so sign in
          before switching if you need the same history. Uninstalling or
          clearing site data can remove guest progress.
        </p>
        <p>
          The app uses the same free testing-preview access as the website. No
          payment or notification permission is required.
        </p>
      </section>
    </InfoShell>
  );
}
