"use client";

import { useState } from "react";

export default function SignInPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [status, setStatus] = useState("idle");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setStatus("error");
      return;
    }

    // Simulated login (replace with real auth later)
    setStatus("loading");

    setTimeout(() => {
      setStatus("success");
      setFormData({ email: "", password: "" });
    }, 1000);
  };

  return (
    <main>
      <section className="bg-[#073D7F] py-24 text-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6491DE]">
              Sign In
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Access your secure client portal
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-100">
              Sign in to manage your financial reports, documents, and communications securely.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-md px-6 py-20 lg:px-8">
        <div className="rounded-[2rem] border border-[#D9E3F4] bg-white p-10 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
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
              <div className="text-sm text-green-600">
                Login successful (demo mode).
              </div>
            )}

            {status === "error" && (
              <div className="text-sm text-red-600">
                Please enter your email and password.
              </div>
            )}

            <div className="text-center text-sm text-slate-500">
              Forgot password? Contact support.
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}