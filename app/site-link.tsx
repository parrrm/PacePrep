import type { ComponentProps } from 'react';

/** Brochure/auth routes use normal navigation; the trainer keeps its own local view state.
 * This avoids a Vinext client-router transition failure and works before hydration. */
export function SiteLink({ children, ...props }: ComponentProps<'a'>) {
  return <a {...props}>{children}</a>;
}
