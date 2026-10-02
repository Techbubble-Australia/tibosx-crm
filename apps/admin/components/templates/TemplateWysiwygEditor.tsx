"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import { useCallback, useEffect, useRef } from "react";
import {
  findDropContainer,
  normalizeSignatureBlockToFlow,
  stripEditorArtifacts,
  TEMPLATE_DOCUMENT_STYLES,
} from "@/lib/credential-template";
import { extractTemplateEditorContent, wrapTemplateEditorContent } from "@/lib/template-canvas-html";
import {
  attachSignatureDelegation,
  attachTableWidthResize,
  clearDropHighlight,
  dropSignatureAt,
  highlightDropTarget,
  prepareEditorSurface,
} from "@/lib/template-editor-interactions";
import { buildTemplateEditorExtensions } from "@/lib/tiptap/template-editor-extensions";

type Props = {
  html: string;
  onHtmlChange: (html: string) => void;
  dragOver: boolean;
  onDragOverChange: (value: boolean) => void;
  signaturePaletteActive: boolean;
  onPaletteActiveChange: (value: boolean) => void;
};

function serializeEditorOutput(innerHtml: string): string {
  return stripEditorArtifacts(wrapTemplateEditorContent(innerHtml));
}

const toolbarBtn =
  "rounded border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800";

export function TemplateWysiwygEditor({
  html,
  onHtmlChange,
  dragOver,
  onDragOverChange,
  signaturePaletteActive,
  onPaletteActiveChange,
}: Props) {
  const lastEmittedRef = useRef(html);
  const dropHighlightRef = useRef<HTMLElement | null>(null);
  const syncingRef = useRef(false);

  const flushDomToState = useCallback(
    (editor: NonNullable<ReturnType<typeof useEditor>>) => {
      const inner = editor.view.dom.innerHTML;
      const next = serializeEditorOutput(inner);
      if (next === lastEmittedRef.current) return;
      syncingRef.current = true;
      lastEmittedRef.current = next;
      editor.commands.setContent(inner, { emitUpdate: false });
      onHtmlChange(next);
      syncingRef.current = false;
    },
    [onHtmlChange],
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: buildTemplateEditorExtensions(),
    content: extractTemplateEditorContent(html),
    editorProps: {
      attributes: {
        class: "template-canvas template-canvas-editable min-h-[480px] focus:outline-none",
        spellcheck: "true",
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (syncingRef.current) return;
      const next = serializeEditorOutput(ed.getHTML());
      if (next === lastEmittedRef.current) return;
      lastEmittedRef.current = next;
      onHtmlChange(next);
    },
  });

  const bindEditorChrome = useCallback(() => {
    if (!editor) return;
    const root = editor.view.dom;
    prepareEditorSurface(root);
    normalizeSignatureBlockToFlow(root);
    attachSignatureDelegation(root, () => flushDomToState(editor), dropHighlightRef);
    attachTableWidthResize(root, () => flushDomToState(editor));
  }, [editor, flushDomToState]);

  useEffect(() => {
    if (!editor) return;
    bindEditorChrome();
  }, [editor, bindEditorChrome]);

  useEffect(() => {
    if (!editor) return;
    const current = serializeEditorOutput(editor.getHTML());
    const incoming = serializeEditorOutput(extractTemplateEditorContent(html));
    if (current === incoming || html === lastEmittedRef.current) return;

    syncingRef.current = true;
    editor.commands.setContent(extractTemplateEditorContent(html), { emitUpdate: false });
    lastEmittedRef.current = html;
    requestAnimationFrame(() => {
      bindEditorChrome();
      syncingRef.current = false;
    });
  }, [html, editor, bindEditorChrome]);

  useEffect(() => {
    lastEmittedRef.current = html;
  }, [html]);

  if (!editor) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-sm text-gray-500 dark:border-gray-700">
        Loading editor…
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-lg border bg-white dark:border-gray-700 ${
        dragOver ? "border-blue-400 ring-2 ring-blue-200" : "border-gray-200"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        onDragOverChange(true);
        const root = editor.view.dom;
        const target = document.elementFromPoint(e.clientX, e.clientY);
        highlightDropTarget(findDropContainer(target, root), dropHighlightRef);
      }}
      onDragLeave={() => {
        onDragOverChange(false);
        clearDropHighlight(dropHighlightRef);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDragOverChange(false);
        onPaletteActiveChange(false);
        clearDropHighlight(dropHighlightRef);
        if (e.dataTransfer.getData("text/plain") === "signature-block") {
          dropSignatureAt(editor.view.dom, e.clientX, e.clientY, () => flushDomToState(editor));
        }
      }}
    >
      <style>{TEMPLATE_DOCUMENT_STYLES}</style>
      <div className="template-format-toolbar flex flex-wrap items-center gap-2 border-b border-gray-100 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-900/50">
        <button
          type="button"
          className={toolbarBtn}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          Bold
        </button>
        <button
          type="button"
          className={toolbarBtn}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          Italic
        </button>
        <button
          type="button"
          className={toolbarBtn}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          Underline
        </button>
        <button
          type="button"
          className={toolbarBtn}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          Strikethrough
        </button>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <button
          type="button"
          className={toolbarBtn}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          Bullets
        </button>
        <button
          type="button"
          className={toolbarBtn}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          Numbered list
        </button>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <button
          type="button"
          className={toolbarBtn}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          Align left
        </button>
        <button
          type="button"
          className={toolbarBtn}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          Center
        </button>
        <button
          type="button"
          className={toolbarBtn}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          Align right
        </button>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <button
          type="button"
          className={toolbarBtn}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 2, withHeaderRow: true }).run()
          }
        >
          Insert table
        </button>
        <button
          type="button"
          className={toolbarBtn}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().addRowAfter().run()}
        >
          Row +
        </button>
        <button
          type="button"
          className={toolbarBtn}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().addColumnAfter().run()}
        >
          Col +
        </button>
        <button
          type="button"
          className={toolbarBtn}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().deleteTable().run()}
        >
          Delete table
        </button>
        <span className="ml-1 self-center text-xs text-gray-500">
          Rich text editor — drag the signature block into tables or paragraphs.
        </span>
      </div>
      <div
        className={`template-editor-host h-[520px] overflow-auto bg-white ${
          signaturePaletteActive ? "ring-2 ring-inset ring-blue-200" : ""
        }`}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
