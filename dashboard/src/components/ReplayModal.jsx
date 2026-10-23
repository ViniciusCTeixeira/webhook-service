import React, { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { Send, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { Badge, StatusBadge, MethodBadge } from "./Badge";
import { useApp } from "../context/AppContext";
import { formatTimestamp } from "../utils/dateTime";

export const ReplayModal = ({ isOpen, onClose, request }) => {
  const { baseUrl } = useApp();
  const [targetUrl, setTargetUrl] = useState("");
  const [method, setMethod] = useState("POST");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (request) {
      setTargetUrl(`${baseUrl}${request.path}`);
      setMethod(request.method || "POST");
      setBody(
        typeof request.body === "object"
          ? JSON.stringify(request.body, null, 2)
          : request.raw_body || String(request.body || "")
      );
      setResult(null);
      setError(null);
    }
  }, [request, baseUrl, isOpen]);

  if (!request) return null;

  const handleReplay = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let parsedBody = body;
      try {
        parsedBody = JSON.parse(body);
      } catch {
        // Keep string if not valid JSON
      }

      const res = await fetch(`/api/v1/requests/${request.id}/replay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUrl,
          method,
          body: parsedBody,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Falha no replay");
      }
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reenviar Webhook (Replay)" maxWidth="max-w-3xl">
      <form onSubmit={handleReplay} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Método</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-bold focus:outline-none focus:border-cyan-500 transition"
            >
              <option value="POST">POST</option>
              <option value="GET">GET</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-slate-400 mb-1">URL de Destino</label>
            <input
              type="url"
              required
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Payload (Corpo do Webhook)
          </label>
          <textarea
            rows={8}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-500 transition leading-relaxed"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-500">
            Requisição original #{request.id} ({formatTimestamp(request.created_at)})
          </span>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 transition shadow-sm disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{loading ? "Reenviando..." : "Executar Replay"}</span>
          </button>
        </div>

        {/* Replay Result Panel */}
        {result && (
          <div className="mt-4 pt-4 border-t border-slate-800 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-200">Resposta do Servidor:</span>
                <StatusBadge status={result.status} />
                <span className="text-xs text-slate-400">{result.statusText}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{result.durationMs}ms</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono max-h-48 overflow-y-auto">
              <pre className="text-emerald-300">
                {typeof result.data === "object"
                  ? JSON.stringify(result.data, null, 2)
                  : String(result.data)}
              </pre>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};
