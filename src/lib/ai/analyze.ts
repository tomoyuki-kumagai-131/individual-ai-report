import { anthropic, analysisModel } from "./anthropic";
import { systemPrompt, REPORT_TOOL, buildUserMessage } from "./prompt";
import {
  reportPayloadSchema,
  type PostForAnalysis,
  type ReportPayload,
  type ReportType,
} from "@/types";

export interface AnalyzeResult {
  payload: ReportPayload;
  model: string;
}

/**
 * The AI analysis harness.
 *
 * Given a report type (morning/evening), the analyzed date and its posts, ask
 * Claude to produce a structured ReportPayload. The model is forced to emit its
 * answer through the `record_report` tool, and the result is validated with Zod.
 *
 * Throws if there are no posts, or if the model fails to return a valid tool
 * call after the built-in retries.
 */
export async function analyzeDay(
  type: ReportType,
  analyzeDate: string,
  posts: PostForAnalysis[],
  profile?: string | null,
): Promise<AnalyzeResult> {
  if (posts.length === 0) {
    throw new Error(`No posts to analyze for ${analyzeDate}`);
  }

  const model = analysisModel();

  const response = await anthropic().messages.create({
    model,
    max_tokens: 2048,
    system: systemPrompt(type),
    tools: [REPORT_TOOL],
    tool_choice: { type: "tool", name: REPORT_TOOL.name },
    messages: [
      {
        role: "user",
        content: buildUserMessage(type, analyzeDate, posts, profile),
      },
    ],
  });

  const toolUse = response.content.find(
    (block): block is Extract<typeof block, { type: "tool_use" }> =>
      block.type === "tool_use" && block.name === REPORT_TOOL.name,
  );

  if (!toolUse) {
    throw new Error("Model did not return a record_report tool call");
  }

  const parsed = reportPayloadSchema.safeParse(toolUse.input);
  if (!parsed.success) {
    throw new Error(`Invalid report payload: ${parsed.error.message}`);
  }

  return { payload: parsed.data, model };
}
