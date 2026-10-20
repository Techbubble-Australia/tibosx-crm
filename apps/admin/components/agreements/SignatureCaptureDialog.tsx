"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Keyboard, PenLine, Redo2, Trash2, Undo2, X } from "lucide-react";

type Tab = "draw" | "type" | "upload";

type Props = {
  open: boolean;
  title?: string;
  onClose: () => void;
  onInsert: (dataUrl: string) => void;
};

function renderTypedSignature(text: string, canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.floor(rect.width * ratio);
  canvas.height = Math.floor(rect.height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, rect.width, rect.height);
  ctx.fillStyle = "#111827";
  ctx.font = `48px "Segoe Script", "Brush Script MT", cursive`;
  ctx.textBaseline = "middle";
  ctx.fillText(text.trim(), 16, rect.height / 2);
}

export function SignatureCaptureDialog({ open, title = "Add your signature", onClose, onInsert }: Props) {
  const [tab, setTab] = useState<Tab>("draw");
  const [legalAck, setLegalAck] = useState(false);
  const [typedName, setTypedName] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const historyRef = useRef<ImageData[]>([]);
  const redoRef = useRef<ImageData[]>([]);

  const reset = useCallback(() => {
    setPreview(null);
    setTypedName("");
    setLegalAck(false);
    setTab("draw");
    historyRef.current = [];
    redoRef.current = [];
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  useEffect(() => {
    if (!open || tab !== "draw") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * ratio);
      canvas.height = Math.floor(rect.height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#111827";
      historyRef.current = [];
      redoRef.current = [];
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [open, tab]);

  function snapshotCanvas() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    historyRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (historyRef.current.length > 30) historyRef.current.shift();
    redoRef.current = [];
    setPreview(canvas.toDataURL("image/png"));
  }

  function getPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function undo() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || historyRef.current.length === 0) return;
    redoRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    const prev = historyRef.current.pop()!;
    ctx.putImageData(prev, 0, 0);
    setPreview(canvas.toDataURL("image/png"));
  }

  function redo() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || redoRef.current.length === 0) return;
    historyRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    const next = redoRef.current.pop()!;
    ctx.putImageData(next, 0, 0);
    setPreview(canvas.toDataURL("image/png"));
  }

  function clearDraw() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    snapshotCanvas();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setPreview(null);
  }

  function applyTyped() {
    const canvas = canvasRef.current;
    if (!canvas || !typedName.trim()) return;
    renderTypedSignature(typedName, canvas);
    setPreview(canvas.toDataURL("image/png"));
  }

  function onUpload(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : null;
      if (!dataUrl) return;
      setPreview(dataUrl);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      const img = new Image();
      img.onload = () => {
        const rect = canvas.getBoundingClientRect();
        const ratio = window.devicePixelRatio || 1;
        canvas.width = Math.floor(rect.width * ratio);
        canvas.height = Math.floor(rect.height * ratio);
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.clearRect(0, 0, rect.width, rect.height);
        const scale = Math.min(rect.width / img.width, rect.height / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (rect.width - w) / 2, (rect.height - h) / 2, w, h);
        setPreview(canvas.toDataURL("image/png"));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  const canInsert = legalAck && Boolean(preview);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h4>
          <button type="button" onClick={onClose} className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex border-b border-gray-100 dark:border-gray-800">
          {(
            [
              { id: "draw" as const, label: "Draw", icon: PenLine },
              { id: "type" as const, label: "Type", icon: Keyboard },
              { id: "upload" as const, label: "Upload", icon: Camera },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setTab(id);
                setPreview(null);
              }}
              className={`flex flex-1 items-center justify-center gap-2 border-b-2 px-3 py-3 text-sm font-medium ${
                tab === id
                  ? "border-sky-600 text-gray-900 dark:text-gray-100"
                  : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {tab === "type" ? (
            <div className="mb-3 space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Type your name</label>
              <input
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="Your full name"
              />
              <button
                type="button"
                onClick={applyTyped}
                className="text-sm font-medium text-sky-600 hover:underline"
              >
                Preview signature
              </button>
            </div>
          ) : null}

          {tab === "upload" ? (
            <div className="mb-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-600 dark:border-gray-600">
                <Camera className="h-4 w-4" />
                Choose image
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          ) : null}

          <div className="relative rounded-lg border border-gray-300 bg-white dark:border-gray-600">
            <canvas
              ref={canvasRef}
              className={`h-44 w-full touch-none ${tab === "draw" ? "cursor-crosshair" : ""}`}
              onPointerDown={(e) => {
                if (tab !== "draw") return;
                const canvas = canvasRef.current;
                const ctx = canvas?.getContext("2d");
                if (!canvas || !ctx) return;
                snapshotCanvas();
                drawingRef.current = true;
                canvas.setPointerCapture(e.pointerId);
                const point = getPoint(e);
                ctx.beginPath();
                ctx.moveTo(point.x, point.y);
              }}
              onPointerMove={(e) => {
                if (!drawingRef.current || tab !== "draw") return;
                const ctx = canvasRef.current?.getContext("2d");
                if (!ctx) return;
                const point = getPoint(e);
                ctx.lineTo(point.x, point.y);
                ctx.stroke();
              }}
              onPointerUp={(e) => {
                if (!drawingRef.current) return;
                drawingRef.current = false;
                canvasRef.current?.releasePointerCapture(e.pointerId);
                if (canvasRef.current) setPreview(canvasRef.current.toDataURL("image/png"));
              }}
            />
            <div className="pointer-events-none absolute bottom-3 left-8 right-8 border-b border-gray-400" />
          </div>

          {tab === "draw" ? (
            <div className="mt-2 flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
              <button type="button" onClick={clearDraw} className="inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800">
                <Trash2 className="h-4 w-4" /> Clear
              </button>
              <span className="text-gray-300">|</span>
              <button type="button" onClick={undo} className="inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800">
                <Undo2 className="h-4 w-4" /> Undo
              </button>
              <span className="text-gray-300">|</span>
              <button type="button" onClick={redo} className="inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800">
                <Redo2 className="h-4 w-4" /> Redo
              </button>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
            <input type="checkbox" checked={legalAck} onChange={(e) => setLegalAck(e.target.checked)} className="mt-0.5" />
            I understand this is a legal representation of my signature.
          </label>
          <button
            type="button"
            disabled={!canInsert}
            onClick={() => {
              if (preview) onInsert(preview);
            }}
            className="shrink-0 rounded-lg bg-sky-600 px-5 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  );
}
