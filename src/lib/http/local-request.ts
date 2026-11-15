const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

function hostname(host: string): string {
  // "localhost:3000" -> "localhost", "[::1]:3000" -> "[::1]"
  return host.replace(/:\d+$/, "").toLowerCase();
}

/**
 * The prototype has no sign-in (ADR 0008), so the only thing stopping another
 * website from calling these routes from the user's browser is this check:
 * the request must be addressed to this machine and must not come from
 * another origin.
 *
 * Requests with no Origin or Sec-Fetch-Site (curl, scripts) pass if the Host is
 * local: the Host check is what blocks DNS rebinding from a browser.
 *
 * Two layers use it on purpose: proxy.ts for every request, and each API route
 * again. With no sign-in, one wrong matcher in proxy.ts must not expose a route.
 */
export function isLocalRequest(req: Request): boolean {
  const host = req.headers.get("host") ?? new URL(req.url).host;
  if (!LOCAL_HOSTS.has(hostname(host))) return false;

  const forwarded = req.headers.get("x-forwarded-host");
  if (forwarded && !LOCAL_HOSTS.has(hostname(forwarded))) return false;

  if (req.headers.get("sec-fetch-site") === "cross-site") return false;

  // A page served from another port on this machine is still another app.
  const origin = req.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host.toLowerCase() !== host.toLowerCase())
        return false;
    } catch {
      return false;
    }
  }
  return true;
}

export function forbidden(): Response {
  return Response.json(
    { error: "This app only answers requests from this computer." },
    { status: 403 }
  );
}
