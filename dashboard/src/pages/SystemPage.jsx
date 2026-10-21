import React, { useState, useEffect } from "react";
import { Cpu, HardDrive, Database, Wifi, Clock, Server, RefreshCw, Copy, Check } from "lucide-react";
import { Badge } from "../components/Badge";
import { useApp } from "../context/AppContext";

export const SystemPage = () => {
  const { showToast } = useApp();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedIp, setCopiedIp] = useState(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/system/status");
      const data = await res.json();
      if (data.success) {
        setMetrics(data.data);
      }
    } catch (err) {
      console.error("Falha ao buscar status do sistema:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const copyIp = (ip, port) => {
    const url = `http://${ip}:${port}`;
    navigator.clipboard.writeText(url);
    setCopiedIp(ip);
    showToast(`URL ${url} copiada!`);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatUptime = (seconds) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d > 0 ? `${d}d ` : ""}${h}h ${m}m ${s}s`;
  };

  if (!metrics) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs">
        Carregando métricas do sistema...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Diagnósticos & Sistema</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Métricas de desempenho, banco de dados SQLite WAL e endereços de rede para testes.
          </p>
        </div>

        <button
          onClick={fetchStatus}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          title="Atualizar"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Server Status */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="flex items-center gap-1.5 font-medium">
              <Server className="w-4 h-4 text-cyan-400" />
              Servidor HTTP
            </span>
            <Badge variant="emerald">Online</Badge>
          </div>
          <p className="text-xl font-bold text-slate-100 font-mono">
            Porta {metrics.config.port}
          </p>
          <p className="text-[11px] text-slate-500 font-mono">
            Node.js {metrics.nodeVersion} ({metrics.platform})
          </p>
        </div>

        {/* Card 2: Uptime */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="w-4 h-4 text-emerald-400" />
              Tempo de Atividade
            </span>
          </div>
          <p className="text-xl font-bold text-slate-100 font-mono">
            {formatUptime(metrics.uptime)}
          </p>
          <p className="text-[11px] text-slate-500">
            Iniciado em {new Date(metrics.startTime).toLocaleTimeString()}
          </p>
        </div>

        {/* Card 3: Memory Usage */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="flex items-center gap-1.5 font-medium">
              <HardDrive className="w-4 h-4 text-purple-400" />
              Memória Heap
            </span>
            <span className="text-[11px] font-mono text-purple-400">
              {formatBytes(metrics.memory.heapUsed)}
            </span>
          </div>
          <p className="text-xl font-bold text-slate-100 font-mono">
            {metrics.memory.osUsedPercent}% <span className="text-xs text-slate-500 font-normal">SO</span>
          </p>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-purple-500 h-full rounded-full transition-all"
              style={{ width: `${metrics.memory.osUsedPercent}%` }}
            />
          </div>
        </div>

        {/* Card 4: SQLite Database */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="flex items-center gap-1.5 font-medium">
              <Database className="w-4 h-4 text-amber-400" />
              SQLite WAL
            </span>
            <Badge variant="amber">WAL</Badge>
          </div>
          <p className="text-xl font-bold text-slate-100 font-mono">
            {metrics.database.totalRequests} reqs
          </p>
          <p className="text-[11px] text-slate-500 font-mono">
            Tamanho: {formatBytes(metrics.database.sizeBytes)}
          </p>
        </div>
      </div>

      {/* Network Interfaces Section */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2">
          <Wifi className="w-4 h-4 text-cyan-400" />
          <h3 className="font-semibold text-sm text-slate-100">
            Endereços IP de Rede (LAN)
          </h3>
        </div>
        <p className="text-xs text-slate-400">
          Use estes endereços para enviar webhooks a partir de smartphones, gateways ou outros computadores na mesma rede:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {metrics.ipAddresses.map((ip) => {
            const url = `http://${ip.address}:${metrics.config.port}`;
            return (
              <div
                key={ip.address}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">
                    {ip.interface}
                  </span>
                  <span className="font-mono text-cyan-300 font-semibold">{url}</span>
                </div>
                <button
                  onClick={() => copyIp(ip.address, metrics.config.port)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="Copiar URL"
                >
                  {copiedIp === ip.address ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Technical Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hardware & CPU */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <h3 className="font-semibold text-sm text-slate-100">Processamento & CPU</h3>
          </div>
          <div className="space-y-2 text-xs font-mono text-slate-300">
            <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
              <span className="text-slate-500">Modelo CPU:</span>
              <span className="truncate max-w-[260px]">{metrics.cpu.model}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
              <span className="text-slate-500">Cores / Threads:</span>
              <span>{metrics.cpu.cores}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
              <span className="text-slate-500">Carga Média (1m, 5m, 15m):</span>
              <span>{metrics.cpu.loadAvg.map((l) => l.toFixed(2)).join(", ")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Arquitetura:</span>
              <span>{metrics.arch}</span>
            </div>
          </div>
        </div>

        {/* Database & Storage */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-400" />
            <h3 className="font-semibold text-sm text-slate-100">Armazenamento & SQLite</h3>
          </div>
          <div className="space-y-2 text-xs font-mono text-slate-300">
            <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
              <span className="text-slate-500">Caminho do Banco:</span>
              <span className="truncate max-w-[260px] text-slate-400" title={metrics.database.path}>
                {metrics.database.path}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
              <span className="text-slate-500">Tamanho em Disco:</span>
              <span>{formatBytes(metrics.database.sizeBytes)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
              <span className="text-slate-500">Total de Sessões:</span>
              <span>{metrics.database.totalSessions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total de Requisições:</span>
              <span>{metrics.database.totalRequests}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
