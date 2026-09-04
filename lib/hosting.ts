export const onVercel = __PACEPREP_PLATFORM__ === 'vercel';
export const cloudAuthReady =
  onVercel &&
  __PACEPREP_CLOUD_READY__ &&
  Boolean(__PACEPREP_SUPABASE_URL__ && __PACEPREP_SUPABASE_KEY__);
export const signInHref = onVercel
  ? '/signin'
  : '/signin-with-chatgpt?return_to=/';
export const signOutHref = onVercel
  ? '/signout'
  : '/signout-with-chatgpt?return_to=/';
export const signInLabel = onVercel
  ? 'Sign in with email'
  : 'Sign in with ChatGPT';
