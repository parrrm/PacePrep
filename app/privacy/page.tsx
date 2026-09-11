import type { Metadata } from 'next';
import { InfoShell } from '@/app/info-shell';
import { onVercel } from '@/lib/hosting';

export const metadata: Metadata = { title: 'Privacy Notice' };

export default function PrivacyPage() {
  return (
    <InfoShell
      eyebrow="PRIVACY"
      title="Public beta privacy notice"
      intro="PacePrep Team maintains this free public beta. Guest practice works without an account; cloud accounts remain disabled on the Vercel release."
    >
      <section>
        <h2>Age</h2>
        <p>
          PacePrep is intended only for people aged 18 or older. Do not use the
          signed-in service if you are under 18.
        </p>
      </section>
      <section>
        <h2>Try-before-saving diagnostic</h2>
        <p>
          The homepage baseline keeps answers in the current page’s memory. It
          does not send answers to our server or save them to browser storage
          until you choose to save and confirm you are 18+. Closing or
          refreshing the unsaved page discards that sample.
        </p>
      </section>
      <section>
        <h2>Guest mode</h2>
        <p>
          Practice answers, response times, settings, and mastery records stay
          in your browser&apos;s local storage. Clearing site data removes them
          from that device. You can also use Profile → Delete progress without
          signing in.
        </p>
      </section>
      <section>
        <h2>Signed-in mode, when enabled</h2>
        <p>
          The authentication layer provides PacePrep with an account identifier,
          email address, and full name when available. PacePrep does not receive
          a profile image in the current implementation. We store those
          identifiers with your practice record so progress can sync across
          devices.
        </p>
      </section>
      <section>
        <h2>Purpose and sharing</h2>
        <p>
          We use the data only to authenticate you, calculate learning progress,
          adapt review scheduling, and operate the service. The PacePrep
          application does not send practice answers back to OpenAI.
          Infrastructure providers process data as needed to host
          authentication, application delivery, and database storage.
        </p>
      </section>
      <section>
        <h2>Storage and security</h2>
        <p>
          Guest data is device-local. Signed-in progress is stored in the
          {onVercel
            ? 'Supabase database when cloud accounts are enabled'
            : 'application’s Cloudflare D1 database'}{' '}
          and transmitted over HTTPS. We do not claim a specific storage region
          or additional encryption property until it is contractually verified.
        </p>
      </section>
      <section>
        <h2>Installed web app</h2>
        <p>
          The installable app uses the same website and data controls. Its
          service worker caches only a public reconnect page and app icon, not
          your account or practice API responses. Full offline reopening of the
          trainer is not available yet. Browser and installed-app storage can
          differ by device.
        </p>
      </section>
      <section>
        <h2>Retention and deletion</h2>
        <p>
          Signed-in progress is retained while your PacePrep record remains
          active. Use Profile → Delete progress to remove the cloud progress
          history on this device and in the cloud. A minimal account-linked
          reset timestamp is retained so older devices cannot restore deleted
          history. Operational backups or logs, if any, may expire according to
          the hosting provider&apos;s retention controls.
        </p>
      </section>
      <section className="info-notice">
        <h2>Hosting and contact</h2>
        <p>
          Vercel hosts the public website and may process technical request
          information, such as IP addresses and logs, to deliver and protect the
          service. See{' '}
          <a href="https://vercel.com/legal/privacy-notice">
            Vercel’s privacy notice
          </a>
          . For the available public support channel and its limits, visit{' '}
          <a href="/contact">Contact</a>. A private privacy/grievance mailbox
          and legal operator details remain to be established before a broader
          account-enabled launch.
        </p>
      </section>
    </InfoShell>
  );
}
