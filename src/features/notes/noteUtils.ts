import { escapeHtml, stripHtml } from "../../shared/utils/html";

export function hasHtmlContent(value: string) {
  return Boolean(stripHtml(value)) || /<img[\s>]/i.test(value);
}

export { escapeHtml, stripHtml };
