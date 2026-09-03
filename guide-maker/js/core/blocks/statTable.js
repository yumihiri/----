// core/blocks/statTable.js
// 目標ステータス表ブロック。ゲーム固有の知識は持たず、列候補は extra.columnOptions で受け取る。
import { escapeHtml, deepClone } from "../utils.js";

export const TYPE = "stat_table";
export const LABEL = "目標ステータス表";
export const DESCRIPTION = "凸・条件ごとの目標ステータスを表で整理する";
export const DEFAULT_CONFIG = { columns: [], rows: [] };

export function render(config) {
  const columns = config?.columns ?? [];
  const rows = config?.rows ?? [];
  if (columns.length === 0 || rows.length === 0) {
    return `<p class="sheet-empty">「列」と「行」を追加すると表が表示されます</p>`;
  }
  const theadCells = columns.map((c) => `<th>${escapeHtml(c.label)}</th>`).join("");
  const bodyRows = rows
    .map((row) => {
      const cells = columns
        .map((c) => `<td>${escapeHtml(row.values?.[c.key] ?? "")}</td>`)
        .join("");
      return `<tr><td>${escapeHtml(row.name)}</td>${cells}</tr>`;
    })
    .join("");
  return `<table class="stat-table"><thead><tr><th>項目</th>${theadCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
}

export function renderEditForm(container, config, onChange, extra = {}) {
  const columnOptions = extra.columnOptions ?? [];
  const cfg = deepClone(config ?? DEFAULT_CONFIG);
  cfg.columns = cfg.columns ?? [];
  cfg.rows = cfg.rows ?? [];

  const emit = () => onChange(deepClone(cfg));

  function paint() {
    container.innerHTML = `
      <div class="form-subhead"><span class="form-subhead__title">列（項目）</span></div>
      <div class="form-list" data-role="columns"></div>
      <button type="button" class="btn btn-ghost btn-block" data-action="add-column">+ 列を追加</button>
      <div class="form-subhead"><span class="form-subhead__title">行（キャラ・条件）</span></div>
      <div class="form-list" data-role="rows"></div>
      <button type="button" class="btn btn-ghost btn-block" data-action="add-row">+ 行を追加</button>
    `;

    const columnsWrap = container.querySelector('[data-role="columns"]');
    cfg.columns.forEach((col, colIndex) => {
      const isCustom = !columnOptions.some((opt) => opt.key === col.key);
      const item = document.createElement("div");
      item.className = "form-list-item";
      item.innerHTML = `
        <div class="form-row">
          <label class="field">
            <span class="field__label">項目</span>
            <select class="select" data-field="key">
              ${columnOptions
                .map(
                  (opt) =>
                    `<option value="${escapeHtml(opt.key)}" ${opt.key === col.key ? "selected" : ""}>${escapeHtml(opt.label)}</option>`
                )
                .join("")}
              <option value="__custom__" ${isCustom ? "selected" : ""}>自由入力…</option>
            </select>
          </label>
          <button type="button" class="btn btn-icon btn-danger" data-action="remove-column" title="この列を削除">✕</button>
        </div>
        ${
          isCustom
            ? `<label class="field">
                <span class="field__label">列名（自由入力）</span>
                <input class="input" type="text" data-field="custom-label" value="${escapeHtml(col.label)}" placeholder="例：与ダメージ" />
              </label>`
            : ""
        }
      `;

      item.querySelector('[data-field="key"]').addEventListener("change", (e) => {
        const value = e.target.value;
        if (value === "__custom__") {
          cfg.columns[colIndex] = { key: `custom_${Date.now()}`, label: "" };
        } else {
          const opt = columnOptions.find((o) => o.key === value);
          cfg.columns[colIndex] = { key: opt.key, label: opt.label };
        }
        paint();
        emit();
      });
      item.querySelector('[data-action="remove-column"]').addEventListener("click", () => {
        const removedKey = cfg.columns[colIndex].key;
        cfg.columns.splice(colIndex, 1);
        cfg.rows.forEach((row) => {
          if (row.values) delete row.values[removedKey];
        });
        paint();
        emit();
      });
      const customLabelInput = item.querySelector('[data-field="custom-label"]');
      if (customLabelInput) {
        customLabelInput.addEventListener("input", (e) => {
          cfg.columns[colIndex].label = e.target.value;
          emit();
        });
      }

      columnsWrap.appendChild(item);
    });

    const rowsWrap = container.querySelector('[data-role="rows"]');
    cfg.rows.forEach((row, rowIndex) => {
      row.values = row.values ?? {};
      const item = document.createElement("div");
      item.className = "form-list-item";
      item.innerHTML = `
        <div class="form-row">
          <label class="field">
            <span class="field__label">名前（キャラ・条件）</span>
            <input class="input" type="text" data-field="name" value="${escapeHtml(row.name)}" placeholder="例：0凸" />
          </label>
          <button type="button" class="btn btn-icon btn-danger" data-action="remove-row" title="この行を削除">✕</button>
        </div>
        ${cfg.columns
          .map(
            (col) => `
          <label class="field">
            <span class="field__label">${escapeHtml(col.label || "(未設定の列)")}</span>
            <input class="input" type="text" data-field="value" data-key="${escapeHtml(col.key)}" value="${escapeHtml(row.values[col.key] ?? "")}" placeholder="例：60~70%" />
          </label>`
          )
          .join("")}
      `;

      item.querySelector('[data-field="name"]').addEventListener("input", (e) => {
        row.name = e.target.value;
        emit();
      });
      item.querySelector('[data-action="remove-row"]').addEventListener("click", () => {
        cfg.rows.splice(rowIndex, 1);
        paint();
        emit();
      });
      item.querySelectorAll('[data-field="value"]').forEach((input) => {
        input.addEventListener("input", (e) => {
          row.values[e.target.dataset.key] = e.target.value;
          emit();
        });
      });

      rowsWrap.appendChild(item);
    });

    container.querySelector('[data-action="add-column"]').addEventListener("click", () => {
      const firstUnused = columnOptions.find((opt) => !cfg.columns.some((c) => c.key === opt.key));
      cfg.columns.push(firstUnused ? { key: firstUnused.key, label: firstUnused.label } : { key: `custom_${Date.now()}`, label: "" });
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
