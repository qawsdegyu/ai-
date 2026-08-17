import { describe, expect, it } from "vitest";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "../shared/supabaseConfig";

describe("Supabase connection configuration", () => {
  it("has a valid current project URL and public anon key", async () => {
    expect(SUPABASE_URL).toBe("https://dgfjqfntkkivnrwwsxle.supabase.co");
    expect(SUPABASE_ANON_KEY).toMatch(/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);

  }, 15_000);
});
