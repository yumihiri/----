// core/utils.js
// core/blocks 配下から共通で使う小さなヘルパー。ゲーム固有の知識は持たない。

const ESCAPE_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch]);
}

export function uid(prefix = "id") {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}
