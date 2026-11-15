export type PostResult<T> = { ok: boolean; data: T | null };

export const UNREACHABLE = "Could not reach the app. Is it still running?";

/** POSTs JSON. A network failure comes back as `{ ok: false, data: { error } }`. */
export async function postJson<T = { error?: string }>(
  url: string,
  body: unknown
): Promise<PostResult<T>> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return {
      ok: res.ok,
      data: (await res.json().catch(() => null)) as T | null,
    };
  } catch {
    return { ok: false, data: { error: UNREACHABLE } as T };
  }
}
