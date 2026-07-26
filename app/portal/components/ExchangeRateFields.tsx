"use client";

export default function ExchangeRateFields({
  exchangeRate,
  setExchangeRate,
  exchangeRateDate,
  setExchangeRateDate,
  exchangeRateSource,
  setExchangeRateSource,
  exchangeRateIsLocked,
  setExchangeRateIsLocked,
}: {
  exchangeRate: string;
  setExchangeRate: (value: string) => void;
  exchangeRateDate: string;
  setExchangeRateDate: (value: string) => void;
  exchangeRateSource: string;
  setExchangeRateSource: (value: string) => void;
  exchangeRateIsLocked: boolean;
  setExchangeRateIsLocked: (value: boolean) => void;
}) {
  return (
    <>
      <label className="block">
        <span className="text-sm font-semibold text-slate-700">
          Exchange rate
        </span>
        <input
          type="number"
          step="0.000001"
          value={exchangeRate}
          onChange={(event) => setExchangeRate(event.target.value)}
          placeholder="1"
          className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
        />
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Use 1 when the transaction currency is the same as the organisation
          base currency.
        </p>
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-slate-700">
          Exchange rate date
        </span>
        <input
          type="date"
          value={exchangeRateDate}
          onChange={(event) => setExchangeRateDate(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
        />
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Usually the invoice date, bill date, receipt date, payment date, or
          transaction date.
        </p>
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-slate-700">
          Exchange rate source
        </span>
        <select
          value={exchangeRateSource}
          onChange={(event) => setExchangeRateSource(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-[#D9E3F4] px-4 py-3 text-sm outline-none focus:border-[#073D7F]"
        >
          <option value="">Select source</option>
          <option value="MANUAL">Manual / Client-provided</option>
          <option value="CENTRAL_BANK">Central Bank / Official Source</option>
          <option value="COMMERCIAL_BANK">Commercial Bank Rate</option>
          <option value="PAYMENT_PROCESSOR">Payment Processor Rate</option>
          <option value="FX_PLATFORM">FX Platform Rate</option>
          <option value="OTHER">Other</option>
        </select>
      </label>

      <label className="flex items-start gap-3 rounded-2xl border border-[#D9E3F4] bg-[#F8FAFC] p-4">
        <input
          type="checkbox"
          checked={exchangeRateIsLocked}
          onChange={(event) => setExchangeRateIsLocked(event.target.checked)}
          className="mt-1"
        />
        <span>
          <span className="block text-sm font-semibold text-slate-700">
            Lock exchange rate
          </span>
          <span className="mt-1 block text-xs leading-5 text-slate-500">
            Use this when the rate has been reviewed or agreed and should not be
            changed casually.
          </span>
        </span>
      </label>
    </>
  );
}