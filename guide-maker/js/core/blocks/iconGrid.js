// core/blocks/iconGrid.js
// 組み合わせ例ブロック（キャラ × 装備アイコンの一覧）。ゲーム固有の知識は持たない。
// キャラ名・アイテム名・列見出しはプレビュー上の直接編集で書き換える。
// renderEditForm はキャラ・アイテムの追加/削除だけを扱う。
import { escapeHtml, deepClone } from "../utils.js";

export const TYPE = "icon_grid";
export const LABEL = "組み合わせ例";
export const DESCRIPTION = "キャラと何か（聖遺物セット等）を対応付けたい";
export const DEFAULT_CONFIG = { groupLabel: "キャラ", entries: [] };

export function render(config) {
  const groupLabel = config?.groupLabel || "";
  const entries = config?.entries ?? [];
  const bodyHtml = entries.length
    ? entries
        .map((entry, ei) => {
          const name = entry.character?.name ?? "";
          const items = entry.items ?? [];
          const itemsHtml = items.length
            ? items
                .map(
                  (item, ii) =>
                    `<span class="icon-grid__item"><span class="icon-grid__item-icon"></span><span contenteditable="true" data-edit="item-label" data-entry-index="${ei}" data-item-index="${ii}" data-placeholder="アイテム名">${escapeHtml(item.label)}</span></span>`
                )
                .join("")
            : "-";
          return `
            <div class="icon-grid__row">
              <div class="icon-grid__char">
                <span class="icon-grid__icon"></span>
                <span class="icon-grid__char-name" contenteditable="true" data-edit="char-name" data-entry-index="${ei}" data-placeholder="キャラ名">${escapeHtml(name)}</span>
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
        <div class="icon-grid__head-cell" contenteditable="true" data-edit="group-label" data-placeholder="列見出し">${escapeHtml(groupLabel)}</div>
        <div class="icon-grid__head-cell">組み合わせ</div>
      </div>
      <div class="icon-grid__body">${bodyHtml}</div>
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

  const groupLabelEl = container.querySelector('[data-edit="group-label"]');
  if (groupLabelEl) {
    groupLabelEl.addEventListener("blur", () => {
      cfg.groupLabel = groupLabelEl.textContent.trim();
      onChange(deepClone(cfg));
    });
    groupLabelEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        groupLabelEl.blur();
      }
    });
  }

  bind('[data-edit="char-name"]', (el) => {
    const i = Number(el.dataset.entryIndex);
    if (cfg.entries[i]) {
      cfg.entries[i].character = cfg.entries[i].character ?? { name: "", iconKey: "" };
      cfg.entries[i].character.name = el.textContent.trim();
    }
  });
  bind('[data-edit="item-label"]', (el) => {
    const ei = Number(el.dataset.entryIndex);
    const ii = Number(el.dataset.itemIndex);
    if (cfg.entries[ei]?.items?.[ii]) {
      cfg.entries[ei].items[ii].label = el.textContent.trim();
    }
  });
}

export function renderEditForm(container, config, onChange) {
  const cfg = deepClone(config ?? DEFAULT_CONFIG);
  cfg.entries = cfg.entries ?? [];

  const emit = () => onChange(deepClone(cfg));

  function paint() {
    container.innerHTML = `
      <div class="mini-panel__section">
        <div class="mini-panel__label">キャラ（クリックで名前を編集できます）</div>
        <div class="mini-panel__list" data-role="entries"></div>
        <button type="button" class="btn btn-ghost btn-sm" data-action="add-entry">+ キャラを追加</button>
      </div>
    `;

    const wrap = container.querySelector('[data-role="entries"]');
    cfg.entries.forEach((entry, ei) => {
      entry.items = entry.items ?? [];
      const row = document.createElement("div");
      row.className = "mini-panel__row-group";
      row.innerHTML = `
        <div class="mini-panel__row">
          <span class="mini-panel__row-label">${escapeHtml(entry.character?.name || "(無題のキャラ)")}</span>
          <button type="button" class="btn btn-icon" data-action="add-item" title="アイテムを追加">+</button>
          <button type="button" class="btn btn-icon btn-danger" data-action="remove-entry" title="削除">✕</button>
        </div>
        <div class="mini-panel__chips" data-role="items"></div>
      `;
      row.querySelector('[data-action="remove-entry"]').addEventListener("click", () => {
        cfg.entries.splice(ei, 1);
        paint();
        emit();
      });
      row.querySelector('[data-action="add-item"]').addEventListener("click", () => {
        entry.items.push({ label: "", iconKey: "" });
        paint();
        emit();
      });

      const itemsWrap = row.querySelector('[data-role="items"]');
      entry.items.forEach((it, ii) => {
        const chip = document.createElement("span");
        chip.className = "mini-chip";
        chip.innerHTML = `<span>${escapeHtml(it.label || "(無題)")}</span><button type="button" data-action="remove-item" title="削除">✕</button>`;
        chip.querySelector('[data-action="remove-item"]').addEventListener("click", () => {
          entry.items.splice(ii, 1);
          paint();
          emit();
        });
        itemsWrap.appendChild(chip);
      });

      wrap.appendChild(row);
    });

    container.querySelector('[data-action="add-entry"]').addEventListener("click", () => {
      cfg.entries.push({ character: { name: "", iconKey: "" }, items: [] });
      paint();
      emit();
    });
  }

  paint();
}
