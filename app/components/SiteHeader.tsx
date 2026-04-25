"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

export default function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileSearchTerm, setMobileSearchTerm] = useState("");

  const pages = useMemo(
    () => [
      { key: "/", label: "Home" },
      { key: "/about", label: "About" },
      { key: "/services", label: "Services" },
      { key: "/industries", label: "Industries" },
      { key: "/insights", label: "Insights" },
      { key: "/career", label: "Career" },
      { key: "/contact", label: "Contact" },
    ],
    []
  );

  const closeMenus = () => {
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
  };

  const filteredMobilePages = [
    ...pages,
    { key: "/signin", label: "Sign In" },
    { key: "/get-started", label: "Get Started" },
    { key: "/privacy", label: "Privacy Statement" },
    { key: "/legal", label: "Legal Statement" },
  ].filter((page) =>
    page.label.toLowerCase().includes(mobileSearchTerm.toLowerCase())
  );

  return (
    <header className="sticky top-0 z-50 border-b border-[#D9E3F4]/70 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/75">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 transition-all duration-300 lg:px-8">
        <Link href="/" onClick={closeMenus} className="group flex items-center gap-3 text-left">
          <div className="overflow-hidden rounded-2xl border border-[#D9E3F4] bg-white p-2 shadow-sm transition duration-300 group-hover:-translate-y-0.5 group-hover:shadow-md">
            <img
              src="/logo.png"
              alt="Kiamina Accounting Services"
              className="h-10 w-auto object-contain"
            />
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.30em] text-[#073D7F]">
              Kiamina Accounting Services
            </div>
            <div className="text-sm text-slate-500">
              Strategic accounting and advisory
            </div>
          </div>
        </Link>

        <div className="hidden items-center gap-3 lg:flex">
          <nav className="flex items-center rounded-full border border-[#D9E3F4] bg-white/90 p-1.5 shadow-sm">
            {pages.map((page) => (
              <Link
                key={page.key}
                href={page.key}
                className="rounded-full px-4 py-2 text-sm font-medium text-[#073D7F] transition hover:bg-[#F1F1F1] hover:text-[#073D7F]"
              >
                {page.label}
              </Link>
            ))}
          </nav>

          <Link
            href="/signin"
            className="inline-flex items-center rounded-full border border-[#D9E3F4] bg-white px-5 py-3 text-sm font-semibold text-[#073D7F] shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg"
          >
            Sign In
          </Link>

          <Link
            href="/get-started"
            className="inline-flex items-center rounded-full border border-[#D9E3F4] bg-white px-5 py-3 text-sm font-semibold text-[#073D7F] shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg"
          >
            Get Started
          </Link>

          <Link
            href="/contact"
            className="inline-flex items-center rounded-full bg-[#073D7F] px-5 py-3 text-sm font-semibold text-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg"
          >
            Book a Consultation
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => {
              setMobileSearchOpen(!mobileSearchOpen);
              setMobileMenuOpen(false);
            }}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#D9E3F4] bg-white text-[#073D7F] shadow-sm"
            aria-label="Open search"
          >
            <Search className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(!mobileMenuOpen);
              setMobileSearchOpen(false);
            }}
            className="inline-flex items-center rounded-full border border-[#D9E3F4] bg-[#073D7F] px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
          >
            {mobileMenuOpen ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {mobileSearchOpen && (
        <div className="border-t border-[#D9E3F4] bg-white px-6 py-4 lg:hidden">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6491DE]" />
            <input
              type="search"
              value={mobileSearchTerm}
              onChange={(e) => setMobileSearchTerm(e.target.value)}
              placeholder="Search pages, services, insights..."
              className="w-full rounded-2xl border border-[#D9E3F4] bg-[#F1F1F1] py-3 pl-11 pr-4 text-sm text-slate-900 outline-none focus:border-[#6491DE]"
            />
          </div>

          <div className="mt-4 grid gap-2">
            {filteredMobilePages.map((page) => (
              <Link
                key={page.key}
                href={page.key}
                onClick={closeMenus}
                className="rounded-xl bg-white px-4 py-3 text-left text-sm font-semibold text-[#073D7F] ring-1 ring-[#D9E3F4]"
              >
                {page.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {mobileMenuOpen && (
        <div className="border-t border-[#D9E3F4] bg-white px-6 py-4 lg:hidden">
          <div className="grid gap-3">
            {pages.map((page) => (
              <Link
                key={page.key}
                href={page.key}
                onClick={closeMenus}
                className="rounded-xl bg-[#F1F1F1] px-4 py-3 text-left text-sm font-semibold text-[#073D7F]"
              >
                {page.label}
              </Link>
            ))}

            <Link
              href="/signin"
              onClick={closeMenus}
              className="rounded-xl bg-[#F1F1F1] px-4 py-3 text-left text-sm font-semibold text-[#073D7F]"
            >
              Sign In
            </Link>

            <Link
              href="/get-started"
              onClick={closeMenus}
              className="rounded-xl bg-[#F1F1F1] px-4 py-3 text-left text-sm font-semibold text-[#073D7F]"
            >
              Get Started
            </Link>

            <Link
              href="/contact"
              onClick={closeMenus}
              className="rounded-xl bg-[#073D7F] px-4 py-3 text-left text-sm font-semibold text-white"
            >
              Book a Consultation
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}