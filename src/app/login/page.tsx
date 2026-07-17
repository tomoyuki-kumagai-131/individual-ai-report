"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  Input,
  Tabs,
  Tab,
} from "@heroui/react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Surface errors handed back by the /auth/confirm and /auth/callback routes.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const e = params.get("error");
    if (params.get("confirmed") === "1") {
      setNotice("メールアドレスの確認が完了しました。ログインしてください。");
    } else if (e === "confirm") {
      setError("確認リンクが無効か、有効期限が切れています。もう一度お試しください。");
    } else if (e === "auth") {
      setError("認証に失敗しました。もう一度お試しください。");
    }
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!email.trim()) {
      setError("メールアドレスを入力してください");
      return;
    }
    if (password.length < 6) {
      setError("パスワードは6文字以上で入力してください");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/dashboard");
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          },
        });
        if (error) throw error;
        if (data.session) {
          // Email confirmation is disabled → signed in immediately.
          router.push("/dashboard");
          router.refresh();
        } else {
          setNotice(
            "確認メールを送信しました。メール内のリンクを開くと認証が完了し、マイページへ移動します。",
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "認証に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-2xl font-bold text-white shadow-lg shadow-primary/30">
          M
        </div>
        <div>
          <h1 className="brand-gradient-text text-3xl font-extrabold tracking-tight">
            Mind Report
          </h1>
          <p className="mt-1 text-sm text-default-500">
            思いを綴ると、朝6時と夜18時にAIが振り返りを届けます。
          </p>
        </div>
      </div>
      <Card className="glass-card w-full" shadow="none">
        <CardBody className="gap-4 p-6">
          <Tabs
            aria-label="認証モード"
            selectedKey={mode}
            onSelectionChange={(key) => {
              setMode(key as Mode);
              setError(null);
              setNotice(null);
            }}
            fullWidth
          >
            <Tab key="signin" title="ログイン" />
            <Tab key="signup" title="新規登録" />
          </Tabs>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-default-700">
                メールアドレス
              </label>
              <Input
                id="email"
                type="email"
                aria-label="メールアドレス"
                placeholder="you@example.com"
                variant="flat"
                value={email}
                onValueChange={setEmail}
                autoComplete="email"
                isDisabled={loading}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-default-700">
                パスワード
              </label>
              <Input
                id="password"
                type="password"
                aria-label="パスワード"
                placeholder="6文字以上"
                variant="flat"
                value={password}
                onValueChange={setPassword}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                isDisabled={loading}
              />
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}
            {notice && <p className="text-sm text-success">{notice}</p>}

            <Button
              type="submit"
              color="primary"
              size="lg"
              radius="full"
              isLoading={loading}
              className="w-full bg-gradient-to-r from-primary to-secondary font-semibold shadow-md shadow-primary/30"
            >
              {mode === "signin" ? "ログイン" : "新規登録"}
            </Button>
          </form>

          <p className="text-center text-xs text-default-400">
            続行することで利用規約とプライバシーポリシーに同意したものとみなされます。
          </p>
        </CardBody>
      </Card>
    </main>
  );
}
