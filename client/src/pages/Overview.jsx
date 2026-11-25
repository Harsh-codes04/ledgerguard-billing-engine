import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Boxes, Plus, ReceiptText, RefreshCw, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import { apiRequest } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { formatMoney } from "../format.js";

function MetricCard({ label, value, note, icon: Icon, tint }) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_26px_rgba(15,23,42,0.035)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">{value}</p></div>
        <span className={`grid h-11 w-11 place-items-center rounded-2xl ${tint}`}><Icon size={20} /></span>
      </div>
      <p className="mt-4 text-xs text-slate-400">{note}</p>
    </article>
  );
}

function statusClass(status) {
  if (status === "paid") return "bg-emerald-50 text-emerald-700";
  if (status === "sent") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

export default function Overview() {
  const { user, tenant } = useAuth();
  const [summary, setSummary] = useState({ customers: [], plans: [], invoices: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    Promise.all([
      apiRequest("/api/customers", { signal: controller.signal }),
      apiRequest("/api/plans", { signal: controller.signal }),
      apiRequest("/api/invoices", { signal: controller.signal }),
    ])
      .then(([customers, plans, invoices]) => {
        setSummary({ customers: customers.customers, plans: plans.plans, invoices: invoices.invoices });
        setError("");
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [refreshKey]);

  const totals = useMemo(() => {
    const paid = summary.invoices.filter((invoice) => invoice.status === "paid");
    const open = summary.invoices.filter((invoice) => invoice.status !== "paid");
    return {
      paidAmount: paid.reduce((sum, invoice) => sum + invoice.totalPaise, 0),
      openAmount: open.reduce((sum, invoice) => sum + invoice.totalPaise, 0),
      openCount: open.length,
    };
  }, [summary.invoices]);

  const checklist = [
    { done: summary.customers.length > 0, label: "Add your first customer", to: "/customers" },
    { done: summary.plans.length > 0, label: "Set up a billing plan", to: "/plans" },
    { done: summary.invoices.length > 0, label: "Create your first invoice", to: "/invoices" },
  ];
  const completedCount = checklist.filter((item) => item.done).length;
  const recentInvoices = [...summary.invoices].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  return (
    <div className="space-y-7 sm:space-y-8">
      <section className="relative overflow-hidden rounded-[26px] bg-[#14263b] px-6 py-7 text-white shadow-[0_18px_45px_rgba(15,37,61,0.13)] sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -right-10 -top-24 h-72 w-72 rounded-full bg-teal-300/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[11px] font-bold text-teal-100">
              {tenant?.planTier || "STARTER"} workspace <span className="h-1 w-1 rounded-full bg-teal-300" /> {tenant?.name || "LedgerGuard"}
            </div>
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-[2.15rem]">Welcome back, {user?.fullName?.split(" ")[0] || "there"}</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">Here’s a clear view of your customers, plans, and invoices.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/customers" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-300 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-teal-200"><Plus size={16} /> Add customer</Link>
            <button type="button" onClick={() => setRefreshKey((key) => key + 1)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.07] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.12]" aria-label="Refresh workspace summary"><RefreshCw size={15} /> Refresh</button>
          </div>
        </div>
      </section>

      {error && <div className="flex flex-col justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:flex-row sm:items-center"><span>{error}</span><button className="font-bold underline underline-offset-2" type="button" onClick={() => setRefreshKey((key) => key + 1)}>Try again</button></div>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Workspace summary">
        <MetricCard label="Customers" value={loading ? "—" : summary.customers.length} note="People and teams in this workspace" icon={UsersRound} tint="bg-teal-50 text-teal-700" />
        <MetricCard label="Billing plans" value={loading ? "—" : summary.plans.length} note="Rates ready for usage tracking" icon={Boxes} tint="bg-indigo-50 text-indigo-700" />
        <MetricCard label="Open invoices" value={loading ? "—" : totals.openCount} note={loading ? "Loading totals" : `${formatMoney(totals.openAmount)} still outstanding`} icon={ArrowUpRight} tint="bg-amber-50 text-amber-700" />
        <MetricCard label="Collected" value={loading ? "—" : formatMoney(totals.paidAmount)} note="Invoices marked paid" icon={ArrowDownRight} tint="bg-emerald-50 text-emerald-700" />
      </section>

      <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.8fr)]">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Latest activity</p><h2 className="mt-1.5 text-lg font-bold text-slate-900">Recent invoices</h2></div>
            <Link to="/invoices" className="inline-flex items-center gap-1 text-sm font-bold text-teal-700 hover:text-teal-800">View all <ArrowRight size={15} /></Link>
          </div>
          {loading ? <p className="py-12 text-center text-sm text-slate-500">Loading invoices…</p> : recentInvoices.length ? (
            <div className="mt-5 divide-y divide-slate-100">
              {recentInvoices.map((invoice) => (
                <div key={invoice._id} className="flex flex-wrap items-center gap-3 py-4 first:pt-1 last:pb-1">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-slate-500"><ReceiptText size={18} /></span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-800">{invoice.customerNameSnapshot}</p><p className="mt-1 text-xs text-slate-500">{invoice.period} · {invoice.lineItems?.length || 0} line items</p></div>
                  <div className="ml-auto flex items-center gap-3"><strong className="text-sm text-slate-800">{formatMoney(invoice.totalPaise)}</strong><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${statusClass(invoice.status)}`}>{invoice.status}</span></div>
                </div>
              ))}
            </div>
          ) : <div className="py-12 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 text-slate-400"><ReceiptText size={21} /></span><p className="mt-4 text-sm font-semibold text-slate-700">No invoices yet</p><p className="mt-1 text-sm text-slate-500">Once you record usage, your invoices will show here.</p><Link to="/invoices" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-teal-700">Go to billing <ArrowRight size={15} /></Link></div>}
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Getting started</p><h2 className="mt-1.5 text-lg font-bold text-slate-900">Your first billing cycle</h2></div><span className="rounded-full bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800">{completedCount}/3</span></div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${(completedCount / checklist.length) * 100}%` }} /></div>
          <div className="mt-4 space-y-1">
            {checklist.map((item, index) => (
              <Link key={item.label} to={item.to} className="group flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-slate-50">
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${item.done ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-500"}`}>{item.done ? "✓" : index + 1}</span>
                <span className={`flex-1 text-sm font-semibold ${item.done ? "text-slate-400 line-through" : "text-slate-700"}`}>{item.label}</span>
                {!item.done && <ArrowRight size={15} className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-teal-700" />}
              </Link>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
