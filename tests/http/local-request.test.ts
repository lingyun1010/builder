import { describe, expect, it } from "vitest";
import { isLocalRequest } from "../../src/lib/http/local-request";

const req = (url: string, headers: Record<string, string> = {}) =>
  new Request(url, { headers });

describe("local-only request guard", () => {
  it("allows requests to localhost and 127.0.0.1", () => {
    expect(isLocalRequest(req("http://localhost:3000/api/key"))).toBe(true);
    expect(isLocalRequest(req("http://127.0.0.1:3000/api/key"))).toBe(true);
    expect(
      isLocalRequest(
        req("http://localhost:3000/api/key", {
          origin: "http://localhost:3000",
        })
      )
    ).toBe(true);
  });

  it("rejects another site calling the local server", () => {
    expect(
      isLocalRequest(
        req("http://localhost:3000/api/key", { origin: "https://evil.example" })
      )
    ).toBe(false);
    expect(
      isLocalRequest(
        req("http://localhost:3000/api/key", { "sec-fetch-site": "cross-site" })
      )
    ).toBe(false);
  });

  it("rejects a page from another local port", () => {
    expect(
      isLocalRequest(
        req("http://localhost:3000/api/key", {
          origin: "http://localhost:5173",
        })
      )
    ).toBe(false);
  });

  it("rejects a non-local host name (DNS rebinding)", () => {
    expect(isLocalRequest(req("http://evil.example:3000/api/key"))).toBe(false);
    expect(
      isLocalRequest(
        req("http://localhost:3000/api/key", {
          "x-forwarded-host": "evil.example",
        })
      )
    ).toBe(false);
  });
});
