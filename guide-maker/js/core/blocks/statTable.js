// core/blocks/statTable.js
// 目標ステータス表ブロック。ゲーム固有の知識は持たず、列候補は extra.columnOptions で受け取る。
// ラベル・値のテキストはプレビュー上の直接編集（contenteditable）で書き換える。
// renderEditForm は列・行の追加/削除など、直接編集では対応できない構造操作だけを扱う。
import { escapeHtml, deepClone } from "../utils.js";

export const TYPE = "stat_table";
export const LABEL = "目標ステータス表";
export const DESCRIPTION = "数値を比較したい（会心率・ダメージ%など、複数対象の横並び比較）";
export const DEFAULT_CONFIG = { columns: [], rows: [] };

export function render(config) {
  const columns = config?.columns ?? [];
  const rows = config?.rows ?? [];
  if (columns.length === 0 && rows.length === 0) {
    return `<p class="sheet-empty">「列」と「行」を追加すると表が表示されます</p>`;
  }
  const theadCells = columns
    .map(
      (c, i) =>
        `<th contenteditable="true" data-edit="column-label" data-col-index="${i}" data-placeholder="列名">${escapeHtml(c.label)}</th>`
    )
    .join("");
  const bodyRows = rows
    .map((row, ri) => {
      const cells = columns
        .map(
          (c) =>
            `<td contenteditable="true" data-edit="cell-value" data-row-index="${ri}" data-col-key="${escapeHtml(c.key)}" data-placeholder="値">${escapeHtml(row.values?.[c.key] ?? "")}</td>`
        )
        .join("");
      return `<tr><td contenteditable="true" data-edit="row-name" data-row-index="${ri}" data-placeholder="名前">${escapeHtml(row.name)}</td>${cells}</tr>`;
    })
    .join("");
  return `<table class="stat-table"><thead><tr><th>項目</th>${theadCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
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

  bind('[data-edit="column-label"]', (el) => {
    const i = Number(el.dataset.colIndex);
    if (cfg.columns[i]) cfg.columns[i].label = el.textContent.trim();
  });
  bind('[data-edit="row-name"]', (el) => {
    const i = Number(el.dataset.rowIndex);
    if (cfg.rows[i]) cfg.rows[i].name = el.textContent.trim();
  });
  bind('[data-edit="cell-value"]', (el) => {
    const i = Number(el.dataset.rowIndex);
    const key = el.dataset.colKey;
    if (cfg.rows[i]) {
      cfg.rows[i].values = cfg.rows[i].values ?? {};
      cfg.rows[i].values[key] = el.textContent.trim();
    }
  });
}

export function renderEditForm(container, config, onChange, extra = {}) {
  const columnOptions = extra.columnOptions ?? [];
  const cfg = deepClone(config ?? DEFAULT_CONFIG);
  cfg.columns = cfg.columns ?? [];
  cfg.rows = cfg.rows ?? [];

  const emit = () => onChange(deepClone(cfg));

  function paint() {
    container.innerHTML = `
      <div class="mini-panel__section">
        <div class="mini-panel__label">列（クリックで名前を編集できます）</div>
        <div class="mini-panel__chips" data-role="columns"></div>
        <button type="button" class="btn btn-ghost btn-sm" data-action="add-column">+ 列を追加</button>
      </div>
      <div class="mini-panel__section">
        <div class="mini-panel__label">行（クリックで名前を編集できます）</div>
        <div class="mini-panel__chips" data-role="rows"></div>
        <button type="button" class="btn btn-ghost btn-sm" data-action="add-row">+ 行を追加</button>
      </div>
    `;

    const columnsWrap = container.querySelector('[data-role="columns"]');
    cfg.columns.forEach((col, colIndex) => {
      const chip = document.createElement("span");
      chip.className = "mini-chip";
      chip.innerHTML = `<span>${escapeHtml(col.label || "(無題の列)")}</span><button type="button" data-action="remove" title="削除">✕</button>`;
      chip.querySelector('[data-action="remove"]').addEventListener("click", () => {
        const removedKey = cfg.columns[colIndex].key;
        cfg.columns.splice(colIndex, 1);
        cfg.rows.forEach((row) => {
          if (row.values) delete row.values[removedKey];
        });
        paint();
        emit();
      });
      columnsWrap.appendChild(chip);
    });

    const rowsWrap = container.querySelector('[data-role="rows"]');
    cfg.rows.forEach((row, rowIndex) => {
      const chip = document.createElement("span");
      chip.className = "mini-chip";
      chip.innerHTML = `<span>${escapeHtml(row.name || "(無題の行)")}</span><button type="button" data-action="remove" title="削除">✕</button>`;
      chip.querySelector('[data-action="remove"]').addEventListener("click", () => {
        cfg.rows.splice(rowIndex, 1);
        paint();
        emit();
      });
      rowsWrap.appendChild(chip);
    });

    container.querySelector('[data-action="add-column"]').addEventListener("click", () => {
      const firstUnused = columnOptions.find((opt) => !cfg.columns.some((c) => c.key === opt.key));
      cfg.columns.push(
        firstUnused ? { key: firstUnused.key, label: firstUnused.label } : { key: `custom_${Date.now()}`, label: "" }
      );
      paint();
      emit();
    });
    container.querySelector('[data-action="add-row"]').addEventListener("click", () => {
      cfg.rows.push({ name: "", values: {} });
      paint();
      emit();
    });
  }

  paint();
}
