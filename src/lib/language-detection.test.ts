// US-2.10: Language detection from file path tests
import { describe, it, expect } from "vitest";
import { detectLanguage } from "./language-detection";

describe("detectLanguage", () => {
  it("returns null for null filePath", () => {
    expect(detectLanguage(null)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(detectLanguage("")).toBeNull();
  });

  it("returns null for file with no extension", () => {
    expect(detectLanguage("Makefile")).toBeNull();
    expect(detectLanguage("Dockerfile")).toBeNull();
  });

  it("returns null for unknown extensions", () => {
    expect(detectLanguage("file.xyz")).toBeNull();
    expect(detectLanguage("data.parquet")).toBeNull();
  });

  it("detects TypeScript from .ts extension", () => {
    expect(detectLanguage("src/lib/auth.ts")).toBe("typescript");
  });

  it("detects TypeScript from .tsx extension", () => {
    expect(detectLanguage("src/components/Button.tsx")).toBe("typescript");
  });

  it("detects JavaScript from .js extension", () => {
    expect(detectLanguage("config/webpack.config.js")).toBe("javascript");
  });

  it("detects JavaScript from .jsx extension", () => {
    expect(detectLanguage("src/App.jsx")).toBe("javascript");
  });

  it("detects Python from .py extension", () => {
    expect(detectLanguage("services/auth/user.py")).toBe("python");
  });

  it("detects Go from .go extension", () => {
    expect(detectLanguage("cmd/server/main.go")).toBe("go");
  });

  it("detects Ruby from .rb extension", () => {
    expect(detectLanguage("app/models/user.rb")).toBe("ruby");
  });

  it("detects Java from .java extension", () => {
    expect(detectLanguage("src/main/java/App.java")).toBe("java");
  });

  it("detects Rust from .rs extension", () => {
    expect(detectLanguage("src/main.rs")).toBe("rust");
  });

  it("detects CSS from .scss extension", () => {
    expect(detectLanguage("styles/theme.scss")).toBe("css");
  });

  it("detects SQL from .sql extension", () => {
    expect(detectLanguage("migrations/001.sql")).toBe("sql");
  });

  it("handles deeply nested paths", () => {
    expect(
      detectLanguage("packages/core/src/lib/utils/helpers.ts"),
    ).toBe("typescript");
  });

  it("handles paths with dots in directory names", () => {
    expect(detectLanguage("src/v2.0/api/handler.go")).toBe("go");
  });
});
