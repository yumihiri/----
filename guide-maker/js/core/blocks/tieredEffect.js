// core/blocks/tieredEffect.js
// 凸効果表ブロック。value.type ごとに percent_range / star / text の3種で描画する。
// 凸段階・効果テキストはプレビュー上の直接編集で書き換える
// （text型の数値欄も同様。percent_range/starは専用の数値入力が必要なためミニパネル側で扱う）。
import { escapeHtml, deepClone } from "../utils.js";

export const TYPE = "tiered_effect";
export const LABEL = "凸効果表";
export const DESCRIPTION = "段階ごとに変わる効果を示したい（凸効果・レベル別ボーナスなど）";
export const DEFAULT_CONFIG = { rows: [] };

function defaultValueForType(type) {
  if (type === "percent_range") return { type, min: 0, max: 0 };
  if (type === "star") return { type, rating: 0, max: 5 };
  return { type: "text", text: "" };
}

function renderValue(value, rowIndex) {
  if (!value) return "";
  if (value.type === "percent_range") {
    const min = Number(value.min ?? 0);
    const max = Number(value.max ?? 0);
    return min === max ? `${max}%` : `${min}~${max}%`;
  }
  if (value.type === "star") {
    const max = Math.max(0, Number(value.max ?? 5));
    const rating = Math.max(0, Math.min(Number(value.rating ?? 0), max));
    const on = "★".repeat(rating);
    const off = "☆".repeat(max - rating);
    return `<span class="tiered-star">${on}<span class="tiered-star__off">${off}</span></span>`;
  }
  return `<span contenteditable="true" data-edit="value-text" data-row-index="${rowIndex}" data-placeholder="数値・テキスト">${escapeHtml(value.text ?? "")}</span>`;
}

export function render(config) {
  const rows = config?.rows ?? [];
  if (rows.length === 0) {
    return `<p class="sheet-empty">行を追加すると凸効果表が表示されます</p>`;
  }
  const bodyRows = rows
    .map(
      (row, i) => `
        <tr class="${row.highlight ? "is-highlight" : ""}">
          <td class="is-level" contenteditable="true" data-edit="level" data-row-index="${i}" data-placeholder="凸段階">${escapeHtml(row.level)}</td>
          <td contenteditable="true" data-edit="effect" data-row-index="${i}" data-placeholder="効果">${escapeHtml(row.effect)}</td>
          <td class="is-value">${renderValue(row.value, i)}</td>
        </tr>
      `
    )
    .join("");
  return `
    <table class="tiered-effect">
      <thead><tr><th>凸</th><th>効果</th><th>数値</th></tr></thead>
      <tbody>${bodyRows}</tbody>
    </table>
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

  bind('[data-edit="level"]', (el) => {
    const i = Number(el.dataset.rowIndex);
    if (cfg.rows[i]) cfg.rows[i].level = el.textContent.trim();
  });
  bind('[data-edit="effect"]', (el) => {
    const i = Number(el.dataset.rowIndex);
    if (cfg.rows[i]) cfg.rows[i].effect = el.textContent.trim();
  });
  bind('[data-edit="value-text"]', (el) => {
    const i = Number(el.dataset.rowIndex);
    if (cfg.rows[i]?.value) cfg.rows[i].value.text = el.textContent.trim();
  });
}

function renderValueFieldsHtml(value) {
  if (value.type === "percent_range") {
    return `
      <div class="mini-panel__inline">
        <input class="input input-sm" type="number" data-field="min" value="${value.min ?? 0}" placeholder="最小%" />
        <span>~</span>
        <input class="input input-sm" type="number" data-field="max" value="${value.max ?? 0}" placeholder="最大%" />
      </div>
    `;
  }
  if (value.type === "star") {
    return `
      <div class="mini-panel__inline">
        <input class="input input-sm" type="number" min="0" data-field="rating" value="${value.rating ?? 0}" placeholder="評価" />
        <span>/</span>
        <input class="input input-sm" type="number" min="1" data-field="max" value="${value.max ?? 5}" placeholder="満点" />
      </div>
    `;
  }
  return `<p class="field__hint">数値・テキストはプレビュー上で直接編集できます</p>`;
}

export function renderEditForm(container, config, onChange) {
  const cfg = deepClone(config ?? DEFAULT_CONFIG);
  cfg.rows = cfg.rows ?? [];

  const emit = () => onChange(deepClone(cfg));

  function paint() {
    container.innerHTML = `
      <div class="mini-panel__section">
        <div class="mini-panel__label">行（クリックで凸段階・効果を編集できます）</div>
        <div class="mini-panel__list" data-role="rows"></div>
        <button type="button" class="btn btn-ghost btn-sm" data-action="add-row">+ 行を追加</button>
      </div>
    `;

    const wrap = container.querySelector('[data-role="rows"]');
    cfg.rows.forEach((row, index) => {
      row.value = row.value ?? defaultValueForType("percent_range");
      const type = row.value.type;

      const item = document.createElement("div");
      item.className = "mini-panel__row-group";
      item.innerHTML = `
        <div class="mini-panel__row">
          <span class="mini-panel__row-label">${escapeHtml(row.level || "(無題)")}</span>
          <button type="button" class="btn btn-icon btn-danger" data-action="remove" title="削除">✕</button>
        </div>
        <div class="mini-panel__inline">
          <select class="select select-sm" data-field="value-type">
            <option value="percent_range" ${type === "percent_range" ? "selected" : ""}>数値範囲(%)</option>
            <option value="star" ${type === "star" ? "selected" : ""}>星評価</option>
            <option value="text" ${type === "text" ? "selected" : ""}>テキスト</option>
          </select>
          <label class="mini-panel__checkbox">
            <input type="checkbox" data-field="highlight" ${row.highlight ? "checked" : ""} /> 強調
          </label>
        </div>
        <div data-role="value-fields">${renderValueFieldsHtml(row.value)}</div>
      `;

      item.querySelector('[data-action="remove"]').addEventListener("click", () => {
        cfg.rows.splice(index, 1);
        paint();
        emit();
      });
      item.querySelector('[data-field="value-type"]').addEventListener("change", (e) => {
        row.value = defaultValueForType(e.target.value);
        paint();
        emit();
      });
      item.querySelector('[data-field="highlight"]').addEventListener("change", (e) => {
        row.highlight = e.target.checked;
        emit();
      });

      // changeイベントで確定させる（inputだと入力中に再描画が走りフォーカスを失うため）
      const valueFieldsEl = item.querySelector('[data-role="value-fields"]');
      const minInput = valueFieldsEl.querySelector('[data-field="min"]');
      if (minInput) minInput.addEventListener("change", (e) => { row.value.min = Number(e.target.value); emit(); });
      const maxInput = valueFieldsEl.querySelector('[data-field="max"]');
      if (maxInput) maxInput.addEventListener("change", (e) => { row.value.max = Number(e.target.value); emit(); });
      const ratingInput = valueFieldsEl.querySelector('[data-field="rating"]');
      if (ratingInput) ratingInput.addEventListener("change", (e) => { row.value.rating = Number(e.target.value); emit(); });

      wrap.appendChild(item);
    });

    container.querySelector('[data-action="add-row"]').addEventListener("click", () => {
      cfg.rows.push({ level: "", effect: "", value: defaultValueForType("percent_range"), highlight: false });
      paint();
      emit();
    });
  }

  paint();
}
