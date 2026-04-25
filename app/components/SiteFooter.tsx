import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";

const socialLinks = [
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/company/kiamina-accounting-services/",
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/share/1BDKLXtn13/",
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/kiaminaas?igsh=NGZxajlod3ZidTJp",
  },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@kiaminaas?_r=1&_t=ZS-92eYTA4KBgF",
  },
  {
    name: "X",
    href: "https://x.com/Kiaminaas?t=7AvK5KaUoEweNxa4173HpA&s=08",
  },
  {
    name: "Pinterest",
    href: "http://pinterest.com/kiaminaas/",
  },
];

const SocialIcon = ({
  name,
  className = "h-4 w-4",
}: {
  name: string;
  className?: string;
}) => {
  if (name === "LinkedIn") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M6.94 8.5H3.56V20h3.38V8.5ZM5.25 3A2.03 2.03 0 0 0 3.2 5.03c0 1.12.91 2.03 2.02 2.03h.03a2.03 2.03 0 1 0 0-4.06ZM20.44 12.88c0-3.46-1.85-5.07-4.31-5.07-1.99 0-2.88 1.09-3.38 1.86V8.5H9.38c.04.78 0 11.5 0 11.5h3.37v-6.42c0-.34.03-.68.13-.92.27-.67.89-1.37 1.93-1.37 1.36 0 1.9 1.03 1.9 2.55V20h3.37v-7.12Z" />
      </svg>
    );
  }

  if (name === "Facebook") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M13.5 21v-7h2.3l.4-2.8h-2.7V9.45c0-.81.22-1.37 1.39-1.37H16.3V5.56c-.24-.03-1.08-.1-2.06-.1-2.04 0-3.44 1.24-3.44 3.52v2.22H8.5V14h2.3v7h2.7Z" />
      </svg>
    );
  }

  if (name === "Instagram") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2.2A2.8 2.8 0 0 0 4.2 7v10A2.8 2.8 0 0 0 7 19.8h10a2.8 2.8 0 0 0 2.8-2.8V7A2.8 2.8 0 0 0 17 4.2H7Zm5 3.3A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5Zm0 2.2A2.3 2.3 0 1 0 14.3 12 2.3 2.3 0 0 0 12 9.7Zm4.7-3.15a1.05 1.05 0 1 1-1.05 1.05 1.05 1.05 0 0 1 1.05-1.05Z" />
      </svg>
    );
  }

  if (name === "TikTok") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M14.5 3c.53 1.52 1.46 2.67 2.8 3.46.8.47 1.66.75 2.7.82v2.68a7.7 7.7 0 0 1-2.67-.52 8.03 8.03 0 0 1-1.87-1.04v6.1c0 1.25-.4 2.35-1.18 3.29A5.64 5.64 0 0 1 9.8 20a5.58 5.58 0 0 1-3.54-1.31A5.39 5.39 0 0 1 4 14.33a5.34 5.34 0 0 1 1.82-4.05A5.63 5.63 0 0 1 9.7 8.9v2.66a2.85 2.85 0 0 0-1.92.6 2.67 2.67 0 0 0-.98 2.13c0 .84.29 1.53.88 2.08.58.54 1.28.8 2.1.8.9 0 1.63-.3 2.18-.92.56-.61.84-1.42.84-2.4V3h2.68Z" />
      </svg>
    );
  }

  if (name === "X") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M18.9 2H22l-6.76 7.73L23.2 22H17l-4.85-5.96L6.94 22H3.82l7.23-8.26L1.4 2h6.35l4.38 5.44L18.9 2Zm-1.08 18.14h1.72L6.82 3.76H4.97l12.85 16.38Z" />
      </svg>
    );
  }

  if (name === "Pinterest") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12.04 2C6.6 2 3 5.64 3 10.49c0 3.1 1.74 4.86 2.79 4.86.43 0 .68-1.2.68-1.53 0-.4-1.02-1.26-1.02-2.96 0-3.51 2.67-6 6.45-6 3.13 0 5.45 1.78 5.45 5.05 0 2.44-.98 7.02-4.15 7.02-1.15 0-2.14-.85-2.14-2.02 0-1.75 1.22-3.45 1.22-5.26 0-3.14-4.45-2.57-4.45 1.22 0 .8.1 1.68.46 2.4-.67 2.88-2.05 7.16-2.05 10.08 0 .92.13 1.83.2 2.75.14.15.07.13.28.06 2.05-2.82 1.98-3.37 2.91-7.08.5.95 1.8 1.45 2.82 1.45 4.33 0 6.28-4.21 6.28-8.05C20.5 5.3 16.8 2 12.04 2Z" />
      </svg>
    );
  }

  return null;
};

const SocialBadge = ({ href, name }: { href: string; name: string }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    title={name}
    aria-label={name}
    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#D9E3F4] bg-white text-[#073D7F] transition hover:-translate-y-0.5 hover:border-[#6491DE] hover:bg-[#F1F1F1] hover:text-[#6491DE]"
  >
    <SocialIcon name={name} />
  </a>
);

export default function SiteFooter() {
  return (
    <footer className="border-t border-[#D9E3F4] bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[1fr_auto] lg:px-8">
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#073D7F]">
            Kiamina Accounting Services
          </div>

          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">
            Nigeria-based accounting and advisory firm providing structured
            financial operations, reporting clarity, and strategic support to
            clients across Nigeria, Canada, United States, United Kingdom,
            Australia, and Ireland.
          </p>

          <div className="mt-6">
            <div className="text-sm font-semibold uppercase tracking-[0.20em] text-[#073D7F]">
              Follow us
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {socialLinks.map((social) => (
                <SocialBadge
                  key={social.name}
                  href={social.href}
                  name={social.name}
                />
              ))}
            </div>

            <div className="mt-2 text-xs text-slate-500">
              Stay connected for insights and updates
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-4 text-sm">
            <Link
              href="/privacy"
              className="text-[#073D7F] transition hover:text-[#6491DE]"
            >
              Privacy Statement
            </Link>

            <Link
              href="/legal"
              className="text-[#073D7F] transition hover:text-[#6491DE]"
            >
              Legal Statement
            </Link>
          </div>
        </div>

        <div className="space-y-3 text-sm text-slate-600">
          <div className="flex items-start gap-3">
            <Mail className="mt-1 h-4 w-4 text-[#6491DE]" />
            <span>info@kiaminaaccounting.com</span>
          </div>

          <div className="flex items-start gap-3">
            <Phone className="mt-1 h-4 w-4 text-[#6491DE]" />
            <span>+234 906 494 2073</span>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="mt-1 h-4 w-4 text-[#6491DE]" />
            <span>
              10 Akpunonu Street, Rumuodumaya, Port Harcourt, Rivers, Nigeria,
              500102
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}