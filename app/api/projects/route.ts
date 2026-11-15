import { forbidden, isLocalRequest } from "../../../src/lib/http/local-request";
import { createProject, listProjects } from "../../../src/lib/store/projects";

export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  if (!isLocalRequest(req)) return forbidden();
  return Response.json({ projects: await listProjects() });
}

export async function POST(req: Request): Promise<Response> {
  if (!isLocalRequest(req)) return forbidden();
  const body = await req.json().catch(() => null);
  try {
    const project = await createProject(body?.name);
    return Response.json({ project }, { status: 201 });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
