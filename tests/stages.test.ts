import { describe, expect, it } from "vitest";
import { STAGES } from "../src/stages";

describe("lingyun-project stages", () => {
  it("has nine stages starting at Init and ending at Post-merge", () => {
    expect(STAGES).toHaveLength(9);
    expect(STAGES[0]).toBe("Init");
    expect(STAGES[8]).toBe("Post-merge");
  });
});
