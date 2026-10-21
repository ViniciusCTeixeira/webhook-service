import React, { useState } from "react";
import {
  Layers,
  Plus,
  Copy,
  Check,
  Edit2,
  Trash2,
  RefreshCw,
  ExternalLink,
  Shield,
  Clock,
  ArrowRight,
  Database,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { Badge, StatusBadge } from "../components/Badge";
import { CreateSessionModal } from "../components/CreateSessionModal";

export const SessionsPage = () => {
  const { sessions, activeSession, setActiveSession, fetchSessions, baseUrl, showToast } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const copyUrl = (token, id) => {
    const url = `${baseUrl}/w/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    showToast("URL da sessão copiada!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (session) => {
    if (session.token === "default") {
      alert("A sessão 'default' não pode ser excluída, pois garante compatibilidade com /webhook.");
      return;
    }

    if (
      !window.confirm(
        `Tem certeza que deseja excluir a sessão '${session.name}' e todas as suas requisições?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/sessions/${session.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        await fetchSessions();
        showToast("Sessão excluída com sucesso.");
      }
    } catch {
      showToast("Erro ao excluir sessão", "error");
    }
  };

  const handleClear = async (session) => {
    if (!window.confirm(`Deseja limpar as requisições da sessão '${session.name}'?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/v1/sessions/${session.id}/clear`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        await fetchSessions();
        showToast("Requisições da sessão limpas com sucesso.");
      }
    } catch {
      showToast("Erro ao limpar requisições", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Gerenciador de Sessões</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Crie endpoints independentes com suas próprias respostas, regras e URLs para testes paralelos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchSessions}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
            title="Atualizar lista"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setEditingSession(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-xs transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Sessão</span>
          </button>
        </div>
      </div>

      {/* Grid of Sessions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions.map((session) => {
          const isActive = activeSession?.id === session.id;
          const webhookUrl = `${baseUrl}/w/${session.token}`;

          return (
            <div
              key={session.id}
              className={`p-5 rounded-2xl border transition flex flex-col justify-between ${
                isActive
                  ? "bg-slate-900/90 border-cyan-500/40 shadow-lg shadow-cyan-500/5 ring-1 ring-cyan-500/30"
                  : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="space-y-3">
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-100">{session.name}</h3>
                      {isActive && (
                        <Badge variant="cyan" className="text-[10px] py-0">
                          Ativa
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                      {session.description || "Sem descrição"}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingSession(session);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
                      title="Editar Sessão"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {session.token !== "default" && (
                      <button
                        onClick={() => handleDelete(session)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Excluir Sessão"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Webhook URL Field */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-2 text-xs font-mono">
                  <span className="truncate text-cyan-300">{webhookUrl}</span>
                  <button
                    onClick={() => copyUrl(session.token, session.id)}
                    className="p-1 rounded text-slate-400 hover:text-white transition shrink-0"
                    title="Copiar URL"
                  >
                    {copiedId === session.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Session Config Details */}
                <div className="space-y-1.5 text-xs text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Status Retornado:</span>
                    <StatusBadge status={session.response_status} />
                  </div>

                  {session.response_delay_ms > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Latência Simulada:</span>
                      <span className="font-mono text-amber-400">{session.response_delay_ms}ms</span>
                    </div>
                  )}

                  {session.forward_url && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 shrink-0">Auto-Forward:</span>
                      <span className="font-mono text-emerald-400 truncate max-w-[170px]" title={session.forward_url}>
                        {session.forward_url}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Total Gravadas:</span>
                    <span className="font-mono text-slate-300 font-semibold">
                      {session.total_requests || 0} reqs
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleClear(session)}
                  className="text-[11px] text-slate-500 hover:text-rose-400 transition"
                >
                  Limpar histórico
                </button>

                {!isActive && (
                  <button
                    onClick={() => {
                      setActiveSession(session);
                      showToast(`Sessão ativa: ${session.name}`);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
                  >
                    Definir como Ativa
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <CreateSessionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingSession}
      />
    </div>
  );
};
