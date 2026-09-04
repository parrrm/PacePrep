'use client';
import { useState } from 'react';
import { onVercel, cloudAuthReady } from '@/lib/hosting';
import { SiteLink as Link } from './site-link';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';

export default function EntryDialog({
  intent,
  close,
  continueEntry,
}: {
  intent: 'guest' | 'signin';
  close: () => void;
  continueEntry: () => void;
}) {
  const [eligible, setEligible] = useState(false);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent className="entry-dialog">
        <DialogTitle>
          {intent === 'signin'
            ? 'Keep your progress across devices'
            : 'Keep your baseline. Build from here.'}
        </DialogTitle>
        <DialogDescription>
          {intent === 'signin'
            ? onVercel
              ? cloudAuthReady
                ? 'Sign in with your email to sync progress. Guest practice does not require an account.'
                : 'Cloud accounts are being connected for this preview. You can practise as a guest now.'
              : 'Current preview sign-in uses ChatGPT. Guest practice does not require an account.'
            : 'Your answers and settings will be saved on this device. You can delete them in Profile at any time.'}
        </DialogDescription>
        <label className="age-confirm">
          <input
            type="checkbox"
            checked={eligible}
            onChange={(event) => setEligible(event.target.checked)}
          />
          <span>
            I am 18+ and agree to the{' '}
            <Link
              href="/terms"
              target="_blank"
              rel="noopener"
              aria-label="Terms (opens in a new tab)"
            >
              Terms
            </Link>{' '}
            and{' '}
            <Link
              href="/privacy"
              target="_blank"
              rel="noopener"
              aria-label="Privacy Policy (opens in a new tab)"
            >
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        <Button
          disabled={!eligible}
          onClick={() => {
            if (eligible) continueEntry();
          }}
        >
          {intent === 'signin' ? 'Continue to sign in' : 'Continue as guest'}{' '}
          <ChevronRight />
        </Button>
        <small>Free testing preview. No payment details needed.</small>
      </DialogContent>
    </Dialog>
  );
}
