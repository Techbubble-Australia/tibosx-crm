import Heading from "@tiptap/extension-heading";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Paragraph from "@tiptap/extension-paragraph";
import { Table } from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { classAttribute, styleAttribute } from "@/lib/tiptap/with-class-attribute";
import { ContractorSignatureBlock } from "@/lib/tiptap/contractor-signature-block";

const CustomHeading = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      class: classAttribute(),
    };
  },
});

const CustomParagraph = Paragraph.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      class: classAttribute(),
    };
  },
});

const CustomTable = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      class: classAttribute(),
      style: styleAttribute(),
    };
  },
});

const CustomTableRow = TableRow.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      class: classAttribute(),
    };
  },
});

const CustomTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      class: classAttribute(),
      style: styleAttribute(),
      colspan: {
        default: 1,
        parseHTML: (element) => {
          const value = element.getAttribute("colspan");
          return value ? Number.parseInt(value, 10) : 1;
        },
        renderHTML: (attributes) =>
          attributes.colspan && attributes.colspan !== 1 ? { colspan: attributes.colspan } : {},
      },
      rowspan: {
        default: 1,
        parseHTML: (element) => {
          const value = element.getAttribute("rowspan");
          return value ? Number.parseInt(value, 10) : 1;
        },
        renderHTML: (attributes) =>
          attributes.rowspan && attributes.rowspan !== 1 ? { rowspan: attributes.rowspan } : {},
      },
    };
  },
});

const CustomTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      class: classAttribute(),
      style: styleAttribute(),
      colspan: {
        default: 1,
        parseHTML: (element) => {
          const value = element.getAttribute("colspan");
          return value ? Number.parseInt(value, 10) : 1;
        },
        renderHTML: (attributes) =>
          attributes.colspan && attributes.colspan !== 1 ? { colspan: attributes.colspan } : {},
      },
      rowspan: {
        default: 1,
        parseHTML: (element) => {
          const value = element.getAttribute("rowspan");
          return value ? Number.parseInt(value, 10) : 1;
        },
        renderHTML: (attributes) =>
          attributes.rowspan && attributes.rowspan !== 1 ? { rowspan: attributes.rowspan } : {},
      },
    };
  },
});

const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      class: classAttribute(),
    };
  },
});

export function buildTemplateEditorExtensions() {
  return [
    StarterKit.configure({
      heading: false,
      paragraph: false,
    }),
    CustomHeading.configure({ levels: [1, 2, 3, 4, 5, 6] }),
    CustomParagraph,
    Underline,
    Link.configure({ openOnClick: false, autolink: true }),
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    CustomTable.configure({ resizable: true }),
    CustomTableRow,
    CustomTableHeader,
    CustomTableCell,
    CustomImage.configure({ inline: false, allowBase64: true }),
    ContractorSignatureBlock,
  ];
}
