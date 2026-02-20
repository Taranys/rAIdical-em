// US-2.02: macOS Keychain access for importing credentials
import { execFile } from "node:child_process";

export function readKeychainPassword(service: string): Promise<string | null> {
  return new Promise((resolve) => {
    execFile(
      "security",
      ["find-generic-password", "-s", service, "-w"],
      { timeout: 5000 },
      (error, stdout) => {
        if (error) {
          resolve(null);
          return;
        }
        const value = stdout.trim();
        resolve(value || null);
      },
    );
  });
}
