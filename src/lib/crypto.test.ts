// US-005: Unit tests for encryption module
import { describe, it, expect } from "vitest";
import { encrypt, decrypt } from "./crypto";

describe("crypto", () => {
  it("encrypts and decrypts a value round-trip", () => {
    const plaintext = "ghp_abcdef123456";
    const encrypted = encrypt(plaintext);
    expect(encrypted).not.toBe(plaintext);
    expect(decrypt(encrypted)).toBe(plaintext);
  });

  it("produces different ciphertext for same input (random IV)", () => {
    const plaintext = "ghp_abcdef123456";
    expect(encrypt(plaintext)).not.toBe(encrypt(plaintext));
  });

  it("throws on tampered ciphertext", () => {
    const encrypted = encrypt("ghp_abcdef123456");
    const tampered = encrypted.slice(0, -2) + "xx";
    expect(() => decrypt(tampered)).toThrow();
  });

  it("handles empty string", () => {
    expect(decrypt(encrypt(""))).toBe("");
  });
});
