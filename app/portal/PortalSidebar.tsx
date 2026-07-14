"use client";

import { usePathname } from "next/navigation";
import {
  Briefcase,
  Building2,
  CheckCircle,
  Database,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";

const sidebarItems = [
  {
    label: "Dashboard",
    href: "/portal",
    icon: LayoutDashboard,
  },
  {
    label: "Inquiries",
    href: "/portal/inquiries",
    icon: MessageSquare,
  },
  {
    label: "Organisations",
    href: "/portal/organisations",
    icon: Building2,
  },
  {
    label: "Operations",
    href: "/portal/operations",
    icon: CheckCircle,
  },
  {
    label: "People",
    href: "/portal/people",
    icon: Users
  },
  {
    label: "Settings",
    href: "/portal/settings/master-data",
    icon: ShieldCheck,
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/portal") {
    return pathname === "/portal";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function PortalSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen border-r border-[#D9E3F4] bg-white px-5 py-6 lg:block lg:w-[280px] lg:shrink-0">
      <div className="sticky top-6">
        <div className="rounded-[1.5rem] bg-[#073D7F] p-5 text-white">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
            Kiamina Portal
          </div>
          <div className="mt-3 text-lg font-semibold">Secure Workspace</div>
        </div>

        <nav className="mt-8 space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActivePath(pathname, item.href);

            return (
              <a
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold ${
                  isActive
                    ? "bg-[#073D7F] text-white"
                    : "text-slate-600 hover:bg-[#F1F1F1] hover:text-[#073D7F]"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </a>
            );
          })}
        </nav>

        <form action="/auth/signout" method="post" className="mt-8">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}