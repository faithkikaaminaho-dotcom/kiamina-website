"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Wallet,
  FileText,
  BarChart3,
  Briefcase,
  LineChart,
  ShieldCheck,
  Building2,
  Laptop,
  Hammer,
  Landmark,
  Globe2,
  Search,
  Rocket,
  Users,
  CalendarDays,
} from "lucide-react";

export default function HomePage() {
  const [subscriptionEmail, setSubscriptionEmail] = useState("");
  const [subscriptionStatus, setSubscriptionStatus] = useState("idle");
  const [subscriptionMessage, setSubscriptionMessage] = useState("");

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

  const services = [
    {
      title: "Bookkeeping",
      slug: "bookkeeping",
      problem:
        "Disorganized records create blind spots, slow reporting, and increase compliance risk.",
      outcome:
        "Structured, audit-ready records that create control and confidence.",
      fit: "Growing businesses and nonprofits that need a reliable financial foundation.",
    },
    {
      title: "Payroll Processing",
      slug: "payroll-processing",
      problem:
        "Manual or poorly managed payroll creates compliance risks, errors, and employee dissatisfaction.",
      outcome:
        "Accurate, timely, and compliant payroll that builds trust and meets statutory requirements.",
      fit: "Businesses and nonprofits with employees requiring structured payroll management.",
    },
    {
      title: "Financial Reporting",
      slug: "financial-reporting",
      problem:
        "Delayed or unclear reporting makes timely decision-making difficult.",
      outcome: "Decision-ready reports that show performance clearly.",
      fit: "Executives who need visibility without chasing numbers.",
    },
    {
      title: "Management Reporting",
      slug: "management-reporting",
      problem: "Data exists, but not in a form leaders can act on quickly.",
      outcome: "Clear insight into trends and performance drivers.",
      fit: "CEOs, founders, and decision-makers.",
    },
    {
      title: "Accounts Receivable & Payable",
      slug: "receivables-payables",
      problem: "Weak payables and receivables control disrupts liquidity.",
      outcome: "Improved cash flow and financial discipline.",
      fit: "Businesses handling recurring transactions.",
    },
    {
      title: "CFO Consulting",
      slug: "cfo-consulting",
      problem:
        "Growing organizations need strategic finance support without full-time CFO cost.",
      outcome: "Executive-level financial insight for better decisions.",
      fit: "Growth-stage businesses and nonprofits.",
    },
    {
      title: "Financial Modelling",
      slug: "financial-modelling",
      problem:
        "Lack of structured projections limits planning and investment decisions.",
      outcome: "Clear financial projections for growth and planning.",
      fit: "Businesses and nonprofits planning expansion or funding.",
    },
    {
      title: "Tax Compliance",
      slug: "tax-compliance",
      problem: "Regulatory complexity creates exposure and penalties.",
      outcome: "Structured compliance and reduced risk.",
      fit: "Organizations operating under regulatory requirements.",
    },
  ];

  const industries = [
    {
      title: "Oil & Gas",
      body: "Support for complex cost structures, regulatory requirements, and reporting needs across capital-intensive operations.",
    },
    {
      title: "Real Estate",
      body: "Financial visibility for project-based operations, asset performance, and cash flow planning.",
    },
    {
      title: "ICT",
      body: "Scalable finance support for fast-moving technology businesses that need clear reporting and operational structure.",
    },
    {
      title: "Construction",
      body: "Control across contracts, project costs, and financial reporting requirements for execution-heavy businesses.",
    },
    {
      title: "Nonprofits",
      body: "Transparent reporting, fund accountability, and structured compliance support for mission-driven organizations.",
    },
    {
      title: "Other Service Organizations",
      body: "Financial systems and reporting clarity for service-led businesses seeking stronger control and profitability insight.",
    },
  ];

  const differentiators = [
    {
      title: "Strategic, not clerical",
      body: "Financial reporting built to inform growth decisions, not simply record transactions.",
    },
    {
      title: "Multi-country capability",
      body: "Remote service delivery across Nigeria, Canada, United States, United Kingdom, Australia, and Ireland with consistent standards and professional execution.",
    },
    {
      title: "Precision by design",
      body: "Structured workflows, reporting discipline, and reliable financial controls.",
    },
    {
      title: "Sector-aware delivery",
      body: "Financial systems shaped around the realities of complex industries and operating models.",
    },
  ];

  const steps = [
    {
      title: "Book Consultation",
      body: "Choose a convenient time using the calendar below to schedule your consultation.",
    },
    {
      title: "Financial Assessment",
      body: "Review your current reporting, systems, gaps, and priorities.",
    },
    {
      title: "Strategy & Execution",
      body: "Implement the right financial processes, controls, and reporting structure.",
    },
    {
      title: "Ongoing Reporting & Advisory",
      body: "Maintain visibility through continuous reporting and strategic support.",
    },
  ];

  const testimonials = [
    {
      text: "Kiamina Accounting Services has been consistently professional, reliable, and detail-oriented. Their clear communication and timely support significantly improved how we manage our finances and maintain compliance.",
      company: "Mozisha International Limited",
      country: "Nigeria",
      tag: "Nigeria",
      logo: "/logos/mozisha.png",
    },
    {
      text: "Kiamina delivered accurate and timely financial reports for our UK Companies House and HMRC filings, ensuring full compliance with micro-entities requirements. Their professionalism and precision stood out.",
      company: "FUTEC Engineering Limited",
      country: "United Kingdom",
      tag: "UK",
      logo: "/logos/futec.png",
    },
  ];

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

  const serviceIcons: Record<
    string,
    React.ComponentType<{ className?: string }>
  > = {
    bookkeeping: BookOpen,
    "payroll-processing": Wallet,
    "financial-reporting": FileText,
    "management-reporting": BarChart3,
    "receivables-payables": Briefcase,
    "cfo-consulting": Users,
    "financial-modelling": LineChart,
    "tax-compliance": ShieldCheck,
  };

  const industryIcons: Record<
    string,
    React.ComponentType<{ className?: string }>
  > = {
    "Oil & Gas": Building2,
    "Real Estate": Building2,
    ICT: Laptop,
    Construction: Hammer,
    Nonprofits: Landmark,
    "Other Service Organizations": Briefcase,
  };

  const differentiatorIcons: Record<
    string,
    React.ComponentType<{ className?: string }>
  > = {
    "Strategic, not clerical": Search,
    "Multi-country capability": Globe2,
    "Precision by design": ShieldCheck,
    "Sector-aware delivery": Briefcase,
  };

  const stepIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    "Book Consultation": CalendarDays,
    "Financial Assessment": Search,
    "Strategy & Execution": Rocket,
    "Ongoing Reporting & Advisory": LineChart,
  };

  const SectionHeading = ({
    eyebrow,
    title,
    body,
  }: {
    eyebrow: string;
    title: string;
    body?: string;
  }) => (
    <div className="max-w-3xl">
      <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
        {eyebrow}
      </div>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
        {title}
      </h2>
      {body ? (
        <p className="mt-5 text-lg leading-8 text-slate-600">{body}</p>
      ) : null}
    </div>
  );

  const IconBadge = ({
    icon: Icon,
  }: {
    icon: React.ComponentType<{ className?: string }>;
  }) => (
    <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#D9E3F4] bg-[#F1F1F1] text-[#073D7F]">
      <Icon className="h-5 w-5" />
    </div>
  );

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

  return (
    <div className="min-h-screen bg-white text-slate-900">

      

      <main>
        <section className="relative overflow-hidden bg-[#073D7F] text-white">
          <div className="absolute inset-0">
            <img
              src="/hero.png"
              alt="Financial professionals"
              className="h-full w-full object-cover opacity-30"
            />
          </div>

          <div className="relative mx-auto grid max-w-7xl gap-14 px-6 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-28">
            <div>
              <div className="mb-6 inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-blue-100">
                Serving businesses and nonprofits across Nigeria, Canada, United
                States, United Kingdom, Australia, and Ireland
              </div>

              <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Financial clarity that strengthens control, improves decisions,
                and supports scalable growth.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100">
                CFO-level insight, structured financial systems, and
                decision-ready reporting for businesses and nonprofits that
                expect more than routine accounting.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/contact"
                  className="rounded-full bg-[#6491DE] px-7 py-3.5 text-center text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#4F7FD1]"
                >
                  Book a Consultation
                </Link>

                <Link
                  href="/services"
                  className="rounded-full border border-white/20 px-7 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-white/5"
                >
                  View Services
                </Link>
              </div>

              <div className="mt-12 grid gap-4 sm:grid-cols-2">
                {[
                  "Nigeria-based firm serving clients across six active markets",
                  "CFO-level insight without full-time CFO cost",
                  "Clear reporting built for executive decisions",
                  "Remote delivery with structured financial systems",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-blue-100 shadow-2xl shadow-black/10"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur">
              <div className="rounded-[1.5rem] bg-white p-6 text-slate-900">
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                  Executive Finance Snapshot
                </div>

                <div className="mt-5 grid gap-4">
                  <div className="rounded-2xl bg-[#F1F1F1] p-5">
                    <div className="text-sm text-slate-500">
                      Reporting standard
                    </div>
                    <div className="mt-2 text-2xl font-semibold">
                      Decision-ready monthly reporting
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-[#F1F1F1] p-5">
                      <div className="text-sm text-slate-500">
                        Delivery model
                      </div>
                      <div className="mt-2 text-lg font-semibold">
                        Remote across 6 countries
                      </div>
                    </div>

                    <div className="rounded-2xl bg-[#F1F1F1] p-5">
                      <div className="text-sm text-slate-500">
                        Strategic value
                      </div>
                      <div className="mt-2 text-lg font-semibold">
                        CFO-level guidance
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#073D7F] p-5 text-white">
                    <div className="text-sm text-blue-100">Built for</div>
                    <div className="mt-2 text-lg font-semibold">
                      Founders, CEOs, CFOs, and serious growth-stage businesses
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#D9E3F4] bg-white">
          <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 md:grid-cols-4 lg:px-8">
            {[
              "Remote delivery with structured operational discipline",
              "Industry-aware financial support for complex businesses",
              "Reporting built for executive visibility and control",
              "Professional systems designed to scale with growth",
            ].map((item) => (
              <div key={item} className="text-sm leading-6 text-slate-600">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <SectionHeading
            eyebrow="Services"
            title="Financial operations, reporting, and strategic advisory designed for businesses that need clarity at leadership level."
            body="Each service is structured around a business problem, the operating outcome it delivers, and the type of organization it best supports."
          />

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {services.map((service) => {
              const Icon = serviceIcons[service.slug] || Briefcase;

              return (
                <div
                  key={service.title}
                  className="rounded-[1.75rem] border border-[#D9E3F4] bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <IconBadge icon={Icon} />
                  <h3 className="text-xl font-semibold text-slate-950">
                    {service.title}
                  </h3>

                  <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
                    <p>
                      <span className="font-semibold text-slate-900">
                        Problem:
                      </span>{" "}
                      {service.problem}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900">
                        Outcome:
                      </span>{" "}
                      {service.outcome}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900">
                        Best suited for:
                      </span>{" "}
                      {service.fit}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-10">
            <Link
              href="/services"
              className="inline-flex rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white"
            >
              Explore all services
            </Link>
          </div>
        </section>

        <section className="bg-[#F1F1F1]">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <div>
                <SectionHeading
                  eyebrow="Why Kiamina"
                  title="A financial growth partner for leaders who need precision, visibility, and strategic finance capability."
                  body="Kiamina delivers financial accuracy, reporting clarity, and strategic finance support in one operating model."
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                {differentiators.map((item) => {
                  const Icon = differentiatorIcons[item.title] || Briefcase;

                  return (
                    <div
                      key={item.title}
                      className="rounded-[1.75rem] bg-white p-7 shadow-sm ring-1 ring-[#D9E3F4]"
                    >
                      <IconBadge icon={Icon} />
                      <h3 className="text-lg font-semibold text-slate-950">
                        {item.title}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        {item.body}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <SectionHeading
            eyebrow="Industries Served"
            title="Financial support shaped around operational complexity, regulatory demands, and sector-specific reporting needs."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {industries.map((industry) => {
              const Icon = industryIcons[industry.title] || Briefcase;

              return (
                <div
                  key={industry.title}
                  className="rounded-[1.75rem] border border-[#D9E3F4] bg-white p-7 transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <IconBadge icon={Icon} />
                  <div className="text-lg font-semibold text-slate-950">
                    {industry.title}
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {industry.body}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-[#073D7F] text-white">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
            <SectionHeading
              eyebrow="How It Works"
              title="A clean process that reduces friction and builds confidence from the first conversation."
            />

            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {steps.map((step, index) => {
                const Icon = stepIcons[step.title] || Briefcase;

                return (
                  <div
                    key={step.title}
                    className="rounded-[1.75rem] border border-white/10 bg-white/5 p-7"
                  >
                    <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#6491DE] ring-1 ring-white/10">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="text-sm font-semibold text-[#6491DE]">
                      0{index + 1}
                    </div>
                    <div className="mt-4 text-xl font-semibold">
                      {step.title}
                    </div>
                    <p className="mt-3 text-sm leading-7 text-blue-100">
                      {step.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            {testimonials.map((t) => (
              <div
                key={t.company}
                className="flex flex-col justify-between rounded-[1.75rem] bg-[#F1F1F1] p-10 ring-1 ring-[#D9E3F4]"
              >
                <p className="text-xl leading-8 text-slate-700">“{t.text}”</p>

                <div className="mt-8 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#D9E3F4] bg-white p-2">
                      <img
                        src={t.logo}
                        alt={t.company}
                        className="h-full w-full object-contain"
                      />
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-slate-950">
                        {t.company}
                      </div>
                      <div className="text-xs text-slate-500">{t.country}</div>
                    </div>
                  </div>

                  <span className="rounded-full border border-[#D9E3F4] bg-white px-3 py-1 text-xs text-slate-700">
                    {t.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-[#D9E3F4] bg-white">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
            <div className="grid gap-8 rounded-[2rem] bg-[#073D7F] px-8 py-10 text-white lg:grid-cols-[1fr_auto] lg:items-center lg:px-10">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                  Email subscription
                </div>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight">
                  Stay informed with practical finance, payroll, and compliance
                  insights.
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-8 text-blue-100">
                  Subscribe to receive clear, practical insights on accounting,
                  tax compliance, payroll, and financial strategy.
                </p>
              </div>

              <form
                onSubmit={handleSubscription}
                className="grid gap-3 sm:grid-cols-[1fr_auto] lg:min-w-[420px]"
              >
                <input
                  type="email"
                  value={subscriptionEmail}
                  onChange={(e) => setSubscriptionEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="rounded-full border border-white/10 bg-white px-5 py-3 text-sm text-slate-900 outline-none"
                />

                <button
                  type="submit"
                  disabled={subscriptionStatus === "loading"}
                  className="rounded-full bg-[#6491DE] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4F7FD1] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {subscriptionStatus === "loading"
                    ? "Connecting..."
                    : "Subscribe"}
                </button>

                {subscriptionMessage ? (
                  <div className="sm:col-span-2 rounded-2xl bg-white/10 px-4 py-3 text-sm leading-7 text-blue-100">
                    {subscriptionMessage}
                  </div>
                ) : null}
              </form>
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-br from-[#F1F1F1] via-white to-[#F1F1F1]">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
            <div>
              <SectionHeading
                eyebrow="Book a Consultation"
                title="Gain financial clarity. Make better decisions. Scale with confidence."
                body="Schedule a focused consultation to assess your financial structure, reporting gaps, and growth priorities. Select a time below to begin a structured discussion built around your business."
              />
            </div>

            <div className="rounded-[2rem] bg-white p-5 shadow-xl ring-1 ring-[#D9E3F4]">
              <div className="overflow-hidden rounded-[1.5rem] border border-[#D9E3F4] bg-[#F1F1F1]">
                <iframe
                  src="https://calendar.app.google/Ph7DtaeNiKSBq7B69"
                  title="Book a consultation with Kiamina Accounting Services"
                  className="h-[560px] w-full"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="fixed bottom-5 right-5 z-40 hidden flex-col gap-3 lg:flex">
        {socialLinks.map((social) => (
          <SocialBadge key={social.name} href={social.href} name={social.name} />
        ))}
      </div>

          </div>
  );
}