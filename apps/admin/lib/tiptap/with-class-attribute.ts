import type { Attribute } from "@tiptap/core";

export function classAttribute(): Attribute {
  return {
    default: null,
    parseHTML: (element) => element.getAttribute("class"),
    renderHTML: (attributes) => (attributes.class ? { class: attributes.class as string } : {}),
  };
}

export function styleAttribute(): Attribute {
  return {
    default: null,
    parseHTML: (element) => element.getAttribute("style"),
    renderHTML: (attributes) => (attributes.style ? { style: attributes.style as string } : {}),
  };
}
