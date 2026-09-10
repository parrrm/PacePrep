import { Zap } from 'lucide-react';
import { SiteLink as Link } from './site-link';

export function WorkspaceHeader({
  active,
}: {
  active: 'practice' | 'operations';
}) {
  return (
    <header className="workspace-nav">
      <Link href="/" className="workspace-brand">
        <Zap size={19} aria-hidden="true" /> PacePrep
      </Link>
      <nav aria-label="Training navigation">
        <Link href="/">My progress</Link>
        <Link
          href="/practice"
          aria-current={active === 'practice' ? 'page' : undefined}
        >
          Practice
        </Link>
        <Link
          href="/ops"
          aria-current={active === 'operations' ? 'page' : undefined}
        >
          Operations
        </Link>
      </nav>
    </header>
  );
}
