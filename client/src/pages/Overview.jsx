import { useEffect, useState } from "react";
import { Activity, CircleAlert, Database, Layers3, LockKeyhole, RefreshCw, ShieldCheck } from "lucide-react";
import { pingHealth } from "../services/api.js";

const roadmap = [
  "Foundation and live system health",
  "Tenant isolation and role-based access",
  "Client-side key vault",
  "Encrypted catalog and blind indexes",
  "Subscription plans and usage metering",
  "Invoice commitments and integrity checks",
  "PDF receipts and private share links",
  "Signed payment webhook simulator",
  "Tamper-evident audit ledger",
  "Zero-knowledge analytics and review",
];

const architectureCards = [
  {
    icon: Layers3,
    title: "Multi-tenant foundation",
    detail: "Tenant and user schemas are ready for workspace-scoped records and role assignment.",
    tag: "Day 1 models",
    iconClass: "bg-indigo-50 text-indigo-600",
  },
  {
    icon: LockKeyhole,
    title: "Browser-held encryption",
    detail: "The vault is not active yet. Customer data is not encrypted by this scaffold.",
    tag: "Planned",
    iconClass: "bg-amber-50 text-amber-700",
  },
  {
    icon: ShieldCheck,
    title: "Verifiable billing",
    detail: "Invoice commitments and the append-only ledger will be added in later milestones.",
    tag: "Planned",
    iconClass: "bg-cyan-50 text-cyan-700",
  },
];

function HealthIndicator({ label, state, detail }) {
  const colors = {
    online: "bg-emerald-500",
    offline: "bg-rose-500",
    checking: "bg-amber-400",
  };
  const text = { online: "Connected", offline: "Disconnected", checking: "Checking" };

  return (
    <div className="flex items-start justify-between gap-4 border-t border-slate-100 py-4 first:border-t-0 first:pt-0 last:pb-0">
      <div>
        <p className="font-semibold text-slate-800">{label}</p>
        <p className="mt-1 text-sm text-slate-500">{detail}</p>
      </div>
      <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700">
        <span className={`h-2 w-2 rounded-full ${colors[state]}`} />{text[state]}
      </span>
    </div>
  );
}

export default function Overview() {
  const [health, setHealth] = useState({ backend: "checking", dbConnected: null, timestamp: null, error: "" });
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function refreshHealth() {
      try {
        const result = await pingHealth({ signal: controller.signal });
        if (active) {
          setHealth({ backend: "online", dbConnected: Boolean(result.dbConnected), timestamp: result.timestamp, error: "" });
        }
      } catch (error) {
        if (active && error.name !== "AbortError") {
          setHealth({ backend: "offline", dbConnected: false, timestamp: null, error: error.message });
        }
      }
    }

    refreshHealth();
    const intervalId = window.setInterval(refreshHealth, 30000);
    return () => {
      active = false;
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, [refreshCount]);

  const dbState = health.backend === "offline" ? "offline" : health.dbConnected === null ? "checking" : health.dbConnected ? "online" : "offline";

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-8 text-white shadow-xl shadow-slate-900/10 sm:px-9 sm:py-10">
        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-7 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-cyan-200">
              <Activity size={14} /> Day 1 · Foundation
            </div>
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">System overview</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              A live health check and a transparent view of the LedgerGuard build milestones.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/15 md:self-auto"
            onClick={() => setRefreshCount((count) => count + 1)}
          >
            <RefreshCw size={16} /> Refresh health
          </button>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]" aria-label="System status">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">Live system check</p>
              <h2 className="mt-2 text-xl font-extrabold tracking-tight text-slate-900">Backend & database</h2>
            </div>
            <span className="rounded-xl bg-slate-100 p-3 text-slate-600"><Database size={21} /></span>
          </div>
          <HealthIndicator label="Express API" state={health.backend} detail="GET /api/health" />
          <HealthIndicator label="MongoDB" state={dbState} detail={health.timestamp ? `Last checked ${new Date(health.timestamp).toLocaleTimeString()}` : "Connection reported by the API"} />
          {health.error && <p className="mt-5 flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700"><CircleAlert size={17} /> {health.error}</p>}
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">Build status</p>
          <div className="mt-2 flex items-center justify-between gap-4">
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900">10-day roadmap</h2>
            <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-extrabold text-cyan-800">Day 1 of 10</span>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-[10%] rounded-full bg-cyan-500" /></div>
          <ol className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {roadmap.map((milestone, index) => {
              const current = index === 0;
              return (
                <li key={milestone} className={`min-h-24 rounded-xl border p-3 ${current ? "border-cyan-200 bg-cyan-50" : "border-slate-100 bg-slate-50"}`}>
                  <span className={`mb-2 grid h-6 w-6 place-items-center rounded-full text-xs font-extrabold ${current ? "bg-cyan-600 text-white" : "bg-slate-200 text-slate-600"}`}>{index + 1}</span>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Day {index + 1}{current ? " · Today" : ""}</span>
                  <span className="mt-1 block text-xs font-semibold leading-4 text-slate-700">{milestone}</span>
                </li>
              );
            })}
          </ol>
        </article>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Architecture map</p>
            <h2 className="mt-2 text-xl font-extrabold tracking-tight text-slate-900">Designed for privacy-first billing</h2>
          </div>
          <span className="hidden items-center gap-1.5 text-xs font-semibold text-slate-400 sm:inline-flex"><LockKeyhole size={13} /> Planned protections are not active yet</span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {architectureCards.map(({ icon: Icon, title, detail, tag, iconClass }) => (
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={title}>
              <div className="flex items-start justify-between gap-3">
                <span className={`rounded-xl p-3 ${iconClass}`}><Icon size={20} /></span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">{tag}</span>
              </div>
              <h3 className="mt-4 font-extrabold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
