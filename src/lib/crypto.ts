// US-005: AES-256-GCM encryption with machine-specific key
import { createCipheriv, createDecipheriv, randomBytes, pbkdf2Sync } from "node:crypto";
import { hostname } from "node:os";

const SALT = "em-ct-salt-v1";
const IV_LENGTH = 12;

function deriveKey(): Buffer {
  return pbkdf2Sync(
    hostname() + "rAIdical-em",
    SALT,
    100_000,
    32,
    "sha256",
  );
}

export function encrypt(plaintext: string): string {
  const key = deriveKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

export function decrypt(encoded: string): string {
  const key = deriveKey();
  const [ivHex, authTagHex, ciphertextHex] = encoded.split(":");

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const ciphertext = Buffer.from(ciphertextHex, "hex");

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}
