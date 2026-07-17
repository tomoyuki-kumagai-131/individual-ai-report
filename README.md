# Daily Mind Report

思いや考えを都度投稿し、**毎日20時 (JST)** に AI がその日を分析して、
「今日はこんなことが起きた」「今日の思考性」「次どうすればいいか」をレポートしてくれるアプリ。

## 技術スタック

| 領域 | 採用 |
| --- | --- |
| フロント | Next.js 15 (App Router) + React 18 |
| UI | HeroUI + Tailwind CSS |
| DB | Supabase (Postgres) |
| ORM | Drizzle ORM (postgres-js) |
| 認証 | Supabase Auth (メールアドレス + パスワード) |
| AI 分析 | Anthropic Claude (`claude-sonnet-5`) |
| 定期実行 | Vercel Cron |

## アーキテクチャ（ハーネス設計）

責務を層で分離しています。差し替え・テストしやすい「ハーネス」が中心です。

```
UI (app/, components/)
  → API Routes (app/api/*)            … 認証・入力検証の境界
    → サービス層 (lib/reports/*)       … 「1日分のレポートを作る」ユースケース
      → AI ハーネス (lib/ai/*)         … Claude を呼び構造化出力を検証
      → DB クエリ (db/queries/*)       … user_id で必ずスコープ
        → Drizzle スキーマ (db/schema) … posts / reports
```

- **AI ハーネス** (`src/lib/ai/analyze.ts`): 入力=その日の投稿、出力=`ReportPayload`。
  Claude を `record_report` ツールで強制的に構造化出力させ、Zod で検証します。
  プロンプトは `src/lib/ai/prompt.ts`、出力の型は `src/types/index.ts` に集約。
- **定期実行**: `vercel.json` の cron が `0 11 * * *` (UTC) = **20:00 JST** に
  `/api/cron/daily-report` を叩き、その日投稿した全ユーザー分を生成します。

## セットアップ

> Node.js **20 以上**が必要です（`nvm install 20 && nvm use 20`）。

1. 依存をインストール
   ```bash
   npm install
   ```

2. Supabase プロジェクトを作成し、`.env.example` を `.env.local` にコピーして値を設定
   ```bash
   cp .env.example .env.local
   ```
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Project Settings → API
   - `DATABASE_URL`: Project Settings → Database → Connection string
   - `ANTHROPIC_API_KEY`: https://console.anthropic.com
   - `CRON_SECRET`: 任意の長いランダム文字列

3. メール + パスワード認証（確認メール付き）を設定
   - Supabase Dashboard → Authentication → Providers → **Email** を有効化し、
     **「Confirm email」を ON**（サインアップ時に確認メールを送信）。
   - Authentication → URL Configuration:
     - **Site URL** に `http://localhost:3000`（本番は本番URL）
     - **Redirect URLs** に `http://localhost:3000/**` と本番URL を追加
   - Authentication → Email Templates → **Confirm signup** のリンクを、
     token_hash 方式に差し替える（デバイスが変わっても確実に認証できる）:
     ```html
     <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=/dashboard">
       メールアドレスを確認する
     </a>
     ```
   - 認証フロー: サインアップ → 確認メール受信 → リンクを開く →
     `/auth/confirm` ページの**ボタンを押すと** `verifyOtp` でセッションを張り →
     **マイページ (`/dashboard`) へ移動**。
   - `/auth/confirm` は**ページ + ボタン方式**（自動 GET で確定しない）。Gmail 等の
     リンク先読みでワンタイムトークンが消費される事故を防ぐため、実際のクリックでのみ確定する。
   - 送信について: Supabase の内蔵メールは**開発用で送信レート制限が厳しい**（数通/時）。
     本番は Authentication → SMTP Settings で独自 SMTP（Resend/SendGrid 等）を設定する。

4. DB スキーマを反映
   ```bash
   npm run db:push          # posts / reports テーブルを作成
   npm run db:rls           # RLS 有効化（push は RLS を消すので毎回セットで実行）
   ```
   ⚠️ `drizzle-kit push` は RLS/ポリシーを削除します（Drizzle スキーマが RLS を
   宣言していないため）。**push のあとは必ず `npm run db:rls`** を実行してください。

5. 開発サーバー
   ```bash
   npm run dev
   ```

## 自動生成スケジュール (Vercel Cron)

> ⚠️ Vercel Cron は **Vercel にデプロイした時だけ**動きます。localhost では自動発火しません
> （手元では `/api/analyze` ボタンや、下記 cron を curl で叩いて確認できます）。

| 種類 | JST | UTC (`vercel.json`) | 内容 |
| --- | --- | --- | --- |
| 朝のブリーフィング | **06:00** | `0 21 * * *` | 昨日の振り返り＋今日やるべきこと |
| 夜の振り返り | **18:00** | `0 9 * * *` | 今日の振り返り |

- 環境変数を Vercel Project Settings に登録（`CRON_SECRET` を含む）。
- Vercel Cron は `Authorization: Bearer $CRON_SECRET` を送るため、エンドポイントが保護されます。
- Vercel Hobby プランの Cron は「1日1回」まで（本設定は各1回/日なので OK）。実行時刻は
  多少ずれることがあります（正確な分刻みが必要なら Pro）。

## 主要エンドポイント

| メソッド | パス | 用途 |
| --- | --- | --- |
| `POST` | `/api/posts` | 投稿の作成 |
| `GET` | `/api/posts` | 投稿一覧 |
| `DELETE` | `/api/posts/:id` | 投稿の削除 |
| `POST` | `/api/analyze` | 今日のレポートを手動生成（`type` 省略時は evening） |
| `GET` | `/api/cron/morning-report` | 朝バッチ（`CRON_SECRET` 必須） |
| `GET` | `/api/cron/evening-report` | 夜バッチ（`CRON_SECRET` 必須） |

## 未実装 / 今後の拡張（ハーネスは用意済み）

- レポートのメール/プッシュ通知
- 週次・月次の傾向分析（`reports` を集計）
- 投稿の編集、タグ、検索
- レート制限・多言語対応
