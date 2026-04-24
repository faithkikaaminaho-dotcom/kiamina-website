"use client";

import React, { useMemo, useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
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
  LogIn,
  Rocket,
  Users,
  CalendarDays,
} from "lucide-react";

export default function KiaminaAccountingWebsite() {
  const [activePage, setActivePage] = useState("home");
  const [subscriptionEmail, setSubscriptionEmail] = useState("");
  const [subscriptionStatus, setSubscriptionStatus] = useState("idle");
  const [subscriptionMessage, setSubscriptionMessage] = useState("");
  const [selectedInsight, setSelectedInsight] = useState(null);

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
        "Preview mode: your Mailchimp-ready form is styled and working in the website preview. The live API connection should be added in your local Next.js project using a secure server route."
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
      intro:
        "Structured bookkeeping is the operating layer behind reliable reporting, clean compliance, and better decision-making.",
      bullets: [
        "Monthly bookkeeping workflows with disciplined close processes",
        "Chart of accounts aligned with reporting needs",
        "Transaction classification and reconciliation",
      ],
    },
    {
      title: "Payroll Processing",
      slug: "payroll-processing",
      problem:
        "Manual or poorly managed payroll creates compliance risks, errors, and employee dissatisfaction.",
      outcome:
        "Accurate, timely, and compliant payroll that builds trust and meets statutory requirements.",
      fit: "Businesses and nonprofits with employees requiring structured payroll management.",
      intro:
        "Payroll processing ensures employees are paid accurately while maintaining compliance and proper documentation.",
      bullets: [
        "End-to-end payroll processing and payslip generation",
        "PAYE, pension, and statutory deductions",
        "Compliance with Nigerian payroll regulations",
      ],
    },
    {
      title: "Financial Reporting",
      slug: "financial-reporting",
      problem:
        "Delayed or unclear reporting makes timely decision-making difficult.",
      outcome: "Decision-ready reports that show performance clearly.",
      fit: "Executives who need visibility without chasing numbers.",
      intro:
        "Financial reporting should clarify performance, risk, and priorities.",
      bullets: [
        "Monthly financial statements",
        "Management-ready reporting",
        "Structured reporting support",
      ],
    },
    {
      title: "Management Reporting",
      slug: "management-reporting",
      problem: "Data exists, but not in a form leaders can act on quickly.",
      outcome: "Clear insight into trends and performance drivers.",
      fit: "CEOs, founders, and decision-makers.",
      intro:
        "Management reporting translates financial data into actionable insight.",
      bullets: [
        "Performance reporting",
        "Trend and variance analysis",
        "Executive-ready formats",
      ],
    },
    {
      title: "Accounts Receivable & Payable",
      slug: "receivables-payables",
      problem: "Weak payables and receivables control disrupts liquidity.",
      outcome: "Improved cash flow and financial discipline.",
      fit: "Businesses handling recurring transactions.",
      intro:
        "Cash discipline depends on structured receivables and payables management.",
      bullets: [
        "Receivables tracking",
        "Payables scheduling",
        "Cash cycle management",
      ],
    },
    {
      title: "CFO Consulting",
      slug: "cfo-consulting",
      problem:
        "Growing organizations need strategic finance support without full-time CFO cost.",
      outcome: "Executive-level financial insight for better decisions.",
      fit: "Growth-stage businesses and nonprofits.",
      intro: "CFO consulting provides leadership-level financial guidance.",
      bullets: [
        "Strategic financial oversight",
        "Decision support",
        "Financial structure advisory",
      ],
    },
    {
      title: "Financial Modelling",
      slug: "financial-modelling",
      problem:
        "Lack of structured projections limits planning and investment decisions.",
      outcome: "Clear financial projections for growth and planning.",
      fit: "Businesses and nonprofits planning expansion or funding.",
      intro:
        "Financial modelling supports planning, forecasting, and investment decisions.",
      bullets: [
        "Forecasting and projections",
        "Scenario analysis",
        "Investment modelling",
      ],
    },
    {
      title: "Tax Compliance",
      slug: "tax-compliance",
      problem: "Regulatory complexity creates exposure and penalties.",
      outcome: "Structured compliance and reduced risk.",
      fit: "Organizations operating under regulatory requirements.",
      intro: "Tax compliance should be controlled and predictable.",
      bullets: [
        "Tax filings and reporting",
        "Regulatory compliance",
        "Risk reduction",
      ],
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

  const insights = [
    {
      slug: "costly-accounting-mistakes-nigerian-smes",
      title: "5 Costly Accounting Mistakes Nigerian SMEs Make",
      category: "SME Accounting",
      readTime: "6 min read",
      summary:
        "Avoidable accounting errors can weaken cash flow, distort reporting, create compliance risk, and limit growth. This resource outlines five common mistakes and how SMEs can fix them.",
      sections: [
        {
          heading: "Introduction",
          body: "Many SMEs in Nigeria struggle not because of poor products or services, but because of common accounting errors. Neglecting accounting can create serious cash flow problems, penalties, and missed opportunities for growth and investment. This guide outlines five common mistakes and practical ways to avoid them.",
        },
        {
          heading: "Mistake 1: Mixing Personal and Business Finances",
          body: "Always maintain a separate business bank account. Mixing personal and business transactions leads to disorganized records, distorted profit calculations, and unnecessary difficulty during tax reporting.",
        },
        {
          heading: "Mistake 2: Not Keeping Proper Financial Records",
          body: "Accurate records are the foundation of reliable reporting and informed decision-making.",
          bullets: [
            "Maintain receipts, invoices, and bank statements in an organized manner.",
            "Use digital bookkeeping tools to improve consistency and save time.",
            "Ensure transactions are properly categorized and documented.",
          ],
        },
        {
          heading: "Mistake 3: Ignoring Tax Compliance",
          body: "Tax compliance is non-negotiable. Missed obligations can result in penalties, disruption, and avoidable legal exposure.",
          bullets: [
            "File and pay all applicable taxes on time, including PAYE, VAT, withholding tax, and company or personal income tax where relevant.",
            "Stay current with changes in tax law and reporting requirements.",
            "Seek professional guidance where complexity exists.",
          ],
        },
        {
          heading: "Mistake 4: Failing to Reconcile Accounts",
          body: "Regular bank reconciliation ensures that transactions are properly captured and that records align with bank activity. Missing reconciliations can hide fraud, accounting errors, or cash shortages.",
        },
        {
          heading: "Mistake 5: Neglecting Management Reporting",
          body: "Monthly management reports help track revenue, expenses, profitability, and performance trends. Without them, decision-making becomes reactive and imprecise.",
        },
        {
          heading: "How to Fix These Mistakes",
          bullets: [
            "Set up a proper bookkeeping system.",
            "Automate accounting processes where practical to reduce manual errors and improve efficiency.",
            "Work with a trusted accounting partner like Kiamina Accounting Services to strengthen compliance and financial management.",
          ],
        },
        {
          heading: "Checklist for SMEs",
          bullets: [
            "Separate business and personal accounts",
            "Maintain organized financial records",
            "File all taxes on time",
            "Reconcile bank statements monthly",
            "Review monthly financial reports",
          ],
        },
      ],
      cta: "Do not let accounting mistakes hold your business back. Kiamina Accounting Services helps SMEs stay compliant, organized, and profitable. Book a free consultation today.",
    },
    {
      slug: "fund-reporting-mistakes-nonprofits",
      title: "5 Critical Fund Reporting Mistakes Nonprofits Must Avoid",
      category: "Nonprofit Finance",
      readTime: "6 min read",
      summary:
        "Maintain transparency and donor trust by avoiding common fund reporting errors. This guide outlines five critical mistakes and how nonprofits can correct them.",
      sections: [
        {
          heading: "Introduction",
          body: "Nonprofits rely on diverse funding streams including grants, donations, membership fees, and government allocations. Accurate fund reporting is essential for transparency, compliance, and donor trust.",
        },
        {
          heading: "Mistake 1: Failing to Separate Funds by Purpose",
          body: "Each fund or grant should have its own reporting structure. Mixing funds makes accurate reporting difficult and risks misuse.",
          bullets: ["Use fund codes to track each funding source and purpose."],
        },
        {
          heading: "Mistake 2: Not Tracking Restricted vs. Unrestricted Funds",
          body: "Restricted funds must only be used for designated purposes, while unrestricted funds support general operations. Misuse can lead to donor and legal issues.",
        },
        {
          heading: "Mistake 3: Late or Inaccurate Grant Reporting",
          body: "Grants often require periodic reporting. Delays or inaccuracies can affect future funding.",
          bullets: [
            "Maintain a reporting calendar.",
            "Document all expenditures clearly.",
          ],
        },
        {
          heading: "Mistake 4: Ignoring Internal Controls",
          body: "Weak approval processes increase risk of error and fraud.",
          bullets: [
            "Implement dual approvals.",
            "Maintain supporting documentation.",
            "Reconcile accounts monthly.",
          ],
        },
        {
          heading: "Mistake 5: Not Reconciling Accounts Regularly",
          body: "Regular reconciliation ensures accuracy of fund balances and prevents hidden discrepancies.",
        },
        {
          heading: "Best Practices",
          bullets: [
            "Maintain fund codes.",
            "Use nonprofit accounting software.",
            "Train staff on fund restrictions.",
            "Conduct regular internal reviews.",
            "Provide transparent reporting to stakeholders.",
          ],
        },
        {
          heading: "Checklist for Nonprofits",
          bullets: [
            "Separate funds by purpose",
            "Track restricted vs. unrestricted funds",
            "Meet all reporting deadlines",
            "Maintain strong internal controls",
            "Reconcile accounts monthly",
          ],
        },
      ],
      cta: "Proper fund reporting protects your nonprofit and builds donor confidence. Kiamina Accounting Services helps nonprofits stay compliant, organized, and transparent. Book a free consultation today.",
    },
    {
      slug: "payroll-guide-nigeria",
      title: "Payroll Made Simple: A Step-by-Step Guide for Nigerian SMEs and Nonprofits",
      category: "Payroll & Compliance",
      readTime: "8 min read",
      summary:
        "A practical step-by-step guide to setting up and managing compliant payroll in Nigeria, covering employee records, deductions, statutory obligations, and common payroll mistakes.",
      sections: [
        {
          heading: "Introduction",
          body: "Payroll is a critical function for any Nigerian SME or nonprofit. Accurate and timely payroll processing supports employee satisfaction, legal compliance, and financial stability.",
        },
        {
          heading: "Step 1: Set Up Employee Records",
          body: "Comprehensive employee records are the foundation of accurate payroll. Maintain full employee details including salary, bank information, pension details, tax identification, address, attendance, and leave records.",
        },
        {
          heading: "Step 2: Calculate Gross Pay",
          body: "Gross pay includes basic salary, allowances, and overtime pay where applicable. Each element should be consistently documented and calculated according to employment terms and labour rules.",
        },
        {
          heading: "Step 3: Deduct Employee Contributions and Taxes",
          body: "Apply payroll deductions accurately, including PAYE tax, pension contributions, and any other lawful deductions relevant to the employee.",
          bullets: [
            "Use current tax tables and statutory rules.",
            "Remit all deductions on time to avoid penalties.",
          ],
        },
        {
          heading: "Step 4: Deduct Employee Disciplinary Fines",
          body: "Where disciplinary fines apply, follow due process, maintain documentation, and ensure the employee is aware before any deduction is made.",
        },
        {
          heading: "Step 5: Generate Pay Slips",
          body: "Each payslip should clearly show gross pay, deductions, net pay, pay period, and employer details. Payroll records should be retained accurately for statutory and operational purposes.",
        },
        {
          heading: "Step 6: Payroll Compliance",
          body: "Payroll compliance includes registration with relevant authorities, timely remittances, annual returns, minimum wage compliance, and retention of payroll records.",
        },
        {
          heading: "Step 7: Handle Promotions and Bonuses",
          body: "Promotions and bonuses should be reflected correctly in payroll records and taxed appropriately. All related changes should be documented and communicated clearly.",
        },
        {
          heading: "Common Payroll Mistakes Organisations Make",
          bullets: [
            "Misclassifying employees",
            "Incorrect tax calculations",
            "Late remittances",
            "Poor record-keeping",
            "Ignoring changes in legislation",
          ],
        },
        {
          heading: "Tips to Streamline Payroll",
          bullets: [
            "Automate payroll where possible.",
            "Centralize employee data.",
            "Set clear payroll, leave, and overtime policies.",
            "Audit payroll regularly.",
            "Seek expert advice when needed.",
          ],
        },
      ],
      cta: "Kiamina Accounting Services offers payroll management and consultation support to help SMEs and nonprofits streamline payroll, ensure compliance, and save time. Book a free consultation today.",
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

  const pages = useMemo(
    () => [
      { key: "home", label: "Home" },
      { key: "about", label: "About" },
      { key: "services", label: "Services" },
      { key: "industries", label: "Industries" },
      { key: "insights", label: "Insights" },
      { key: "career", label: "Career" },
      { key: "contact", label: "Contact" },
    ],
    []
  );

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

  const serviceIcons = {
    bookkeeping: BookOpen,
    "payroll-processing": Wallet,
    "financial-reporting": FileText,
    "management-reporting": BarChart3,
    "receivables-payables": Briefcase,
    "cfo-consulting": Users,
    "financial-modelling": LineChart,
    "tax-compliance": ShieldCheck,
  };

  const industryIcons = {
    "Oil & Gas": Building2,
    "Real Estate": Building2,
    ICT: Laptop,
    Construction: Hammer,
    Nonprofits: Landmark,
    "Other Service Organizations": Briefcase,
  };

  const differentiatorIcons = {
    "Strategic, not clerical": Search,
    "Multi-country capability": Globe2,
    "Precision by design": ShieldCheck,
    "Sector-aware delivery": Briefcase,
  };

  const stepIcons = {
    "Book Consultation": CalendarDays,
    "Financial Assessment": Search,
    "Strategy & Execution": Rocket,
    "Ongoing Reporting & Advisory": LineChart,
  };

  const openPage = (page: string) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const PageButton = ({
  pageKey,
  children,
}: {
  pageKey: string;
  children: React.ReactNode;
}) => (
    <button
      type="button"
      onClick={() => openPage(pageKey)}
      className={`transition duration-200 rounded-full px-4 py-2 text-sm font-medium ${
        activePage === pageKey
          ? "bg-[#073D7F] text-white"
          : "text-[#073D7F] hover:bg-[#F1F1F1] hover:text-[#073D7F]"
      }`}
    >
      {children}
    </button>
  );

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
      {body ? <p className="mt-5 text-lg leading-8 text-slate-600">{body}</p> : null}
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

  const SocialBadge = ({ href, name }) => (
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

  const Footer = () => (
   <footer className="border-t border-[#D9E3F4] bg-white">
     <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[1fr_auto] lg:px-8">
       <div>
         <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#073D7F]">
           Kiamina Accounting Services
         </div>
         <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">
           Nigeria-based accounting and advisory firm providing structured financial operations, reporting clarity, and strategic support to clients across Nigeria, Canada, United States, United Kingdom, Australia, and Ireland.
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
           <button
             type="button"
             onClick={() => openPage("privacy")}
             className="text-[#073D7F] transition hover:text-[#6491DE]"
           >
             Privacy Statement
           </button>
           <button
             type="button"
             onClick={() => openPage("legal")}
             className="text-[#073D7F] transition hover:text-[#6491DE]"
           >
             Legal Statement
           </button>
         </div>
       </div>

       <div className="text-sm text-slate-600 space-y-3">
         <div className="flex items-start gap-3">
           <Mail className="h-4 w-4 mt-1 text-[#6491DE]" />
           <span>info@kiaminaaccounting.com</span>
         </div>
         <div className="flex items-start gap-3">
           <Phone className="h-4 w-4 mt-1 text-[#6491DE]" />
           <span>+234 906 494 2073</span>
         </div>
         <div className="flex items-start gap-3">
           <MapPin className="h-4 w-4 mt-1 text-[#6491DE]" />
           <span>10 Akpunonu Street, Rumuodumaya, Port Harcourt, Rivers, Nigeria, 500102</span>
         </div>
       </div>
     </div>
   </footer>
 );

  const HomePage = () => (
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
              Serving businesses and nonprofits across Nigeria, Canada, United States, United Kingdom, Australia, and Ireland
            </div>

            <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Financial clarity that strengthens control, improves decisions, and supports scalable growth.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100">
              CFO-level insight, structured financial systems, and decision-ready reporting for businesses and nonprofits that expect more than routine accounting.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <button
                type="button"
                onClick={() => openPage("contact")}
                className="rounded-full bg-[#6491DE] px-7 py-3.5 text-center text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#4F7FD1]"
              >
                Book a Consultation
              </button>
              <button
                type="button"
                onClick={() => openPage("services")}
                className="rounded-full border border-white/20 px-7 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-white/5"
              >
                View Services
              </button>
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
                  <div className="text-sm text-slate-500">Reporting standard</div>
                  <div className="mt-2 text-2xl font-semibold">
                    Decision-ready monthly reporting
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-[#F1F1F1] p-5">
                    <div className="text-sm text-slate-500">Delivery model</div>
                    <div className="mt-2 text-lg font-semibold">Remote across 6 countries</div>
                  </div>
                  <div className="rounded-2xl bg-[#F1F1F1] p-5">
                    <div className="text-sm text-slate-500">Strategic value</div>
                    <div className="mt-2 text-lg font-semibold">CFO-level guidance</div>
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
                <h3 className="text-xl font-semibold text-slate-950">{service.title}</h3>
                <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
                  <p>
                    <span className="font-semibold text-slate-900">Problem:</span> {service.problem}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">Outcome:</span> {service.outcome}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">Best suited for:</span> {service.fit}
                  </p>
                </div>
              </div>
            );
          })}
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
                    <h3 className="text-lg font-semibold text-slate-950">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{item.body}</p>
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
                className="rounded-[1.75rem] border border-[#D9E3F4] p-7 transition hover:-translate-y-1 hover:shadow-lg bg-white"
              >
                <IconBadge icon={Icon} />
                <div className="text-lg font-semibold text-slate-950">{industry.title}</div>
                <p className="mt-3 text-sm leading-7 text-slate-600">{industry.body}</p>
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
                  <div className="text-sm font-semibold text-[#6491DE]">0{index + 1}</div>
                  <div className="mt-4 text-xl font-semibold">{step.title}</div>
                  <p className="mt-3 text-sm leading-7 text-blue-100">{step.body}</p>
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
              className="rounded-[1.75rem] bg-[#F1F1F1] p-10 ring-1 ring-[#D9E3F4] flex flex-col justify-between"
>
              <p className="text-xl leading-8 text-slate-700">“{t.text}”</p>

              <div className="mt-8 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {t.logo ? (
                    <div className="h-12 w-12 flex items-center justify-center rounded-xl border border-[#D9E3F4] bg-white p-2">
                      <img
                        src={t.logo}
                        alt={t.company}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#073D7F] text-sm font-semibold text-white">
                      {t.company
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                  )}

                  <div>
                    <div className="text-sm font-semibold text-slate-950">
                      {t.company}
                    </div>
                    <div className="text-xs text-slate-500">
                      {t.country}
                    </div>
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
                Stay informed with practical finance, payroll, and compliance insights.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-blue-100">
                Subscribe to receive clear, practical insights on accounting, tax compliance,
                payroll, and financial strategy - designed to help businesses and nonprofits
                operate with confidence and make better financial decisions.
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
                {subscriptionStatus === "loading" ? "Connecting..." : "Subscribe"}
              </button>
              {subscriptionMessage ? (
                <div
                  className={`sm:col-span-2 rounded-2xl px-4 py-3 text-sm leading-7 ${
                    subscriptionStatus === "success"
                      ? "bg-white/10 text-blue-100"
                      : subscriptionStatus === "error"
                      ? "bg-white/10 text-red-200"
                      : "bg-white/10 text-blue-100"
                  }`}
                >
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
  );

  const AboutPage = () => (
    <main>
      <section className="bg-[#073D7F] py-24 text-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">About Kiamina</div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              A Nigeria-based accounting and advisory firm built for business leaders who need more than basic compliance.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-100">
              Kiamina Accounting Services combines financial accuracy, reporting clarity, and strategic finance support for companies operating across multiple jurisdictions. The firm works remotely across Nigeria, Canada, United States, United Kingdom, Australia, and Ireland.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <img
          src="/about.png"
          alt="About Kiamina Accounting Services"
          className="mb-10 h-[360px] w-full rounded-[2rem] object-cover"
        />

        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Our Mission
            </div>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              To empower businesses and nonprofits with accurate accounting systems, compliant tax structures, and strategic financial insight that support long term growth, transparency, and accountability.
            </p>

            <div className="mt-10 text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Our Vision
            </div>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              To redefine accounting and financial advisory as a strategic growth engine for businesses and mission-driven organizations worldwide.
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#D9E3F4] bg-[#F1F1F1] p-8">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Core Values
            </div>
            <ul className="mt-6 space-y-4 text-sm leading-7 text-slate-600">
              <li><span className="font-semibold text-slate-900">Accuracy:</span> Precision in financial reporting and data integrity underpins every engagement, supporting both businesses and nonprofits.</li>
              <li><span className="font-semibold text-slate-900">Integrity:</span> We operate with uncompromising ethical standards and transparent accountability, supporting both businesses and nonprofits.</li>
              <li><span className="font-semibold text-slate-900">Compliance:</span> Strict adherence to statutory, regulatory, and professional requirements across all jurisdictions, supporting both businesses and nonprofits.</li>
              <li><span className="font-semibold text-slate-900">Partnership:</span> Long-term client relationships built on trust, alignment, and shared objectives, supporting both businesses and nonprofits.</li>
              <li><span className="font-semibold text-slate-900">Continuous Improvement:</span> Ongoing refinement of processes, systems, and expertise in response to evolving environments, supporting both businesses and nonprofits.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-[#F1F1F1]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <SectionHeading
            eyebrow="Why clients choose Kiamina"
            title="Built for executives who value control, precision, and professional execution."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {differentiators.map((item) => {
              const Icon = differentiatorIcons[item.title] || Briefcase;
              return (
                <div key={item.title} className="rounded-[1.75rem] bg-white p-7 ring-1 ring-[#D9E3F4] shadow-sm">
                  <IconBadge icon={Icon} />
                  <h3 className="text-lg font-semibold text-slate-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );

  const ServicesPage = () => (
    <main>
      <section className="relative overflow-hidden bg-[#073D7F] py-24 text-white">
        <div className="absolute inset-0">
          <img
            src="/services.png"
            alt="Professional accounting services"
            className="h-full w-full object-cover opacity-25"
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Services
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Accounting, reporting, compliance, and strategic finance support designed for serious businesses.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-100">
              Each capability is designed to improve financial visibility, strengthen control, and support better leadership decisions.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-8">
          {services.map((service) => {
            const Icon = serviceIcons[service.slug] || Briefcase;
            return (
              <div key={service.slug} className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm lg:p-10">
                <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
                  <div>
                    <IconBadge icon={Icon} />
                    <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">{service.title}</div>
                    <p className="mt-4 text-lg leading-8 text-slate-600">{service.intro}</p>
                  </div>
                  <div>
                    <div className="grid gap-5 md:grid-cols-3">
                      <div className="rounded-2xl bg-[#F1F1F1] p-5">
                        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Problem</div>
                        <p className="mt-3 text-sm leading-7 text-slate-700">{service.problem}</p>
                      </div>
                      <div className="rounded-2xl bg-[#F1F1F1] p-5">
                        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Outcome</div>
                        <p className="mt-3 text-sm leading-7 text-slate-700">{service.outcome}</p>
                      </div>
                      <div className="rounded-2xl bg-[#F1F1F1] p-5">
                        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Best suited for</div>
                        <p className="mt-3 text-sm leading-7 text-slate-700">{service.fit}</p>
                      </div>
                    </div>
                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                      {service.bullets.map((bullet) => (
                        <div key={bullet} className="rounded-2xl border border-[#D9E3F4] p-5 text-sm leading-7 text-slate-600">
                          {bullet}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );

  const IndustriesPage = () => (
    <main>
      <section className="relative overflow-hidden bg-[#073D7F] py-24 text-white">
        <div className="absolute inset-0">
          <img
            src="/industries.png"
            alt="Industry-focused financial support"
            className="h-full w-full object-cover opacity-25"
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Industries
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Industry-aware financial support for organizations with real operational complexity.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-100">
              Kiamina supports companies and organizations whose reporting, compliance, and financial control needs require more than generic accounting support.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {industries.map((industry) => {
            const Icon = industryIcons[industry.title] || Briefcase;
            return (
              <div key={industry.title} className="rounded-[1.75rem] border border-[#D9E3F4] bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <IconBadge icon={Icon} />
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">Sector</div>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">{industry.title}</h2>
                <p className="mt-4 text-sm leading-7 text-slate-600">{industry.body}</p>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );

  const InsightsPage = () => {
    const insight = selectedInsight || insights[0];
    const featured = insights[0];
    const secondary = insights.slice(1);

    return (
      <main>
        <section className="relative overflow-hidden bg-[#073D7F] py-24 text-white">
          <div className="absolute inset-0">
            <img
              src="/insights.png"
              alt="Financial insights and publications"
              className="h-full w-full object-cover opacity-20"
            />
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(100,145,222,0.18),transparent_30%),radial-gradient(circle_at_left,rgba(255,255,255,0.06),transparent_22%)]" />
          <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
            <div className="max-w-5xl">
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
                Insights
              </div>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                Financial insight for leaders, operators, and mission-driven organizations.
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-100">
                A curated resource library covering accounting, reporting, payroll, compliance, and financial decision-making for businesses and nonprofits operating in complex environments.
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-[#D9E3F4] bg-white">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
              <button
                type="button"
                onClick={() => setSelectedInsight(featured)}
                className="group rounded-[2rem] border border-[#D9E3F4] bg-[#073D7F] p-8 text-left text-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#6491DE]">
                  Featured Insight
                </div>
                <div className="mt-6 text-sm font-semibold uppercase tracking-[0.22em] text-blue-100">{featured.category}</div>
                <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight">{featured.title}</h2>
                <p className="mt-5 max-w-2xl text-base leading-8 text-blue-100">{featured.summary}</p>
                <div className="mt-6 text-sm text-blue-200">{featured.readTime}</div>
              </button>

              <div className="grid gap-5">
                {secondary.map((item) => (
                  <button
                    key={item.slug}
                    type="button"
                    onClick={() => setSelectedInsight(item)}
                    className={`rounded-[1.75rem] border p-6 text-left transition duration-300 hover:-translate-y-1 hover:shadow-lg ${
                      insight.slug === item.slug
                        ? "border-[#073D7F] bg-[#073D7F] text-white shadow-lg"
                        : "border-[#D9E3F4] bg-white text-slate-900"
                    }`}
                  >
                    <div className={`text-xs font-semibold uppercase tracking-[0.22em] ${insight.slug === item.slug ? "text-[#6491DE]" : "text-[#6491DE]"}`}>
                      {item.category}
                    </div>
                    <h3 className="mt-3 text-xl font-semibold leading-tight">{item.title}</h3>
                    <p className={`mt-3 text-sm leading-7 ${insight.slug === item.slug ? "text-blue-100" : "text-slate-600"}`}>
                      {item.summary}
                    </p>
                    <div className={`mt-4 text-xs ${insight.slug === item.slug ? "text-blue-200" : "text-slate-500"}`}>
                      {item.readTime}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#F1F1F1]">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.34fr_0.66fr] lg:items-start">
              <aside className="space-y-6 lg:sticky lg:top-28">
                <div className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
                  <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">Resource Library</div>
                  <div className="mt-6 space-y-4">
                    {insights.map((item) => (
                      <button
                        key={item.slug}
                        type="button"
                        onClick={() => setSelectedInsight(item)}
                        className={`w-full rounded-[1.25rem] border p-5 text-left transition duration-300 ${
                          insight.slug === item.slug
                            ? "border-[#073D7F] bg-[#073D7F] text-white shadow-md"
                            : "border-[#D9E3F4] bg-[#F1F1F1] text-slate-900 hover:bg-white hover:shadow-sm"
                        }`}
                      >
                        <div className={`text-xs font-semibold uppercase tracking-[0.2em] ${insight.slug === item.slug ? "text-[#6491DE]" : "text-slate-500"}`}>
                          {item.category}
                        </div>
                        <div className="mt-2 text-base font-semibold leading-7">{item.title}</div>
                        <div className={`mt-2 text-xs ${insight.slug === item.slug ? "text-blue-200" : "text-slate-500"}`}>
                          {item.readTime}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
                  <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">Why this matters</div>
                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    These publications are designed to help decision-makers strengthen financial control, reduce compliance risk, and improve reporting quality across both businesses and nonprofits.
                  </p>
                </div>
              </aside>

              <article className="overflow-hidden rounded-[2.25rem] border border-[#D9E3F4] bg-white shadow-sm">
                <div className="border-b border-[#D9E3F4] bg-[#073D7F] px-8 py-10 text-white lg:px-10 lg:py-12">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#6491DE]">
                      {insight.category}
                    </div>
                    <div className="text-xs text-blue-200">{insight.readTime}</div>
                  </div>
                  <h2 className="mt-5 max-w-4xl text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                    {insight.title}
                  </h2>
                  <p className="mt-5 max-w-3xl text-lg leading-8 text-blue-100">{insight.summary}</p>
                </div>

                <div className="grid gap-10 px-8 py-10 lg:grid-cols-[0.24fr_0.76fr] lg:px-10 lg:py-12">
                  <div className="space-y-8">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Publication focus</div>
                      <div className="mt-3 text-sm leading-7 text-slate-700">Practical guidance for financial operations, compliance discipline, and management decision-making.</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Audience</div>
                      <div className="mt-3 text-sm leading-7 text-slate-700">Founders, executives, finance leads, administrators, and nonprofit decision-makers.</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Use</div>
                      <div className="mt-3 text-sm leading-7 text-slate-700">Use this insight to strengthen internal finance processes and reduce operational risk.</div>
                    </div>
                  </div>

                  <div className="space-y-10">
                    {insight.sections.map((section, index) => (
                      <section key={section.heading} className="border-b border-slate-100 pb-10 last:border-b-0 last:pb-0">
                        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6491DE]">Section {index + 1}</div>
                        <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{section.heading}</h3>
                        {section.body ? <p className="mt-4 text-base leading-8 text-slate-600">{section.body}</p> : null}
                        {section.bullets ? (
                          <ul className="mt-5 space-y-4 text-base leading-8 text-slate-600">
                            {section.bullets.map((bullet) => (
                              <li key={bullet} className="flex gap-4">
                                <span className="mt-3 h-1.5 w-1.5 rounded-full bg-[#6491DE]" />
                                <span>{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </section>
                    ))}

                    <div className="rounded-[1.75rem] bg-[#073D7F] p-8 text-white">
                      <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">Take Action</div>
                      <p className="mt-4 text-base leading-8 text-blue-100">{insight.cta}</p>
                      <button type="button" onClick={() => openPage("contact")} className="mt-6 inline-flex items-center rounded-full bg-[#6491DE] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4F7FD1]">
                        Book a Free Consultation
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>
      </main>
    );
  };

  const ContactPage = () => (
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
              Start with a focused consultation built around your reporting, control, and growth priorities.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-100">
              For founders, CEOs, CFOs, and decision-makers looking for serious accounting and advisory support, the next step is a structured conversation.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
        <div className="space-y-8">
          <div className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Contact details
            </div>
            <div className="mt-6 space-y-5 text-sm leading-7 text-slate-600">
              <p><span className="font-semibold text-slate-900">Email:</span> info@kiaminaaccounting.com</p>
              <p><span className="font-semibold text-slate-900">Phone:</span> +234 906 494 2073</p>
              <p><span className="font-semibold text-slate-900">Head office:</span> 10 Akpunonu Street, Rumuodumaya, Port Harcourt, Rivers, Nigeria, 500102</p>
              <p><span className="font-semibold text-slate-900">Active markets:</span> Nigeria, Canada, United States, United Kingdom, Australia, and Ireland</p>
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

          <div className="rounded-[2rem] border border-[#D9E3F4] bg-[#F1F1F1] p-8 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">Subscribe for insights</div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
              Receive accounting, compliance, payroll, and reporting insights by email.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Stay ahead with practical accounting, tax, and financial management insights tailored for businesses and nonprofits. Join our mailing list to receive clear, actionable guidance that supports better decisions and long-term growth.
            </p>
            <form onSubmit={handleSubscription} className="mt-6 space-y-4">
              <div>
                <label htmlFor="subscriber-name" className="mb-2 block text-sm font-medium text-slate-700">Full name</label>
                <input
                  id="subscriber-name"
                  type="text"
                  placeholder="Enter your name"
                  className="w-full rounded-xl border border-[#D9E3F4] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#073D7F]"
                />
              </div>
              <div>
                <label htmlFor="subscriber-email" className="mb-2 block text-sm font-medium text-slate-700">Email address</label>
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
                {subscriptionStatus === "loading" ? "Connecting..." : "Subscribe"}
              </button>
              {subscriptionMessage ? (
                <div className={`rounded-xl px-4 py-3 text-sm leading-7 ${subscriptionStatus === "success" ? "bg-emerald-50 text-emerald-700" : subscriptionStatus === "error" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"}`}>
                  {subscriptionMessage}
                </div>
              ) : null}
            </form>
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-5 shadow-xl ring-1 ring-[#D9E3F4]">
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

  const CareerPage = () => (
    <main>
      <section className="relative overflow-hidden bg-[#073D7F] py-24 text-white">
        <div className="absolute inset-0">
          <img
            src="/career.png"
            alt="Careers at Kiamina Accounting Services"
            className="h-full w-full object-cover opacity-20"
          />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(100,145,222,0.16),transparent_28%),radial-gradient(circle_at_left,rgba(255,255,255,0.06),transparent_20%)]" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Career
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Build your career with a firm focused on precision, integrity, and growth.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-100">
              We are building a high-standard accounting and advisory practice designed to support businesses and nonprofits with clarity, compliance, and strategic financial insight.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <img
          src="/career.png"
          alt="Career opportunities at Kiamina"
          className="mb-10 h-[320px] w-full rounded-[2rem] object-cover"
        />

        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm">
            <IconBadge icon={Users} />
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Why Join Kiamina
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
              A growing environment for professionals who value excellence.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              At Kiamina Accounting Services, we believe strong careers are built on technical excellence, continuous improvement, and meaningful client impact.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                "Exposure to real client challenges",
                "Professional and ethical work culture",
                "Growth-oriented environment",
                "Opportunities to build specialist expertise",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[1.25rem] border border-[#D9E3F4] bg-[#F1F1F1] p-4 text-sm leading-7 text-slate-700"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#D9E3F4] bg-[#F1F1F1] p-8 shadow-sm">
            <IconBadge icon={Briefcase} />
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Current Openings
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
              No vacancies at the moment.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              We do not have any active openings right now. When opportunities become available, they will be published here with full role details and application instructions.
            </p>

            <div className="mt-8 rounded-[1.5rem] border border-dashed border-[#D9E3F4] bg-white p-8">
              <div className="text-lg font-semibold text-slate-950">Please check back later.</div>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                You can also follow Kiamina Accounting Services for future announcements and career updates.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );

  const SignInPage = () => (
    <main>
      <section className="relative overflow-hidden bg-[#073D7F] py-24 text-white">
        <div className="absolute inset-0">
          <img
            src="/signin.png"
            alt="Sign in to Kiamina Accounting Services"
            className="h-full w-full object-cover opacity-20"
          />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(100,145,222,0.16),transparent_28%),radial-gradient(circle_at_left,rgba(255,255,255,0.06),transparent_20%)]" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Sign In
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Secure client access coming soon.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-100">
              This area is reserved for future client access, secure document collaboration, and account-based services.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <img
          src="/signin.png"
          alt="Client sign in preview"
          className="mb-10 h-[320px] w-full rounded-[2rem] object-cover"
        />

        <div className="rounded-[2rem] border border-[#D9E3F4] bg-white p-10 shadow-sm">
          <IconBadge icon={LogIn} />
          <div className="max-w-2xl">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Coming Soon
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
              Client sign-in experience in development.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              Authentication, dashboards, and document access can be added here later.
            </p>
          </div>
          <div className="mt-10 min-h-[220px] rounded-[1.5rem] border border-dashed border-[#D9E3F4] bg-[#F1F1F1]" />
        </div>
      </section>
    </main>
  );

  const GetStartedPage = () => (
    <main>
      <section className="relative overflow-hidden bg-[#073D7F] py-24 text-white">
        <div className="absolute inset-0">
          <img
            src="/get-started.png"
            alt="Get started with Kiamina Accounting Services"
            className="h-full w-full object-cover opacity-20"
          />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(100,145,222,0.16),transparent_28%),radial-gradient(circle_at_left,rgba(255,255,255,0.06),transparent_20%)]" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Get Started
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              A dedicated onboarding experience will live here.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-100">
              This page is reserved for future onboarding, discovery questions, service selection, and lead qualification.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <img
          src="/get-started.png"
          alt="Get started onboarding preview"
          className="mb-10 h-[320px] w-full rounded-[2rem] object-cover"
        />

        <div className="rounded-[2rem] border border-[#D9E3F4] bg-white p-10 shadow-sm">
          <IconBadge icon={Rocket} />
          <div className="max-w-2xl">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Coming Soon
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
              Structured intake and onboarding flow.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              For now, this page is intentionally empty in terms of functionality, but styled to fit the rest of the site.
            </p>
          </div>
          <div className="mt-10 min-h-[220px] rounded-[1.5rem] border border-dashed border-[#D9E3F4] bg-[#F1F1F1]" />
        </div>
      </section>
    </main>
  );

 const PrivacyPage = () => (
   <main>
     <section className="relative overflow-hidden bg-[#073D7F] py-24 text-white">
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(100,145,222,0.16),transparent_28%),radial-gradient(circle_at_left,rgba(255,255,255,0.06),transparent_20%)]" />
       <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
         <div className="max-w-4xl">
           <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
             Privacy Statement
           </div>
           <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
             Privacy and data handling at Kiamina Accounting Services.
           </h1>
           <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-100">
             We are committed to protecting personal and business information shared with us through our website, communications, and service relationships.
           </p>
         </div>
       </div>
     </section>
  
     <section className="mx-auto max-w-5xl px-6 py-20 lg:px-8">
       <div className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm lg:p-10">
         <div className="space-y-10 text-slate-600">
           <div>
             <h2 className="text-2xl font-semibold text-slate-950">1. Information we collect</h2>
             <p className="mt-4 leading-8">
               We may collect personal and business information that you provide directly, including your name, email address, phone number, company details, and any information submitted through consultation, contact, or subscription forms.
             </p>
           </div>
 
           <div>
             <h2 className="text-2xl font-semibold text-slate-950">2. How we use information</h2>
             <p className="mt-4 leading-8">
               We use submitted information to respond to enquiries, provide requested services, communicate updates, manage client relationships, improve service delivery, and maintain internal records.
             </p>
           </div>

           <div>
             <h2 className="text-2xl font-semibold text-slate-950">3. Confidentiality</h2>
             <p className="mt-4 leading-8">
               We treat client and prospective client information with care and take reasonable steps to protect confidential financial, operational, and personal data shared with us.
             </p>
           </div>

           <div>
             <h2 className="text-2xl font-semibold text-slate-950">4. Data sharing</h2>
             <p className="mt-4 leading-8">
               We do not sell personal information. Information may be shared only where necessary for service delivery, compliance, professional obligations, lawful requests, or approved third-party tools supporting our operations.
             </p>
           </div>

           <div>
             <h2 className="text-2xl font-semibold text-slate-950">5. Data security</h2>
             <p className="mt-4 leading-8">
               We apply reasonable administrative, technical, and operational safeguards to help protect information against unauthorized access, misuse, alteration, or disclosure.
             </p>
           </div>

           <div>
             <h2 className="text-2xl font-semibold text-slate-950">6. Third-party tools</h2>
             <p className="mt-4 leading-8">
               Our website may use third-party platforms for scheduling, subscriptions, analytics, communications, or embedded services. Those providers may process data in line with their own privacy terms.
             </p>
           </div>

           <div>
             <h2 className="text-2xl font-semibold text-slate-950">7. Your choices</h2>
             <p className="mt-4 leading-8">
               You may contact us to update information you have submitted, ask questions about how your information is used, or request removal from marketing communications where applicable.
             </p>
           </div>

           <div>
             <h2 className="text-2xl font-semibold text-slate-950">8. Contact</h2>
             <p className="mt-4 leading-8">
               For privacy-related questions, please contact Kiamina Accounting Services at info@kiaminaaccounting.com.
             </p>
           </div>
          </div>
       </div>
     </section>
   </main>
 );

 const LegalPage = () => (
   <main>
     <section className="relative overflow-hidden bg-[#073D7F] py-24 text-white">
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(100,145,222,0.16),transparent_28%),radial-gradient(circle_at_left,rgba(255,255,255,0.06),transparent_20%)]" />
       <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
         <div className="max-w-4xl">
           <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
             Legal Statement
           </div>
           <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
             Terms, use, and general legal information.
           </h1>
           <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-100">
             This website is provided for general information about Kiamina Accounting Services, our capabilities, and our professional service offering.
           </p>
         </div>
       </div>
     </section>
 
     <section className="mx-auto max-w-5xl px-6 py-20 lg:px-8">
       <div className="rounded-[2rem] border border-[#D9E3F4] bg-white p-8 shadow-sm lg:p-10">
         <div className="space-y-10 text-slate-600">
           <div>
             <h2 className="text-2xl font-semibold text-slate-950">1. General information only</h2>
             <p className="mt-4 leading-8">
               Content on this website is for general information purposes only and does not constitute legal, tax, audit, investment, or other regulated professional advice unless formally agreed in writing as part of a client engagement.
             </p>
           </div>

           <div>
             <h2 className="text-2xl font-semibold text-slate-950">2. No client relationship by website use</h2>
             <p className="mt-4 leading-8">
               Accessing this website, sending a message, booking a consultation, or subscribing to updates does not by itself create a client, advisory, or fiduciary relationship.
             </p>
           </div>

           <div>
             <h2 className="text-2xl font-semibold text-slate-950">3. Professional engagement</h2>
             <p className="mt-4 leading-8">
               Services are provided only under a formal engagement, scope, or service agreement defining responsibilities, deliverables, limitations, timelines, and applicable fees.
             </p>
           </div>

           <div>
             <h2 className="text-2xl font-semibold text-slate-950">4. Accuracy and updates</h2>
             <p className="mt-4 leading-8">
               We make reasonable efforts to keep website information accurate and current, but we do not guarantee completeness, accuracy, or uninterrupted availability at all times.
             </p>
           </div>

           <div>
             <h2 className="text-2xl font-semibold text-slate-950">5. Third-party links and tools</h2>
             <p className="mt-4 leading-8">
               This website may contain links to or integrations with third-party platforms and services. We are not responsible for the content, availability, or practices of those external providers.
             </p>
           </div>

           <div>
             <h2 className="text-2xl font-semibold text-slate-950">6. Limitation of reliance</h2>
             <p className="mt-4 leading-8">
               Users should not rely solely on website content when making financial, tax, business, compliance, or operational decisions. Independent professional advice should be obtained where required.
             </p>
           </div>

           <div>
             <h2 className="text-2xl font-semibold text-slate-950">7. Intellectual property</h2>
             <p className="mt-4 leading-8">
               Website content, structure, branding, and original materials presented by Kiamina Accounting Services remain protected and may not be copied or reused inappropriately without permission.
             </p>
           </div>

           <div>
             <h2 className="text-2xl font-semibold text-slate-950">8. Contact</h2>
             <p className="mt-4 leading-8">
               For legal or website-related enquiries, please contact info@kiaminaaccounting.com.
             </p>
           </div>
         </div>
       </div>
     </section>
   </main>
 );

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-50 border-b border-[#D9E3F4]/70 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/75">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 transition-all duration-300 lg:px-8">
          <button type="button" onClick={() => openPage("home")} className="group flex items-center gap-3 text-left">
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
              <div className="text-sm text-slate-500">Strategic accounting and advisory</div>
            </div>
          </button>

          <div className="hidden items-center gap-3 lg:flex">
            <nav className="flex items-center rounded-full border border-[#D9E3F4] bg-white/90 p-1.5 shadow-sm">
              {pages.map((page) => (
                <PageButton key={page.key} pageKey={page.key}>
                  {page.label}
                </PageButton>
              ))}
            </nav>

            <button
              type="button"
              onClick={() => openPage("signin")}
              className="inline-flex items-center rounded-full border border-[#D9E3F4] bg-white px-5 py-3 text-sm font-semibold text-[#073D7F] shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => openPage("get-started")}
              className="inline-flex items-center rounded-full border border-[#D9E3F4] bg-white px-5 py-3 text-sm font-semibold text-[#073D7F] shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg"
            >
              Get Started
            </button>
            <button
              type="button"
              onClick={() => openPage("contact")}
              className="inline-flex items-center rounded-full bg-[#073D7F] px-5 py-3 text-sm font-semibold text-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg"
            >
              Book a Consultation
            </button>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => openPage("signin")}
              className="inline-flex items-center rounded-full border border-[#D9E3F4] bg-white px-4 py-2.5 text-sm font-semibold text-[#073D7F] shadow-sm"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => openPage("get-started")}
              className="inline-flex items-center rounded-full border border-[#D9E3F4] bg-white px-4 py-2.5 text-sm font-semibold text-[#073D7F] shadow-sm"
            >
              Start
            </button>
          </div>
        </div>
      </header>

      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 h-24 bg-gradient-to-b from-white/35 to-transparent" />

      {activePage === "home" && <HomePage />}
      {activePage === "about" && <AboutPage />}
      {activePage === "services" && <ServicesPage />}
      {activePage === "industries" && <IndustriesPage />}
      {activePage === "insights" && <InsightsPage />}
      {activePage === "career" && <CareerPage />}
      {activePage === "contact" && <ContactPage />}
      {activePage === "signin" && <SignInPage />}
      {activePage === "get-started" && <GetStartedPage />}
      {activePage === "privacy" && <PrivacyPage />}
      {activePage === "legal" && <LegalPage />}

      <div className="fixed bottom-5 right-5 z-40 hidden flex-col gap-3 lg:flex">
        {socialLinks.map((social) => (
          <SocialBadge
            key={social.name}
            href={social.href}
            name={social.name}
          />
        ))}
      </div>

      <Footer />
    </div>
  );
}