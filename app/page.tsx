import Link from "next/link";
import { listProjects } from "../src/lib/store/projects";
import { apiKeyStatus } from "../src/lib/store/secrets";
import { KeyForm } from "./components/KeyForm";
import { NewProjectForm } from "./components/NewProjectForm";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [status, projects] = await Promise.all([
    apiKeyStatus(),
    listProjects(),
  ]);

  return (
    <main>
      <h1>Builder</h1>
      <p className="muted">
        Describe the app you want and chat with the agent that builds it.
        Everything stays on this computer.
      </p>

      <KeyForm initial={status} />

      <section className="panel" aria-labelledby="new-heading">
        <h2 id="new-heading">2. Start a project</h2>
        <NewProjectForm />
      </section>

      <section className="panel" aria-labelledby="projects-heading">
        <h2 id="projects-heading">Your projects</h2>
        {projects.length === 0 ? (
          <p className="muted">No projects yet. Start one above.</p>
        ) : (
          <ul className="projects">
            {projects.map((project) => (
              <li key={project.id}>
                <Link href={`/projects/${project.id}`}>{project.name}</Link>
                <span className="muted">
                  {new Date(project.createdAt).toLocaleDateString("en-AU", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
