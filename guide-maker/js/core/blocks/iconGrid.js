// core/blocks/iconGrid.js
// 組み合わせ例ブロック（キャラ × 装備アイコンの一覧）。ゲーム固有の知識は持たない。
import { escapeHtml, deepClone } from "../utils.js";

export const TYPE = "icon_grid";
export const LABEL = "組み合わせ例";
export const DESCRIPTION = "キャラごとのおすすめ装備・武器の組み合わせを並べる";
export const DEFAULT_CONFIG = { groupLabel: "キャラ", entries: [] };

export function render(config) {
  const groupLabel = config?.groupLabel || "キャラ";
  const entries = config?.entries ?? [];
  const bodyHtml = entries.length
    ? entries
        .map((entry) => {
          const name = entry.character?.name ?? "";
          const items = entry.items ?? [];
          const itemsHtml = items.length
            ? items
                .map(
                  (item) =>
                    `<span class="icon-grid__item"><span class="icon-grid__item-icon"></span>${escapeHtml(item.label)}</span>`
                )
                .join("")
            : "-";
          return `
            <div class="icon-grid__row">
              <div class="icon-grid__char">
                <span class="icon-grid__icon"></span>
                <span class="icon-grid__char-name">${escapeHtml(name)}</span>
              </div>
              <div class="icon-grid__items">${itemsHtml}</div>
            </div>
          `;
        })
        .join("")
    : `<p class="sheet-empty">キャラを追加すると組み合わせ表が表示されます</p>`;
  return `
    <div class="icon-grid">
      <div class="icon-grid__head">
        <div class="icon-grid__head-cell">${escapeHtml(groupLabel)}</div>
        <div class="icon-grid__head-cell">組み合わせ</div>
      </div>
      <div class="icon-grid__body">${bodyHtml}</div>
    </div>
  `;
}

export function renderEditForm(container, config, onChange) {
  const cfg = deepClone(config ?? DEFAULT_CONFIG);
  cfg.entries = cfg.entries ?? [];

  const emit = () => onChange(deepClone(cfg));

  function paint() {
    container.innerHTML = `
      <label class="field">
        <span class="field__label">列見出し</span>
        <input class="input" type="text" data-field="group-label" value="${escapeHtml(cfg.groupLabel ?? "")}" placeholder="例：キャラ" />
      </label>
      <div class="form-subhead"><span class="form-subhead__title">キャラと組み合わせ</span></div>
      <div class="form-list" data-role="entries"></div>
      <button type="button" class="btn btn-ghost btn-block" data-action="add-entry">+ キャラを追加</button>
    `;

    container.querySelector('[data-field="group-label"]').addEventListener("input", (e) => {
      cfg.groupLabel = e.target.value;
      emit();
    });

    const entriesWrap = container.querySelector('[data-role="entries"]');
    cfg.entries.forEach((entry, entryIndex) => {
      entry.character = entry.character ?? { name: "", iconKey: "" };
      entry.items = entry.items ?? [];

      const item = document.createElement("div");
      item.className = "form-list-item";
      item.innerHTML = `
        <div class="form-list-item__head">
          <span class="form-list-item__title">キャラ ${entryIndex + 1}</span>
          <button type="button" class="btn btn-icon btn-danger" data-action="remove-entry" title="このキャラを削除">✕</button>
        </div>
        <label class="field">
          <span class="field__label">キャラ名</span>
          <input class="input" type="text" data-field="char-name" value="${escapeHtml(entry.character.name)}" placeholder="例：キャラA" />
        </label>
        <div class="form-subhead"><span class="form-subhead__title">組み合わせアイテム</span></div>
        <div class="form-list" data-role="items"></div>
        <button type="button" class="btn btn-ghost btn-block" data-action="add-item">+ アイテムを追加</button>
      `;

      item.querySelector('[data-field="char-name"]').addEventListener("input", (e) => {
        entry.character.name = e.target.value;
        emit();
      });
      item.querySelector('[data-action="remove-entry"]').addEventListener("click", () => {
        cfg.entries.splice(entryIndex, 1);
        paint();
        emit();
      });

      const itemsWrap = item.querySelector('[data-role="items"]');
      entry.items.forEach((it, itIndex) => {
        const row = document.createElement("div");
        row.className = "form-row";
        row.innerHTML = `
          <label class="field">
            <input class="input" type="text" data-field="item-label" value="${escapeHtml(it.label)}" placeholder="例：アイテムA" />
          </label>
          <button type="button" class="btn btn-icon btn-danger" data-action="remove-item" title="このアイテムを削除">✕</button>
        `;
        row.querySelector('[data-field="item-label"]').addEventListener("input", (e) => {
          it.label = e.target.value;
          emit();
        });
        row.querySelector('[data-action="remove-item"]').addEventListener("click", () => {
          entry.items.splice(itIndex, 1);
          paint();
          emit();
        });
        itemsWrap.appendChild(row);
      });

      item.querySelector('[data-action="add-item"]').addEventListener("click", () => {
        entry.items.push({ label: "", iconKey: "" });
        paint();
        emit();
      });

      entriesWrap.appendChild(item);
    });

    container.querySelector('[data-action="add-entry"]').addEventListener("click", () => {
      cfg.entries.push({ character: { name: "", iconKey: "" }, items: [] });
      paint();
      emit();
    });
  }

  paint();
}
