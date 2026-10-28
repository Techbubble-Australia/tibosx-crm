"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { adminFetch } from "@/lib/admin-api";
import { messageFromApiError } from "@/lib/api-error";
import { readUploadImageUrlFromJson } from "@/lib/upload-response";
import { captureApiPrerequisite, type ApiPrerequisiteCapture } from "@/lib/debug/api-prerequisite";
import { captureElementDiagnostics, type ElementDiagnostics } from "@/lib/debug/css-selector";
import { useAdminSession } from "@/contexts/AdminSessionContext";

const DEBUG_STORAGE_KEY = "tbos-debug-mode-active";

export type DebugCaptureType = "BUG" | "ENHANCEMENT";
export type ReportedEnvironment = "development" | "staging" | "production";

export type UserMetadataSnapshot = {
  userId: string;
  role: string;
  email: string;
  userAgent: string;
  currentUrl: string;
  clientIp?: string | null;
};

export type DebugCaptureDraft = {
  ticketId: string;
  type: DebugCaptureType;
  reportedEnvironment: ReportedEnvironment;
  userDescription: string;
  elementDiagnostics: ElementDiagnostics;
  apiPrerequisite: ApiPrerequisiteCapture | null;
  screenshotDataUrl: string | null;
  userMetadata: UserMetadataSnapshot;
};

type DebugModeContextValue = {
  isDebugActive: boolean;
  toggleDebug: () => void;
  modalOpen: boolean;
  closeModal: () => void;
  captureLoading: boolean;
  draft: DebugCaptureDraft | null;
  setDraftField: <K extends keyof DebugCaptureDraft>(key: K, value: DebugCaptureDraft[K]) => void;
  openTicketFromElement: (el: Element) => Promise<void>;
  buildPayloadJson: () => string;
  submitTicket: () => Promise<{ ok: boolean; error?: string }>;
  copyPayloadJson: () => Promise<boolean>;
};

const DebugModeContext = createContext<DebugModeContextValue | null>(null);

function readStoredDebugActive(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(DEBUG_STORAGE_KEY) === "1";
}

function dataUrlToFile(dataUrl: string, filename: string): File | null {
  try {
    const [header, base64] = dataUrl.split(",");
    if (!header || !base64) return null;
    const mime = header.match(/data:([^;]+);/)?.[1] ?? "image/png";
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new File([bytes], filename, { type: mime });
  } catch {
    return null;
  }
}

