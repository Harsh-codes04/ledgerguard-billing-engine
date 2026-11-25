import { useEffect, useState } from "react";
import { Boxes } from "lucide-react";
import { apiRequest } from "../api.js";
import PlansPanel from "../components/PlansPanel.jsx";

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    apiRequest("/api/plans", { signal: controller.signal })
      .then((data) => setPlans(data.plans))
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  return (
    <div className="space-y-7">
      <section className="flex items-end gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-indigo-700"><Boxes size={22} /></span>
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">Rates and usage</p><h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">Plans & metering</h1><p className="mt-1 text-sm text-slate-500">Set your rates, then record each customer’s monthly usage.</p></div>
      </section>
      {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{error}</p>}
      {loading ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Loading your plans…</div> : (
        <PlansPanel plans={plans} onPlansChanged={setPlans} />
      )}
    </div>
  );
}
