import React, { useState } from "react";
import { Modal } from "./Modal";
import { Copy, Check, QrCode } from "lucide-react";

export const QrCodeModal = ({ isOpen, onClose, url, title = "QR Code do Webhook" }) => {
  const [copied, setCopied] = useState(false);

  if (!url) return null;

  const copyUrl = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(
    url
  )}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center space-y-4 py-2">
        <div className="p-4 bg-white rounded-2xl shadow-xl flex items-center justify-center">
          <img src={qrImageUrl} alt="QR Code" className="w-56 h-56 rounded-lg" />
        </div>

        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
          Aponte a câmera do celular ou leitor de QR para abrir ou disparar requisições diretamente para esta sessão.
        </p>

        <div className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
          <span className="truncate flex-1 text-left">{url}</span>
          <button
            onClick={copyUrl}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Copiar URL"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </Modal>
  );
};
