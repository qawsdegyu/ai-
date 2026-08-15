import { describe, expect, it } from "vitest";

describe("Supabase connection configuration", () => {
  it("has a valid project URL and anon key that can reach the REST endpoint", async () => {
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_ANON_KEY?.trim();
    expect(key).not.toContain("publicey");
    expect(url).toMatch(/^https:\/\/[^\s]+\.supabase\.co$/);
    expect(new URL(url!).hostname).toBe("awoyujiumnnwwolngnop.supabase.co");
    expect(key).toMatch(/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);

    const response = await fetch(`${url}/rest/v1/`, {
      headers: { apikey: key!, Authorization: `Bearer ${key}` },
    });
    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(403);
  }, 15_000);
});
