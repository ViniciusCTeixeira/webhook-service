import React, { useState, useEffect } from "react";
import { Send, CheckCircle2, Clock, Terminal, AlertTriangle, Sparkles } from "lucide-react";
import { useApp } from "../context/AppContext";
import { StatusBadge, MethodBadge } from "../components/Badge";

const PRESETS = [
  {
    name: "Stripe Checkout",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Stripe-Signature": "t=1700000000,v1=abcdef0123456789",
    },
    body: {
      id: "evt_1NtK8l2eZvKYlo2C",
      object: "event",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_a1b2c3d4",
          amount_total: 19900,
          currency: "brl",
          customer_email: "cliente@exemplo.com",
          payment_status: "paid",
        },
      },
    },
  },
  {
    name: "WhatsApp Mensagem",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Hub-Signature": "sha256=9876543210fedcba",
    },
    body: {
      event: "messages.upsert",
      instance: "wa-prod-01",
      data: {
        key: {
          remoteJid: "5511999998888@s.whatsapp.net",
          fromMe: false,
          id: "3EB0ABC123456",
        },
        message: {
          conversation: "Olá! Gostaria de tirar uma dúvida sobre a integração.",
        },
        messageTimestamp: Math.floor(Date.now() / 1000),
      },
    },
  },
  {
    name: "Mercado Pago IPN",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: {
      action: "payment.created",
      api_version: "v1",
      data: { id: "1234567890" },
      date_created: new Date().toISOString(),
      type: "payment",
    },
  },
  {
    name: "GitHub Push Event",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-GitHub-Event": "push",
    },
    body: {
      ref: "refs/heads/main",
      before: "0000000000000000000000000000000000000000",
      after: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
      repository: {
        name: "webhook-service",
        full_name: "vinicius/webhook-service",
      },
      pusher: { name: "vinicius" },
    },
  },
];

export const TesterPage = () => {
  const { activeSession, baseUrl, showToast } = useApp();

  const [targetUrl, setTargetUrl] = useState("");
  const [method, setMethod] = useState("POST");
  const [headersText, setHeadersText] = useState('{\n  "Content-Type": "application/json"\n}');
  const [bodyText, setBodyText] = useState(
    JSON.stringify({ event: "teste.manual", timestamp: new Date().toISOString() }, null, 2)
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (activeSession) {
      setTargetUrl(`${baseUrl}/w/${activeSession.token}`);
    }
  }, [activeSession, baseUrl]);

  const loadPreset = (preset) => {
    setMethod(preset.method);
    setHeadersText(JSON.stringify(preset.headers, null, 2));
    setBodyText(JSON.stringify(preset.body, null, 2));
    showToast(`Preset '${preset.name}' carregado!`);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let parsedHeaders = {};
      try {
        parsedHeaders = JSON.parse(headersText);
      } catch {
        throw new Error("Headers devem estar no formato JSON válido.");
      }

      let parsedBody = bodyText;
      try {
        parsedBody = JSON.parse(bodyText);
      } catch {
        // use raw string
      }

      const res = await fetch("/api/v1/tester/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: targetUrl,
          method,
          headers: parsedHeaders,
          body: parsedBody,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Erro no envio do webhook.");
      }
      setResult(data);
      showToast("Webhook disparado com sucesso!");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 tracking-tight">Simulador de Webhooks</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Envie webhooks de teste com payloads reais para qualquer sessão ou servidor externo sem precisar de ferramentas de terceiros.
        </p>
      </div>

      {/* Preset Pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          Presets Rápidos:
        </span>
        {PRESETS.map((preset) => (
          <button
            key={preset.name}
            onClick={() => loadPreset(preset)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition"
          >
            {preset.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Panel */}
        <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <form onSubmit={handleSend} className="space-y-4">
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
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  URL de Destino
                </label>
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
                Headers Personalizados (JSON)
              </label>
              <textarea
                rows={3}
                value={headersText}
                onChange={(e) => setHeadersText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Corpo da Requisição (Payload JSON ou Texto)
              </label>
              <textarea
                rows={10}
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-500 transition leading-relaxed"
              />
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 transition shadow-lg shadow-cyan-500/10 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? "Disparando..." : "Disparar Webhook"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Response Panel */}
        <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between overflow-hidden">
          <div>
            <h3 className="font-semibold text-sm text-slate-100 mb-3 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              Resposta do Servidor
            </h3>

            {result ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={result.status} />
                    <span className="text-xs font-semibold text-slate-200">
                      {result.statusText || "OK"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{result.durationMs}ms</span>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-slate-400 mb-1">Corpo da Resposta:</p>
                  <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300 font-mono text-xs max-h-64 overflow-y-auto leading-relaxed">
                    {typeof result.data === "object"
                      ? JSON.stringify(result.data, null, 2)
                      : String(result.data)}
                  </pre>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-slate-400 mb-1">Headers Retornados:</p>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 max-h-40 overflow-y-auto">
                    {Object.entries(result.headers || {}).map(([k, v]) => (
                      <div key={k} className="truncate">
                        <span className="text-cyan-400">{k}:</span> {String(v)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center flex flex-col items-center justify-center text-slate-500 space-y-2 mt-8">
                <Send className="w-10 h-10 text-slate-700 stroke-[1.5]" />
                <p className="text-xs font-medium text-slate-400">Aguardando disparo</p>
                <p className="text-[11px] text-slate-500 max-w-xs">
                  Preencha o formulário e clique em "Disparar Webhook" para inspecionar a resposta.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
