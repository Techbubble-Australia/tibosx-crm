"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";

export type ConfirmOptions = {
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" for destructive actions (red button and icon). */
  tone?: "default" | "danger";
  /** Critical actions: the confirm button stays disabled until this exact text is typed. */
  requireText?: string;
};

type Pending = ConfirmOptions & { resolve: (ok: boolean) => void };

const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(null);

/** In-app replacement for window.confirm: `if (!(await confirm({ title: "…" }))) return;` */
export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error("useConfirm must be used inside ConfirmDialogProvider");
  return confirm;
}

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);
  const [typed, setTyped] = useState("");
  const confirmRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setTyped("");
        setPending({ ...options, resolve });
      }),
    [],
  );

  const close = useCallback(
    (ok: boolean) => {
      pending?.resolve(ok);
      setPending(null);
    },
    [pending],
  );

  useEffect(() => {
    if (!pending) return;
    if (pending.requireText) inputRef.current?.focus();
    else confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pending, close]);

  const danger = pending?.tone === "danger";
  const textMatches = !pending?.requireText || typed.trim() === pending.requireText;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close(false);
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby={pending.message ? "confirm-dialog-message" : undefined}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex gap-4">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  danger ? "bg-red-100 text-red-600" : "dp-icon-soft"
                }`}
                aria-hidden
              >
                {danger ? <AlertTriangle className="h-5 w-5" /> : <HelpCircle className="h-5 w-5" />}
              </span>
              <div className="min-w-0 flex-1">
                <h2 id="confirm-dialog-title" className="text-base font-semibold text-slate-900">
                  {pending.title}
                </h2>
                {pending.message ? (
                  <div id="confirm-dialog-message" className="mt-1.5 text-sm leading-relaxed text-slate-600">
                    {pending.message}
                  </div>
                ) : null}
                {pending.requireText ? (
                  <div className="mt-4">
                    <label htmlFor="confirm-dialog-input" className="mb-1.5 block text-sm text-slate-700">
                      Type <span className="select-all rounded bg-slate-100 px-1.5 py-0.5 font-mono font-semibold text-slate-900">{pending.requireText}</span> to confirm
                    </label>
                    <input
                      id="confirm-dialog-input"
                      ref={inputRef}
                      value={typed}
                      onChange={(e) => setTyped(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && textMatches) {
                          e.preventDefault();
                          close(true);
                        }
                      }}
                      autoComplete="off"
                      spellCheck={false}
                      className={`dp-input ${typed && !textMatches ? "border-red-300 focus:border-red-400 focus:ring-red-400/25" : ""}`}
                      aria-invalid={Boolean(typed) && !textMatches}
                    />
                  </div>
                ) : null}
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => close(false)} className="dp-btn-secondary justify-center">
                {pending.cancelLabel ?? "Cancel"}
              </button>
              <button
                ref={confirmRef}
                type="button"
                disabled={!textMatches}
                onClick={() => close(true)}
                className={
                  danger
                    ? "inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/40 disabled:cursor-not-allowed disabled:bg-red-300"
                    : "dp-btn-primary justify-center disabled:cursor-not-allowed disabled:opacity-50"
                }
              >
                {pending.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ConfirmContext.Provider>
  );
}
