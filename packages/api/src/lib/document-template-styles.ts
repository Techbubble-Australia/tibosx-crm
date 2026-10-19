/** Shared document preview styles (Word import fidelity). Keep in sync with apps/admin/lib/document-template-styles.ts */
export const DOCUMENT_TEMPLATE_STYLES = `
.template-canvas { position: relative; min-height: 480px; outline: none; padding: 32px 48px; box-sizing: border-box; }
.template-canvas-editable:focus { box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.35); }
body { margin: 0; padding: 24px; color: #111; }
.template-canvas {
  font-family: Arial, Helvetica, "Segoe UI", sans-serif;
  font-size: 11pt;
  line-height: 1.35;
  color: #111;
}
.template-canvas p,
.template-canvas li,
.template-canvas td,
.template-canvas th {
  font-family: inherit;
  line-height: inherit;
  color: inherit;
}
.template-canvas h1,
.template-canvas h2,
.template-canvas h3 {
  font-family: inherit;
  line-height: 1.35;
  color: inherit;
}
h1.docx-agreement-title,
.docx-agreement-title {
  font-size: 22pt;
  font-weight: 700;
  line-height: 1.15;
  margin: 4px 0 10px;
}
h2.docx-section-title,
.docx-section-title {
  font-size: 14pt;
  font-weight: 700;
  margin: 18px 0 8px;
}
h3.docx-subsection-title,
.docx-subsection-title {
  font-size: 12pt;
  font-weight: 700;
  margin: 14px 0 8px;
}
.template-canvas img,
img.docx-logo {
  max-width: 240px;
  height: auto;
  margin: 0 0 12px;
  display: block;
}
table.docx-table {
  width: 100%;
  max-width: 100%;
  border-collapse: collapse;
  margin: 12px 0 16px;
  table-layout: auto;
  border: 1px solid #000;
}
table.docx-details-table thead th {
  background: #000 !important;
  color: #fff !important;
  font-weight: 700;
  border: 1px solid #000;
  padding: 6px 8px;
  text-align: left;
}
table.docx-details-table tbody tr:nth-child(odd) td {
  background: #d9d9d9;
}
table.docx-details-table tbody tr:nth-child(even) td {
  background: #fff;
}
table.docx-table td,
table.docx-table th {
  border: 1px solid #000;
  padding: 6px 8px;
  vertical-align: top;
  word-wrap: break-word;
}
table.docx-table:not(.docx-details-table) th {
  background: #f3f4f6;
  font-weight: 600;
}
table.docx-table td p,
table.docx-table th p { margin: 0; }
.template-table-host { position: relative; max-width: 100%; margin: 12px 0; }
.template-table-host > table { margin: 0; }
.template-canvas ul,
.template-canvas ol,
ul.docx-bullet-list {
  margin: 0.5em 0 0.75em;
  padding-left: 1.75em;
  list-style-position: outside;
}
.template-canvas ul,
ul.docx-bullet-list { list-style-type: disc; }
.template-canvas ol { list-style-type: decimal; }
.template-canvas li,
li.docx-list-item { display: list-item; margin: 0.2em 0; }
.signature-block { border: 2px dashed #6b7280; padding: 14px 16px 28px; background: #fafafa; position: relative; }
.signature-block--flow { margin: 8px 0; z-index: auto; }
td.signature-host-cell, th.signature-host-cell { padding: 14px 16px !important; overflow: visible; vertical-align: top; }
td .signature-block--flow, th .signature-block--flow { margin: 0; width: auto; max-width: 100%; min-width: 120px; }
.signature-capture-area { min-height: 56px; border-bottom: 1px solid #374151; margin-top: 8px; }
.signature-hint { margin-top: 6px; font-size: 11px; color: #6b7280; }
.signature-drag-handle { position: absolute; top: 4px; right: 4px; z-index: 12; border: 1px solid #d1d5db; border-radius: 4px; background: #fff; padding: 2px 8px; font-size: 10px; font-family: system-ui, sans-serif; cursor: grab; color: #374151; pointer-events: auto; }
.signature-resize-handle { position: absolute; right: 4px; bottom: 4px; width: 20px; height: 20px; cursor: nwse-resize; z-index: 10; pointer-events: auto; touch-action: none; background: linear-gradient(135deg, transparent 52%, #6b7280 52%); }
.template-drop-target { outline: 2px dashed #3b82f6; outline-offset: 2px; background: rgba(59, 130, 246, 0.06); }
.table-width-resize-grip { position: absolute; right: 0; bottom: 0; width: 14px; height: 14px; cursor: nwse-resize; z-index: 4; background: linear-gradient(135deg, transparent 55%, #9ca3af 55%); }
.template-format-toolbar button { border: 1px solid #d1d5db; background: #fff; border-radius: 4px; padding: 4px 8px; font-size: 12px; cursor: pointer; }
.template-format-toolbar button:hover { background: #f3f4f6; }
`;
