import { mergeProgress } from './learning-progress.ts';
import { isSavedProgress } from './progress-validation.ts';

export function progressStorageKey(accountId: string | null) {
  return accountId ? `paceprep-progress:${accountId}` : 'paceprep-progress';
}

export function assertProgressAccount(
  expected: string | null | undefined,
  actual: string | null,
) {
  if (expected !== undefined && expected !== actual)
    throw new Error('Account changed. Reload before syncing progress.');
}

/** Claim guest data once. A prior account marker prevents a different account
 * from implicitly inheriting work on a shared browser. Keep all data on failure. */
export function prepareAccountStorage(userId: string, storage: Storage) {
  const key = progressStorageKey(userId);
  const owner = storage.getItem('paceprep-account');
  const guest =
    storage.getItem('paceprep-progress') ?? storage.getItem('recall-lab');
  if (guest && (!owner || owner === userId)) {
    const local: unknown = JSON.parse(guest);
    const existing: unknown = JSON.parse(storage.getItem(key) || '{}');
    if (!isSavedProgress(local) || !isSavedProgress(existing))
      throw new Error('Saved progress needs recovery before account import');
    // Claim before copying so an interrupted write can only resume for this
    // identity. The guest source is removed only after its account copy succeeds.
    storage.setItem('paceprep-account', userId);
    storage.setItem(
      key,
      JSON.stringify(
        mergeProgress({ ...local, resetAt: existing.resetAt }, existing),
      ),
    );
    storage.removeItem('paceprep-progress');
    storage.removeItem('recall-lab');
  } else if (!guest) {
    storage.setItem('paceprep-account', userId);
  }
}
