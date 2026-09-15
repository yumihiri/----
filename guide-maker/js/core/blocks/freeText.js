// core/blocks/freeText.js
// 自由型キャンバス専用の自由記述ボックス。ゲーム固有の知識は持たない。
// テンプレート型の4ブロックと違い構造を持たず、ただの自由なテキスト領域。
import { escapeHtml, deepClone } from "../utils.js";

export const TYPE = "free_text";
export const LABEL = "自由記述";
export const DESCRIPTION = "自由に文章や情報を書き込みたい";
export const DEFAULT_CONFIG = { text: "" };

export function render(config) {
  const text = config?.text ?? "";
  return `<div class="free-text" contenteditable="true" data-edit="text" data-placeholder="ここに自由に入力できます">${escapeHtml(text)}</div>`;
}

export function bindInlineEdit(container, config, onChange) {
  const cfg = deepClone(config ?? DEFAULT_CONFIG);
  const el = container.querySelector('[data-edit="text"]');
  if (!el) return;
  el.addEventListener("blur", () => {
    cfg.text = el.textContent;
    onChange(deepClone(cfg));
  });
}

export function renderEditForm(container) {
  container.innerHTML = `<p class="field__hint">プレビュー上のボックスに直接書き込めます。位置やサイズも自由に変更できます</p>`;
}
