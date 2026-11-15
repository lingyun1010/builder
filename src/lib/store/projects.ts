import { randomBytes } from "node:crypto";
import {
  appendFile,
  mkdir,
  readFile,
  readdir,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { dataDir, isValidProjectId, projectDir } from "./paths";

export type Project = {
  id: string;
  name: string;
  createdAt: string;
  /** Agent SDK session to continue on the next message. */
  sessionId: string | null;
};

export type ChatMessage = {
  role: "user" | "assistant" | "error";
  text: string;
  at: string;
};

const metaFile = (id: string) => path.join(projectDir(id), "project.json");
const transcriptFile = (id: string) =>
  path.join(projectDir(id), "transcript.jsonl");

/** The folder the agent works in for this project. */
export function workspaceDir(id: string): string {
  return path.join(projectDir(id), "workspace");
}

function isMissing(error: unknown): boolean {
  return (error as NodeJS.ErrnoException)?.code === "ENOENT";
}

function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
  return slug || "project";
}

export async function createProject(rawName: string): Promise<Project> {
  const name = rawName.trim().slice(0, 80);
  if (!name) throw new Error("A project needs a name");

  const project: Project = {
    id: `${slugify(name)}-${randomBytes(3).toString("hex")}`,
    name,
    createdAt: new Date().toISOString(),
    sessionId: null,
  };
  await mkdir(workspaceDir(project.id), { recursive: true });
  await writeFile(
    metaFile(project.id),
    JSON.stringify(project, null, 2) + "\n"
  );
  return project;
}

export async function getProject(id: string): Promise<Project | null> {
  if (!isValidProjectId(id)) return null;
  try {
    return JSON.parse(await readFile(metaFile(id), "utf8")) as Project;
  } catch (error) {
    if (isMissing(error)) return null;
    throw error;
  }
}

export async function listProjects(): Promise<Project[]> {
  let ids: string[];
  try {
    ids = await readdir(path.join(dataDir(), "projects"));
  } catch (error) {
    if (isMissing(error)) return [];
    throw error;
  }
  const projects = await Promise.all(ids.map((id) => getProject(id)));
  return projects
    .filter((p): p is Project => p !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function setSessionId(
  id: string,
  sessionId: string
): Promise<void> {
  const project = await getProject(id);
  if (!project) throw new Error("Project not found");
  await writeFile(
    metaFile(id),
    JSON.stringify({ ...project, sessionId }, null, 2) + "\n"
  );
}

export async function appendMessage(
  id: string,
  message: Pick<ChatMessage, "role" | "text">
): Promise<ChatMessage> {
  const saved: ChatMessage = { ...message, at: new Date().toISOString() };
  await appendFile(transcriptFile(id), JSON.stringify(saved) + "\n");
  return saved;
}

export async function readTranscript(id: string): Promise<ChatMessage[]> {
  let raw: string;
  try {
    raw = await readFile(transcriptFile(id), "utf8");
  } catch (error) {
    if (isMissing(error)) return [];
    throw error;
  }
  return raw
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as ChatMessage);
}
