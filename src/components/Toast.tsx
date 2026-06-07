"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = "info", duration = 4000) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type, duration }]);

      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  const success = useCallback((msg: string, dur?: number) => addToast(msg, "success", dur), [addToast]);
  const error = useCallback((msg: string, dur?: number) => addToast(msg, "error", dur), [addToast]);
  const info = useCallback((msg: string, dur?: number) => addToast(msg, "info", dur), [addToast]);
  const warning = useCallback((msg: string, dur?: number) => addToast(msg, "warning", dur), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info, warning }}>
      {children}
      {/* Toast Portal Container */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 max-w-md w-full pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const getIcon = (type: ToastType) => {
    switch (type) {
      case "success":
        return { name: "check_circle", color: "text-secondary" };
      case "error":
        return { name: "error", color: "text-error" };
      case "warning":
        return { name: "warning", color: "text-tertiary" };
      case "info":
      default:
        return { name: "info", color: "text-primary" };
    }
  };

  const getBorderColor = (type: ToastType) => {
    switch (type) {
      case "success":
        return "border-secondary/30";
      case "error":
        return "border-error/30";
      case "warning":
        return "border-tertiary/30";
      case "info":
      default:
        return "border-primary/30";
    }
  };

  const icon = getIcon(toast.type);
  const borderColor = getBorderColor(toast.type);

  return (
    <div
      className={`glass-card pointer-events-auto flex items-start gap-3 p-4 rounded-xl border ${borderColor} shadow-[0_8px_32px_0_rgba(11,15,26,0.5)] transition-all duration-300 animate-slide-in hover:translate-y-[-2px]`}
      role="alert"
    >
      <span className={`material-symbols-outlined text-[22px] shrink-0 ${icon.color}`}>
        {icon.name}
      </span>
      <div className="flex-1 text-sm font-medium text-on-surface leading-snug">
        {toast.message}
      </div>
      <button
        onClick={onClose}
        className="text-on-surface-variant hover:text-on-surface transition-colors p-0.5 rounded-md hover:bg-white/5 active:scale-95 duration-150"
      >
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>
    </div>
  );
}
