import React, { useState } from "react";
import { Copy, Check, Plus, Radio, Sparkles, ExternalLink } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Logo } from "./Logo";
import { Badge } from "./Badge";
import { CreateSessionModal } from "./CreateSessionModal";

export const Navbar = () => {
  const { sessions, activeSession, setActiveSession, baseUrl, socket, showToast } = useApp();
  const [copied, setCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeWebhookUrl = activeSession
    ? `${baseUrl}/w/${activeSession.token}`
    : `${baseUrl}/w/default`;

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(activeWebhookUrl);
    setCopied(true);
    showToast("URL do webhook copiada para a área de transferência!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Logo className="w-9 h-9" withText={true} />
        </div>

        <div className="flex items-center gap-3">
          {/* Active Session Webhook URL Bar */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
            <span className="text-slate-500 font-mono">Sessão:</span>
            <select
              value={activeSession?.id || ""}
              onChange={(e) => {
                const s = sessions.find((item) => item.id === Number(e.target.value));
                if (s) setActiveSession(s);
              }}
              className="bg-transparent text-cyan-400 font-semibold focus:outline-none cursor-pointer"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-slate-100">
                  {s.name} ({s.token})
                </option>
              ))}
            </select>

            <div className="h-3.5 w-px bg-slate-800 mx-1" />

            <span className="font-mono text-slate-400 select-all max-w-[280px] truncate">
              {activeWebhookUrl}
            </span>

            <button
              onClick={copyWebhookUrl}
              title="Copiar URL do Webhook"
              className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* New Session Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-semibold text-xs transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Sessão</span>
          </button>

          {/* WebSocket Status Indicator */}
          <Badge variant={socket?.connected ? "emerald" : "amber"} className="text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                socket?.connected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
            {socket?.connected ? "Ao Vivo" : "Conectando..."}
          </Badge>
        </div>
      </header>

      <CreateSessionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
