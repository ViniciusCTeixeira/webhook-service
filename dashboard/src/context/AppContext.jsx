import React, { createContext, useContext, useState, useEffect } from "react";
import { io } from "socket.io-client";

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [socket, setSocket] = useState(null);
  const [toast, setToast] = useState(null);

  const baseUrl = window.location.origin;

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/v1/sessions");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setSessions(data.data);
        // If active session not set, or no longer exists, select first
        setActiveSession((prev) => {
          if (!prev && data.data.length > 0) return data.data[0];
          const exists = data.data.find((s) => s.id === prev?.id);
          return exists || data.data[0] || null;
        });
      }
    } catch (err) {
      console.error("Falha ao carregar sessões:", err);
    } finally {
      setLoadingSessions(false);
    }
  };

  // Setup Socket.IO connection
  useEffect(() => {
    const s = io("/", {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
    });

    s.on("connect", () => {
      console.log("WebSocket conectado:", s.id);
    });

    s.on("sessionCreated", (newSess) => {
      setSessions((prev) => [...prev, newSess]);
    });

    s.on("sessionUpdated", (updSess) => {
      setSessions((prev) => prev.map((s) => (s.id === updSess.id ? { ...s, ...updSess } : s)));
      setActiveSession((prev) => (prev?.id === updSess.id ? { ...prev, ...updSess } : prev));
    });

    s.on("sessionDeleted", ({ id }) => {
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setActiveSession((prev) => (prev?.id === id ? null : prev));
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  // Join session room when activeSession changes
  useEffect(() => {
    if (socket && activeSession?.token) {
      socket.emit("joinSession", activeSession.token);
      return () => {
        socket.emit("leaveSession", activeSession.token);
      };
    }
  }, [socket, activeSession?.token]);

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <AppContext.Provider
      value={{
        sessions,
        activeSession,
        setActiveSession,
        loadingSessions,
        fetchSessions,
        socket,
        baseUrl,
        showToast,
      }}
    >
      {children}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 shadow-2xl text-xs font-medium animate-in slide-in-from-bottom-2 duration-200">
          <span
            className={`w-2 h-2 rounded-full ${
              toast.type === "error" ? "bg-rose-500" : "bg-emerald-400"
            }`}
          />
          {toast.message}
        </div>
      )}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp deve ser usado dentro de AppProvider");
  return context;
};
