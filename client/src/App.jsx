import { useEffect, useState } from "react";
import { apiRequest } from "./api.js";
import PlansPanel from "./components/PlansPanel.jsx";
import BillingPanel from "./components/BillingPanel.jsx";

const TOKEN_KEY = "ledgerguard-token";

function Brand() {
  return <a className="brand" href="#home" aria-label="LedgerGuard home">Ledger<span>Guard</span></a>;
}

function AuthScreen({ onSignedIn }) {
  const [mode, setMode] = useState("login");
  const [fields, setFields] = useState({ name: "", workspaceName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function update(event) {
    setFields((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const payload = await apiRequest(endpoint, { method: "POST", body: fields });
      onSignedIn(payload);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-story">
        <div className="eyebrow">A clear view of every bill</div>
        <h1>Billing that keeps each workspace in its own lane.</h1>
        <p>LedgerGuard is an internship project for workspace-based billing and privacy-aware invoice verification.</p>
        <div className="story-note">
          <span className="note-icon">✓</span>
          <div><strong>Built in milestones</strong><p>Workspace accounts and customer records are the first foundation.</p></div>
        </div>
      </section>

      <form className="surface auth-card" onSubmit={submit}>
        <Brand />
        <p className="auth-kicker">{mode === "register" ? "Create your workspace" : "Welcome back"}</p>
        <h2>{mode === "register" ? "Start with your team" : "Sign in to LedgerGuard"}</h2>
        {mode === "register" && <>
          <label htmlFor="name">Your name</label>
          <input id="name" name="name" value={fields.name} onChange={update} autoComplete="name" maxLength="80" required />
          <label htmlFor="workspaceName">Workspace name</label>
          <input id="workspaceName" name="workspaceName" value={fields.workspaceName} onChange={update} maxLength="100" required />
        </>}
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" value={fields.email} onChange={update} autoComplete="email" required />
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" value={fields.password} onChange={update} autoComplete={mode === "register" ? "new-password" : "current-password"} minLength="8" required />
        {error && <div className="alert error-alert" role="alert">{error}</div>}
        <button className="button primary-button full-button" type="submit" disabled={busy}>
          {busy ? "Please wait…" : mode === "register" ? "Create workspace" : "Sign in"}
        </button>
        <p className="switch-mode">
          {mode === "register" ? "Already have an account?" : "New to LedgerGuard?"}{" "}
          <button type="button" className="inline-button" onClick={() => { setMode(mode === "register" ? "login" : "register"); setError(""); }}>
            {mode === "register" ? "Sign in" : "Create a workspace"}
          </button>
        </p>
      </form>
    </main>
  );
}

function Dashboard({ token, user, customers, plans, invoices, onCustomersChanged, onPlansChanged, onInvoicesChanged, onSignOut }) {
  const [activeSection, setActiveSection] = useState("customers");
  const [form, setForm] = useState({ name: "", email: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  async function addCustomer(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setBusy(true);
    try {
      const data = await apiRequest("/api/customers", {
        token,
        method: "POST",
        body: form,
      });
      onCustomersChanged([data.customer, ...customers]);
      setForm({ name: "", email: "" });
      setSuccess("Customer added to this workspace.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeCustomer(customerId) {
    if (!window.confirm("Remove this customer from your workspace?")) return;
    setError("");
    setSuccess("");
    try {
      await apiRequest(`/api/customers/${customerId}`, { token, method: "DELETE" });
      onCustomersChanged(customers.filter((customer) => customer._id !== customerId));
      setSuccess("Customer removed.");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Brand />
        <div className="account-area">
          <span className="workspace-chip">{user.workspaceName}</span>
          <span className="account-name">{user.name}</span>
          <button className="text-button" onClick={onSignOut}>Sign out</button>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="page-heading">
          <div>
            <div className="eyebrow">Workspace overview</div>
            <h1>Good to see you, {user.name.split(" ")[0]}</h1>
            <p>Manage billing data for <strong>{user.workspaceName}</strong>.</p>
          </div>
          <span className="status-pill"><span className="status-dot" /> Billing foundation</span>
        </section>

        {(error || success) && <div className={`alert ${error ? "error-alert" : "success-alert"}`} role="status">{error || success}</div>}

        <section className="stat-grid" aria-label="Workspace summary">
          <article className="stat-card"><span className="stat-label">Customers</span><strong className="stat-value">{customers.length}</strong><span className="stat-foot">In this workspace</span></article>
          <article className="stat-card"><span className="stat-label">Billing plans</span><strong className="stat-value">{plans.length}</strong><span className="stat-foot">Rates in this workspace</span></article>
          <article className="stat-card"><span className="stat-label">Invoices</span><strong className="stat-value">{invoices.length}</strong><span className="stat-foot">Draft invoices generated</span></article>
        </section>

        <nav className="section-tabs" aria-label="Workspace sections">
          <button type="button" className={`tab-button ${activeSection === "customers" ? "active" : ""}`} onClick={() => setActiveSection("customers")}>Customers</button>
          <button type="button" className={`tab-button ${activeSection === "plans" ? "active" : ""}`} onClick={() => setActiveSection("plans")}>Billing plans</button>
          <button type="button" className={`tab-button ${activeSection === "billing" ? "active" : ""}`} onClick={() => setActiveSection("billing")}>Usage & invoices</button>
        </nav>

        {activeSection === "customers" && <section className="content-grid">
          <form className="surface form-card" onSubmit={addCustomer}>
            <div className="section-icon">＋</div>
            <h2>Add a customer</h2>
            <p>Create the first billing contact in this workspace.</p>
            <label htmlFor="customerName">Customer name</label>
            <input id="customerName" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} maxLength="120" placeholder="Example: Acme Design" required />
            <label htmlFor="customerEmail">Email <span className="optional">(optional)</span></label>
            <input id="customerEmail" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} maxLength="254" placeholder="billing@example.com" />
            <button className="button primary-button full-button" type="submit" disabled={busy}>{busy ? "Adding…" : "Add customer"}</button>
          </form>

          <section className="surface customer-card">
            <div className="list-heading">
              <div><div className="eyebrow">Workspace directory</div><h2>Customers</h2></div>
              <span className="count-badge">{customers.length}</span>
            </div>
            {customers.length ? <div className="customer-list">
              {customers.map((customer) => <article className="customer-row" key={customer._id}>
                <div className="avatar">{customer.name.slice(0, 1).toUpperCase()}</div>
                <div className="customer-info"><strong>{customer.name}</strong><span>{customer.email || "No email added"}</span></div>
                <button className="delete-button" type="button" onClick={() => removeCustomer(customer._id)}>Remove</button>
              </article>)}
            </div> : <div className="empty-state"><div className="empty-icon">♧</div><strong>No customers yet</strong><p>Add the first customer using the form.</p></div>}
          </section>
        </section>}

        {activeSection === "plans" && <PlansPanel token={token} plans={plans} onPlansChanged={onPlansChanged} />}

        {activeSection === "billing" && <BillingPanel token={token} customers={customers} plans={plans} invoices={invoices} onInvoicesChanged={onInvoicesChanged} />}

        <section className="privacy-banner">
          <span className="privacy-lock">◈</span>
          <div><strong>Workspace data stays scoped</strong><p>Customer requests use the signed-in account's workspace. The browser cannot choose a different workspace ID.</p></div>
        </section>
      </main>
      <footer className="footer">LedgerGuard · MERN internship project prototype</footer>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(Boolean(token));
  const [sessionError, setSessionError] = useState("");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return undefined;
    }
    let active = true;
    setLoading(true);
    Promise.all([
      apiRequest("/api/auth/me", { token }),
      apiRequest("/api/customers", { token }),
      apiRequest("/api/plans", { token }),
      apiRequest("/api/invoices", { token }),
    ]).then(([account, customerData, planData, invoiceData]) => {
      if (!active) return;
      setUser(account.user);
      setCustomers(customerData.customers);
      setPlans(planData.plans);
      setInvoices(invoiceData.invoices);
      setSessionError("");
    }).catch((error) => {
      if (!active) return;
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
      setCustomers([]);
      setPlans([]);
      setInvoices([]);
      setSessionError(error.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [token]);

  function signIn(payload) {
    localStorage.setItem(TOKEN_KEY, payload.token);
    setUser(payload.user);
    setCustomers([]);
    setPlans([]);
    setInvoices([]);
    setToken(payload.token);
  }

  function signOut() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setCustomers([]);
    setPlans([]);
    setInvoices([]);
  }

  if (loading) return <div className="loading-screen"><Brand /><span>Opening your workspace…</span></div>;
  if (token && user) return <Dashboard token={token} user={user} customers={customers} plans={plans} invoices={invoices} onCustomersChanged={setCustomers} onPlansChanged={setPlans} onInvoicesChanged={setInvoices} onSignOut={signOut} />;
  return <><AuthScreen onSignedIn={signIn} />{sessionError && <div className="session-message">{sessionError}</div>}</>;
}
