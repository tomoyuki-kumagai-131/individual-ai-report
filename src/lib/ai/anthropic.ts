import Anthropic from "@anthropic-ai/sdk";
import { serverEnv } from "@/lib/env";

let cached: Anthropic | null = null;

/** Lazily-constructed Anthropic client (server only). */
export function anthropic(): Anthropic {
  if (!cached) {
    cached = new Anthropic({ apiKey: serverEnv().ANTHROPIC_API_KEY });
  }
  return cached;
}

/** The Claude model used for daily analysis. */
export function analysisModel(): string {
  return serverEnv().ANTHROPIC_MODEL;
}
