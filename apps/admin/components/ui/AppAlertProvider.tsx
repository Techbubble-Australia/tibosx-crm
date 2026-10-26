"use client";

import { useCallback, useEffect, useState } from "react";
import {
  registerAppAlertHandlers,
  type AppAlertOptions,
  type AppConfirmOptions,
} from "@/lib/app-alert";

type AlertState = AppAlertOptions & { kind: "alert" };
type ConfirmState = AppConfirmOptions & { kind: "confirm"; resolve: (value: boolean) => void };

export function AppAlertProvider({ children }: { children: React.ReactNode }) {
  const [modal, setModal] = useState<AlertState | ConfirmState | null>(null);

  const close = useCallback(() => setModal(null), []);

  useEffect(() => {
    registerAppAlertHandlers({
      alert: (options) => setModal({ kind: "alert", ...options }),
      confirm: (options) =>
        new Promise<boolean>((resolve) => {
          setModal({ kind: "confirm", ...options, resolve });
        }),
    });
    return () => registerAppAlertHandlers(null);
  }, []);

  return (
    <>
      {children}
      {modal ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && modal.kind === "alert") close();
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="app-alert-title"
            aria-describedby="app-alert-message"
            className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-900"
          >
            <h2 id="app-alert-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {modal.title ?? (modal.kind === "confirm" ? "Confirm" : "Notice")}
            </h2>
            <p id="app-alert-message" className="mt-2 whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-300">
              {modal.message}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              {modal.kind === "confirm" ? (
                <>
                  <button
                    type="button"
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                    onClick={() => {
                      modal.resolve(false);
                      close();
                    }}
                  >
                    {modal.cancelLabel ?? "Cancel"}
                  </button>
                  <button
                    type="button"
                    className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
                      modal.destructive
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-sky-600 hover:bg-sky-700"
                    }`}
                    onClick={() => {
                      modal.resolve(true);
                      close();
                    }}
                  >
                    {modal.confirmLabel ?? "Continue"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
                  onClick={close}
                >
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
