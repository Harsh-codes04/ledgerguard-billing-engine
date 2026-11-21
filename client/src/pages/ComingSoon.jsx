import { Construction } from "lucide-react";
import { useLocation } from "react-router-dom";

export default function ComingSoon() {
  const location = useLocation();
  const section = location.pathname.split("/").filter(Boolean).at(-1)?.replaceAll("-", " ") || "section";

  return (
    <section className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm sm:px-10">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-600"><Construction size={25} /></span>
      <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.18em] text-cyan-700">Roadmap milestone</p>
      <h1 className="mt-2 text-2xl font-extrabold capitalize tracking-tight text-slate-900">{section}</h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">This area is a navigation placeholder for a later build day. No billing or cryptographic behavior is wired here yet.</p>
    </section>
  );
}
