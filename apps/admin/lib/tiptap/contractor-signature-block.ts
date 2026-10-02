import { mergeAttributes, Node } from "@tiptap/core";
import { DEFAULT_SIGNATURE_MIN_HEIGHT_PX } from "@/lib/credential-template";

export const ContractorSignatureBlock = Node.create({
  name: "contractorSignatureBlock",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      layout: {
        default: "flow",
        parseHTML: (element) => element.getAttribute("data-signature-layout") ?? "flow",
        renderHTML: (attributes) => ({ "data-signature-layout": attributes.layout }),
      },
      blockStyle: {
        default: `width:auto;max-width:100%;min-width:140px;min-height:${DEFAULT_SIGNATURE_MIN_HEIGHT_PX}px;box-sizing:border-box;`,
        parseHTML: (element) => element.getAttribute("style"),
        renderHTML: (attributes) => (attributes.blockStyle ? { style: attributes.blockStyle as string } : {}),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-signature-block="contractor"]', priority: 120 }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-signature-block": "contractor",
        class: "signature-block signature-block--flow",
        contenteditable: "false",
      }),
      [
        "button",
        {
          type: "button",
          "data-signature-drag-handle": "",
          class: "signature-drag-handle",
          "aria-label": "Move signature block",
        },
        "Move",
      ],
      ["p", {}, ["strong", {}, "Contractor signature"]],
      ["div", { "data-signature-capture": "contractor", class: "signature-capture-area" }],
      ["p", { class: "signature-hint" }, "The contractor will sign here in the agreement portal."],
      ["span", { "data-signature-resize-handle": "", class: "signature-resize-handle", "aria-hidden": "true" }],
    ];
  },
});
