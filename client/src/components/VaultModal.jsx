import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Check, FlaskConical, LockKeyhole, ShieldCheck, X } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useVault } from "../context/VaultContext.jsx";

const emptyDiagnostic = { ciphertext: "", plaintext: "", error: "", complete: false };

export default function VaultModal({ open, onClose }) {
  const { tenant } = useAuth();
  const { isUnlocked, unlockVault, lockVault, encrypt, decrypt } = useVault();
  const [passphrase, setPassphrase] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [diagnostic, setDiagnostic] = useState(emptyDiagnostic);

  const handleClose = useCallback(() => {
    setPassphrase("");
    setDiagnostic(emptyDiagnostic);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    setPassphrase("");
    setError("");
    setDiagnostic(emptyDiagnostic);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleClose]);

  useEffect(() => {
    if (!isUnlocked) setDiagnostic(emptyDiagnostic);
  }, [isUnlocked]);

  if (!open) return null;

  async function handleUnlock(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await unlockVault(passphrase);
      setPassphrase("");
    } catch (unlockError) {
      setError(unlockError.message);
    } finally {
      setBusy(false);
    }
  }

  async function runRoundTrip() {
    setError("");
    setDiagnostic(emptyDiagnostic);
    setBusy(true);
    try {
      const sample = {
        purpose: "LedgerGuard vault diagnostic",
        note: "This sample stays in the browser.",
        checkedAt: new Date().toISOString(),
      };
      const encrypted = await encrypt(sample);
      const decrypted = await decrypt(encrypted.ciphertextBase64, encrypted.ivBase64);
      if (JSON.stringify(sample) !== JSON.stringify(decrypted)) {
        throw new Error("The decrypted sample did not match the original.");
      }

      setDiagnostic({
        ciphertext: encrypted.ciphertextBase64,
        plaintext: JSON.stringify(decrypted, null, 2),
        error: "",
        complete: true,
      });
    } catch (diagnosticError) {
      setDiagnostic({ ...emptyDiagnostic, error: diagnosticError.message });
    } finally {
      setBusy(false);
    }
  }

  function handleLock() {
    lockVault();
    setPassphrase("");
    setError("");
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto p-4 sm:p-6">
      <button className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" type="button" aria-label="Close vault dialog" onClick={handleClose} />
      <section className="relative my-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="vault-modal-title">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-7">
          <div className="flex items-start gap-3">
            <span className={`mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${isUnlocked ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
              {isUnlocked ? <ShieldCheck size={21} /> : <LockKeyhole size={21} />}
            </span>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">{tenant?.name || "Workspace"} vault</p>
              <h2 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900" id="vault-modal-title">{isUnlocked ? "Vault unlocked in this browser" : "Unlock your workspace vault"}</h2>
              <p className="mt-1 text-sm text-slate-500">Encryption keys remain in this tab’s memory.</p>
            </div>
          </div>
          <button className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" type="button" aria-label="Close dialog" onClick={handleClose}><X size={19} /></button>
        </div>

        <div className="space-y-6 px-5 py-5 sm:px-7 sm:py-6">
          {!isUnlocked ? (
            <form className="space-y-3" onSubmit={handleUnlock}>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700" htmlFor="vault-passphrase">Workspace encryption passphrase</label>
                <input
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  id="vault-passphrase"
                  type="password"
                  autoComplete="off"
                  minLength="12"
                  value={passphrase}
                  onChange={(event) => setPassphrase(event.target.value)}
                  placeholder="Enter your workspace passphrase"
                  required
                  autoFocus
                />
                <p className="mt-1.5 text-xs leading-5 text-slate-500">Use a long, unique passphrase. It is used locally to derive encryption keys and is not sent to the API.</p>
              </div>
              {error && <p className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700" role="alert"><AlertCircle className="mt-0.5 shrink-0" size={16} />{error}</p>}
              <button className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60" type="submit" disabled={busy || passphrase.length < 12 || !tenant?.vaultSalt}>
                {busy ? "Deriving keys…" : "Unlock vault"}
              </button>
              {!tenant?.vaultSalt && <p className="text-xs text-rose-600">The workspace key salt is missing. Refresh the page to reload your session.</p>}
            </form>
          ) : (
            <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-extrabold text-emerald-900">Keys derived successfully</p>
                <p className="mt-1 text-sm text-emerald-800">The AES-GCM and HMAC keys are non-extractable and held in memory.</p>
              </div>
              <button className="shrink-0 rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100" type="button" onClick={handleLock}>Lock now</button>
            </div>
          )}

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5" aria-labelledby="vault-diagnostic-heading">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-slate-600 shadow-sm"><FlaskConical size={18} /></span>
              <div>
                <h3 className="font-extrabold text-slate-900" id="vault-diagnostic-heading">Verify round-trip encryption</h3>
                <p className="mt-1 text-sm leading-5 text-slate-500">Encrypt a harmless sample in this browser, decrypt it with the same key, and compare the result.</p>
              </div>
            </div>
            <button className="mt-4 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50" type="button" onClick={runRoundTrip} disabled={!isUnlocked || busy}>
              {busy ? "Working…" : "Run diagnostic"}
            </button>

            {diagnostic.error && <p className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700" role="alert"><AlertCircle className="mt-0.5 shrink-0" size={16} />{diagnostic.error}</p>}
            {diagnostic.complete && (
              <div className="mt-4 space-y-3">
                <p className="flex items-center gap-2 text-sm font-bold text-emerald-700"><Check size={17} /> Encrypt/decrypt round trip matched.</p>
                <div>
                  <p className="mb-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-500">Ciphertext (Base64)</p>
                  <pre className="max-h-28 overflow-auto rounded-xl bg-slate-900 p-3 text-xs leading-5 text-emerald-200">{diagnostic.ciphertext}</pre>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-500">Decrypted sample (browser only)</p>
                  <pre className="max-h-36 overflow-auto rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-700">{diagnostic.plaintext}</pre>
                </div>
              </div>
            )}
          </section>

          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs leading-5 text-amber-900">
            Day 3 does not yet save an encrypted passphrase verifier or connect encryption to customer records. Any passphrase can derive keys at this stage; this diagnostic proves only that the same browser key can encrypt and decrypt its sample.
          </p>
        </div>
      </section>
    </div>
  );
}
