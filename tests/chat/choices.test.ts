import { describe, expect, it } from "vitest";
import { hideTrailingChoices, parseChoices } from "../../src/lib/chat/choices";

describe("choice cards", () => {
  it("splits a trailing choices block from the reply", () => {
    const reply =
      'Which style do you want?\n\n```choices\n["Simple and clean", "Colourful"]\n```';
    expect(parseChoices(reply)).toEqual({
      text: "Which style do you want?",
      choices: ["Simple and clean", "Colourful"],
    });
  });

  it("leaves a reply without a block alone", () => {
    expect(parseChoices("All done.")).toEqual({
      text: "All done.",
      choices: [],
    });
  });

  it("ignores a block that is not a list of short strings", () => {
    for (const body of ['{"a":1}', "not json", "[1, 2]", "[]", '[""]']) {
      const reply = "Pick:\n```choices\n" + body + "\n```";
      expect(parseChoices(reply)).toEqual({ text: reply, choices: [] });
    }
  });

  it("keeps at most six choices and trims them", () => {
    const list = JSON.stringify(["  a ", "b", "c", "d", "e", "f", "g"]);
    const { choices } = parseChoices("Q\n```choices\n" + list + "\n```");
    expect(choices).toEqual(["a", "b", "c", "d", "e", "f"]);
  });

  it("only reads a block at the end, not one quoted in the middle", () => {
    const reply = '```choices\n["x"]\n```\nand then more text';
    expect(parseChoices(reply)).toEqual({ text: reply, choices: [] });
  });
});

describe("hiding a choices block while the reply streams", () => {
  it("cuts a complete or half-typed trailing block", () => {
    expect(hideTrailingChoices('Who?\n\n```choices\n["a"')).toBe("Who?");
    expect(hideTrailingChoices("Who?\n\n```cho")).toBe("Who?");
    expect(hideTrailingChoices("Who?\n\n``")).toBe("Who?");
  });

  it("keeps other text, including other code fences", () => {
    expect(hideTrailingChoices("Done.")).toBe("Done.");
    expect(hideTrailingChoices("Run:\n```bash\nls")).toBe("Run:\n```bash\nls");
  });
});
