"use client";

import { useEffect, useState } from "react";
import { Button, Card, CardBody, CardHeader } from "@heroui/react";
import { useRouter } from "next/navigation";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type Params = { tokenHash: string; type: EmailOtpType; next: string };
type Status = "idle" | "verifying" | "error";

/**
 * Email confirmation landing page.
 *
 * The confirmation email links here with `token_hash` & `type`. We DON'T verify
 * automatically on load — email clients (Gmail etc.) pre-fetch links, which
 * would consume the one-time token before the user ever clicks. Instead we show
 * a button; the actual `verifyOtp` runs only on a real user click, which also
 * works across devices/browsers (no PKCE verifier needed).
 */
export default function ConfirmPage() {
  const router = useRouter();
  const [params, setParams] = useState<Params | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const tokenHash = p.get("token_hash");
    const type = p.get("type") as EmailOtpType | null;
    const next = p.get("next") ?? "/dashboard";
    if (tokenHash && type) {
      setParams({ tokenHash, type, next });
    } else {
      setStatus("error");
      setError("確認リンクが正しくありません。メール内のリンクをそのまま開いてください。");
    }
  }, []);

  async function confirm() {
    if (!params) return;
    setStatus("verifying");
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      type: params.type,
      token_hash: params.tokenHash,
    });
    if (error) {
      setStatus("error");
      setError(
        "確認に失敗しました。リンクの有効期限切れか、既に使用済みの可能性があります。もう一度サインアップしてお試しください。",
      );
      return;
    }
    // Session is now set. Head to the my-page.
    router.push(params.next);
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center p-6">
      <Card className="w-full">
        <CardHeader className="flex-col items-start gap-1 px-6 pt-6">
          <h1 className="text-2xl font-bold">メールアドレスの確認</h1>
          <p className="text-sm text-default-500">
            下のボタンを押すと認証が完了し、マイページへ移動します。
          </p>
        </CardHeader>
        <CardBody className="gap-4 px-6 pb-6">
          <Button
            color="primary"
            size="lg"
            className="w-full"
            isLoading={status === "verifying"}
            isDisabled={!params || status === "verifying"}
            onPress={confirm}
          >
            メールアドレスを確認して続ける
          </Button>
          {error && <p className="text-sm text-danger">{error}</p>}
          {status === "error" && (
            <Button as="a" href="/login" variant="flat" className="w-full">
              ログイン画面へ戻る
            </Button>
          )}
        </CardBody>
      </Card>
    </main>
  );
}
