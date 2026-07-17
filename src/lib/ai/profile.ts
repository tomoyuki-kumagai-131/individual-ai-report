import { anthropic, analysisModel } from "./anthropic";
import type { PostForAnalysis, ReportPayload } from "@/types";

/**
 * The user profile is a short, continuously-integrated markdown note that
 * captures the user's recurring tendencies — NOT a log. Each update MERGES the
 * new day into the existing profile rather than appending, so it stays compact.
 */
const PROFILE_SYSTEM = `あなたはユーザーの「思考と感情の伴走者」が持つ、長期メモの編集者です。
これまでの累積プロファイルに、新しい1日の気づきを"統合"して、最新版のプロファイルを返します。

方針:
- 追記ではなく統合。重複するテーマはまとめ、古い断片は要約し、全体を簡潔に保つ。
- 含める観点: 繰り返し現れる思考のクセ／価値観・大事にしていること／気分が上下する引き金／本人に効く対処・習慣／向き合い中のテーマ。
- 断定・診断はしない。観察ベースで、優しく中立的に。
- 日本語。全体で概ね400〜700文字。見出し付きの箇条書き(Markdown)で簡潔に。
- 出力はプロファイル本文のみ（前置き・後書き・コードフェンス無し）。`;

function postsBlock(posts: PostForAnalysis[]): string {
  return posts
    .map((p, i) => {
      const mood = p.mood != null ? ` (self-mood: ${p.mood}/5)` : "";
      return `${i + 1}.${mood} ${p.content}`;
    })
    .join("\n");
}

function buildUpdateMessage(
  existing: string | null,
  analyzeDate: string,
  posts: PostForAnalysis[],
  payload: ReportPayload,
): string {
  const current = existing?.trim()
    ? existing
    : "(まだプロファイルはありません。今回が初回です。)";

  return `# 現在の累積プロファイル
${current}

# 新しい1日 (${analyzeDate})
## 本人の投稿
${postsBlock(posts)}

## その日の分析まとめ
- 要約: ${payload.summary}
- 気分: ${payload.moodScore}/5
- 感情: ${payload.emotions.join(", ")}
- 思考性: ${payload.thinkingPatterns.map((t) => t.label).join(" / ")}

上記を統合し、最新版の累積プロファイル本文だけを返してください。`;
}

/**
 * Fold one day's posts + report into the user's accumulated profile and return
 * the new profile text. Non-fatal: callers should treat failures as "keep the
 * old profile".
 */
export async function updateUserProfile(input: {
  existing: string | null;
  analyzeDate: string;
  posts: PostForAnalysis[];
  payload: ReportPayload;
}): Promise<string> {
  const response = await anthropic().messages.create({
    model: analysisModel(),
    max_tokens: 1024,
    system: PROFILE_SYSTEM,
    messages: [
      {
        role: "user",
        content: buildUpdateMessage(
          input.existing,
          input.analyzeDate,
          input.posts,
          input.payload,
        ),
      },
    ],
  });

  const text = response.content
    .filter((b): b is Extract<typeof b, { type: "text" }> => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  if (!text) throw new Error("Empty profile update from model");
  return text;
}
