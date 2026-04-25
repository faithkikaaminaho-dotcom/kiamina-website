import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";

export default function SiteFooter() {
  return (
    <footer className="border-t border-[#D9E3F4] bg-white mt-20">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">

        <div className="grid gap-8 lg:grid-cols-2">

          {/* Left */}
          <div>
            <div className="text-sm font-semibold text-[#073D7F]">
              Kiamina Accounting Services
            </div>

            <p className="mt-3 text-sm text-slate-600 max-w-xl">
              Strategic accounting, payroll, tax compliance, and CFO advisory
              services for businesses and nonprofits.
            </p>

            <div className="mt-6 flex gap-4 text-sm">
              <Link href="/privacy" className="text-[#073D7F]">
                Privacy
              </Link>
              <Link href="/legal" className="text-[#073D7F]">
                Legal
              </Link>
            </div>
          </div>

          {/* Right */}
          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex gap-2">
              <Mail className="h-4 w-4" />
              info@kiaminaaccounting.com
            </div>
            <div className="flex gap-2">
              <Phone className="h-4 w-4" />
              +234 906 494 2073
            </div>
            <div className="flex gap-2">
              <MapPin className="h-4 w-4" />
              Port Harcourt, Nigeria
            </div>
          </div>

        </div>

        <div className="mt-10 text-xs text-slate-500">
          © {new Date().getFullYear()} Kiamina Accounting Services
        </div>
      </div>
    </footer>
  );
}