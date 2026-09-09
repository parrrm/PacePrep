export type Learner = {
  userId: string;
  email: string;
  displayName: string;
  fullName: string | null;
};

export type ProgressStore = {
  user: Learner;
  read(): Promise<{
    progress: unknown;
    updatedAt: number | null;
    revision: string | null;
  }>;
  write(
    progress: unknown,
    revision: string | null,
  ): Promise<{ updatedAt: number; revision: string }>;
  remove(): Promise<{ updatedAt: number; revision: string; resetAt: number }>;
};
