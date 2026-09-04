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

export function prepareAccountStorage(userId: string, storage: Storage) {
  const key = progressStorageKey(userId);
  const guest = storage.getItem('paceprep-progress');
  if (guest && !storage.getItem(key) && !storage.getItem('paceprep-account')) {
    storage.setItem(key, guest);
    storage.removeItem('paceprep-progress');
    storage.removeItem('recall-lab');
  }
  storage.setItem('paceprep-account', userId);
}
