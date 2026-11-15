import type { NextRequest } from "next/server";
import { forbidden, isLocalRequest } from "./src/lib/http/local-request";

/**
 * Runs before every page and API route. The prototype has no sign-in
 * (ADR 0008), so nothing is served unless the request is local.
 */
export function proxy(req: NextRequest) {
  if (!isLocalRequest(req)) return forbidden();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
