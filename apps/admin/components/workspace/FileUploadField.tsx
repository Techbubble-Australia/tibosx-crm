"use client";

import { useRef, useState } from "react";
import { Paperclip, X } from "lucide-react";

const MAX_FILES = 5;

export function FileUploadField({
  files,
  onChange,
}: {
  files: File[];
  onChange: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function addFiles(list: FileList | null) {
    if (!list?.length) return;
    const next = [...files];
    for (const file of Array.from(list)) {
      if (next.length >= MAX_FILES) break;
      next.push(file);
    }
    onChange(next);
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium">Attachments (optional)</label>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed px-4 py-6 text-center text-sm transition ${
          dragOver ? "border-sky-500 bg-sky-50" : "border-gray-200 bg-gray-50 hover:border-gray-300"
        }`}
      >
        <Paperclip className="mx-auto mb-2 h-5 w-5 text-gray-400" />
        <p className="text-gray-600">Drop files here or click to browse</p>
        <p className="mt-1 text-xs text-gray-400">PDF, images, Word — up to 10MB each, max {MAX_FILES} files</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.txt,.doc,.docx"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>
      {files.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {files.map((file, i) => (
            <li key={`${file.name}-${i}`} className="flex items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm">
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                className="text-gray-400 hover:text-red-600"
                onClick={() => onChange(files.filter((_, idx) => idx !== i))}
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
