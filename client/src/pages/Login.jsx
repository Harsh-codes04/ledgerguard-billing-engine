import { useState } from "react";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login, sessionError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [fields, setFields] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(fields);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-slate-950 px-4 py-10 text-slate-100">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      <section className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/90 p-7 shadow-2xl shadow-black/30 sm:p-9">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-300"><ShieldCheck size={23} /></span>
          <div>
            <p className="font-extrabold tracking-tight text-white">Ledger<span className="text-emerald-400">Guard</span></p>
            <p className="mt-0.5 text-xs text-slate-500">Workspace billing console</p>
          </div>
        </div>
        <div className="mb-6">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-400">Welcome back</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white">Sign in to your workspace</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">Use your account email and password to continue.</p>
        </div>

        <form className="space-y-4" onSubmit={submit}>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-300" htmlFor="login-email">Email</label>
            <input className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10" id="login-email" type="email" autoComplete="email" value={fields.email} onChange={(event) => setFields({ ...fields, email: event.target.value })} required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-300" htmlFor="login-password">Password</label>
            <div className="relative">
              <LockKeyhole className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
              <input className="w-full rounded-xl border border-slate-700 bg-slate-950/70 py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10" id="login-password" type="password" autoComplete="current-password" value={fields.password} onChange={(event) => setFields({ ...fields, password: event.target.value })} required />
            </div>
          </div>
          {(error || sessionError) && <p className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-3.5 py-3 text-sm text-rose-200" role="alert">{error || sessionError}</p>}
          <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-60" type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}<ArrowRight size={17} />
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">New to LedgerGuard? <Link className="font-bold text-emerald-300 hover:text-emerald-200" to="/register">Create a workspace</Link></p>
      </section>
    </main>
  );
}
