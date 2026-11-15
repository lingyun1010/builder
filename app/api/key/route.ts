import { forbidden, isLocalRequest } from "../../../src/lib/http/local-request";
import { apiKeyStatus, saveApiKey } from "../../../src/lib/store/secrets";

export const dynamic = "force-dynamic";

/** Says whether a key is saved. The key itself is never sent to the browser. */
export async function GET(req: Request): Promise<Response> {
  if (!isLocalRequest(req)) return forbidden();
  return Response.json(await apiKeyStatus());
}

export async function POST(req: Request): Promise<Response> {
  if (!isLocalRequest(req)) return forbidden();
  const body = await req.json().catch(() => null);
  try {
    await saveApiKey(body?.key);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
  return Response.json(await apiKeyStatus());
}
