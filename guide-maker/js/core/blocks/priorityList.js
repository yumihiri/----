// core/blocks/priorityList.js
// 優先順位リストブロック（武器・天賦など）。表示順=配列順、上下ボタンで並び替え。
import { escapeHtml, deepClone } from "../utils.js";

export const TYPE = "priority_list";
export const LABEL = "優先順位リスト";
export const DESCRIPTION = "武器・聖遺物・天賦などの優先順位を並べる";
export const DEFAULT_CONFIG = { title: "", items: [] };

export function render(config) {
  const title = config?.title || "";
  const items = config?.items ?? [];
  if (items.length === 0) {
    return `<p class="sheet-empty">項目を追加すると優先順位が表示されます</p>`;
  }
  const itemsHtml = items
    .map((it, index) => {
      const noteHtml = it.note ? `<span class="priority-list__note">${escapeHtml(it.note)}</span>` : "";
      const arrow = index < items.length - 1 ? `<span class="priority-list__arrow">→</span>` : "";
      return `
        <div class="priority-list__item ${index === 0 ? "is-top" : ""}">
          <span class="priority-list__rank">${index + 1}位</span>
          <span class="priority-list__label">${escapeHtml(it.label)}</span>
          ${noteHtml}
        </div>
        ${arrow}
      `;
    })
    .join("");
  return `
    <div class="priority-list">
      ${title ? `<div class="priority-list__title">${escapeHtml(title)}</div>` : ""}
      <div class="priority-list__row">${itemsHtml}</div>
    </div>
  `;
}

export function renderEditForm(container, config, onChange) {
  const cfg = deepClone(config ?? DEFAULT_CONFIG);
  cfg.items = cfg.items ?? [];

  const emit = () => onChange(deepClone(cfg));

  function paint() {
    container.innerHTML = `
      <label class="field">
        <span class="field__label">タイトル</span>
        <input class="input" type="text" data-field="title" value="${escapeHtml(cfg.title ?? "")}" placeholder="例：武器優先度" />
      </label>
      <div class="form-subhead"><span class="form-subhead__title">項目（表示順）</span></div>
      <div class="form-list" data-role="items"></div>
      <button type="button" class="btn btn-ghost btn-block" data-action="add-item">+ 項目を追加</button>
    `;

    container.querySelector('[data-field="title"]').addEventListener("input", (e) => {
      cfg.title = e.target.value;
      emit();
    });

    const itemsWrap = container.querySelector('[data-role="items"]');
    cfg.items.forEach((it, index) => {
      const row = document.createElement("div");
      row.className = "form-list-item";
      row.innerHTML = `
        <div class="form-row">
          <label class="field">
            <span class="field__label">項目名</span>
            <input class="input" type="text" data-field="label" value="${escapeHtml(it.label)}" placeholder="例：候補A" />
          </label>
          <button type="button" class="btn btn-icon" data-action="move-up" title="上へ" ${index === 0 ? "disabled" : ""}>↑</button>
          <button type="button" class="btn btn-icon" data-action="move-down" title="下へ" ${index === cfg.items.length - 1 ? "disabled" : ""}>↓</button>
          <button type="button" class="btn btn-icon btn-danger" data-action="remove" title="削除">✕</button>
        </div>
        <label class="field">
          <span class="field__label">補足（任意）</span>
          <input class="input" type="text" data-field="note" value="${escapeHtml(it.note ?? "")}" placeholder="例：凸あり推奨" />
        </label>
      `;

      row.querySelector('[data-field="label"]').addEventListener("input", (e) => {
        it.label = e.target.value;
        emit();
      });
      row.querySelector('[data-field="note"]').addEventListener("input", (e) => {
        it.note = e.target.value;
        emit();
      });
      row.querySelector('[data-action="remove"]').addEventListener("click", () => {
        cfg.items.splice(index, 1);
        paint();
        emit();
      });
      const upBtn = row.querySelector('[data-action="move-up"]');
      upBtn.addEventListener("click", () => {
        if (index === 0) return;
        [cfg.items[index - 1], cfg.items[index]] = [cfg.items[index], cfg.items[index - 1]];
        paint();
        emit();
      });
      const downBtn = row.querySelector('[data-action="move-down"]');
      downBtn.addEventListener("click", () => {
        if (index === cfg.items.length - 1) return;
        [cfg.items[index + 1], cfg.items[index]] = [cfg.items[index], cfg.items[index + 1]];
        paint();
        emit();
      });

      itemsWrap.appendChild(row);
    });

    container.querySelector('[data-action="add-item"]').addEventListener("click", () => {
      cfg.items.push({ label: "", note: "" });
      paint();
      emit();
    });
  }

  paint();
}
