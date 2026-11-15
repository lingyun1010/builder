import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getProject,
  readTranscript,
  workspaceDir,
} from "../../../src/lib/store/projects";
import { readStage } from "../../../src/lib/workspace/stage";
import { apiKeyStatus } from "../../../src/lib/store/secrets";
import { Chat } from "../../components/Chat";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const [messages, status, stage] = await Promise.all([
    readTranscript(id),
    apiKeyStatus(),
    readStage(workspaceDir(id)),
  ]);

  return (
    <main>
      <p>
        <Link href="/">← All projects</Link>
      </p>
      <h1>{project.name}</h1>
      <Chat
        projectId={project.id}
        initialMessages={messages}
        hasKey={status.saved}
        initialStage={stage}
      />
    </main>
  );
}
