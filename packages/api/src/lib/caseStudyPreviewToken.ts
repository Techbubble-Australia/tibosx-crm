import crypto from "crypto";

function getPreviewSecret(): string | null {
  return (
    process.env.CASE_STUDY_PREVIEW_SECRET ||
    (process.env.NODE_ENV !== "production" ? process.env.JWT_SECRET || null : null)
  );
}

export function previewSigningAvailable(): boolean {
  return Boolean(getPreviewSecret());
}

export function signCaseStudyPreviewToken(slug: string): string | null {
  const secret = getPreviewSecret();
  if (!secret) return null;
  const exp = Date.now() + 60 * 60 * 1000;
  const payload = JSON.stringify({ slug, exp });
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  const payloadB64 = Buffer.from(payload, "utf8").toString("base64url");
  return `${payloadB64}.${sig}`;
}

export function verifyCaseStudyPreviewToken(token: string, expectedSlug: string): boolean {
  const secret = getPreviewSecret();
  if (!secret) return false;
  const dot = token.indexOf(".");
  if (dot <= 0 || dot === token.length - 1) return false;
  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  let payload: string;
  try {
    payload = Buffer.from(payloadB64, "base64url").toString("utf8");
  } catch {
    return false;
  }
  const expectedSig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  const a = Buffer.from(sig, "utf8");
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length) return false;
  try {
    if (!crypto.timingSafeEqual(a, b)) return false;
  } catch {
    return false;
  }
  let parsed: { slug: string; exp: number };
  try {
    parsed = JSON.parse(payload) as { slug: string; exp: number };
  } catch {
    return false;
  }
  if (typeof parsed.slug !== "string" || typeof parsed.exp !== "number") return false;
  if (parsed.slug !== expectedSlug) return false;
  if (Date.now() > parsed.exp) return false;
  return true;
}
