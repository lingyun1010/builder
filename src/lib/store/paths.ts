import path from "node:path";

/** Root folder for all local data. See docs/adr/0008-local-prototype.md. */
export function dataDir(): string {
  return process.env.BUILDER_DATA_DIR ?? path.join(process.cwd(), "data");
}

const PROJECT_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Ids become folder names, so anything that is not a plain slug is refused. */
export function isValidProjectId(id: string): boolean {
  return id.length <= 80 && PROJECT_ID.test(id);
}

export function projectDir(id: string): string {
  if (!isValidProjectId(id)) throw new Error("Invalid project id");
  return path.join(dataDir(), "projects", id);
}
