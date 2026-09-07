'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun, Zap } from 'lucide-react';
import { SiteLink as Link } from './site-link';

export function useIsolatedPractice() {
  const [isolated, setIsolated] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(
      () =>
        setIsolated(
          new URLSearchParams(window.location.search).get('grok-test') === '1',
        ),
      0,
    );
    return () => window.clearTimeout(timer);
  }, []);
  return isolated;
}

export default function PracticeNavigation() {
  const isolated = useIsolatedPractice();
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const key =
        new URLSearchParams(window.location.search).get('grok-test') === '1'
          ? 'paceprep-grok-test'
          : 'paceprep-progress';
      const saved = JSON.parse(localStorage.getItem(key) || '{}');
      queueMicrotask(() => {
        setDark(!!saved.dark);
        setReady(true);
      });
      document.documentElement.classList.toggle('dark', !!saved.dark);
    } catch {
      queueMicrotask(() => setReady(true));
    }
  }, []);
  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      const key = isolated ? 'paceprep-grok-test' : 'paceprep-progress';
      const saved = JSON.parse(localStorage.getItem(key) || '{}');
      localStorage.setItem(key, JSON.stringify({ ...saved, dark: next }));
    } catch {
      /* Theme still works for this page when storage is unavailable. */
    }
  }
  return (
    <nav className="practice-navigation" aria-label="Practice navigation">
      <Link className="brand" href={isolated ? '/?grok-test=1' : '/'}>
        <b>
          <Zap size={16} />
        </b>
        Pace<span>Prep</span>
      </Link>
      <Link href={isolated ? '/practice?grok-test=1' : '/practice'}>
        Practice home
      </Link>
      <button
        type="button"
        disabled={!ready}
        onClick={toggleTheme}
        aria-label={dark ? 'Use light theme' : 'Use dark theme'}
      >
        {dark ? <Sun size={18} /> : <Moon size={18} />}{' '}
        {dark ? 'Light' : 'Dark'}
      </button>
    </nav>
  );
}
