import { describe, expect, it } from "vitest";
import { SampleAuthClient } from "./sample-client";

describe("SampleAuthClient", () => {
  it("rejects sign-up without 18+ confirmation, before creating an account", async () => {
    const client = new SampleAuthClient();
    await expect(client.signUp("person@example.com", "password123", false)).rejects.toThrow(/18/);
    expect(await client.getCurrentUser()).toBeNull();
  });

  it("signs a new user up, ageConfirmed true, and signs them in automatically", async () => {
    const client = new SampleAuthClient();
    const user = await client.signUp("person@example.com", "password123", true, "Pat");
    expect(user).toMatchObject({ email: "person@example.com", displayName: "Pat", ageConfirmed: true });
    expect(await client.getCurrentUser()).toMatchObject({ email: "person@example.com" });
  });

  it("rejects a second sign-up with the same email", async () => {
    const client = new SampleAuthClient();
    await client.signUp("person@example.com", "password123", true);
    await expect(client.signUp("person@example.com", "different-pw", true)).rejects.toThrow(/already exists/);
  });

  it("treats email as case-insensitive", async () => {
    const client = new SampleAuthClient();
    await client.signUp("Person@Example.com", "password123", true);
    const user = await client.signIn("person@example.com", "password123");
    expect(user.email).toBe("person@example.com");
  });

  it("rejects sign-in with the wrong password", async () => {
    const client = new SampleAuthClient();
    await client.signUp("person@example.com", "password123", true);
    await client.signOut();
    await expect(client.signIn("person@example.com", "wrong")).rejects.toThrow(/incorrect/);
  });

  it("rejects sign-in for an email that was never signed up", async () => {
    const client = new SampleAuthClient();
    await expect(client.signIn("nobody@example.com", "password123")).rejects.toThrow(/incorrect/);
  });

  it("signs out, clearing the current user", async () => {
    const client = new SampleAuthClient();
    await client.signUp("person@example.com", "password123", true);
    await client.signOut();
    expect(await client.getCurrentUser()).toBeNull();
  });

  it("rejects a too-short password", async () => {
    const client = new SampleAuthClient();
    await expect(client.signUp("person@example.com", "short", true)).rejects.toThrow(/8 characters/);
  });

  it("keeps separate clients' data apart when given separate stores", async () => {
    const a = new SampleAuthClient();
    const b = new SampleAuthClient();
    await a.signUp("person@example.com", "password123", true);
    expect(await b.getCurrentUser()).toBeNull();
    await expect(b.signIn("person@example.com", "password123")).rejects.toThrow(/incorrect/);
  });
});
