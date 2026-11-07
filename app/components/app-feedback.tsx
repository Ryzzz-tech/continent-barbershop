"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type ToastKind = "success" | "error" | "info";

type Toast = {
  id: number;
  title: string;
  message: string;
  kind: ToastKind;
};

type AppFeedbackContextValue = {
  showToast: (title: string, message: string, kind?: ToastKind) => void;
};

const AppFeedbackContext = createContext<AppFeedbackContextValue | null>(null);
let nextToastId = 0;

function ToastNotification({
  toast,
  onClose,
}: {
  toast: Toast;
  onClose: () => void;
}) {
  return (
    <div
      className={`app-toast app-toast--${toast.kind}`}
      role={toast.kind === "error" ? "alert" : "status"}
      aria-live={toast.kind === "error" ? "assertive" : "polite"}
    >
      <span className="app-toast__icon" aria-hidden="true">
        {toast.kind === "success" ? "✓" : toast.kind === "error" ? "!" : "i"}
      </span>
      <div className="app-toast__content">
        <strong>{toast.title}</strong>
        <p>{toast.message}</p>
      </div>
      <button
        aria-label="Tutup notifikasi"
        className="app-toast__close"
        onClick={onClose}
        type="button"
      >
        ×
      </button>
    </div>
  );
}

export function AppFeedbackProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback(
    (title: string, message: string, kind: ToastKind = "info") => {
      setToast({ id: ++nextToastId, title, message, kind });
    },
    [],
  );

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const closeToast = useCallback(() => setToast(null), []);

  return (
    <AppFeedbackContext.Provider value={{ showToast }}>
      {children}
      {toast && <ToastNotification toast={toast} onClose={closeToast} />}
    </AppFeedbackContext.Provider>
  );
}

export function useAppFeedback() {
  const context = useContext(AppFeedbackContext);
  if (!context) {
    throw new Error("useAppFeedback harus digunakan di dalam AppFeedbackProvider.");
  }
  return context;
}
