import type { Metadata } from 'next';
import { InfoShell } from '@/app/info-shell';
import SignInForm from './sign-in-form';

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
};
export default function SignInPage() {
  return (
    <InfoShell
      eyebrow="YOUR PACEPREP ACCOUNT"
      title="Keep your progress with you."
      intro="Train on your phone. Review on your laptop. Pick up where you left off."
    >
      <SignInForm />
    </InfoShell>
  );
}
