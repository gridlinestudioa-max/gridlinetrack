import Link from "next/link";
import { requireUser } from "@/lib/admin";
import { signOut } from "../login/actions";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireUser();
  return (
    <div className="min-h-dvh bg-neutral-100 text-neutral-950 [--paper:#f5f5f5] [--ink:#0a0a0a]">
      <div className="stripe h-1.5" />
      <header className="border-b-2 border-neutral-950 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/admin" className="display text-xl">
            Gridline <span className="text-[#c10500]">Track</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden max-w-48 truncate text-neutral-500 sm:inline">{user.email}</span>
            <form action={signOut}>
              <button className="min-h-10 px-2 font-semibold underline underline-offset-4">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
