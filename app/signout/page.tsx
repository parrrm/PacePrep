'use client';
import { useState } from 'react';
import { getAuthClient } from '@/lib/auth-client';
import { cloudAuthReady } from '@/lib/hosting';
import { SiteLink as Link } from '@/app/site-link';

export default function SignOutPage() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function signOut() {
    setBusy(true);
    try {
      if (cloudAuthReady) {
        const client = await getAuthClient();
        const { error } = await client.auth.signOut({ scope: 'local' });
        if (error) throw error;
      }
      // Retain the previous guest-data claim so another account cannot inherit it.
      sessionStorage.removeItem('paceprep-entered');
      window.location.assign('/');
    } catch {
      setError('Could not sign out. Please retry.');
      setBusy(false);
    }
  }
  return (
    <main className="info-page">
      <article>
        <h1>Sign out of this device?</h1>
        <p>
          Your saved progress stays with your account. Check that cloud sync has
          finished in Profile before signing out.
        </p>
        {error && <p role="alert">{error}</p>}
        <button className="auth-return" disabled={busy} onClick={signOut}>
          {busy ? 'Signing out…' : 'Sign out'}
        </button>{' '}
        <Link href="/">Keep practising</Link>
      </article>
    </main>
  );
}
