import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import PortalSidebar from "./PortalSidebar";

export const dynamic = "force-dynamic";

export default async function PortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] lg:flex">
      <PortalSidebar />

      <div className="min-w-0 flex-1">
        <div className="border-b border-[#D9E3F4] bg-white px-6 py-4 lg:hidden">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6491DE]">
            Kiamina Portal
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-950">
            Secure Workspace
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}