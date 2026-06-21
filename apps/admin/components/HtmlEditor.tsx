"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bold, Italic, List, ListOrdered, Link2, Heading2, Underline } from "lucide-react";

type Props = {
  name?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
};

function exec(cmd: string, value?: string) {
  document.execCommand(cmd, false, value);
}

export function HtmlEditor({
  name = "description",
  defaultValue = "",
  value: controlledValue,
  onChange,
  placeholder = "Role description, responsibilities, requirements…",
  className = "",
}: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [internal, setInternal] = useState(defaultValue);
  const html = controlledValue ?? internal;

  useEffect(() => {
    if (editorRef.current && defaultValue && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = defaultValue;
      setInternal(defaultValue);
    }
  }, [defaultValue]);

  const sync = useCallback(() => {
    const next = editorRef.current?.innerHTML ?? "";
    setInternal(next);
    onChange?.(next);
  }, [onChange]);

  function insertLink() {
    const url = window.prompt("Enter URL (https://…)");
    if (!url?.trim()) return;
    exec("createLink", url.trim());
    sync();
  }

  const toolbarBtn =
    "inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700";

  return (
    <div className={className}>
      <div className="mb-2 flex flex-wrap gap-1 rounded-t-lg border border-b-0 border-gray-200 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-900">
        <button type="button" className={toolbarBtn} onClick={() => { exec("bold"); sync(); }} aria-label="Bold">
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" className={toolbarBtn} onClick={() => { exec("italic"); sync(); }} aria-label="Italic">
          <Italic className="h-4 w-4" />
        </button>
        <button type="button" className={toolbarBtn} onClick={() => { exec("underline"); sync(); }} aria-label="Underline">
          <Underline className="h-4 w-4" />
        </button>
        <button type="button" className={toolbarBtn} onClick={() => { exec("formatBlock", "h2"); sync(); }} aria-label="Heading">
          <Heading2 className="h-4 w-4" />
        </button>
        <button type="button" className={toolbarBtn} onClick={() => { exec("insertUnorderedList"); sync(); }} aria-label="Bullet list">
          <List className="h-4 w-4" />
        </button>
        <button type="button" className={toolbarBtn} onClick={() => { exec("insertOrderedList"); sync(); }} aria-label="Numbered list">
          <ListOrdered className="h-4 w-4" />
        </button>
        <button type="button" className={toolbarBtn} onClick={insertLink} aria-label="Insert link">
          <Link2 className="h-4 w-4" />
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        role="textbox"
        aria-multiline
        data-placeholder={placeholder}
        className="min-h-[200px] w-full rounded-b-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 empty:before:text-gray-400 empty:before:content-[attr(data-placeholder)]"
        onInput={sync}
        onBlur={sync}
        suppressContentEditableWarning
      />
      <input type="hidden" name={name} value={html} readOnly />
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Rich text editor — supports headings, lists, bold, italic, and links. Up to 500,000 characters.
      </p>
    </div>
  );
}
