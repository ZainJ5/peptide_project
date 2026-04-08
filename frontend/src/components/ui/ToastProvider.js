"use client";

import { createContext, useCallback, useContext, useMemo, useState, useEffect, useRef } from "react";

const ToastContext = createContext(null);

const toneStyles = {
  success: "border-emerald-200 bg-emerald-50/95 text-emerald-900",
  error: "border-rose-200 bg-rose-50/95 text-rose-900",
  info: "border-blue-200 bg-blue-50/95 text-blue-900",
};

function ToastItem({ toast, onRemove }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    // trigger enter animation
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleRemove = useCallback(() => {
    setVisible(false);
    // wait for exit animation
    setTimeout(() => onRemove(toast.id), 200);
  }, [toast.id, onRemove]);

  useEffect(() => {
    const timer = setTimeout(handleRemove, 3400);
    return () => clearTimeout(timer);
  }, [handleRemove]);

  return (
    <div
      ref={ref}
      style={{
        transition: "opacity 200ms ease, transform 200ms ease",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(-12px) scale(0.98)",
      }}
      className={`pointer-events-auto min-w-72 max-w-sm rounded-2xl border px-4 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.12)] backdrop-blur ${toneStyles[toast.tone] || toneStyles.info}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">{toast.message}</p>
        <button
          onClick={handleRemove}
          className="shrink-0 rounded-full p-1 transition-colors hover:bg-black/10"
          aria-label="Dismiss notification"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, tone = "info") => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((current) => [...current, { id, message, tone }]);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div role="status" aria-live="polite" className="pointer-events-none fixed right-4 top-4 z-100 space-y-2">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
