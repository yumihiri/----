// core/blocks/priorityList.js
// 優先順位リストブロック（武器・天賦など）。表示順=配列順。
// タイトル・項目名・補足はプレビュー上の直接編集で書き換える。
// renderEditForm は項目の追加/削除/並び替えだけを扱う。
import { escapeHtml, deepClone } from "../utils.js";

export const TYPE = "priority_list";
export const LABEL = "優先順位リスト";
export const DESCRIPTION = "優先順位・順番を示したい（武器の優先度など）";
export const DEFAULT_CONFIG = { title: "", items: [] };

export function render(config) {
  const title = config?.title || "";
  const items = config?.items ?? [];
  const itemsHtml = items.length
    ? items
        .map((it, index) => {
          const arrow = index < items.length - 1 ? `<span class="priority-list__arrow">→</span>` : "";
          return `
            <div class="priority-list__item ${index === 0 ? "is-top" : ""}">
              <span class="priority-list__rank">${index + 1}位</span>
              <span class="priority-list__label" contenteditable="true" data-edit="item-label" data-item-index="${index}" data-placeholder="項目名">${escapeHtml(it.label)}</span>
              <span class="priority-list__note" contenteditable="true" data-edit="item-note" data-item-index="${index}" data-placeholder="補足（任意）">${escapeHtml(it.note ?? "")}</span>
            </div>
            ${arrow}
          `;
        })
        .join("")
    : `<p class="sheet-empty">項目を追加すると優先順位が表示されます</p>`;
  return `
    <div class="priority-list">
      <div class="priority-list__title" contenteditable="true" data-edit="title" data-placeholder="タイトル（例：武器優先度）">${escapeHtml(title)}</div>
      <div class="priority-list__row">${itemsHtml}</div>
    </div>
  `;
}

export function bindInlineEdit(container, config, onChange) {
  const cfg = deepClone(config ?? DEFAULT_CONFIG);

  function bind(selector, apply) {
    container.querySelectorAll(selector).forEach((el) => {
      el.addEventListener("blur", () => {
        apply(el);
        onChange(deepClone(cfg));
      });
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          el.blur();
        }
      });
    });
  }

  bind('[data-edit="title"]', (el) => {
    cfg.title = el.textContent.trim();
  });
  bind('[data-edit="item-label"]', (el) => {
    const i = Number(el.dataset.itemIndex);
    if (cfg.items[i]) cfg.items[i].label = el.textContent.trim();
  });
  bind('[data-edit="item-note"]', (el) => {
    const i = Number(el.dataset.itemIndex);
    if (cfg.items[i]) cfg.items[i].note = el.textContent.trim();
  });
}

export function renderEditForm(container, config, onChange) {
  const cfg = deepClone(config ?? DEFAULT_CONFIG);
  cfg.items = cfg.items ?? [];

  const emit = () => onChange(deepClone(cfg));

  function paint() {
    container.innerHTML = `
      <div class="mini-panel__section">
        <div class="mini-panel__label">項目（クリックで名前を編集できます）</div>
        <div class="mini-panel__list" data-role="items"></div>
        <button type="button" class="btn btn-ghost btn-sm" data-action="add-item">+ 項目を追加</button>
      </div>
    `;

    const wrap = container.querySelector('[data-role="items"]');
    cfg.items.forEach((it, index) => {
      const row = document.createElement("div");
      row.className = "mini-panel__row";
      row.innerHTML = `
        <span class="mini-panel__row-label">${escapeHtml(it.label || "(無題)")}</span>
        <button type="button" class="btn btn-icon" data-action="move-up" title="上へ" ${index === 0 ? "disabled" : ""}>↑</button>
        <button type="button" class="btn btn-icon" data-action="move-down" title="下へ" ${index === cfg.items.length - 1 ? "disabled" : ""}>↓</button>
        <button type="button" class="btn btn-icon btn-danger" data-action="remove" title="削除">✕</button>
      `;
      row.querySelector('[data-action="remove"]').addEventListener("click", () => {
        cfg.items.splice(index, 1);
        paint();
        emit();
      });
      row.querySelector('[data-action="move-up"]').addEventListener("click", () => {
        if (index === 0) return;
        [cfg.items[index - 1], cfg.items[index]] = [cfg.items[index], cfg.items[index - 1]];
        paint();
        emit();
      });
      row.querySelector('[data-action="move-down"]').addEventListener("click", () => {
        if (index === cfg.items.length - 1) return;
        [cfg.items[index + 1], cfg.items[index]] = [cfg.items[index], cfg.items[index + 1]];
        paint();
        emit();
      });
      wrap.appendChild(row);
    });

    container.querySelector('[data-action="add-item"]').addEventListener("click", () => {
      cfg.items.push({ label: "", note: "" });
      paint();
      emit();
    });
  }

  paint();
}
