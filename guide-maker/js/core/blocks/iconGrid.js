// core/blocks/iconGrid.js
// 組み合わせ例ブロック。パーティ4人（列固定）× 組み合わせパターン（行、任意数）の表。
// ゲーム固有の知識は持たない。キャラ名・アイテム名はプレビュー上の直接編集で書き換える。
// 将来的にはアイコン画像をドラッグして配置する想定だが、現状はテキストのみ。
import { escapeHtml, deepClone } from "../utils.js";

export const TYPE = "icon_grid";
export const LABEL = "組み合わせ例";
export const DESCRIPTION = "キャラと何か（聖遺物セット等）を対応付けたい";
const CHAR_COUNT = 4;

function emptyCharacters() {
  return Array.from({ length: CHAR_COUNT }, () => ({ name: "", iconKey: "" }));
}
function emptyRow() {
  return { items: Array.from({ length: CHAR_COUNT }, () => ({ label: "", iconKey: "" })) };
}

export const DEFAULT_CONFIG = { characters: emptyCharacters(), rows: [] };

// iconKeyは将来Enka Network等のAPIから取得したキャラ/聖遺物アイコンを
// 割り当てるための拡張ポイント。今は空文字のままグレーの丸だけを表示する。
function iconSlot(iconKey, sizeClass = "") {
  return `<div class="icon-grid__icon-slot ${sizeClass}" data-icon-key="${escapeHtml(iconKey ?? "")}"></div>`;
}

export function render(config) {
  const characters = config?.characters?.length === CHAR_COUNT ? config.characters : emptyCharacters();
  const rows = config?.rows ?? [];

  const headCells = characters
    .map(
      (c, i) => `
        <th>
          ${iconSlot(c.iconKey)}
          <div contenteditable="true" data-edit="char-name" data-char-index="${i}" data-placeholder="キャラ${i + 1}">${escapeHtml(c.name)}</div>
        </th>
      `
    )
    .join("");

  const bodyRows = rows.length
    ? rows
        .map((row, ri) => {
          const cells = Array.from({ length: CHAR_COUNT })
            .map((_, ci) => {
              const item = row.items?.[ci] ?? {};
              return `
                <td>
                  ${iconSlot(item.iconKey, "icon-grid__icon-slot--sm")}
                  <div contenteditable="true" data-edit="item-label" data-row-index="${ri}" data-item-index="${ci}" data-placeholder="組み合わせ">${escapeHtml(item.label ?? "")}</div>
                </td>
              `;
            })
            .join("");
          return `<tr>${cells}</tr>`;
        })
        .join("")
    : `<tr><td colspan="${CHAR_COUNT}" class="icon-grid__empty-row">ミニパネルの「組み合わせを追加」で行を増やせます</td></tr>`;

  return `
    <table class="icon-grid-table">
      <thead><tr>${headCells}</tr></thead>
      <tbody>${bodyRows}</tbody>
    </table>
  `;
}

export function bindInlineEdit(container, config, onChange) {
  const cfg = deepClone(config ?? DEFAULT_CONFIG);
  cfg.characters = cfg.characters?.length === CHAR_COUNT ? cfg.characters : emptyCharacters();
  cfg.rows = cfg.rows ?? [];

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

  bind('[data-edit="char-name"]', (el) => {
    const i = Number(el.dataset.charIndex);
    if (cfg.characters[i]) cfg.characters[i].name = el.textContent.trim();
  });
  bind('[data-edit="item-label"]', (el) => {
    const ri = Number(el.dataset.rowIndex);
    const ci = Number(el.dataset.itemIndex);
    if (cfg.rows[ri]) {
      cfg.rows[ri].items = cfg.rows[ri].items ?? [];
      cfg.rows[ri].items[ci] = cfg.rows[ri].items[ci] ?? { label: "", iconKey: "" };
      cfg.rows[ri].items[ci].label = el.textContent.trim();
    }
  });
}

export function renderEditForm(container, config, onChange) {
  const cfg = deepClone(config ?? DEFAULT_CONFIG);
  cfg.characters = cfg.characters?.length === CHAR_COUNT ? cfg.characters : emptyCharacters();
  cfg.rows = cfg.rows ?? [];

  const emit = () => onChange(deepClone(cfg));

  function paint() {
    container.innerHTML = `
      <div class="mini-panel__section">
        <div class="mini-panel__label">キャラ4人はプレビュー上で直接編集できます</div>
      </div>
      <div class="mini-panel__section">
        <div class="mini-panel__label">組み合わせ（行）</div>
        <div class="mini-panel__list" data-role="rows"></div>
        <button type="button" class="btn btn-ghost btn-sm" data-action="add-row">+ 組み合わせを追加</button>
      </div>
    `;

    const wrap = container.querySelector('[data-role="rows"]');
    cfg.rows.forEach((row, ri) => {
      const label = (row.items ?? []).map((it) => it.label).filter(Boolean).join(" / ") || "(無題)";
      const item = document.createElement("div");
      item.className = "mini-panel__row";
      item.innerHTML = `
        <span class="mini-panel__row-label">${escapeHtml(label)}</span>
        <button type="button" class="btn btn-icon btn-danger" data-action="remove" title="この組み合わせを削除">✕</button>
      `;
      item.querySelector('[data-action="remove"]').addEventListener("click", () => {
        cfg.rows.splice(ri, 1);
        paint();
        emit();
      });
      wrap.appendChild(item);
    });

    container.querySelector('[data-action="add-row"]').addEventListener("click", () => {
      cfg.rows.push(emptyRow());
      paint();
      emit();
    });
  }

  paint();
}
