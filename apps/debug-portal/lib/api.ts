export function getUpstreamApiBase(): string {
  return (
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:3001"
  ).replace(/\/$/, "");
}

export async function portalFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = `${getUpstreamApiBase()}${path.startsWith("/") ? path : `/${path}`}`;
  return fetch(url, {
    ...init,
    credentials: init?.credentials ?? "include",
    headers: {
      ...(init?.headers ?? {}),
    },
  });
}
