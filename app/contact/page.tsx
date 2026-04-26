"use client";

import { useState } from "react";

export default function ContactPage() {
  const [subscriptionEmail, setSubscriptionEmail] = useState("");
  const [subscriptionStatus, setSubscriptionStatus] = useState("idle");
  const [subscriptionMessage, setSubscriptionMessage] = useState("");

  const [contactStatus, setContactStatus] = useState("idle");
  const [contactMessage, setContactMessage] = useState("");

  const handleSubscription = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!subscriptionEmail.trim()) {
      setSubscriptionStatus("error");
      setSubscriptionMessage("Please enter your email address.");
      return;
    }

    try {
      setSubscriptionStatus("loading");
      setSubscriptionMessage("Connecting to Mailchimp...");

      await new Promise((resolve) => setTimeout(resolve, 900));

      setSubscriptionStatus("success");
      setSubscriptionMessage(
        "Preview mode: your Mailchimp-ready form is styled and working. The live API connection should be added later using a secure server route."
      );
      setSubscriptionEmail("");
    } catch (error) {
      setSubscriptionStatus("error");
      setSubscriptionMessage("Something went wrong. Please try again.");
    }
  };

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    const data = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      company: String(formData.get("company") || ""),
      service: String(formData.get("service") || ""),
      message: String(formData.get("message") || ""),
    };

    if (!data.name || !data.email || !data.message) {
      setContactStatus("error");
      setContactMessage("Please fill in your name, email, and message.");
      return;
    }

    try {
      setContactStatus("loading");
      setContactMessage("Sending your message...");

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to send message.");
      }

      setContactStatus("success");
      setContactMessage(
        "Thank you. Your message has been sent successfully. We will respond shortly."
      );
      form.reset();
    } catch (error) {
      setContactStatus("error");
      setContactMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    }
  };

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
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M6.94 8.5H3.56V20h3.38V8.5ZM5.25 3A2.03 2.03 0 0 0 3.2 5.03c0 1.12.91 2.03 2.02 2.03h.03a2.03 2.03 0 1 0 0-4.06ZM20.44 12.88c0-3.46-1.85-5.07-4.31-5.07-1.99 0-2.88 1.09-3.38 1.86V8.5H9.38c.04.78 0 11.5 0 11.5h3.37v-6.42c0-.34.03-.68.13-.92.27-.67.89-1.37 1.93-1.37 1.36 0 1.9 1.03 1.9 2.55V20h3.37v-7.12Z" />
        </svg>
      );
    }

    if (name === "Facebook") {
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M13.5 21v-7h2.3l.4-2.8h-2.7V9.45c0-.81.22-1.37 1.39-1.37H16.3V5.56c-.24-.03-1.08-.1-2.06-.1-2.04 0-3.44 1.24-3.44 3.52v2.22H8.5V14h2.3v7h2.7Z" />
        </svg>
      );
    }

    if (name === "Instagram") {
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2.2A2.8 2.8 0 0 0 4.2 7v10A2.8 2.8 0 0 0 7 19.8h10a2.8 2.8 0 0 0 2.8-2.8V7A2.8 2.8 0 0 0 17 4.2H7Zm5 3.3A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5Zm0 2.2A2.3 2.3 0 1 0 14.3 12 2.3 2.3 0 0 0 12 9.7Zm4.7-3.15a1.05 1.05 0 1 1-1.05 1.05 1.05 1.05 0 0 1 1.05-1.05Z" />
        </svg>
      );
    }

    if (name === "TikTok") {
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M14.5 3c.53 1.52 1.46 2.67 2.8 3.46.8.47 1.66.75 2.7.82v2.68a7.7 7.7 0 0 1-2.67-.52 8.03 8.03 0 0 1-1.87-1.04v6.1c0 1.25-.4 2.35-1.18 3.29A5.64 5.64 0 0 1 9.8 20a5.58 5.58 0 0 1-3.54-1.31A5.39 5.39 0 0 1 4 14.33a5.34 5.34 0 0 1 1.82-4.05A5.63 5.63 0 0 1 9.7 8.9v2.66a2.85 2.85 0 0 0-1.92.6 2.67 2.67 0 0 0-.98 2.13c0 .84.29 1.53.88 2.08.58.54 1.28.8 2.1.8.9 0 1.63-.3 2.18-.92.56-.61.84-1.42.84-2.4V3h2.68Z" />
        </svg>
      );
    }

    if (name === "X") {
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M18.9 2H22l-6.76 7.73L23.2 22H17l-4.85-5.96L6.94 22H3.82l7.23-8.26L1.4 2h6.35l4.38 5.44L18.9 2Zm-1.08 18.14h1.72L6.82 3.76H4.97l12.85 16.38Z" />
        </svg>
      );
    }

    if (name === "Pinterest") {
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
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
      <SocialIcon name={name} className="h-4 w-4" />
    </a>
  );

  return (
    <main>
      <section className="relative overflow-hidden bg-[#073D7F] py-24 text-white">
        <div className="absolute inset-0">
          <img
            src="/contact.png"
            alt="Contact Kiamina Accounting Services"
            className="h-full w-full object-cover opacity-20"
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Contact
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Start with a focused consultation built around your reporting,
              control, and growth priorities.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-100">
              For founders, CEOs, CFOs, and decision-makers looking for serious
              accounting and advisory support, the next step is a structured
              conversation.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="space-y-8">
          <div className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Contact details
            </div>
            <div className="mt-6 space-y-5 text-sm leading-7 text-slate-600">
              <p>
                <span className="font-semibold text-slate-900">Email:</span>{" "}
                info@kiaminaaccounting.com
              </p>
              <p>
                <span className="font-semibold text-slate-900">Phone:</span>{" "}
                +234 906 496 2073
              </p>
              <p>
                <span className="font-semibold text-slate-900">
                  Head office:
                </span>{" "}
                10 Akpunonu Street, Rumuodumaya, Port Harcourt, Rivers,
                Nigeria, 500102
              </p>
              <p>
                <span className="font-semibold text-slate-900">
                  Active markets:
                </span>{" "}
                Nigeria, Canada, United States, United Kingdom, Australia, and
                Ireland
              </p>
            </div>

            <div className="mt-8">
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
          </div>

          <div className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Send a message
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
              Tell us what you need help with.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Complete the form below and our team will respond with the next
              step for your accounting, reporting, payroll, tax, or advisory
              needs.
            </p>

            <form onSubmit={handleContactSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="contact-name"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Full name
                </label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  required
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border border-[#D9E3F4] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#073D7F]"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-email"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Email address
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  required
                  placeholder="Enter your email address"
                  className="w-full rounded-xl border border-[#D9E3F4] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#073D7F]"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-company"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Company / Organization
                </label>
                <input
                  id="contact-company"
                  name="company"
                  type="text"
                  placeholder="Enter company or organization name"
                  className="w-full rounded-xl border border-[#D9E3F4] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#073D7F]"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-service"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Service of interest
                </label>
                <select
                  id="contact-service"
                  name="service"
                  className="w-full rounded-xl border border-[#D9E3F4] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#073D7F]"
                >
                  <option value="">Select a service</option>
                  <option value="Bookkeeping">Bookkeeping</option>
                  <option value="Payroll Processing">Payroll Processing</option>
                  <option value="Financial Reporting">
                    Financial Reporting
                  </option>
                  <option value="Management Reporting">
                    Management Reporting
                  </option>
                  <option value="Accounts Receivable & Payable">
                    Accounts Receivable & Payable
                  </option>
                  <option value="CFO Consulting">CFO Consulting</option>
                  <option value="Financial Modelling">
                    Financial Modelling
                  </option>
                  <option value="Tax Compliance">Tax Compliance</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="contact-message"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Message
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  required
                  rows={5}
                  placeholder="Tell us about your needs"
                  className="w-full rounded-xl border border-[#D9E3F4] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#073D7F]"
                />
              </div>

              <button
                type="submit"
                disabled={contactStatus === "loading"}
                className="inline-flex items-center rounded-full bg-[#073D7F] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
              >
                {contactStatus === "loading" ? "Sending..." : "Send Message"}
              </button>

              {contactMessage ? (
                <div
                  className={`rounded-xl px-4 py-3 text-sm leading-7 ${
                    contactStatus === "success"
                      ? "bg-emerald-50 text-emerald-700"
                      : contactStatus === "error"
                      ? "bg-red-50 text-red-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {contactMessage}
                </div>
              ) : null}
            </form>
          </div>

          <div className="rounded-[2rem] border border-[#D9E3F4] bg-[#F1F1F1] p-8 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Subscribe for insights
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
              Receive accounting, compliance, payroll, and reporting insights by
              email.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Stay ahead with practical accounting, tax, and financial
              management insights tailored for businesses and nonprofits.
            </p>

            <form onSubmit={handleSubscription} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="subscriber-name"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Full name
                </label>
                <input
                  id="subscriber-name"
                  name="name"
                  type="text"
                  placeholder="Enter your name"
                  className="w-full rounded-xl border border-[#D9E3F4] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#073D7F]"
                />
              </div>

              <div>
                <label
                  htmlFor="subscriber-email"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Email address
                </label>
                <input
                  id="subscriber-email"
                  name="email"
                  type="email"
                  value={subscriptionEmail}
                  onChange={(e) => setSubscriptionEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full rounded-xl border border-[#D9E3F4] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#073D7F]"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center rounded-full bg-[#073D7F] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
                disabled={subscriptionStatus === "loading"}
              >
                {subscriptionStatus === "loading"
                  ? "Connecting..."
                  : "Subscribe"}
              </button>

              {subscriptionMessage ? (
                <div
                  className={`rounded-xl px-4 py-3 text-sm leading-7 ${
                    subscriptionStatus === "success"
                      ? "bg-emerald-50 text-emerald-700"
                      : subscriptionStatus === "error"
                      ? "bg-red-50 text-red-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {subscriptionMessage}
                </div>
              ) : null}
            </form>
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-5 shadow-xl ring-1 ring-[#D9E3F4] lg:sticky lg:top-28">
          <div className="mb-6 rounded-2xl border border-[#D9E3F4] bg-[#F1F1F1] p-5">
            <div className="text-sm font-semibold text-[#073D7F]">
              What happens after booking:
            </div>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>• Review of your current accounting and reporting setup</li>
              <li>• Identification of gaps and risks</li>
              <li>• Clear recommendation on next steps</li>
            </ul>
          </div>

          <div className="overflow-hidden rounded-[1.5rem] border border-[#D9E3F4] bg-[#F1F1F1]">
            <iframe
              src="https://calendar.app.google/Ph7DtaeNiKSBq7B69"
              title="Book a consultation with Kiamina Accounting Services"
              className="h-[640px] w-full"
            />
          </div>
        </div>
      </section>
    </main>
  );
}