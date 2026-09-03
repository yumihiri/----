// core/blocks/tieredEffect.js
// 凸効果表ブロック。value.type ごとに percent_range / star / text の3種で描画する。
import { escapeHtml, deepClone } from "../utils.js";

export const TYPE = "tiered_effect";
export const LABEL = "凸効果表";
export const DESCRIPTION = "1凸〜6凸などの段階別効果を表で整理する";
export const DEFAULT_CONFIG = { rows: [] };

function defaultValueForType(type) {
  if (type === "percent_range") return { type, min: 0, max: 0 };
  if (type === "star") return { type, rating: 0, max: 5 };
  return { type: "text", text: "" };
}

function renderValue(value) {
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
  return escapeHtml(value.text ?? "");
}

export function render(config) {
  const rows = config?.rows ?? [];
  if (rows.length === 0) {
    return `<p class="sheet-empty">行を追加すると凸効果表が表示されます</p>`;
  }
  const bodyRows = rows
    .map(
      (row) => `
        <tr class="${row.highlight ? "is-highlight" : ""}">
          <td class="is-level">${escapeHtml(row.level)}</td>
          <td>${escapeHtml(row.effect)}</td>
          <td class="is-value">${renderValue(row.value)}</td>
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

export function renderEditForm(container, config, onChange) {
  const cfg = deepClone(config ?? DEFAULT_CONFIG);
  cfg.rows = cfg.rows ?? [];

  const emit = () => onChange(deepClone(cfg));

  function paint() {
    container.innerHTML = `
      <div class="form-subhead"><span class="form-subhead__title">凸効果（表示順）</span></div>
      <div class="form-list" data-role="rows"></div>
      <button type="button" class="btn btn-ghost btn-block" data-action="add-row">+ 行を追加</button>
    `;

    const rowsWrap = container.querySelector('[data-role="rows"]');
    cfg.rows.forEach((row, index) => {
      row.value = row.value ?? defaultValueForType("percent_range");
      const type = row.value.type;

      const valueFieldsHtml =
        type === "percent_range"
          ? `
            <div class="form-grid-2">
              <label class="field">
                <span class="field__label">最小%</span>
                <input class="input" type="number" data-field="min" value="${row.value.min ?? 0}" />
              </label>
              <label class="field">
                <span class="field__label">最大%</span>
                <input class="input" type="number" data-field="max" value="${row.value.max ?? 0}" />
              </label>
            </div>
          `
          : type === "star"
          ? `
            <div class="form-grid-2">
              <label class="field">
                <span class="field__label">評価</span>
                <input class="input" type="number" min="0" data-field="rating" value="${row.value.rating ?? 0}" />
              </label>
              <label class="field">
                <span class="field__label">満点</span>
                <input class="input" type="number" min="1" data-field="max" value="${row.value.max ?? 5}" />
              </label>
            </div>
          `
          : `
            <label class="field">
              <span class="field__label">表示テキスト</span>
              <input class="input" type="text" data-field="text" value="${escapeHtml(row.value.text ?? "")}" placeholder="例：発動条件なし" />
            </label>
          `;

      const item = document.createElement("div");
      item.className = "form-list-item";
      item.innerHTML = `
        <div class="form-row">
          <label class="field">
            <span class="field__label">凸段階</span>
            <input class="input" type="text" data-field="level" value="${escapeHtml(row.level ?? "")}" placeholder="例：1凸" />
          </label>
          <button type="button" class="btn btn-icon btn-danger" data-action="remove" title="削除">✕</button>
        </div>
        <label class="field">
          <span class="field__label">効果</span>
          <textarea class="textarea" data-field="effect" placeholder="例：スキルのダメージが上昇する">${escapeHtml(row.effect ?? "")}</textarea>
        </label>
        <label class="field">
          <span class="field__label">数値の種類</span>
          <select class="select" data-field="value-type">
            <option value="percent_range" ${type === "percent_range" ? "selected" : ""}>数値範囲(%)</option>
            <option value="star" ${type === "star" ? "selected" : ""}>星評価</option>
            <option value="text" ${type === "text" ? "selected" : ""}>テキスト</option>
          </select>
        </label>
        <div data-role="value-fields">${valueFieldsHtml}</div>
        <label class="field field-checkbox">
          <input type="checkbox" data-field="highlight" ${row.highlight ? "checked" : ""} />
          <span class="field__label">強調表示する</span>
        </label>
      `;

      item.querySelector('[data-field="level"]').addEventListener("input", (e) => {
        row.level = e.target.value;
        emit();
      });
      item.querySelector('[data-field="effect"]').addEventListener("input", (e) => {
        row.effect = e.target.value;
        emit();
      });
      item.querySelector('[data-field="highlight"]').addEventListener("change", (e) => {
        row.highlight = e.target.checked;
        emit();
      });
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

      const minInput = item.querySelector('[data-field="min"]');
      if (minInput) minInput.addEventListener("input", (e) => { row.value.min = Number(e.target.value); emit(); });
      const maxInput = item.querySelector('[data-field="max"]');
      if (maxInput) maxInput.addEventListener("input", (e) => { row.value.max = Number(e.target.value); emit(); });
      const ratingInput = item.querySelector('[data-field="rating"]');
      if (ratingInput) ratingInput.addEventListener("input", (e) => { row.value.rating = Number(e.target.value); emit(); });
      const textInput = item.querySelector('[data-field="text"]');
      if (textInput) textInput.addEventListener("input", (e) => { row.value.text = e.target.value; emit(); });

      rowsWrap.appendChild(item);
    });

    container.querySelector('[data-action="add-row"]').addEventListener("click", () => {
      cfg.rows.push({ level: "", effect: "", value: defaultValueForType("percent_range"), highlight: false });
      paint();
      emit();
    });
  }

  paint();
}
