import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, readTranscript } from "../../../src/lib/store/projects";
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

  const [messages, status] = await Promise.all([
    readTranscript(id),
    apiKeyStatus(),
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
      />
    </main>
  );
}
