// US-2.02: Import Anthropic API key from Claude Code's macOS Keychain
import { NextResponse } from "next/server";
import { readKeychainPassword } from "@/lib/keychain";
import { setSetting } from "@/db/settings";

export const dynamic = "force-dynamic";

const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";

export async function POST() {
  try {
    const apiKey = await readKeychainPassword("Claude Code");

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No Claude Code API key found in macOS Keychain. Make sure Claude Code is installed and configured.",
        },
        { status: 404 },
      );
    }

    setSetting("llm_provider", "anthropic");
    setSetting("llm_model", DEFAULT_MODEL);
    setSetting("llm_api_key", apiKey);

    return NextResponse.json({
      success: true,
      provider: "anthropic",
      model: DEFAULT_MODEL,
      message: "API key imported from Claude Code.",
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to read macOS Keychain.",
      },
      { status: 500 },
    );
  }
}
