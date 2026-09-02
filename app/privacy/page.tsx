import type { Metadata } from 'next';
import { InfoShell } from '@/app/info-shell';

export const metadata: Metadata = { title: 'Privacy Notice' };

export default function PrivacyPage() {
  return (
    <InfoShell
      eyebrow="PRIVACY"
      title="Preview privacy notice"
      intro="This notice describes the data behaviour implemented in the current PacePrep testing preview. Operator and grievance-contact details must be added before production launch."
    >
      <section>
        <h2>Age</h2>
        <p>
          PacePrep is intended only for people aged 18 or older. Do not use the
          signed-in service if you are under 18.
        </p>
      </section>
      <section>
        <h2>Guest mode</h2>
        <p>
          Practice answers, response times, settings, and mastery records stay
          in your browser&apos;s local storage. Clearing site data removes them
          from that device.
        </p>
      </section>
      <section>
        <h2>Signed-in mode</h2>
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
          application&apos;s Cloudflare D1 database and transmitted over HTTPS.
          We do not claim a specific storage region or additional encryption
          property until it is contractually verified.
        </p>
      </section>
      <section>
        <h2>Retention and deletion</h2>
        <p>
          Signed-in progress is retained while your PacePrep record remains
          active. Use Profile → Delete progress to remove the cloud progress
          record and this device&apos;s local record. Operational backups or
          logs, if any, may expire according to the hosting provider&apos;s
          retention controls.
        </p>
      </section>
      <section className="info-notice">
        <h2>Pre-launch requirement</h2>
        <p>
          The product owner must provide the legal operator name, address/state,
          and working grievance email before this notice can be treated as final
          or the service can be described as production-ready.
        </p>
      </section>
    </InfoShell>
  );
}
