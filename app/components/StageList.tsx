import { STAGES, type Stage } from "../../src/stages";

/** All nine stages in order, with the current one marked. */
export function StageList({ current }: { current: Stage }) {
  const at = STAGES.indexOf(current);
  return (
    <ol className="stages" aria-label="Where this project is">
      {STAGES.map((stage, index) => (
        <li
          key={stage}
          className={index < at ? "past" : index === at ? "current" : ""}
          aria-current={index === at ? "step" : undefined}
        >
          {stage}
        </li>
      ))}
    </ol>
  );
}
