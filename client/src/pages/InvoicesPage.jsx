import { useEffect, useState } from "react";
import { ReceiptText } from "lucide-react";
import { apiRequest } from "../api.js";
import BillingPanel from "../components/BillingPanel.jsx";

export default function InvoicesPage() {
  const [data, setData] = useState({ customers: [], plans: [], invoices: [] });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      apiRequest("/api/customers", { signal: controller.signal }),
      apiRequest("/api/plans", { signal: controller.signal }),
      apiRequest("/api/invoices", { signal: controller.signal }),
    ])
      .then(([customers, plans, invoices]) => {
        setData({ customers: customers.customers, plans: plans.plans, invoices: invoices.invoices });
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  return (
    <div className="space-y-7">
      <section className="flex items-end gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-700"><ReceiptText size={22} /></span>
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Usage to payment</p><h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">Invoices</h1><p className="mt-1 text-sm text-slate-500">Record usage, prepare a draft, and track what has been paid.</p></div>
      </section>
      {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{error}</p>}
      {loading ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Loading billing data…</div> : (
        <BillingPanel
          customers={data.customers}
          plans={data.plans}
          invoices={data.invoices}
          onInvoicesChanged={(invoices) => setData((current) => ({ ...current, invoices }))}
        />
      )}
    </div>
  );
}
