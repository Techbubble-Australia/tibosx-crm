function normalizeMediaInput(src: string): string {
  let t = src.trim();
  if (
    (t.startsWith('"') && t.endsWith('"') && t.length >= 2) ||
    (t.startsWith("'") && t.endsWith("'") && t.length >= 2)
  ) {
    t = t.slice(1, -1).trim();
  }
  return t;
}

function toUploadsPath(u: string): string | null {
  const t = normalizeMediaInput(u);
  if (!t) return null;
  if (t.startsWith("/uploads/")) return t;
  if (t.toLowerCase().startsWith("uploads/")) return `/${t}`;
  if (t.startsWith("http://") || t.startsWith("https://")) {
    try {
      const parsed = new URL(t);
      if (parsed.pathname.startsWith("/uploads/")) {
        return `${parsed.pathname}${parsed.search}`;
      }
    } catch {
      return null;
    }
  }
  return null;
}

function absoluteUploadsFromPublicEnv(uploadPath: string): string | null {
  const base = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "") ?? "";
  if (!base.startsWith("http://") && !base.startsWith("https://")) {
    return null;
  }
  if (base.startsWith("http:") && process.env.NODE_ENV === "production") {
    return null;
  }
  if (typeof window !== "undefined" && window.location.protocol === "https:" && base.startsWith("http:")) {
    return null;
  }
  return `${base}${uploadPath}`;
}

function sameOriginUploadsPath(uploadPath: string): string {
  if (typeof window === "undefined") {
    return uploadPath;
  }
  return `${window.location.origin}${uploadPath}`;
}

/** URL for `<img src>` — same-origin `/uploads` proxy or NEXT_PUBLIC_API_URL when set at build. */
export function resolveMediaPreviewUrl(url: string | null | undefined): string | null {
  const raw = normalizeMediaInput(url ?? "");
  if (!raw) return null;

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    const asPath = toUploadsPath(raw);
    if (asPath) {
      const fromEnv = absoluteUploadsFromPublicEnv(asPath);
      if (fromEnv) return fromEnv;
      return sameOriginUploadsPath(asPath);
    }
    return raw;
  }

  const uploadsPath = toUploadsPath(raw);
  const path = uploadsPath ?? (raw.startsWith("/") ? raw : `/${raw}`);

  if (!path.startsWith("/uploads/")) {
    return path.startsWith("/") ? path : null;
  }

  const fromEnv = absoluteUploadsFromPublicEnv(path);
  if (fromEnv) return fromEnv;
  return sameOriginUploadsPath(path);
}
