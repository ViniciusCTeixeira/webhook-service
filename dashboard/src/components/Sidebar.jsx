import React from "react";
import { Radio, Layers, Send, Cpu, Database } from "lucide-react";
import { useApp } from "../context/AppContext";

export const Sidebar = ({ activeTab, onSelectTab }) => {
  const { sessions, activeSession } = useApp();

  const items = [
    {
      id: "inspector",
      label: "Inspetor ao Vivo",
      icon: Radio,
      description: "Stream em tempo real e payloads",
    },
    {
      id: "sessions",
      label: "Gerenciar Sessões",
      icon: Layers,
      description: "Endpoints, mock response e proxy",
    },
    {
      id: "tester",
      label: "Simulador de Envio",
      icon: Send,
      description: "Dispare webhooks com presets",
    },
    {
      id: "system",
      label: "Diagnósticos & Sistema",
      icon: Cpu,
      description: "SQLite, memória, CPU e rede",
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/40 p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-1.5">
        <p className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Navegação
        </p>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition ${
                isActive
                  ? "bg-cyan-500/10 text-cyan-400 font-medium border border-cyan-500/20 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-cyan-400" : "text-slate-500"}`} />
              <div className="overflow-hidden">
                <p className="text-sm truncate">{item.label}</p>
                <p className="text-[11px] text-slate-500 truncate">{item.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Session Quick Info Badge */}
      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-semibold text-slate-300">Sessão Ativa</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium font-mono">
            {activeSession ? activeSession.token : "Nenhuma"}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 truncate font-medium">
          {activeSession ? activeSession.name : "Selecione uma sessão"}
        </p>
        <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <Database className="w-3 h-3 text-cyan-400" />
            SQLite WAL
          </span>
          <span>{sessions.length} sessões</span>
        </div>
      </div>
    </aside>
  );
};
