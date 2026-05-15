"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const TONES = {
  success: { icon: CheckCircle2, className: "toast toast-success" },
  warning: { icon: AlertTriangle, className: "toast toast-warning" },
  error: { icon: AlertTriangle, className: "toast toast-error" },
  info: { icon: Info, className: "toast toast-info" },
};

let nextToastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((message, tone = "success", duration = 3500) => {
    const id = ++nextToastId;
    setToasts((current) => [...current, { id, message, tone }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, duration);
    }
    return id;
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, dismiss }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  return (
    <div className="toast-container" role="status" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => {
        const config = TONES[toast.tone] || TONES.info;
        const Icon = config.icon;
        return (
          <div className={config.className} key={toast.id}>
            <Icon size={18} aria-hidden="true" />
            <span>{toast.message}</span>
            <button type="button" aria-label="Dismiss notification" onClick={() => dismiss(toast.id)}>
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return { addToast: () => {}, dismiss: () => {} };
  }
  return ctx;
}
