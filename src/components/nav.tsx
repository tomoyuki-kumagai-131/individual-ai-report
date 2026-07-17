"use client";

import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Button,
  Link,
  Avatar,
} from "@heroui/react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const LINKS = [
  { href: "/dashboard", label: "今日" },
  { href: "/reports", label: "レポート" },
];

export function Nav({ email }: { email?: string | null }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Navbar
      maxWidth="lg"
      isBordered={false}
      className="border-b border-white/40 bg-white/60 backdrop-blur-xl"
      classNames={{ wrapper: "px-4" }}
    >
      <NavbarBrand className="gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white shadow-sm">
          M
        </div>
        <span className="brand-gradient-text text-lg font-extrabold tracking-tight">
          Mind Report
        </span>
      </NavbarBrand>

      <NavbarContent className="gap-1" justify="center">
        {LINKS.map((l) => {
          const active = pathname === l.href || pathname.startsWith(l.href + "/");
          return (
            <NavbarItem key={l.href}>
              <Link
                href={l.href}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-default-500 hover:text-default-800"
                }`}
              >
                {l.label}
              </Link>
            </NavbarItem>
          );
        })}
      </NavbarContent>

      <NavbarContent justify="end" className="gap-2">
        <NavbarItem className="hidden items-center gap-2 sm:flex">
          <Avatar
            size="sm"
            name={(email ?? "?").charAt(0).toUpperCase()}
            classNames={{
              base: "bg-gradient-to-br from-primary to-secondary",
              name: "text-white text-xs",
            }}
          />
        </NavbarItem>
        <NavbarItem>
          <Button variant="flat" size="sm" radius="full" onPress={signOut}>
            ログアウト
          </Button>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
