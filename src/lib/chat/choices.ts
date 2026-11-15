const MAX_CHOICES = 6;
const MAX_LENGTH = 120;

// A fenced block tagged "choices" at the very end of a reply.
const TRAILING_BLOCK = /\n*```choices[ \t]*\n([\s\S]*?)\n```\s*$/;

export type ParsedReply = { text: string; choices: string[] };

/**
 * Splits the clickable choices the agent may put at the end of a reply
 * (a ```choices block holding a JSON list of short strings) from its text.
 * Anything that does not look right is left as plain text.
 */
export function parseChoices(reply: string): ParsedReply {
  const none = { text: reply, choices: [] };
  const match = TRAILING_BLOCK.exec(reply);
  if (!match) return none;

  let list: unknown;
  try {
    list = JSON.parse(match[1]);
  } catch {
    return none;
  }
  if (!Array.isArray(list)) return none;

  const choices = list
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0 && item.length <= MAX_LENGTH)
    .slice(0, MAX_CHOICES);
  if (choices.length === 0) return none;

  return { text: reply.slice(0, match.index).trimEnd(), choices };
}

/** The reply as it streams in, without a choices block that is still being typed. */
export function hideTrailingChoices(partial: string): string {
  const tail =
    /\n*(`{1,3}(?:c(?:h(?:o(?:i(?:c(?:e(?:s[\s\S]*)?)?)?)?)?)?)?)$/.exec(
      partial
    );
  return tail ? partial.slice(0, tail.index) : partial;
}
