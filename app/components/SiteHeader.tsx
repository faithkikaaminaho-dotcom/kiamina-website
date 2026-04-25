"use client";

import Link from "next/link";
import { useState } from "react";
import { Search } from "lucide-react";

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  const pages = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/services", label: "Services" },
    { href: "/industries", label: "Industries" },
    { href: "/insights", label: "Insights" },
    { href: "/career", label: "Career" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[#D9E3F4] bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="Kiamina" className="h-10" />
          <span className="text-sm font-semibold text-[#073D7F] hidden sm:block">
            Kiamina Accounting Services
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex gap-4">
          {pages.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="text-sm font-medium text-[#073D7F] hover:text-[#6491DE]"
            >
              {p.label}
            </Link>
          ))}
        </nav>

        {/* Right buttons */}
        <div className="hidden lg:flex gap-3">
          <Link href="/signin" className="text-sm font-semibold text-[#073D7F]">
            Sign In
          </Link>
          <Link
            href="/get-started"
            className="bg-[#073D7F] text-white px-4 py-2 rounded-full text-sm"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile buttons */}
        <div className="lg:hidden flex gap-2">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="px-3 py-2 bg-[#073D7F] text-white rounded-full text-sm"
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden px-6 pb-4 space-y-2">
          {pages.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              onClick={() => setMenuOpen(false)}
              className="block text-sm text-[#073D7F]"
            >
              {p.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}