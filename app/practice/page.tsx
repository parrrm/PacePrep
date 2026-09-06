import type { Metadata } from 'next';
import PracticeHubPage from './practice-client';

export const metadata: Metadata = { title: 'Practice' };

export default function Page() {
  return <PracticeHubPage />;
}
