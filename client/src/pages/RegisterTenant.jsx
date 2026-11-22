import { useState } from "react";
import { ArrowRight, Building2, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function RegisterTenant() {
  const { registerTenant, sessionError } = useAuth();
  const navigate = useNavigate();
  const [fields, setFields] = useState({ fullName: "", tenantName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await registerTenant(fields);
      navigate("/", { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-slate-950 px-4 py-10 text-slate-100">
      <div className="pointer-events-none absolute -right-32 -top-24 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      <section className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900/90 p-7 shadow-2xl shadow-black/30 sm:p-9">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-300"><ShieldCheck size={23} /></span>
          <div>
            <p className="font-extrabold tracking-tight text-white">Ledger<span className="text-emerald-400">Guard</span></p>
            <p className="mt-0.5 text-xs text-slate-500">Create an organization workspace</p>
          </div>
        </div>
        <div className="mb-6">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-400">Workspace setup</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white">Start with your team</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">You’ll be the organization administrator. You can add workspace roles later.</p>
        </div>

        <form className="space-y-4" onSubmit={submit}>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-300" htmlFor="register-full-name">Your name</label>
            <input className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10" id="register-full-name" autoComplete="name" maxLength="120" value={fields.fullName} onChange={(event) => setFields({ ...fields, fullName: event.target.value })} required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-300" htmlFor="register-tenant-name">Workspace name</label>
            <div className="relative">
              <Building2 className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
              <input className="w-full rounded-xl border border-slate-700 bg-slate-950/70 py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10" id="register-tenant-name" maxLength="100" value={fields.tenantName} onChange={(event) => setFields({ ...fields, tenantName: event.target.value })} required />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-300" htmlFor="register-email">Email</label>
            <input className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10" id="register-email" type="email" autoComplete="email" maxLength="254" value={fields.email} onChange={(event) => setFields({ ...fields, email: event.target.value })} required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-300" htmlFor="register-password">Password</label>
            <input className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10" id="register-password" type="password" autoComplete="new-password" minLength="8" maxLength="72" value={fields.password} onChange={(event) => setFields({ ...fields, password: event.target.value })} required />
            <span className="mt-1.5 block text-xs text-slate-500">Use at least 8 characters (up to 72 UTF-8 bytes).</span>
          </div>
          {(error || sessionError) && <p className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-3.5 py-3 text-sm text-rose-200" role="alert">{error || sessionError}</p>}
          <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-60" type="submit" disabled={busy}>
            {busy ? "Creating workspace…" : "Create workspace"}<ArrowRight size={17} />
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">Already have an account? <Link className="font-bold text-emerald-300 hover:text-emerald-200" to="/login">Sign in</Link></p>
      </section>
    </main>
  );
}
