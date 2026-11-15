export const STAGES = [
  "Init",
  "Think",
  "Map",
  "Slice",
  "Build",
  "Pre-PR",
  "Review",
  "Merge",
  "Post-merge",
] as const;

export type Stage = (typeof STAGES)[number];
