export type Learner = {
  userId: string;
  email: string;
  displayName: string;
  fullName: string | null;
};

export type ProgressStore = {
  user: Learner;
  read(): Promise<{ progress: unknown; updatedAt: number | null }>;
  write(progress: unknown): Promise<number>;
  remove(): Promise<void>;
};
