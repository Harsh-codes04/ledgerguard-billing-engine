import { useState } from "react";
import { apiRequest } from "../api.js";
import { formatMoney, parseRupeesToPaise } from "../format.js";

export default function PlansPanel({ token, plans, onPlansChanged }) {
  const [form, setForm] = useState({ name: "", unitLabel: "unit", price: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    const unitPricePaise = parseRupeesToPaise(form.price);
    if (unitPricePaise === null) {
      setError("Enter a price with no more than two decimal places.");
      return;
    }

    setBusy(true);
    try {
      const data = await apiRequest("/api/plans", {
        token,
        method: "POST",
        body: {
          name: form.name,
          unitLabel: form.unitLabel,
          unitPricePaise,
        },
      });
      onPlansChanged([...plans, data.plan].sort((left, right) => left.name.localeCompare(right.name)));
      setForm({ name: "", unitLabel: "unit", price: "" });
      setSuccess("Billing plan added to this workspace.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="billing-grid">
      <form className="surface form-card" onSubmit={submit}>
        <div className="section-icon">＋</div>
        <h2>Create a billing plan</h2>
        <p>Set a price for one billable unit. Fixed fees can use a unit such as “month” with quantity 1.</p>
        {error && <div className="alert error-alert" role="alert">{error}</div>}
        {success && <div className="alert success-alert" role="status">{success}</div>}
        <label htmlFor="planName">Plan name</label>
        <input id="planName" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} maxLength="100" placeholder="Example: API usage" required />
        <label htmlFor="unitLabel">Billing unit</label>
        <input id="unitLabel" value={form.unitLabel} onChange={(event) => setForm({ ...form, unitLabel: event.target.value })} maxLength="30" placeholder="request, hour, seat, month" required />
        <label htmlFor="planPrice">Price per unit (₹)</label>
        <input id="planPrice" type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="25.00" required />
        <button className="button primary-button full-button" type="submit" disabled={busy}>{busy ? "Saving…" : "Save plan"}</button>
      </form>

      <section className="surface plan-list-card">
        <div className="list-heading">
          <div><div className="eyebrow">Workspace rates</div><h2>Billing plans</h2></div>
          <span className="count-badge">{plans.length}</span>
        </div>
        {plans.length ? <div className="plan-list">
          {plans.map((plan) => <article className="plan-row" key={plan._id}>
            <div className="plan-mark">₹</div>
            <div className="plan-info"><strong>{plan.name}</strong><span>Per {plan.unitLabel}</span></div>
            <strong className="plan-price">{formatMoney(plan.unitPricePaise)}</strong>
          </article>)}
        </div> : <div className="empty-state"><div className="empty-icon">₹</div><strong>No plans yet</strong><p>Create a rate to start recording billable usage.</p></div>}
      </section>
    </section>
  );
}
