export class ProgressConflict extends Error {
  constructor() {
    super(
      'Progress changed on another device. Reload and merge before saving.',
    );
  }
}
