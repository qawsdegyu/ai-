import { describe, expect, it } from "vitest";
import { shouldDeleteConversation } from "../shared/conversation";

describe("conversation destructive actions", () => {
  it("requires explicit confirmation before permanent deletion", () => {
    expect(shouldDeleteConversation(false)).toBe(false);
    expect(shouldDeleteConversation(true)).toBe(true);
  });
});
