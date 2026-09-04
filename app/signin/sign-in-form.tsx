'use client';

import { useEffect, useState, type SubmitEvent } from 'react';
import { SiteLink as Link } from '@/app/site-link';
import { Button } from '@/components/ui/button';
import { getAuthClient, prepareAccountStorage } from '@/lib/auth-client';
import { cloudAuthReady, onVercel, signInHref } from '@/lib/hosting';

type Mode = 'signin' | 'signup' | 'forgot' | 'reset';

export default function SignInForm() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [eligible, setEligible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function enter(userId: string) {
    prepareAccountStorage(userId);
    sessionStorage.setItem('paceprep-entered', '1');
    window.location.assign('/');
  }

  useEffect(() => {
    if (!cloudAuthReady) return;
    let active = true;
    const reset =
      new URLSearchParams(window.location.search).get('reset') === '1';
    void getAuthClient()
      .then(async (client) => {
        const { data, error: sessionError } = await client.auth.getSession();
        if (!active) return;
        if (reset) setMode(data.session && !sessionError ? 'reset' : 'forgot');
        if (sessionError)
          setError(
            'This link could not be verified. Please request a new one.',
          );
        if (data.session && !reset) enter(data.session.user.id);
      })
      .catch(() => {
        if (active) setError('Unable to connect. Please try again.');
      });
    return () => {
      active = false;
    };
  }, []);

  if (!onVercel)
    return (
      <p>
        <a href={signInHref}>Continue with ChatGPT</a>
      </p>
    );
  if (!cloudAuthReady)
    return (
      <section className="auth-card">
        <h2>Guest preview is ready</h2>
        <p>
          Email accounts and cloud sync are not enabled on this preview yet. You
          can use every practice mode now; progress stays in this browser.
        </p>
        <Link className="auth-return" href="/">
          Start guest practice
        </Link>
      </section>
    );

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || (mode === 'signup' && !eligible)) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const client = await getAuthClient();
      if (mode === 'forgot') {
        const { error } = await client.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/signin?reset=1`,
        });
        if (error) throw error;
        setMessage(
          'If an account exists for that email, a reset link is on its way. Open it in this browser on this device.',
        );
      } else if (mode === 'reset') {
        const { data, error } = await client.auth.updateUser({ password });
        if (error) throw error;
        if (data.user) enter(data.user.id);
      } else if (mode === 'signup') {
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/signin`,
            data: { age_18_confirmed_at: new Date().toISOString() },
          },
        });
        if (error) throw error;
        if (data.session) enter(data.session.user.id);
        else
          setMessage(
            'Check your email for a confirmation link. Open it in this browser on this device, then return to sign in.',
          );
      } else {
        const { data, error } = await client.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        enter(data.user.id);
      }
    } catch {
      setError(
        mode === 'signin'
          ? 'Unable to sign in. Check your email and password, and confirm your email first.'
          : 'Unable to complete this request. Please wait a moment and try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-card">
      <div className="auth-switch" aria-label="Account action">
        <button
          type="button"
          aria-pressed={mode === 'signin'}
          onClick={() => {
            setMode('signin');
            setError('');
            setMessage('');
          }}
        >
          Sign in
        </button>
        <button
          type="button"
          aria-pressed={mode === 'signup'}
          onClick={() => {
            setMode('signup');
            setError('');
            setMessage('');
          }}
        >
          Create account
        </button>
      </div>
      <h2>
        {mode === 'signup'
          ? 'Create your account'
          : mode === 'forgot'
            ? 'Reset your password'
            : mode === 'reset'
              ? 'Choose a new password'
              : 'Welcome back'}
      </h2>
      <form onSubmit={submit} aria-busy={busy}>
        {mode !== 'reset' && (
          <label>
            Email address
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
        )}
        {mode !== 'forgot' && (
          <label>
            Password
            <input
              type="password"
              autoComplete={
                mode === 'signin' ? 'current-password' : 'new-password'
              }
              minLength={mode === 'signin' ? 1 : 10}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {mode !== 'signin' && <small>Use at least 10 characters.</small>}
          </label>
        )}
        {mode === 'signup' && (
          <label className="auth-age">
            <input
              type="checkbox"
              required
              checked={eligible}
              onChange={(e) => setEligible(e.target.checked)}
            />
            <span>
              I am 18+ and agree to the{' '}
              <a href="/terms" target="_blank" rel="noopener">
                Terms
              </a>{' '}
              and{' '}
              <a href="/privacy" target="_blank" rel="noopener">
                Privacy Notice
              </a>
              .
            </span>
          </label>
        )}
        {error && (
          <p role="alert" className="auth-error">
            {error}
          </p>
        )}
        {message && <output>{message}</output>}
        <Button type="submit" disabled={busy}>
          {busy
            ? 'Please wait…'
            : mode === 'signup'
              ? 'Create account'
              : mode === 'forgot'
                ? 'Send reset link'
                : mode === 'reset'
                  ? 'Save new password'
                  : 'Sign in'}
        </Button>
      </form>
      {mode === 'signin' && (
        <button
          className="auth-text-button"
          onClick={() => {
            setMode('forgot');
            setError('');
            setMessage('');
          }}
        >
          Forgot password?
        </button>
      )}
      <Link className="auth-return" href="/">
        Back to guest practice
      </Link>
    </section>
  );
}