export function DebugModeProvider({ children }: { children: ReactNode }) {
  const { userId, role, email } = useAdminSession();
  const [isDebugActive, setIsDebugActive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [captureLoading, setCaptureLoading] = useState(false);
  const [draft, setDraft] = useState<DebugCaptureDraft | null>(null);

  useEffect(() => {
    setIsDebugActive(readStoredDebugActive());
  }, []);

  const persistActive = useCallback((next: boolean) => {
    setIsDebugActive(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DEBUG_STORAGE_KEY, next ? "1" : "0");
    }
  }, []);

  const toggleDebug = useCallback(() => {
    persistActive(!isDebugActive);
  }, [isDebugActive, persistActive]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setDraft(null);
  }, []);

  const setDraftField = useCallback(
    <K extends keyof DebugCaptureDraft>(key: K, value: DebugCaptureDraft[K]) => {
      setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
    },
    [],
  );

  const resolveUserMetadata = useCallback(async (): Promise<UserMetadataSnapshot> => {
    const base: UserMetadataSnapshot = {
      userId: userId || "unknown",
      role: role || "unknown",
      email: email || "",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      currentUrl: typeof window !== "undefined" ? window.location.href : "",
    };
    if (userId) return base;
    try {
      const res = await adminFetch("/api/auth/me");
      const data = await res.json();
      const user = data?.data?.user;
      return {
        userId: typeof user?.id === "string" ? user.id : base.userId,
        role: typeof user?.role === "string" ? user.role : base.role,
        email: typeof user?.email === "string" ? user.email : base.email,
        userAgent: base.userAgent,
        currentUrl: base.currentUrl,
      };
    } catch {
      return base;
    }
  }, [email, role, userId]);

  const openTicketFromElement = useCallback(
    async (el: Element) => {
      setCaptureLoading(true);
      setModalOpen(true);
      try {
        const [userMetadata, apiPrerequisite] = await Promise.all([
          resolveUserMetadata(),
          captureApiPrerequisite(el),
        ]);
        let screenshotDataUrl: string | null = null;
        try {
          const html2canvas = (await import("html2canvas")).default;
          const canvas = await html2canvas(el as HTMLElement, {
            backgroundColor: "#ffffff",
            scale: 1,
            logging: false,
          });
          screenshotDataUrl = canvas.toDataURL("image/png");
        } catch {
          screenshotDataUrl = null;
        }
        setDraft({
          ticketId: `TICK-${Date.now()}`,
          type: "BUG",
          reportedEnvironment: "development",
          userDescription: "",
          elementDiagnostics: captureElementDiagnostics(el),
          apiPrerequisite,
          screenshotDataUrl,
          userMetadata,
        });
      } finally {
        setCaptureLoading(false);
      }
    },
    [resolveUserMetadata],
  );

  const buildPayloadObject = useCallback(() => {
    if (!draft) return null;
    return {
      ticketId: draft.ticketId,
      timestamp: new Date().toISOString(),
      type: draft.type,
      reportedEnvironment: draft.reportedEnvironment,
      userDescription: draft.userDescription,
      userMetadata: draft.userMetadata,
      elementDiagnostics: draft.elementDiagnostics,
      apiPrerequisite: draft.apiPrerequisite,
      screenshotUrl: null as string | null,
      screenshotDataUrl: draft.screenshotDataUrl,
    };
  }, [draft]);

  const buildPayloadJson = useCallback(() => {
    const obj = buildPayloadObject();
    return obj ? JSON.stringify(obj, null, 2) : "{}";
  }, [buildPayloadObject]);

  const copyPayloadJson = useCallback(async () => {
    const text = buildPayloadJson();
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }, [buildPayloadJson]);

  const submitTicket = useCallback(async () => {
    if (!draft) return { ok: false, error: "Nothing to save" };
    if (!draft.userDescription.trim()) {
      return { ok: false, error: "Description is required" };
    }

    let screenshotUrl: string | null = null;
    if (draft.screenshotDataUrl) {
      const file = dataUrlToFile(draft.screenshotDataUrl, `${draft.ticketId}.png`);
      if (file) {
        const form = new FormData();
        form.append("file", file);
        const up = await adminFetch("/api/upload/image", { method: "POST", body: form });
        const upJson = await up.json().catch(() => ({}));
        if (up.ok) {
          screenshotUrl = readUploadImageUrlFromJson(upJson) || null;
        }
      }
    }

    const fullPayload = {
      ...JSON.parse(buildPayloadJson()),
      screenshotUrl,
    };
    delete (fullPayload as { screenshotDataUrl?: string }).screenshotDataUrl;

    const res = await adminFetch("/api/admin/debug-capture-tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticketId: draft.ticketId,
        type: draft.type,
        reportedEnvironment: draft.reportedEnvironment,
        userDescription: draft.userDescription.trim(),
        userMetadata: {
          userId: draft.userMetadata.userId,
          role: draft.userMetadata.role,
          userAgent: draft.userMetadata.userAgent,
          currentUrl: draft.userMetadata.currentUrl,
        },
        elementDiagnostics: draft.elementDiagnostics,
        apiPrerequisite: draft.apiPrerequisite,
        screenshotUrl,
        fullPayload,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: messageFromApiError(data, "Failed to save ticket") };
    }
    if (typeof data.clientIp === "string") {
      setDraft((prev) =>
        prev
          ? {
              ...prev,
              userMetadata: { ...prev.userMetadata, clientIp: data.clientIp },
            }
          : prev,
      );
    }
    return { ok: true };
  }, [buildPayloadJson, draft]);

  const value = useMemo(
    () => ({
      isDebugActive,
      toggleDebug,
      modalOpen,
      closeModal,
      captureLoading,
      draft,
      setDraftField,
      openTicketFromElement,
      buildPayloadJson,
      submitTicket,
      copyPayloadJson,
    }),
    [
      isDebugActive,
      toggleDebug,
      modalOpen,
      closeModal,
      captureLoading,
      draft,
      setDraftField,
      openTicketFromElement,
      buildPayloadJson,
      submitTicket,
      copyPayloadJson,
    ],
  );

  return <DebugModeContext.Provider value={value}>{children}</DebugModeContext.Provider>;
}

export function useDebugMode(): DebugModeContextValue {
  const ctx = useContext(DebugModeContext);
  if (!ctx) {
    throw new Error("useDebugMode must be used within DebugModeProvider");
  }
  return ctx;
}

export function useDebugModeOptional(): DebugModeContextValue | null {
  return useContext(DebugModeContext);
}
