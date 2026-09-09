import { progressStorageKey } from './account-storage.ts';
import { updateStat, mergeProgress } from './learning-progress.ts';
import {
  isSavedProgress,
  type SavedProgress,
  type ProgressAttempt,
} from './progress-validation.ts';

export type OperationProgress = {
  accountId: string | null;
  record(item: ProgressAttempt): void;
  complete(): void;
  flush(): Promise<void>;
};

/** A session stays bound to the identity it opened with, even after sign-out. */
export function createOperationProgress(
  accountId: string | null,
  storage: Pick<Storage, 'getItem' | 'setItem'>,
  save: (snapshot: SavedProgress) => Promise<void>,
): OperationProgress {
  const key = progressStorageKey(accountId);
  let pending: Promise<void> = Promise.resolve();
  function read(): SavedProgress {
    const snapshot: unknown = JSON.parse(storage.getItem(key) || '{}');
    if (!isSavedProgress(snapshot))
      throw new Error('Saved progress needs recovery');
    return snapshot;
  }
  function write(snapshot: SavedProgress) {
    storage.setItem(key, JSON.stringify(snapshot));
    if (accountId) {
      // Writes are serialized so a slow earlier save cannot replace later work.
      pending = pending.catch(() => {}).then(() => save(snapshot));
      void pending.catch(() => {});
    }
  }
  read();
  return {
    accountId,
    record(item) {
      const snapshot = read();
      write({
        ...snapshot,
        stats: {
          ...snapshot.stats,
          [item.id]: updateStat(
            snapshot.stats?.[item.id],
            item.correct && !item.skipped,
            item.ms,
            item.at,
          ),
        },
        history: [...(snapshot.history || []), item].slice(-1500),
      });
    },
    complete() {
      const snapshot = read();
      write({
        ...snapshot,
        completedSessions: (snapshot.completedSessions || 0) + 1,
      });
    },
    flush: () => pending,
  };
}

export async function openOperationProgress(): Promise<OperationProgress> {
  const { getProgressAccount, openProgressClient, prepareAccountStorage } =
    await import('./auth-client');
  const accountId = await getProgressAccount();
  const progressRequest = openProgressClient(accountId);
  if (accountId) prepareAccountStorage(accountId);
  const key = progressStorageKey(accountId);
  const local: unknown = JSON.parse(localStorage.getItem(key) || '{}');
  if (!isSavedProgress(local)) throw new Error('Saved progress needs recovery');
  if (accountId) {
    const response = await progressRequest();
    if (!response.ok) throw new Error('Cloud progress unavailable');
    const payload = (await response.json()) as {
      user?: { userId?: string };
      progress: unknown;
    };
    if (
      payload.user?.userId !== accountId ||
      (payload.progress !== null && !isSavedProgress(payload.progress))
    )
      throw new Error('Invalid account progress');
    localStorage.setItem(
      key,
      JSON.stringify(mergeProgress(local, payload.progress)),
    );
  }
  return createOperationProgress(accountId, localStorage, async (snapshot) => {
    const response = await progressRequest({
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(snapshot),
    });
    if (!response.ok) throw new Error('Cloud sync failed');
  });
}

export function recordOperationAttempt(
  item: Omit<ProgressAttempt, 'at' | 'answerMode'>,
  progress: OperationProgress,
) {
  progress.record({ ...item, at: Date.now(), answerMode: 'typed' });
}

export function completeOperationSession(progress: OperationProgress) {
  progress.complete();
}
