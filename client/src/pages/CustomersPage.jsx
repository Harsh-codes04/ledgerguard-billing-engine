import { useEffect, useMemo, useState } from "react";
import { Mail, Plus, Search, Trash2, UsersRound } from "lucide-react";
import { apiRequest } from "../api.js";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [fields, setFields] = useState({ name: "", email: "" });
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    apiRequest("/api/customers", { signal: controller.signal })
      .then((data) => setCustomers(data.customers))
      .catch((error) => {
        if (error.name !== "AbortError") setNotice({ type: "error", text: error.message });
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter((customer) => `${customer.name} ${customer.email}`.toLowerCase().includes(query));
  }, [customers, search]);

  async function addCustomer(event) {
    event.preventDefault();
    setNotice(null);
    setSaving(true);
    try {
      const data = await apiRequest("/api/customers", {
        method: "POST",
        body: { name: fields.name, email: fields.email },
      });
      setCustomers((current) => [...current, data.customer].sort((a, b) => a.name.localeCompare(b.name)));
      setFields({ name: "", email: "" });
      setNotice({ type: "success", text: `${data.customer.name} was added to this workspace.` });
    } catch (error) {
      setNotice({ type: "error", text: error.message });
    } finally {
      setSaving(false);
    }
  }

  async function removeCustomer(customer) {
    if (!window.confirm(`Remove ${customer.name} from this workspace?`)) return;
    setNotice(null);
    try {
      await apiRequest(`/api/customers/${customer._id}`, { method: "DELETE" });
      setCustomers((current) => current.filter((item) => item._id !== customer._id));
      setNotice({ type: "success", text: "Customer removed." });
    } catch (error) {
      setNotice({ type: "error", text: error.message });
    }
  }

  return (
    <div className="space-y-7">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Your workspace</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">Customers</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Keep customer contacts together before you start recording usage.</p>
        </div>
        <div className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm sm:self-auto">
          <UsersRound size={17} className="text-teal-700" /> {customers.length} {customers.length === 1 ? "customer" : "customers"}
        </div>
      </section>

      {notice && <p className={`rounded-xl border px-4 py-3 text-sm ${notice.type === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`} role="status">{notice.text}</p>}

      <section className="grid items-start gap-5 xl:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.5fr)]">
        <form className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" onSubmit={addCustomer}>
          <div className="mb-5 grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><Plus size={20} /></div>
          <h2 className="text-lg font-bold text-slate-900">Add a customer</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">Add a name and optional email address.</p>
          <label className="mt-5 block text-sm font-semibold text-slate-700" htmlFor="customer-name">Name</label>
          <input className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" id="customer-name" value={fields.name} onChange={(event) => setFields({ ...fields, name: event.target.value })} maxLength="120" placeholder="e.g. Northstar Studio" required />
          <label className="mt-4 block text-sm font-semibold text-slate-700" htmlFor="customer-email">Email <span className="font-normal text-slate-400">(optional)</span></label>
          <div className="relative mt-1.5">
            <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
            <input className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" id="customer-email" type="email" value={fields.email} onChange={(event) => setFields({ ...fields, email: event.target.value })} maxLength="254" placeholder="name@company.com" />
          </div>
          <button className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60" type="submit" disabled={saving}>
            <Plus size={16} /> {saving ? "Saving…" : "Add customer"}
          </button>
        </form>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Directory</p><h2 className="mt-1 text-lg font-bold text-slate-900">All customers</h2></div>
            <label className="relative block sm:w-64">
              <Search size={16} className="absolute left-3 top-3.5 text-slate-400" />
              <input className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" type="search" placeholder="Search customers" aria-label="Search customers" value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
          </div>

          {loading ? <div className="py-16 text-center text-sm text-slate-500">Loading customers…</div> : filteredCustomers.length ? (
            <div className="mt-5 divide-y divide-slate-100">
              {filteredCustomers.map((customer) => (
                <article key={customer._id} className="flex items-center gap-3 py-4 first:pt-1 last:pb-1">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-teal-50 text-sm font-extrabold text-teal-800">{customer.name.slice(0, 1).toUpperCase()}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-800">{customer.name}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">{customer.email || "No email added"}</p>
                  </div>
                  <button className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600" type="button" onClick={() => removeCustomer(customer)} aria-label={`Remove ${customer.name}`} title="Remove customer"><Trash2 size={16} /></button>
                </article>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 text-slate-400"><UsersRound size={22} /></span>
              <p className="mt-4 font-semibold text-slate-700">{search ? "No matches" : "Your customer list is empty"}</p>
              <p className="mt-1 text-sm text-slate-500">{search ? "Try another name or email." : "Add your first customer with the form."}</p>
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
