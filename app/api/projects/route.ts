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
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return Response.json(
      { error: "Give your project a name." },
      { status: 400 }
    );
  }
  return Response.json({ project: await createProject(name) }, { status: 201 });
}
