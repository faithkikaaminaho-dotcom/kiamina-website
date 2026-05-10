"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Lock, ShieldCheck, FileText } from "lucide-react";

export default function SignInPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [status, setStatus] = useState("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setStatus("error");
      return;
    }

    try {
      setStatus("loading");

      const supabase = createClient();

      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        setStatus("error");
        return;
      }

      window.location.href = "/portal";
    } catch {
      setStatus("error");
    }
  };

  return (
    <main>
      <section className="relative overflow-hidden bg-[#073D7F] py-24 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(100,145,222,0.16),transparent_28%),radial-gradient(circle_at_left,rgba(255,255,255,0.06),transparent_20%)]" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Secure Client Portal
            </div>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Sign in to access your protected Kiamina workspace.
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-100">
              Authorized users can securely access client documents, onboarding
              records, approval workflows, inquiries, and accounting
              collaboration tools.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { title: "Secure access", icon: Lock },
                { title: "Role-based controls", icon: ShieldCheck },
                { title: "Document workflows", icon: FileText },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-blue-100"
                  >
                    <Icon className="mb-3 h-5 w-5 text-[#6491DE]" />
                    {item.title}
                  </div>
                );
              })}
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
                className="w-full rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
                disabled={status === "loading"}
              >
                {status === "loading" ? "Signing in..." : "Sign In"}
              </button>

              {status === "error" && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  Invalid email or password. Please try again.
                </div>
              )}

              <div className="text-center text-sm text-slate-500">
                Forgot password? Contact your Kiamina portal administrator.
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}