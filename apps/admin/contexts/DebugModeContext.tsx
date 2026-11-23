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
import {
  captureElementScreenshot,
  captureViewportDiagnostics,
  captureViewportScreenshot,
} from "@/lib/debug/screenshot";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import { useIsDevelopmentAppEnv } from "@/lib/use-is-development-app-env";

const DEBUG_STORAGE_KEY = "tbos-debug-mode-active";

/** Level-0 capture types from TBOS (Story replaces legacy Enhancement). */
export type DebugCaptureType = "BUG" | "STORY" | "TASK";
/** Environments we expose in the UI (DB may still store legacy `staging`). */
export type ReportedEnvironment = "development" | "production";

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
  title: string;
  userDescription: string;
  elementDiagnostics: ElementDiagnostics;
  apiPrerequisite: ApiPrerequisiteCapture | null;
  screenshotDataUrl: string | null;
  /** Images the user attached in addition to the automatic capture. */
  extraScreenshots: Array<{ file: File; previewUrl: string }>;
  userMetadata: UserMetadataSnapshot;
};

export const MAX_DEBUG_SCREENSHOTS = 20;

type DebugModeContextValue = {
  isDebugActive: boolean;
  toggleDebug: () => void;
  modalOpen: boolean;
  closeModal: () => void;
  captureLoading: boolean;
  draft: DebugCaptureDraft | null;
  setDraftField: <K extends keyof DebugCaptureDraft>(key: K, value: DebugCaptureDraft[K]) => void;
  openTicketFromElement: (el: Element) => Promise<void>;
  openTicketFromViewport: () => Promise<void>;
  recaptureViewport: () => Promise<void>;
  buildPayloadJson: () => string;
  submitTicket: () => Promise<{ ok: boolean; error?: string }>;
  copyPayloadJson: () => Promise<boolean>;
  /** Extra screenshots: add files, capture the page behind the modal, or hide the modal to set up a shot. */
  addExtraScreenshotFiles: (files: File[]) => number;
  captureExtraScreen: () => Promise<boolean>;
  captureExtraElement: (el: Element) => Promise<boolean>;
  extraCapturing: boolean;
  extraCaptureMode: boolean;
  startExtraCapture: () => void;
  finishExtraCapture: () => Promise<void>;
  cancelExtraCapture: () => void;
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
  const isDevelopmentAppEnv = useIsDevelopmentAppEnv();
  const defaultReportedEnvironment: ReportedEnvironment = isDevelopmentAppEnv ? "development" : "production";
  const [isDebugActive, setIsDebugActive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [captureLoading, setCaptureLoading] = useState(false);
  const [draft, setDraft] = useState<DebugCaptureDraft | null>(null);
  const [extraCapturing, setExtraCapturing] = useState(false);
  const [extraCaptureMode, setExtraCaptureMode] = useState(false);

  useEffect(() => {
    setIsDebugActive(readStoredDebugActive());
  }, []);

  /** Appends images to the draft (respecting the per-ticket limit); returns how many were added. */
  const addExtraScreenshotFiles = useCallback(
    (files: File[]) => {
      if (!draft) return 0;
      const used = (draft.screenshotDataUrl ? 1 : 0) + draft.extraScreenshots.length;
      const picked = files.slice(0, Math.max(MAX_DEBUG_SCREENSHOTS - used, 0));
      if (!picked.length) return 0;
      const additions = picked.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
      setDraft((prev) => (prev ? { ...prev, extraScreenshots: [...prev.extraScreenshots, ...additions] } : prev));
      return picked.length;
    },
    [draft],
  );

  const captureExtraScreen = useCallback(async () => {
    setExtraCapturing(true);
    try {
      const dataUrl = await captureViewportScreenshot();
      const file = dataUrl ? dataUrlToFile(dataUrl, `screen-capture-${Date.now()}.png`) : null;
      if (!file) return false;
      addExtraScreenshotFiles([file]);
      return true;
    } finally {
      setExtraCapturing(false);
    }
  }, [addExtraScreenshotFiles]);

  /** Captures one element (picked while the modal is hidden) and returns to the ticket. */
  const captureExtraElement = useCallback(
    async (el: Element) => {
      setExtraCapturing(true);
      try {
        const dataUrl = await captureElementScreenshot(el as HTMLElement);
        const file = dataUrl ? dataUrlToFile(dataUrl, `element-capture-${Date.now()}.png`) : null;
        if (!file) return false;
        addExtraScreenshotFiles([file]);
        setExtraCaptureMode(false);
        return true;
      } finally {
        setExtraCapturing(false);
      }
    },
    [addExtraScreenshotFiles],
  );

  const startExtraCapture = useCallback(() => setExtraCaptureMode(true), []);
  const cancelExtraCapture = useCallback(() => setExtraCaptureMode(false), []);
  const finishExtraCapture = useCallback(async () => {
    await captureExtraScreen();
    setExtraCaptureMode(false);
  }, [captureExtraScreen]);

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
    setExtraCaptureMode(false);
    setDraft((prev) => {
      prev?.extraScreenshots.forEach((shot) => URL.revokeObjectURL(shot.previewUrl));
      return null;
    });
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
      try {
        const [userMetadata, apiPrerequisite, screenshotDataUrl] = await Promise.all([
          resolveUserMetadata(),
          captureApiPrerequisite(el),
          captureElementScreenshot(el as HTMLElement),
        ]);
        setDraft({
          ticketId: `TICK-${Date.now()}`,
          type: "BUG",
          reportedEnvironment: defaultReportedEnvironment,
          title: "",
          userDescription: "",
          elementDiagnostics: captureElementDiagnostics(el),
          apiPrerequisite,
          screenshotDataUrl,
          extraScreenshots: [],
          userMetadata,
        });
        setModalOpen(true);
      } finally {
        setCaptureLoading(false);
      }
    },
    [defaultReportedEnvironment, resolveUserMetadata],
  );

  const openTicketFromViewport = useCallback(async () => {
    setCaptureLoading(true);
    try {
      const [userMetadata, screenshotDataUrl] = await Promise.all([
        resolveUserMetadata(),
        captureViewportScreenshot(),
      ]);
      setDraft({
        ticketId: `TICK-${Date.now()}`,
        type: "BUG",
        reportedEnvironment: defaultReportedEnvironment,
        title: "",
        userDescription: "",
        elementDiagnostics: captureViewportDiagnostics(),
        apiPrerequisite: null,
        screenshotDataUrl,
        extraScreenshots: [],
        userMetadata,
      });
      setModalOpen(true);
    } finally {
      setCaptureLoading(false);
    }
  }, [defaultReportedEnvironment, resolveUserMetadata]);

  const recaptureViewport = useCallback(async () => {
    setCaptureLoading(true);
    try {
      const screenshotDataUrl = await captureViewportScreenshot();
      setDraft((prev) =>
        prev
          ? {
              ...prev,
              elementDiagnostics: captureViewportDiagnostics(),
              apiPrerequisite: null,
              screenshotDataUrl,
            }
          : prev,
      );
    } finally {
      setCaptureLoading(false);
    }
  }, []);

  const buildPayloadObject = useCallback(() => {
    if (!draft) return null;
    return {
      ticketId: draft.ticketId,
      timestamp: new Date().toISOString(),
      type: draft.type,
      reportedEnvironment: draft.reportedEnvironment,
      title: draft.title,
      userDescription: draft.userDescription,
      userMetadata: draft.userMetadata,
      elementDiagnostics: draft.elementDiagnostics,
      apiPrerequisite: draft.apiPrerequisite,
      screenshotUrl: null as string | null,
      screenshotDataUrl: draft.screenshotDataUrl,
      additionalScreenshotFiles: draft.extraScreenshots.map((shot) => shot.file.name),
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
    if (!draft.title.trim()) {
      return { ok: false, error: "Title is required" };
    }
    if (!draft.userDescription.trim()) {
      return { ok: false, error: "Description is required" };
    }

    const filesToUpload: File[] = [];
    if (draft.screenshotDataUrl) {
      const file = dataUrlToFile(draft.screenshotDataUrl, `${draft.ticketId}.png`);
      if (file) filesToUpload.push(file);
    }
    filesToUpload.push(...draft.extraScreenshots.map((shot) => shot.file));

    const screenshotUrls: string[] = [];
    for (const file of filesToUpload) {
      const form = new FormData();
      form.append("image", file);
      const up = await adminFetch("/api/upload/image", { method: "POST", body: form });
      const upJson = await up.json().catch(() => ({}));
      const url = up.ok ? readUploadImageUrlFromJson(upJson) : null;
      if (!url) {
        return {
          ok: false,
          error: messageFromApiError(upJson, `Upload failed for ${file.name}. The ticket was not saved.`),
        };
      }
      screenshotUrls.push(url);
    }
    const screenshotUrl = screenshotUrls[0] ?? null;

    const fullPayload = {
      ...JSON.parse(buildPayloadJson()),
      screenshotUrl,
      screenshotUrls,
    };
    delete (fullPayload as { screenshotDataUrl?: string }).screenshotDataUrl;

    const res = await adminFetch("/api/admin/debug-capture-tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticketId: draft.ticketId,
        type: draft.type,
        reportedEnvironment: draft.reportedEnvironment,
        title: draft.title.trim(),
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
        screenshotUrls,
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
      openTicketFromViewport,
      recaptureViewport,
      buildPayloadJson,
      submitTicket,
      copyPayloadJson,
      addExtraScreenshotFiles,
      captureExtraScreen,
      captureExtraElement,
      extraCapturing,
      extraCaptureMode,
      startExtraCapture,
      finishExtraCapture,
      cancelExtraCapture,
    }),
    [
      addExtraScreenshotFiles,
      captureExtraScreen,
      captureExtraElement,
      extraCapturing,
      extraCaptureMode,
      startExtraCapture,
      finishExtraCapture,
      cancelExtraCapture,
      isDebugActive,
      toggleDebug,
      modalOpen,
      closeModal,
      captureLoading,
      draft,
      setDraftField,
      openTicketFromElement,
      openTicketFromViewport,
      recaptureViewport,
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
