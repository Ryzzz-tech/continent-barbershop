"use client";

import { useEffect, useId, useState } from "react";

type ConfirmDialogProps = {
  title: string;
  description: string;
  detail?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => boolean | Promise<boolean>;
  onClose: () => void;
};

export default function ConfirmDialog({
  title,
  description,
  detail = "Data yang telah dihapus tidak dapat dikembalikan.",
  confirmLabel = "Ya, Hapus",
  cancelLabel = "Batal",
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const titleId = useId();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isProcessing) onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isProcessing, onClose]);

  async function handleConfirm() {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => resolve());
      });
      if (await onConfirm()) onClose();
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="app-dialog-backdrop">
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className="app-confirm-dialog"
        role="dialog"
      >
        <button
          aria-label="Tutup dialog"
          className="app-confirm-dialog__close"
          disabled={isProcessing}
          onClick={onClose}
          type="button"
        >
          ×
        </button>
        <span className="app-confirm-dialog__icon" aria-hidden="true">!</span>
        <h2 id={titleId}>{title}</h2>
        <p>{description}</p>
        {detail && <p className="app-confirm-dialog__detail">{detail}</p>}
        <div className="app-confirm-dialog__actions">
          <button
            className="app-confirm-dialog__cancel"
            disabled={isProcessing}
            onClick={onClose}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className="app-confirm-dialog__confirm"
            disabled={isProcessing}
            onClick={handleConfirm}
            type="button"
          >
            {isProcessing ? (
              <>
                <span className="app-confirm-dialog__spinner" aria-hidden="true" />
                Memproses...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </section>
    </div>
  );
}
