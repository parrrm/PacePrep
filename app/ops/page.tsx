import type { Metadata } from 'next';
import OpsPage from './ops-client';

export const metadata: Metadata = { title: 'Mental operations' };

export default function Page() {
  return <OpsPage />;
}
