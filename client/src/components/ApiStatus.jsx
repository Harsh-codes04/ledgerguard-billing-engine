import { useEffect, useState } from "react";
import { pingHealth } from "../services/api.js";

export default function ApiStatus() {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    const controller = new AbortController();

    pingHealth({ signal: controller.signal })
      .then((health) => setStatus(health.dbConnected ? "ready" : "database"))
      .catch((error) => {
        if (error.name !== "AbortError") setStatus("offline");
      });

    return () => controller.abort();
  }, []);

  const styles = {
    checking: "border-slate-700 bg-slate-800/60 text-slate-300",
    ready: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
    database: "border-amber-400/20 bg-amber-400/10 text-amber-200",
    offline: "border-rose-400/20 bg-rose-400/10 text-rose-200",
  };
  const messages = {
    checking: "Checking API and database connection…",
    ready: "API and MongoDB are connected.",
    database: "API is online, but MongoDB is disconnected. Check Render and Atlas settings.",
    offline: "Can't reach the API. Check Vercel's VITE_API_URL and Render's CLIENT_URL.",
  };

  return (
    <p className={`mb-5 rounded-xl border px-3.5 py-3 text-sm ${styles[status]}`} role="status" aria-live="polite">
      <span className="mr-2 inline-block h-2 w-2 rounded-full bg-current align-middle" />
      {messages[status]}
    </p>
  );
}
