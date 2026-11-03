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

  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternal(controlledValue);
    }
  }, [controlledValue]);

  function focusEditor() {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }

  function runCommand(cmd: string, value?: string) {
    focusEditor();
    exec(cmd, value);
    sync();
  }

  function insertLink() {
    focusEditor();
    const url = window.prompt("Enter URL (https://…)");
    if (!url?.trim()) return;
    exec("createLink", url.trim());
    sync();
  }

  const toolbarBtn =
    "inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700";

  const editorClass =
    "min-h-[200px] w-full rounded-b-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 empty:before:text-gray-400 empty:before:content-[attr(data-placeholder)] [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol_ol]:list-[lower-alpha] [&_ol_ol_ol]:list-[lower-roman] [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:my-0.5";

  return (
    <div className={className}>
      <div className="mb-2 flex flex-wrap gap-1 rounded-t-lg border border-b-0 border-gray-200 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-900">
        <button type="button" className={toolbarBtn} onClick={() => runCommand("bold")} aria-label="Bold">
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" className={toolbarBtn} onClick={() => runCommand("italic")} aria-label="Italic">
          <Italic className="h-4 w-4" />
        </button>
        <button type="button" className={toolbarBtn} onClick={() => runCommand("underline")} aria-label="Underline">
          <Underline className="h-4 w-4" />
        </button>
        <button type="button" className={toolbarBtn} onClick={() => runCommand("formatBlock", "h2")} aria-label="Heading">
          <Heading2 className="h-4 w-4" />
        </button>
        <button type="button" className={toolbarBtn} onClick={() => runCommand("insertUnorderedList")} aria-label="Bullet list">
          <List className="h-4 w-4" />
        </button>
        <button type="button" className={toolbarBtn} onClick={() => runCommand("insertOrderedList")} aria-label="Numbered list">
          <ListOrdered className="h-4 w-4" />
        </button>
        <button type="button" className={toolbarBtn} onClick={() => runCommand("indent")} aria-label="Increase list level">
          <span className="text-xs font-semibold">→</span>
        </button>
        <button type="button" className={toolbarBtn} onClick={() => runCommand("outdent")} aria-label="Decrease list level">
          <span className="text-xs font-semibold">←</span>
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
        className={editorClass}
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
