import React, { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { useApp } from "../context/AppContext";

export const CreateSessionModal = ({ isOpen, onClose, initialData = null }) => {
  const { fetchSessions, setActiveSession, showToast } = useApp();

  const [formData, setFormData] = useState({
    name: "",
    token: "",
    description: "",
    response_status: 200,
    response_content_type: "application/json",
    response_body: JSON.stringify({ success: true, message: "Webhook received successfully" }, null, 2),
    response_delay_ms: 0,
    forward_url: "",
    max_requests: 500,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        token: initialData.token || "",
        description: initialData.description || "",
        response_status: initialData.response_status || 200,
        response_content_type: initialData.response_content_type || "application/json",
        response_body: typeof initialData.response_body === "string"
          ? initialData.response_body
          : JSON.stringify(initialData.response_body || {}, null, 2),
        response_delay_ms: initialData.response_delay_ms || 0,
        forward_url: initialData.forward_url || "",
        max_requests: initialData.max_requests || 500,
      });
    } else {
      setFormData({
        name: "",
        token: "",
        description: "",
        response_status: 200,
        response_content_type: "application/json",
        response_body: JSON.stringify({ success: true, message: "Webhook received successfully" }, null, 2),
        response_delay_ms: 0,
        forward_url: "",
        max_requests: 500,
      });
    }
    setError(null);
  }, [initialData, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = initialData ? `/api/v1/sessions/${initialData.id}` : "/api/v1/sessions";
      const method = initialData ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Erro ao salvar sessão.");
      }

      await fetchSessions();
      if (!initialData && data.data) {
        setActiveSession(data.data);
      }
      showToast(initialData ? "Sessão atualizada com sucesso!" : "Sessão criada com sucesso!");
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Editar Sessão de Webhook" : "Criar Nova Sessão de Webhook"}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nome da Sessão *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Stripe Checkout, WhatsApp Lead"
              value={formData.name}
              onChange={(e) => {
                const name = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  name,
                  token: !initialData && !prev.tokenCustomized
                    ? name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
                    : prev.token,
                }));
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Token / Slug da URL *
            </label>
            <div className="flex items-center rounded-xl bg-slate-950 border border-slate-800 focus-within:border-cyan-500 transition px-3 py-2 text-xs">
              <span className="text-slate-500 font-mono">/w/</span>
              <input
                type="text"
                required
                placeholder="slug-unico"
                value={formData.token}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    token: e.target.value.toLowerCase().replace(/[^a-z0-9\-_]/g, ""),
                    tokenCustomized: true,
                  }))
                }
                className="w-full bg-transparent text-cyan-400 font-mono focus:outline-none ml-1"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Descrição (opcional)
          </label>
          <input
            type="text"
            placeholder="Ex: Utilizada para testar webhooks de pagamentos PIX e cartão"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        <div className="pt-2 border-t border-slate-800">
          <p className="text-xs font-semibold text-cyan-400 mb-3 uppercase tracking-wider">
            Resposta Mockada (O que retornar ao emissor)
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Status HTTP
              </label>
              <select
                value={formData.response_status}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, response_status: Number(e.target.value) }))
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 transition"
              >
                <option value={200}>200 OK</option>
                <option value={201}>201 Created</option>
                <option value={202}>202 Accepted</option>
                <option value={204}>204 No Content</option>
                <option value={400}>400 Bad Request</option>
                <option value={401}>401 Unauthorized</option>
                <option value={500}>500 Internal Error</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Content-Type
              </label>
              <select
                value={formData.response_content_type}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, response_content_type: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 transition"
              >
                <option value="application/json">application/json</option>
                <option value="text/plain">text/plain</option>
                <option value="text/html">text/html</option>
                <option value="application/xml">application/xml</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Delay / Latência (ms)
              </label>
              <input
                type="number"
                min="0"
                max="30000"
                step="100"
                placeholder="0"
                value={formData.response_delay_ms}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, response_delay_ms: Number(e.target.value) }))
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 transition"
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Corpo da Resposta
            </label>
            <textarea
              rows={3}
              value={formData.response_body}
              onChange={(e) => setFormData((prev) => ({ ...prev, response_body: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500 transition"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800">
          <p className="text-xs font-semibold text-emerald-400 mb-3 uppercase tracking-wider">
            Auto-Forwarding / Proxy (Opcional)
          </p>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Encaminhar requisição recebida para URL de destino:
            </label>
            <input
              type="url"
              placeholder="Ex: http://localhost:8080/api/webhook"
              value={formData.forward_url}
              onChange={(e) => setFormData((prev) => ({ ...prev, forward_url: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 transition"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Se preenchido, cada webhook recebido nesta sessão será automaticamente enviado para este endereço.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 transition shadow-sm disabled:opacity-50"
          >
            {loading ? "Salvando..." : initialData ? "Atualizar Sessão" : "Criar Sessão"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
