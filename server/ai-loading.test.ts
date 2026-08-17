import { describe, expect, it } from "vitest";
import { assistantLoadingState } from "../shared/aiLoading";

describe("AI loading state", () => {
  it("shows a safe animated-thinking state while waiting", () => {
    expect(assistantLoadingState(true)).toEqual({ showIndicator: true, label: "Thinking" });
    expect(assistantLoadingState(false)).toEqual({ showIndicator: false, label: "" });
  });
});
