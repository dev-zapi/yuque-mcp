import { describe, it, expect } from "vitest";

describe("Sample Test", () => {
  it("should pass a basic test", () => {
    expect(1 + 1).toBe(2);
  });

  it("should handle string operations", () => {
    const message = "Yuque MCP Server";
    expect(message).toContain("Yuque");
    expect(message).toMatch(/MCP/);
  });
});
