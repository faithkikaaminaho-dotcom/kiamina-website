"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

type TrackingCategory = {
  id: string;
  category_code: string | null;
  category_name: string | null;
  description: string | null;
  is_required: boolean | null;
  is_active: boolean | null;
};

type TrackingOption = {
  id: string;
  tracking_category_id: string;
  option_code: string | null;
  option_name: string | null;
  description: string | null;
  is_active: boolean | null;
};

export default function TrackingOptionsManager({
  organisationId,
  categories,
  options,
}: {
  organisationId: string;
  categories: TrackingCategory[];
  options: TrackingOption[];
}) {
  const router = useRouter();

  const [activeCategoryId, setActiveCategoryId] = useState(
    categories[0]?.id || ""
  );
  const [optionName, setOptionName] = useState("");
  const [optionCode, setOptionCode] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const activeCategory = categories.find(
    (category) => category.id === activeCategoryId
  );

  const activeOptions = options.filter(
    (option) => option.tracking_category_id === activeCategoryId
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activeCategoryId) {
      setErrorMessage("Select a tracking category.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/tracking-options", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organisation_id: organisationId,
          tracking_category_id: activeCategoryId,
          option_code: optionCode || null,
          option_name: optionName,
          description: description || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to create tracking option.");
      }

      setOptionName("");
      setOptionCode("");
      setDescription("");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to create tracking option."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.36fr_0.64fr]">
      <div className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-5">
        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-[#6491DE]">
          Categories
        </div>

        <div className="mt-5 space-y-2">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategoryId(category.id)}
              className={
                category.id === activeCategoryId
                  ? "w-full rounded-2xl bg-[#073D7F] px-4 py-3 text-left text-sm font-semibold text-white"
                  : "w-full rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] px-4 py-3 text-left text-sm font-semibold text-[#073D7F]"
              }
            >
              {category.category_name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <section className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-[#6491DE]">
                {activeCategory?.category_code || "Tracking"}
              </div>

              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                {activeCategory?.category_name || "Tracking Options"}
              </h2>
            </div>

            <div className="rounded-2xl bg-[#F8FAFC] px-4 py-3 text-right">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Options
              </div>
              <div className="mt-1 text-lg font-semibold text-[#073D7F]">
                {activeOptions.length}
              </div>
            </div>
          </div>

          {activeCategory?.description ? (
            <p className="mt-4 text-sm leading-7 text-slate-600">
              {activeCategory.description}
            </p>
          ) : null}

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {activeOptions.length > 0 ? (
              activeOptions.map((option) => (
                <div
                  key={option.id}
                  className="rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold text-slate-950">
                        {option.option_name}
                      </div>

                      {option.option_code ? (
                        <div className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#6491DE]">
                          {option.option_code}
                        </div>
                      ) : null}
                    </div>

                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                      Active
                    </span>
                  </div>

                  {option.description ? (
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {option.description}
                    </p>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-[#D9E3F4] bg-[#F8FAFC] p-5 text-sm text-slate-500 md:col-span-2">
                No options created yet for this category.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-[#D9E3F4] bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F1F1F1] text-[#073D7F]">
              <Plus className="h-5 w-5" />
            </div>

            <div>
              <div className="font-semibold text-slate-950">
                Add Tracking Option
              </div>
              <div className="text-sm text-slate-500">
                Add a department, location, project, cost centre, class, fund,
                grant, or service line.
              </div>
            </div>
          </div>

          {errorMessage ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Category
              </span>
              <select
                value={activeCategoryId}
                onChange={(event) => setActiveCategoryId(event.target.value)}
                required
                className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.category_name}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Option Name
                </span>
                <input
                  value={optionName}
                  onChange={(event) => setOptionName(event.target.value)}
                  required
                  placeholder="Example: Finance, Lagos, Project A"
                  className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Option Code
                </span>
                <input
                  value={optionCode}
                  onChange={(event) => setOptionCode(event.target.value)}
                  placeholder="Example: FIN, LAG, PRJ-A"
                  className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Description
              </span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                placeholder="Optional internal description."
                className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm leading-7 outline-none focus:border-[#073D7F]"
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-[#073D7F] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Add Tracking Option"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}