import { randomBytes } from "node:crypto";
import {
  appendFile,
  mkdir,
  readFile,
  readdir,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { dataDir, isMissing, isValidProjectId, projectDir } from "./paths";

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

function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
  return slug || "project";
}

async function writeProject(project: Project): Promise<void> {
  await writeFile(
    metaFile(project.id),
    JSON.stringify(project, null, 2) + "\n"
  );
}

/** Throws an Error whose message is meant for the user when the name is empty. */
export async function createProject(rawName: unknown): Promise<Project> {
  const name = (typeof rawName === "string" ? rawName : "").trim().slice(0, 80);
  if (!name) throw new Error("Give your project a name.");

  const project: Project = {
    id: `${slugify(name)}-${randomBytes(3).toString("hex")}`,
    name,
    createdAt: new Date().toISOString(),
    sessionId: null,
  };
  await mkdir(workspaceDir(project.id), { recursive: true });
  await writeProject(project);
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

/** Saves the session id on the given project (the caller already loaded it). */
export async function setSessionId(
  project: Project,
  sessionId: string
): Promise<Project> {
  const updated = { ...project, sessionId };
  await writeProject(updated);
  return updated;
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
    .flatMap((line) => {
      try {
        return [JSON.parse(line) as ChatMessage];
      } catch {
        return []; // a line cut short by a crash must not break the whole chat
      }
    });
}
