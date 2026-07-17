import type Anthropic from "@anthropic-ai/sdk";
import type { PostForAnalysis, ReportType } from "@/types";

/**
 * System prompt: sets the persona and the analytical frame. The assistant is a
 * warm, insightful journaling companion — never clinical, never a therapist
 * substitute. It writes in the user's language (Japanese by default).
 */
const SYSTEM_BASE = `あなたはユーザーの「思考と感情のジャーナリング相棒」です。
ユーザーが投稿した思いや考えを読み、静かに寄り添いながら分析します。

方針:
- 断定や説教をせず、観察と気づきを丁寧に言葉にする。
- 良し悪しのジャッジではなく、思考のクセ（思考性）を鏡のように映し出す。
- 医療・診断行為はしない。強い希死念慮など危険な兆候があれば、専門家や相談窓口に繋がるよう優しく促す一文を summary か encouragement に含める。
- 出力は必ず日本語で、指定されたツール(record_report)経由の構造化データのみ。`;

const SYSTEM_BY_TYPE: Record<ReportType, string> = {
  morning: `\n\n【朝のブリーフィング】
- summary は「昨日」の投稿を振り返る内容にする。
- nextActions は「今日」実行すべき小さな一歩の提案にする（昨日の内容を踏まえて）。
- encouragement は今日一日を穏やかに始められる前向きな一言にする。`,
  evening: `\n\n【夜の振り返り】
- summary は「今日」の投稿を振り返る内容にする。
- nextActions は次に向けた小さく実行可能な提案にする。
- encouragement は一日を終えるユーザーへのねぎらいの一言にする。`,
};

export function systemPrompt(type: ReportType): string {
  return SYSTEM_BASE + SYSTEM_BY_TYPE[type];
}

/**
 * The tool that forces Claude to return the exact ReportPayload shape.
 * Keeping the JSON Schema here (rather than deriving it) keeps the model
 * contract explicit and readable.
 */
export const REPORT_TOOL: Anthropic.Tool = {
  name: "record_report",
  description:
    "その日の投稿を分析した結果を構造化データとして記録する。必ずこのツールを1回だけ呼び出すこと。",
  input_schema: {
    type: "object",
    properties: {
      summary: {
        type: "string",
        description: "今日はこのようなことが起きた、という短い振り返り（3〜5文）。",
      },
      moodScore: {
        type: "number",
        description: "その日の総合的な気分。1(とても低い)〜5(とても高い)。",
      },
      emotions: {
        type: "array",
        items: { type: "string" },
        description: "その日に見られた感情ラベル（例: 不安, 達成感, 焦り）。最大8個。",
      },
      thinkingPatterns: {
        type: "array",
        description: "今日の思考性・思考のクセ。",
        items: {
          type: "object",
          properties: {
            label: { type: "string", description: "思考のクセの短い名前。" },
            detail: { type: "string", description: "その根拠と説明（2〜3文）。" },
          },
          required: ["label", "detail"],
        },
      },
      nextActions: {
        type: "array",
        description: "次どうすればいいかの、小さく実行可能な提案。",
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "提案（短く具体的に）。" },
            why: { type: "string", description: "なぜそれが役立つか（1〜2文）。" },
          },
          required: ["title", "why"],
        },
      },
      encouragement: {
        type: "string",
        description: "ユーザーへの、あたたかい締めの一言。",
      },
    },
    required: [
      "summary",
      "moodScore",
      "emotions",
      "thinkingPatterns",
      "nextActions",
      "encouragement",
    ],
  },
};

/** Build the user-turn text from the analyzed day's posts. */
export function buildUserMessage(
  type: ReportType,
  analyzeDate: string,
  posts: PostForAnalysis[],
  profile?: string | null,
): string {
  const lines = posts.map((p, i) => {
    const time = new Date(p.createdAt).toISOString();
    const mood = p.mood != null ? ` (self-mood: ${p.mood}/5)` : "";
    return `${i + 1}. [${time}]${mood} ${p.content}`;
  });

  const frame =
    type === "morning"
      ? `今日は朝です。以下は「昨日(${analyzeDate})」ユーザーが投稿した思い・考えです（時刻順）。\n昨日を振り返り、今日やるべきことを提案してください。`
      : `以下は「本日(${analyzeDate})」ユーザーが投稿した思い・考えです（時刻順）。\n今日を振り返ってください。`;

  // Long-term context: the accumulated profile lets the analysis reference
  // recurring patterns ("以前も同じ思考のクセが…") instead of judging each day
  // in isolation.
  const profileBlock = profile?.trim()
    ? `\n\n--- これまでのあなたの傾向（参考） ---\n${profile}\n--- ここまで ---\n過去の傾向を踏まえ、繰り返しのパターンがあれば優しく触れつつ分析してください。`
    : "";

  return `${frame}
これらを分析し、record_report ツールで結果を記録してください。${profileBlock}

--- 投稿 ---
${lines.join("\n")}
--- ここまで ---`;
}
