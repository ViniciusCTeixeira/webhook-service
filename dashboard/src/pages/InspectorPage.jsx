import React, { useState, useEffect } from "react";
import {
  Copy,
  Check,
  QrCode,
  Trash2,
  RefreshCw,
  Search,
  Terminal,
  Send,
  ArrowRight,
  ExternalLink,
  Code2,
  ListFilter,
  CheckCircle2,
  AlertCircle,
  FileJson,
  Layers,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { MethodBadge, StatusBadge } from "../components/Badge";
import { ReplayModal } from "../components/ReplayModal";
import { QrCodeModal } from "../components/QrCodeModal";
import { formatTimestamp } from "../utils/dateTime";

export const InspectorPage = () => {
  const { activeSession, sessions, setActiveSession, baseUrl, socket, showToast } = useApp();

  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [activeTab, setActiveTab] = useState("body"); // 'body' | 'headers' | 'query' | 'raw' | 'response'
  const [rawView, setRawView] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  const [isReplayOpen, setIsReplayOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);

  const activeWebhookUrl = activeSession
    ? `${baseUrl}/w/${activeSession.token}`
    : `${baseUrl}/w/default`;

  const fetchRequests = async () => {
    if (!activeSession) return;
    setLoading(true);
    try {
      let url = `/api/v1/requests?sessionId=${activeSession.id}&limit=100`;
      if (methodFilter !== "ALL") url += `&method=${methodFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setRequests(data.data);
        if (data.data.length > 0) {
          // Keep current selection or default to first
          setSelectedRequest((prev) => {
            if (!prev) return data.data[0];
            const stillExists = data.data.find((r) => r.id === prev.id);
            return stillExists || data.data[0];
          });
        } else {
          setSelectedRequest(null);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar requisições:", err);
    } finally {
      setLoading(false);
    }
  };

  // Reload when activeSession, methodFilter, or search changes
  useEffect(() => {
    fetchRequests();
  }, [activeSession?.id, methodFilter, search]);

  // Real-time socket event handling
  useEffect(() => {
    if (!socket || !activeSession) return;

    const handleNewRequest = (newReq) => {
      if (newReq.session_id === activeSession.id || newReq.session_token === activeSession.token) {
        setRequests((prev) => [newReq, ...prev.slice(0, 499)]);
        setSelectedRequest((prev) => (!prev ? newReq : prev));
      }
    };

    const handleClearRequests = () => {
      setRequests([]);
      setSelectedRequest(null);
    };

    socket.on("newRequest", handleNewRequest);
    socket.on("clearRequests", handleClearRequests);

    return () => {
      socket.off("newRequest", handleNewRequest);
      socket.off("clearRequests", handleClearRequests);
    };
  }, [socket, activeSession?.id, activeSession?.token]);

  const handleClear = async () => {
    if (!activeSession) return;
    if (!window.confirm(`Deseja limpar todas as requisições da sessão '${activeSession.name}'?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/v1/sessions/${activeSession.id}/clear`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setRequests([]);
        setSelectedRequest(null);
        showToast("Histórico limpo!");
      }
    } catch (err) {
      showToast("Erro ao limpar requisições", "error");
    }
  };

  const handleDeleteSingle = async (id) => {
    try {
      const res = await fetch(`/api/v1/requests/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setRequests((prev) => prev.filter((r) => r.id !== id));
        if (selectedRequest?.id === id) {
          setSelectedRequest(requests.find((r) => r.id !== id) || null);
        }
        showToast("Requisição excluída.");
      }
    } catch {
      showToast("Erro ao excluir requisição", "error");
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(activeWebhookUrl);
    setCopiedUrl(true);
    showToast("URL copiada!");
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const copyCurl = () => {
    const curl = `curl -X POST "${activeWebhookUrl}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"event": "teste", "timestamp": "${new Date().toISOString()}"}'`;
    navigator.clipboard.writeText(curl);
    setCopiedCurl(true);
    showToast("Comando cURL copiado!");
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const copyBody = () => {
    if (!selectedRequest) return;
    const content =
      typeof selectedRequest.body === "object"
        ? JSON.stringify(selectedRequest.body, null, 2)
        : selectedRequest.raw_body || String(selectedRequest.body || "");
    navigator.clipboard.writeText(content);
    setCopiedBody(true);
    showToast("Payload copiado!");
    setTimeout(() => setCopiedBody(false), 2000);
  };

  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const methods = ["ALL", "POST", "GET", "PUT", "PATCH", "DELETE"];

  return (
    <div className="space-y-4">
      {/* Top Banner: Webhook URL & Quick Actions */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              Endpoint Ativo:
            </span>
            <span className="text-xs font-bold text-slate-200">
              {activeSession?.name || "Sessão Padrão"}
            </span>
            {activeSession?.forward_url && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Proxy Ativo → {activeSession.forward_url}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono text-cyan-300 font-semibold select-all break-all">
              {activeWebhookUrl}
            </code>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={copyUrl}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
          >
            {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedUrl ? "Copiado!" : "Copiar URL"}</span>
          </button>

          <button
            onClick={copyCurl}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
          >
            {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Terminal className="w-3.5 h-3.5" />}
            <span>cURL</span>
          </button>

          <button
            onClick={() => setIsQrOpen(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Exibir QR Code"
          >
            <QrCode className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Split Layout: Left Request List | Right Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-230px)]">
        {/* Left Column: Request List */}
        <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
          {/* Filter & Search Header */}
          <div className="p-3 border-b border-slate-800 bg-slate-950/40 space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar no body, headers ou caminho..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <button
                onClick={fetchRequests}
                title="Atualizar lista"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>

              <button
                onClick={handleClear}
                title="Limpar histórico da sessão"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Method Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
              {methods.map((m) => (
                <button
                  key={m}
                  onClick={() => setMethodFilter(m)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-mono font-semibold transition ${
                    methodFilter === m
                      ? "bg-cyan-500 text-slate-950 shadow-sm"
                      : "bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  {m}
                </button>
              ))}
              <span className="ml-auto text-[11px] text-slate-500 font-mono">
                {requests.length} requisições
              </span>
            </div>
          </div>

          {/* Scrollable Requests List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {requests.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
                <Code2 className="w-10 h-10 text-slate-600 stroke-[1.5]" />
                <p className="text-xs font-medium text-slate-400">Nenhum webhook recebido ainda</p>
                <p className="text-[11px] text-slate-500 max-w-xs">
                  Envie requisições HTTP para a URL acima para visualizá-las aqui em tempo real.
                </p>
              </div>
            ) : (
              requests.map((req) => {
                const isSelected = selectedRequest?.id === req.id;
                return (
                  <div
                    key={req.id}
                    onClick={() => setSelectedRequest(req)}
                    className={`p-3 text-left transition cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-cyan-500/10 border-l-4 border-cyan-400 text-slate-100"
                        : "hover:bg-slate-800/40 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <MethodBadge method={req.method} />
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-xs font-semibold truncate text-slate-200">
                            {req.path}
                          </p>
                          <StatusBadge status={req.response_status} />
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5 font-mono">
                          <span>{req.client_ip || "127.0.0.1"}</span>
                          <span>•</span>
                          <span>{formatSize(req.size_bytes)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {formatTimestamp(req.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Request Detail Inspector */}
        <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
          {selectedRequest ? (
            <>
              {/* Request Header Bar */}
              <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <MethodBadge method={selectedRequest.method} className="text-sm px-2.5 py-1" />
                  <span className="font-mono text-sm font-semibold text-slate-100">
                    {selectedRequest.path}
                  </span>
                  <StatusBadge status={selectedRequest.response_status} />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsReplayOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-xs transition shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Replay</span>
                  </button>

                  <button
                    onClick={copyBody}
                    title="Copiar Body"
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                  >
                    {copiedBody ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => handleDeleteSingle(selectedRequest.id)}
                    title="Excluir requisição"
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Meta Info Strip */}
              <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-950/20 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
                <div>
                  <span className="text-slate-500">IP:</span> {selectedRequest.client_ip || "127.0.0.1"}
                </div>
                <div>
                  <span className="text-slate-500">Tamanho:</span> {formatSize(selectedRequest.size_bytes)}
                </div>
                <div>
                  <span className="text-slate-500">Duração:</span> {selectedRequest.duration_ms}ms
                </div>
                <div>
                  <span className="text-slate-500">Recebido em:</span> {formatTimestamp(selectedRequest.created_at)}
                </div>
              </div>

              {/* Inspector Navigation Tabs */}
              <div className="flex items-center justify-between border-b border-slate-800 px-4 bg-slate-950/30">
                <div className="flex items-center gap-2">
                  {[
                    { id: "body", label: "Corpo (Body)" },
                    { id: "headers", label: "Headers" },
                    { id: "query", label: "Query Params" },
                    { id: "raw", label: "Raw String" },
                    { id: "response", label: "Resposta Enviada" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3 py-2.5 text-xs font-medium border-b-2 transition ${
                        activeTab === tab.id
                          ? "border-cyan-400 text-cyan-400"
                          : "border-transparent text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {activeTab === "body" && (
                  <button
                    onClick={() => setRawView(!rawView)}
                    className="text-[11px] font-mono text-slate-400 hover:text-cyan-400 transition"
                  >
                    {rawView ? "Visualizar Formatado" : "Visualizar Raw"}
                  </button>
                )}
              </div>

              {/* Tab Content Display */}
              <div className="flex-1 p-4 overflow-y-auto font-mono text-xs">
                {activeTab === "body" && (
                  <div className="h-full">
                    {rawView ? (
                      <pre className="text-slate-300 whitespace-pre-wrap break-all leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
                        {selectedRequest.raw_body || JSON.stringify(selectedRequest.body, null, 2)}
                      </pre>
                    ) : (
                      <pre className="text-cyan-300 whitespace-pre-wrap break-all leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
                        {typeof selectedRequest.body === "object"
                          ? JSON.stringify(selectedRequest.body, null, 2)
                          : selectedRequest.body || "Nenhum body recebido"}
                      </pre>
                    )}
                  </div>
                )}

                {activeTab === "headers" && (
                  <div className="space-y-1">
                    <div className="rounded-xl overflow-hidden border border-slate-800">
                      <table className="w-full text-left">
                        <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                          <tr>
                            <th className="p-2.5 font-semibold">Header</th>
                            <th className="p-2.5 font-semibold">Valor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
                          {Object.entries(selectedRequest.headers || {}).map(([key, val]) => (
                            <tr key={key} className="hover:bg-slate-800/30">
                              <td className="p-2.5 text-cyan-400 font-semibold align-top">{key}</td>
                              <td className="p-2.5 text-slate-300 break-all">{String(val)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === "query" && (
                  <div className="space-y-1">
                    {Object.keys(selectedRequest.query_params || {}).length === 0 ? (
                      <p className="text-slate-500 italic p-4 text-center">
                        Nenhum parâmetro de consulta (Query Params) recebido.
                      </p>
                    ) : (
                      <div className="rounded-xl overflow-hidden border border-slate-800">
                        <table className="w-full text-left">
                          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                            <tr>
                              <th className="p-2.5 font-semibold">Parâmetro</th>
                              <th className="p-2.5 font-semibold">Valor</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
                            {Object.entries(selectedRequest.query_params || {}).map(([key, val]) => (
                              <tr key={key} className="hover:bg-slate-800/30">
                                <td className="p-2.5 text-emerald-400 font-semibold">{key}</td>
                                <td className="p-2.5 text-slate-300">{String(val)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "raw" && (
                  <pre className="text-slate-300 whitespace-pre-wrap break-all leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
                    {selectedRequest.raw_body || "Sem raw body"}
                  </pre>
                )}

                {activeTab === "response" && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="font-semibold text-slate-200">
                          Resposta retornada para o emissor:
                        </span>
                        <StatusBadge status={selectedRequest.response_status} />
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Configurada na sessão {selectedRequest.session_token}
                      </p>
                    </div>

                    {selectedRequest.forward_status && (
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                        <div className="flex items-center gap-2">
                          <ArrowRight className="w-4 h-4 text-cyan-400" />
                          <span className="font-semibold text-slate-200">
                            Auto-Forwarding executado:
                          </span>
                          <StatusBadge status={selectedRequest.forward_status} />
                        </div>
                        {selectedRequest.forward_response && (
                          <pre className="text-slate-300 text-[11px] p-2 rounded bg-slate-900">
                            {selectedRequest.forward_response}
                          </pre>
                        )}
                        {selectedRequest.forward_error && (
                          <p className="text-rose-400 text-[11px]">
                            Erro: {selectedRequest.forward_error}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 flex flex-col items-center justify-center h-full text-slate-500 space-y-3">
              <FileJson className="w-12 h-12 text-slate-600 stroke-[1.5]" />
              <p className="text-sm font-semibold text-slate-400">Selecione uma requisição</p>
              <p className="text-xs text-slate-500 max-w-sm text-center">
                Clique em uma requisição da lista à esquerda para inspecionar os cabeçalhos, corpo, query params e resposta enviada.
              </p>
            </div>
          )}
        </div>
      </div>

      <ReplayModal
        isOpen={isReplayOpen}
        onClose={() => setIsReplayOpen(false)}
        request={selectedRequest}
      />

      <QrCodeModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        url={activeWebhookUrl}
        title={`QR Code - ${activeSession?.name}`}
      />
    </div>
  );
};
