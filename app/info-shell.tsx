import type { ReactNode } from 'react';
import { Zap } from 'lucide-react';
import { SiteLink as Link } from './site-link';

export function InfoShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <main className="info-page">
      <header className="info-nav">
        <Link className="brand" href="/" aria-label="PacePrep home">
          <b>
            <Zap size={16} />
          </b>
          Pace<span>Prep</span>
        </Link>
        <Link href="/">Back to home</Link>
      </header>
      <article>
        <small>{eyebrow}</small>
        <h1>{title}</h1>
        <p className="info-intro">{intro}</p>
        {children}
      </article>
      <footer>
        <Link href="/about">About</Link>
        <Link href="/pricing">Pricing</Link>
        <Link href="/faq">FAQ</Link>
        <Link href="/install">Install app</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/contact">Contact</Link>
      </footer>
    </main>
  );
}
