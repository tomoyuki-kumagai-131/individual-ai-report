"use client";

import { HeroUIProvider } from "@heroui/react";
import { useRouter } from "next/navigation";

/**
 * Wraps the app in HeroUI's provider and wires its `navigate` to the Next.js
 * router so HeroUI links use client-side navigation.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return <HeroUIProvider navigate={router.push}>{children}</HeroUIProvider>;
}
