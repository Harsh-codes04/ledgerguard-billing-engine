import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api.js";
import { formatMoney } from "../format.js";

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function csvCell(value) {
  const text = String(value ?? "");
  const safeText = /^[\s]*[=+@\-]/.test(text) ? `'${text}` : text;
  return `"${safeText.replaceAll('"', '""')}"`;
}

export default function BillingPanel({ customers, plans, invoices, onInvoicesChanged }) {
  const [period, setPeriod] = useState(currentPeriod);
  const [customerId, setCustomerId] = useState("");
  const [planId, setPlanId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [usageRecords, setUsageRecords] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [expandedInvoiceId, setExpandedInvoiceId] = useState("");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceStatus, setInvoiceStatus] = useState("all");

  useEffect(() => {
    if (customers.length && !customers.some((customer) => customer._id === customerId)) {
      setCustomerId(customers[0]._id);
    }
  }, [customers, customerId]);

  useEffect(() => {
    if (plans.length && !plans.some((plan) => plan._id === planId)) {
      setPlanId(plans[0]._id);
    }
  }, [plans, planId]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiRequest(`/api/usage?period=${encodeURIComponent(period)}`)
      .then((data) => { if (active) setUsageRecords(data.usageRecords); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [period]);

  const selectedInvoice = useMemo(
    () => invoices.find((invoice) => invoice.customerId === customerId && invoice.period === period),
    [invoices, customerId, period]
  );

  const filteredInvoices = useMemo(() => {
    const query = invoiceSearch.trim().toLowerCase();
    return invoices.filter((invoice) => {
      const matchesSearch = !query || `${invoice.customerNameSnapshot} ${invoice.period}`.toLowerCase().includes(query);
      const matchesStatus = invoiceStatus === "all" || invoice.status === invoiceStatus;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, invoiceSearch, invoiceStatus]);

  async function addUsage(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setBusy(true);
    try {
      const data = await apiRequest("/api/usage", {
        method: "POST",
        body: { customerId, planId, period, quantity: Number(quantity) },
      });
      setUsageRecords((current) => [data.usageRecord, ...current]);
      setSuccess("Usage added. The invoice total will use this plan’s saved unit price.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeUsage(record) {
    setError("");
    setSuccess("");
    try {
      await apiRequest(`/api/usage/${record._id}`, { method: "DELETE" });
      setUsageRecords((current) => current.filter((item) => item._id !== record._id));
      setSuccess("Usage record removed.");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function generateInvoice() {
    setError("");
    setSuccess("");
    setBusy(true);
    try {
      const data = await apiRequest("/api/invoices", {
        method: "POST",
        body: { customerId, period },
      });
      onInvoicesChanged([data.invoice, ...invoices]);
      setSuccess(`Draft invoice generated for ${period}.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function advanceInvoice(invoice) {
    const nextStatus = invoice.status === "draft" ? "sent" : "paid";
    setError("");
    setSuccess("");
    setBusy(true);
    try {
      const data = await apiRequest(`/api/invoices/${invoice._id}/status`, {
        method: "PATCH",
        body: { status: nextStatus },
      });
      onInvoicesChanged(invoices.map((item) => item._id === invoice._id ? data.invoice : item));
      setSuccess(`Invoice marked ${nextStatus}.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  function exportInvoices() {
    const headings = ["Invoice ID", "Customer", "Billing period", "Status", "Total (INR)", "Line items"];
    const rows = filteredInvoices.map((invoice) => [
      invoice._id,
      invoice.customerNameSnapshot,
      invoice.period,
      invoice.status,
      (invoice.totalPaise / 100).toFixed(2),
      (invoice.lineItems || []).map((line) => `${line.description}: ${line.quantity} ${line.unitLabel}`).join("; "),
    ]);
    const csv = [headings, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    const file = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const downloadUrl = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `ledgerguard-invoices-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
  }

  const monthTotalPaise = usageRecords.reduce(
    (total, record) => total + record.quantity * record.unitPricePaiseSnapshot,
    0
  );

  return (
    <section className="billing-stack">
      <div className="billing-toolbar surface">
        <div><div className="eyebrow">Billing period</div><strong>Usage and invoices</strong></div>
        <input aria-label="Billing month" type="month" value={period} onChange={(event) => setPeriod(event.target.value)} required />
      </div>

      {(error || success) && <div className={`alert ${error ? "error-alert" : "success-alert"}`} role="status">{error || success}</div>}

      <div className="billing-grid">
        <form className="surface form-card" onSubmit={addUsage}>
          <div className="section-icon">↗</div>
          <h2>Record billable usage</h2>
          <p>Add one usage row per customer, plan, and month. A plan’s price is saved with the row.</p>
          <label htmlFor="usageCustomer">Customer</label>
          <select id="usageCustomer" value={customerId} onChange={(event) => setCustomerId(event.target.value)} required disabled={!customers.length}>
            {!customers.length && <option value="">Add a customer first</option>}
            {customers.map((customer) => <option key={customer._id} value={customer._id}>{customer.name}</option>)}
          </select>
          <label htmlFor="usagePlan">Billing plan</label>
          <select id="usagePlan" value={planId} onChange={(event) => setPlanId(event.target.value)} required disabled={!plans.length}>
            {!plans.length && <option value="">Add a plan first</option>}
            {plans.map((plan) => <option key={plan._id} value={plan._id}>{plan.name} · {formatMoney(plan.unitPricePaise)} / {plan.unitLabel}</option>)}
          </select>
          <label htmlFor="usageQuantity">Quantity</label>
          <input id="usageQuantity" type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
          <button className="button primary-button full-button" type="submit" disabled={busy || !customers.length || !plans.length || Boolean(selectedInvoice)}>
            {selectedInvoice ? "Invoice already generated" : busy ? "Saving…" : "Add usage"}
          </button>
        </form>

        <section className="surface usage-card">
          <div className="list-heading">
            <div><div className="eyebrow">{period}</div><h2>Usage records</h2></div>
            <span className="count-badge">{usageRecords.length}</span>
          </div>
          {loading ? <div className="empty-state"><p>Loading usage…</p></div> : usageRecords.length ? <div className="usage-list">
            {usageRecords.map((record) => {
              const locked = invoices.some((invoice) => invoice.customerId === record.customerId && invoice.period === record.period);
              return <article className="usage-row" key={record._id}>
                <div className="usage-info">
                  <strong>{record.customerNameSnapshot} · {record.planNameSnapshot}</strong>
                  <span>{record.quantity} {record.unitLabelSnapshot} × {formatMoney(record.unitPricePaiseSnapshot)}</span>
                </div>
                <strong className="plan-price">{formatMoney(record.quantity * record.unitPricePaiseSnapshot)}</strong>
                {!locked && <button className="delete-button" type="button" onClick={() => removeUsage(record)}>Remove</button>}
              </article>;
            })}
          </div> : <div className="empty-state"><div className="empty-icon">↗</div><strong>No usage this month</strong><p>Add billable usage to prepare an invoice.</p></div>}

          <div className="invoice-total-row"><span>Uninvoiced period total</span><strong>{formatMoney(monthTotalPaise)}</strong></div>
          <button className="button secondary-button full-button" type="button" onClick={generateInvoice} disabled={busy || !customerId || !usageRecords.some((record) => record.customerId === customerId) || Boolean(selectedInvoice)}>
            {selectedInvoice ? `Draft invoice · ${formatMoney(selectedInvoice.totalPaise)}` : busy ? "Generating…" : "Generate invoice for selected customer"}
          </button>
        </section>
      </div>

      <section className="surface invoice-list-card">
        <div className="list-heading">
          <div><div className="eyebrow">Generated from saved usage</div><h2>Invoices</h2></div>
          <div className="invoice-actions">
            <span className="count-badge" aria-label={`${filteredInvoices.length} invoices shown`}>{filteredInvoices.length}</span>
            <button className="button secondary-button export-button" type="button" onClick={exportInvoices} disabled={!filteredInvoices.length}>Export CSV</button>
          </div>
        </div>
        {invoices.length > 0 && <div className="invoice-tools">
          <input aria-label="Search invoices" type="search" placeholder="Search customer or month" value={invoiceSearch} onChange={(event) => setInvoiceSearch(event.target.value)} />
          <select aria-label="Filter invoices by status" value={invoiceStatus} onChange={(event) => setInvoiceStatus(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
          </select>
        </div>}
        {filteredInvoices.length ? <div className="invoice-list">
          {filteredInvoices.map((invoice) => <article className="invoice-item" key={invoice._id}>
            <div className="invoice-row">
              <div className="invoice-mark">₹</div>
              <div className="invoice-info"><strong>{invoice.customerNameSnapshot}</strong><span>{invoice.period} · <span className={`invoice-status status-${invoice.status}`}>{invoice.status}</span></span></div>
              <strong className="plan-price">{formatMoney(invoice.totalPaise)}</strong>
              <button className="text-button invoice-detail-button" type="button" aria-expanded={expandedInvoiceId === invoice._id} onClick={() => setExpandedInvoiceId(expandedInvoiceId === invoice._id ? "" : invoice._id)}>
                {expandedInvoiceId === invoice._id ? "Hide" : "Details"}
              </button>
              {invoice.status !== "paid" && <button className="delete-button invoice-status-button" type="button" disabled={busy} onClick={() => advanceInvoice(invoice)}>
                {invoice.status === "draft" ? "Mark sent" : "Mark paid"}
              </button>}
            </div>
            {expandedInvoiceId === invoice._id && <div className="invoice-detail">
              {(invoice.lineItems || []).map((line, index) => <div className="invoice-line" key={`${invoice._id}-${index}`}>
                <span>{line.description} · {line.quantity} {line.unitLabel} × {formatMoney(line.unitPricePaise)}</span>
                <strong>{formatMoney(line.lineTotalPaise)}</strong>
              </div>)}
              <div className="invoice-detail-total"><span>Total</span><strong>{formatMoney(invoice.totalPaise)}</strong></div>
            </div>}
          </article>)}
        </div> : invoices.length ? <div className="empty-state"><strong>No matching invoices</strong><p>Try a different customer, billing month, or status.</p></div> : <div className="empty-state"><strong>No invoices yet</strong><p>Generate one after adding a customer’s usage for the month.</p></div>}
      </section>
    </section>
  );
}
