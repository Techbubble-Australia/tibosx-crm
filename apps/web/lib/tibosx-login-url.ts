/** TBOS admin sign-in URL for marketing-site CTAs (opens login, not auto-redirect to dashboard). */
export function tibosxLoginUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_TIBOSX_URL?.trim().replace(/\/$/, "") ||
    "https://tibosx.ai.techbubble.com.au";
  return `${base}/login?signin=1`;
}
