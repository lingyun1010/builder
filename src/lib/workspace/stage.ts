import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { STAGES, type Stage } from "../../stages";
import { isMissing } from "../store/paths";

const stageFile = (workspace: string) =>
  path.join(workspace, ".builder", "stage");

/** The stage the agent last recorded in the workspace. Init when unknown. */
export async function readStage(workspace: string): Promise<Stage> {
  let raw: string;
  try {
    raw = await readFile(stageFile(workspace), "utf8");
  } catch (error) {
    if (isMissing(error)) return "Init";
    throw error;
  }
  const wanted = raw.trim().toLowerCase();
  return STAGES.find((stage) => stage.toLowerCase() === wanted) ?? "Init";
}

export async function writeStage(
  workspace: string,
  stage: Stage
): Promise<void> {
  await mkdir(path.dirname(stageFile(workspace)), { recursive: true });
  await writeFile(stageFile(workspace), stage + "\n");
}
