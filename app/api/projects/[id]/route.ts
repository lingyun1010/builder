import {
  forbidden,
  isLocalRequest,
} from "../../../../src/lib/http/local-request";
import { getProject, readTranscript } from "../../../../src/lib/store/projects";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx): Promise<Response> {
  if (!isLocalRequest(req)) return forbidden();
  const { id } = await params;
  const project = await getProject(id);
  if (!project)
    return Response.json({ error: "Project not found." }, { status: 404 });
  return Response.json({ project, messages: await readTranscript(id) });
}
