import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Activity,
  Boxes,
  FileClock,
  LayoutDashboard,
  LogOut,
  LockKeyhole,
  Menu,
  ReceiptText,
  ShieldCheck,
  UsersRound,
  Webhook,
  X,
} from "lucide-react";
import VaultModal from "./VaultModal.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useVault } from "../context/VaultContext.jsx";

const navigation = [
  { label: "Overview", to: "/", icon: LayoutDashboard, end: true },
  { label: "Customers", to: "/customers", icon: UsersRound },
  { label: "Plans & Metering", to: "/plans", icon: Boxes },
  { label: "Invoices", to: "/invoices", icon: ReceiptText },
  { label: "Webhooks", to: "/webhooks", icon: Webhook },
  { label: "Audit Ledger", to: "/audit", icon: FileClock },
];

export default function Layout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [vaultModalOpen, setVaultModalOpen] = useState(false);
  const { user, tenant, logout } = useAuth();
  const { isUnlocked, lockVault } = useVault();
  const navigate = useNavigate();

  async function handleLogout() {
    lockVault();
    try {
      await logout();
    } catch {
      // Clear the local session view even if the API is temporarily unreachable.
    }
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 lg:flex">
      {mobileNavOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <aside className={`${mobileNavOpen ? "fixed" : "hidden"} inset-y-0 left-0 z-50 flex h-screen w-72 shrink-0 flex-col bg-slate-950 text-slate-200 lg:sticky lg:top-0 lg:z-auto lg:flex lg:w-64`}>
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <Link className="text-xl font-extrabold tracking-tight text-white" to="/">
            Ledger<span className="text-cyan-400">Guard</span>
          </Link>
          <button className="rounded-lg p-2 text-slate-400 hover:bg-white/10 lg:hidden" type="button" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="px-5 pb-3 pt-6 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Workspace</div>
        <nav className="flex-1 space-y-1 px-3" aria-label="Main navigation">
          {navigation.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMobileNavOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${isActive ? "bg-cyan-500/15 text-cyan-300 ring-1 ring-inset ring-cyan-400/20" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
            >
              <Icon size={18} strokeWidth={1.9} />
              <span>{label}</span>
              {label === "Overview" && <Activity className="ml-auto text-cyan-400" size={15} />}
            </NavLink>
          ))}
        </nav>

        <div className="m-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <LockKeyhole size={14} /> Privacy status
          </div>
          <p className="text-sm font-semibold text-white">{isUnlocked ? "Vault unlocked" : "Vault locked"}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Keys stay in memory; billing records are not encrypted yet.</p>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex min-h-20 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-7 lg:px-10">
          <div className="flex items-center gap-3">
            <button className="rounded-lg border border-slate-200 p-2 text-slate-600 lg:hidden" type="button" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}>
              <Menu size={20} />
            </button>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">LedgerGuard console</p>
              <p className="mt-1 text-sm font-bold text-slate-800">Workspace overview</p>
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="hidden min-w-0 text-right md:block">
              <p className="max-w-44 truncate text-sm font-bold text-slate-800">{user?.fullName}</p>
              <p className="max-w-44 truncate text-xs text-slate-500">{tenant?.name} · {tenant?.planTier}</p>
            </div>
            <span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-extrabold text-emerald-800 sm:inline-flex">{user?.role}</span>
            <button
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold transition ${isUnlocked ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}
              type="button"
              onClick={() => setVaultModalOpen(true)}
              aria-expanded={vaultModalOpen}
            >
              {isUnlocked ? <ShieldCheck size={14} /> : <LockKeyhole size={14} />}
              <span className="hidden sm:inline">Zero-Knowledge Vault:</span> {isUnlocked ? "Unlocked" : "Locked"}
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700" type="button" onClick={handleLogout} title="Sign out">
              <LogOut size={16} /><span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2.5 sm:px-7 md:hidden">
          <div className="min-w-0">
            <p className="truncate text-xs font-extrabold text-slate-800">{tenant?.name} <span className="font-medium text-slate-500">· {tenant?.planTier}</span></p>
            <p className="mt-0.5 truncate text-xs text-slate-500">{user?.fullName}</p>
          </div>
          <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[10px] font-extrabold text-emerald-800">{user?.role}</span>
        </div>

        <main className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-7 sm:py-9 lg:px-10">
          <Outlet />
        </main>
        <footer className="border-t border-slate-200 px-6 py-5 text-center text-xs text-slate-400">
          Browser-side vault ready · Billing records are not yet connected to encryption
        </footer>
      </div>
      <VaultModal open={vaultModalOpen} onClose={() => setVaultModalOpen(false)} />
    </div>
  );
}
