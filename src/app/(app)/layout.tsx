import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { Nav } from "@/components/nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-dvh">
      <Nav email={user.email} />
      <main className="mx-auto max-w-xl px-4 py-8">{children}</main>
    </div>
  );
}
