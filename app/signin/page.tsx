"use client";

import { useState } from "react";
import {
  FileText,
  Wallet,
  Building2,
  Users,
  ShieldCheck,
  MessageSquare,
  UploadCloud,
  Lock,
  Database,
  Eye,
  Download,
  FileSpreadsheet,
  History,
  Workflow,
  Brain,
  Cloud,
  UserCog,
} from "lucide-react";

export default function SignInPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [status, setStatus] = useState("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setStatus("error");
      return;
    }

    setStatus("loading");

    setTimeout(() => {
      setStatus("success");
      setFormData({ email: "", password: "" });
    }, 1000);
  };

  const modules = [
    {
      title: "Sales Documentation",
      icon: FileText,
      body: "Submit customer invoices, receipts, revenue records, sales support, and related transaction documents.",
    },
    {
      title: "Purchases Documentation",
      icon: Wallet,
      body: "Upload supplier invoices, vendor bills, expense receipts, procurement files, and purchase documentation.",
    },
    {
      title: "Bank Documentation",
      icon: Building2,
      body: "Submit bank statements, payment confirmations, transfer support, reconciliation files, and bank transaction evidence.",
    },
    {
      title: "Payroll Documentation",
      icon: Users,
      body: "Upload payroll schedules, employee records, statutory deduction support, payslips, and payroll-related files.",
    },
  ];

  const uploadChannels = [
    "Direct platform upload",
    "Email attachment upload",
    "WhatsApp document submission",
    "Google Drive import",
    "OneDrive import",
    "Dropbox import",
    "Kiamina admin upload",
    "Bulk document import",
  ];

  const extractionFeatures = [
    "Document date extraction",
    "Supplier or customer detection",
    "Invoice and receipt reference capture",
    "Amount and currency extraction",
    "Tax or VAT extraction",
    "Description and narration capture",
    "GL account suggestion",
    "Department, class, and location suggestion",
  ];

  const fields = [
    "Transaction Date",
    "Document Reference Number",
    "Platform Reference Number",
    "GL Account",
    "Class",
    "Location",
    "Department",
    "Description",
    "Amount",
    "Currency",
    "Customer / Supplier / Employee",
    "Upload Source",
    "Submitted Via",
    "Original File Name",
    "Source Email Address",
    "Source WhatsApp Number",
    "Connected Storage Provider",
    "Drive Folder Path",
    "Import Batch ID",
    "Received Date",
    "Received Time",
    "Extraction Status",
    "Extracted Transaction Date",
    "Extracted Supplier / Customer",
    "Extracted Amount",
    "Extracted Tax / VAT",
    "Suggested GL Account",
    "Suggested Class",
    "Suggested Location",
    "Suggested Department",
    "Uploader Review Status",
    "Approval Status",
    "Approved By",
    "Approved Date",
    "Rejected By",
    "Rejected Date",
    "Rejection Reason",
    "Processed GL Account",
    "Processed Class",
    "Processed Location",
    "Processed Department",
    "Processing Notes",
    "Processed By",
    "Archived By",
    "Preview Available",
    "Download Available",
    "Export Format",
    "Exported By",
    "Exported Date",
    "Downloaded By",
    "Downloaded Date",
    "Timestamped File Name",
    "Audit Trail",
    "Deletion Control",
  ];

  const internalRoles = [
    {
      title: "Super Admin / Platform Owner",
      body: "Overall platform control across all client workspaces, users, roles, permissions, document workflows, audit logs, deletion overrides, and system settings.",
    },
    {
      title: "Accountant User",
      body: "Reviews documents, updates accounting classifications, adjusts GL accounts, class, location, department, tax treatment, processing notes, and prepares items for processing.",
    },
    {
      title: "Customer Support User",
      body: "Supports clients with upload issues, missing documents, portal guidance, inquiry follow-up, and document status questions.",
    },
    {
      title: "IT / System Admin User",
      body: "Manages technical access, platform configuration, storage connections, security support, and system troubleshooting.",
    },
    {
      title: "Reviewer / Manager User",
      body: "Oversees accountant work, monitors client workspaces, reviews escalations, and supports internal quality control.",
    },
  ];

  const clientRoles = [
    {
      title: "Client Admin User",
      body: "Manages client users, uploads documents, reviews submissions, approves or rejects uploaded transactions, responds to inquiries, and monitors status.",
    },
    {
      title: "Client Approver User",
      body: "Approves or rejects uploaded transactions, adds rejection reasons, and monitors documents requiring approval.",
    },
    {
      title: "Client Standard User",
      body: "Uploads assigned documents, views own submissions, responds to assigned inquiries, and provides supporting information.",
    },
  ];

  const statuses = [
    "Uploaded",
    "Pending Review",
    "Inquiry Raised",
    "Client Responded",
    "Approved",
    "Rejected",
    "Processed",
    "Archived",
  ];

  const auditItems = [
    "Uploaded by and upload date",
    "Received through portal, email, WhatsApp, Drive, OneDrive, or Dropbox",
    "Data extracted by platform",
    "Extracted fields reviewed by uploader",
    "Uploader corrections recorded",
    "Submitted for approver review",
    "Inquiry raised and responded to",
    "Approved by and approval date",
    "Rejected by and rejection reason",
    "Accounting field changed by Accountant User",
    "Accounting field changed by Super Admin",
    "Previous and new values recorded",
    "Processing notes added",
    "Document previewed by and preview date",
    "Downloaded by and download date",
    "Exported by, export format, and export date",
    "Bulk export generated and downloaded",
    "Processed by and processing date",
    "Archived by and archive date",
    "Deleted by Super Admin only",
  ];

  const previewExportItems = [
    "Document preview",
    "Single document download",
    "Bulk ZIP download",
    "Excel export",
    "CSV export",
    "PDF export",
    "Audit log export",
    "Timestamped file names",
  ];

  const processingControls = [
    "GL Account updates",
    "Class updates",
    "Location updates",
    "Department updates",
    "Description updates",
    "Tax/VAT treatment updates",
    "Customer or supplier mapping",
    "Processing notes",
    "Super Admin override",
  ];

  return (
    <main>
      <section className="relative overflow-hidden bg-[#073D7F] py-24 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(100,145,222,0.16),transparent_28%),radial-gradient(circle_at_left,rgba(255,255,255,0.06),transparent_20%)]" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Client Portal
            </div>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Secure document workflow for client accounting collaboration.
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-100">
              Access the Kiamina Client Portal to upload, extract, classify,
              review, approve, export, and manage sales, purchases, bank, and
              payroll documentation in one structured workspace.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                "Role-based access",
                "Automated extraction",
                "Approval workflow",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-blue-100"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white p-8 text-slate-900 shadow-2xl">
            <div className="mb-6 flex items-center gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <div className="text-lg font-semibold text-slate-950">
                  Portal Sign In
                </div>
                <div className="text-sm text-slate-500">
                  Authorized users only
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white transition hover:shadow-lg"
                disabled={status === "loading"}
              >
                {status === "loading" ? "Signing in..." : "Sign In"}
              </button>

              {status === "success" && (
                <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  Login request received. Portal authentication will route users
                  according to their assigned access level.
                </div>
              )}

              {status === "error" && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  Please enter your email and password.
                </div>
              )}

              <div className="text-center text-sm text-slate-500">
                Forgot password? Contact your Kiamina portal administrator.
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="max-w-3xl">
          <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
            Document Modules
          </div>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            First-phase portal modules for structured financial documentation.
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            The portal is designed to organize client submissions before
            accounting processing, review, classification, approval, and inquiry
            resolution.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {modules.map((module) => {
            const Icon = module.icon;

            return (
              <div
                key={module.title}
                className="rounded-[1.75rem] border border-[#D9E3F4] bg-white p-7 shadow-sm"
              >
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-semibold text-slate-950">
                  {module.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {module.body}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-[#F1F1F1]">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Multi-Channel Uploads
            </div>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
              Documents can be received from the portal, email, WhatsApp, and
              cloud storage.
            </h2>

            <p className="mt-5 text-base leading-8 text-slate-600">
              The platform is designed to collect documents through multiple
              channels and route them into the same structured review workflow.
              Whether a file is uploaded directly, emailed, sent through
              WhatsApp, or imported from Google Drive, OneDrive, or Dropbox, it
              can be tracked, extracted, reviewed, approved, and processed.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {uploadChannels.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-[#D9E3F4] bg-white px-5 py-4 text-sm font-semibold text-[#073D7F]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Automated Data Extraction
            </div>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
              Uploaded documents can be read and converted into structured
              transaction data.
            </h2>

            <p className="mt-5 text-base leading-8 text-slate-600">
              The platform is designed to extract key information from uploaded
              documents and populate transaction fields automatically. Users can
              review, correct, and confirm extracted details before submitting
              the document for approval.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {extractionFeatures.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-[#D9E3F4] bg-[#F1F1F1] px-5 py-4 text-sm font-medium text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F1F1F1]">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Structured Data Capture
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
              Capture the information needed to classify, review, approve, and
              process every document.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              Each submitted document can be captured with operational,
              accounting, upload source, extraction, approval, processing,
              preview, download, export, and audit trail fields.
            </p>
          </div>

          <div className="grid max-h-[640px] gap-3 overflow-y-auto pr-2 sm:grid-cols-2">
            {fields.map((field) => (
              <div
                key={field}
                className="rounded-2xl border border-[#D9E3F4] bg-white px-5 py-4 text-sm font-medium text-slate-700"
              >
                {field}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="max-w-3xl">
          <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
            Role-Based Access
          </div>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
            Access levels for Kiamina users, client administrators, approvers,
            and standard users.
          </h2>
        </div>

        <div className="mt-12">
          <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
            Kiamina-side users
          </h3>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {internalRoles.map((role) => (
              <div
                key={role.title}
                className="rounded-[1.75rem] border border-[#D9E3F4] bg-white p-7 shadow-sm"
              >
                <UserCog className="h-6 w-6 text-[#073D7F]" />
                <h4 className="mt-5 text-xl font-semibold text-slate-950">
                  {role.title}
                </h4>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {role.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16">
          <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
            Client-side users
          </h3>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {clientRoles.map((role) => (
              <div
                key={role.title}
                className="rounded-[1.75rem] border border-[#D9E3F4] bg-white p-7 shadow-sm"
              >
                <ShieldCheck className="h-6 w-6 text-[#073D7F]" />
                <h4 className="mt-5 text-xl font-semibold text-slate-950">
                  {role.title}
                </h4>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {role.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="max-w-3xl">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Processing Controls
            </div>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
              Accountant and Super Admin users can update accounting
              classifications during processing.
            </h2>

            <p className="mt-5 text-base leading-8 text-slate-600">
              During processing, authorized Kiamina Accountant Users and Super
              Admin Users can update accounting classification fields such as GL
              account, class, location, department, description, tax treatment,
              and processing notes where professional judgment is required.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {processingControls.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-[#D9E3F4] bg-[#F1F1F1] px-5 py-4 text-sm font-medium text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#073D7F] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Inquiry Management
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">
              Two-way inquiries between Kiamina and client teams.
            </h2>
            <p className="mt-5 text-base leading-8 text-blue-100">
              Inquiries can be raised by Kiamina or by clients, allowing
              clarification requests, document follow-ups, comments, and
              responses to be tracked against the relevant document submission.
            </p>
          </div>

          <div className="grid gap-4">
            {[
              "Kiamina can request missing documents or clarification.",
              "Clients can ask questions about classification or submission requirements.",
              "Inquiries remain connected to the relevant document workflow.",
              "Rejected submissions notify users through the portal and by email.",
            ].map((item) => (
              <div
                key={item}
                className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm leading-7 text-blue-100"
              >
                <MessageSquare className="mt-1 h-5 w-5 shrink-0 text-[#6491DE]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F1F1F1]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="max-w-3xl">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Approval Workflow
            </div>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
              Document statuses are tracked from upload to archive.
            </h2>

            <p className="mt-5 text-base leading-8 text-slate-600">
              Every uploaded document moves through a controlled review
              workflow. Client Admin and Approver users can approve or reject
              uploaded transactions, while Kiamina teams can review, process,
              and manage inquiries.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statuses.map((status) => (
              <div
                key={status}
                className="rounded-2xl border border-[#D9E3F4] bg-white px-5 py-4 text-sm font-semibold text-[#073D7F]"
              >
                {status}
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-[1.75rem] border border-[#D9E3F4] bg-white p-7">
            <h3 className="text-xl font-semibold text-slate-950">
              Approved documents are locked for control.
            </h3>

            <p className="mt-4 text-sm leading-7 text-slate-600">
              Once a document is approved, it cannot be deleted by standard
              users, client administrators, approvers, accountants, support
              users, or IT users. Deletion of approved documents is restricted
              to the Kiamina Super Admin only, and every deletion must be
              recorded in the audit log.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Audit Trail
            </div>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
              Every document action is recorded for accountability.
            </h2>

            <p className="mt-5 text-base leading-8 text-slate-600">
              The portal keeps a document-level audit trail from upload through
              extraction, review, inquiry, approval, rejection, processing,
              preview, download, export, archiving, and restricted deletion.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {auditItems.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-[#D9E3F4] bg-[#F1F1F1] px-5 py-4 text-sm font-medium text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F1F1F1]">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Preview, Download & Export
            </div>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
              Users can preview, download, and export records based on their
              access permissions.
            </h2>

            <p className="mt-5 text-base leading-8 text-slate-600">
              Permitted users can preview documents, download supporting files,
              and export accessible records in Excel, CSV, PDF, ZIP, audit log,
              and transaction register formats. Every download and export is
              timestamped and recorded in the document audit trail.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {previewExportItems.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-[#D9E3F4] bg-white px-5 py-4 text-sm font-semibold text-[#073D7F]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="rounded-[2rem] border border-[#D9E3F4] bg-[#F1F1F1] p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#073D7F]">
                <Database className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">
                Accounting software integration will be introduced in a later
                phase.
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                The current portal phase focuses on multi-channel document
                collection, automated data extraction, uploader review,
                approval workflow, inquiry management, preview, download,
                export, audit trail, and structured processing controls. Direct
                accounting software integration will be added as Kiamina
                continues developing its internal platform.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}