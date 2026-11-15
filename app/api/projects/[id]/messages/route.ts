import { sdkRunner } from "../../../../../src/lib/agent/sdk-runner";
import {
  ChatError,
  startChat,
  type ChatErrorCode,
} from "../../../../../src/lib/chat/send";
import {
  forbidden,
  isLocalRequest,
} from "../../../../../src/lib/http/local-request";

export const dynamic = "force-dynamic";
// Agent runs can take many minutes.
export const maxDuration = 3600;

type Ctx = { params: Promise<{ id: string }> };

const STATUS: Record<ChatErrorCode, number> = {
  not_found: 404,
  empty: 400,
  no_key: 400,
  busy: 409,
};

/** Sends one message to the agent. The reply streams back as one JSON object per line. */
export async function POST(req: Request, { params }: Ctx): Promise<Response> {
  if (!isLocalRequest(req)) return forbidden();
  const { id } = await params;
  const body = await req.json().catch(() => null);

  let events;
  try {
    events = await startChat(
      id,
      typeof body?.text === "string" ? body.text : "",
      sdkRunner,
      req.signal
    );
  } catch (error) {
    if (error instanceof ChatError) {
      return Response.json(
        { error: error.message },
        { status: STATUS[error.code] }
      );
    }
    throw error;
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { value, done } = await events.next();
      if (done) controller.close();
      else controller.enqueue(encoder.encode(JSON.stringify(value) + "\n"));
    },
    async cancel() {
      // Browser went away: release the project (the request signal stops the agent).
      await events.return(undefined);
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
