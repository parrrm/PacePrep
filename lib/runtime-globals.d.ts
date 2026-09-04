declare const __PACEPREP_PLATFORM__: 'sites' | 'vercel';
declare const __PACEPREP_SUPABASE_URL__: string;
declare const __PACEPREP_SUPABASE_KEY__: string;
declare const __PACEPREP_CLOUD_READY__: boolean;

declare module 'paceprep:progress-store' {
  export function openProgressStore(
    request: Request,
  ): Promise<import('../server/progress-types').ProgressStore | null>;
}
