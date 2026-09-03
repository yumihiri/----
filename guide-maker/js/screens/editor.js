// screens/editor.js
// ③エディタ画面。ブロック追加・編集フォーム・プレビュー・並び替え・削除・
// 自動保存・PNG書き出しを統合するメイン画面。
import { getGame } from "../games/registry.js";
import { getBlockModule, BLOCK_TYPES } from "../core/blocks/index.js";
import { COLUMN_OPTIONS } from "../games/genshin/columnOptions.js";
import { exportSheetAsImage } from "../core/export/toImage.js";
import { listDrafts, loadDraft } from "../core/storage/autosave.js";
import { escapeHtml, deepClone } from "../core/utils.js";
import { navigate } from "../router.js";
import * as state from "../state.js";

// v1ではstat_tableの列候補のみゲーム固有データが必要。他ブロックはextra不要。
function extraForBlockType(gameId, type) {
  if (type === "stat_table" && gameId === "genshin") return { columnOptions: COLUMN_OPTIONS };
  return {};
}

function blockPreviewLabel(block, mod) {
  if (!mod) return "(不明なブロック)";
  switch (block.type) {
    case "stat_table": {
      const names = (block.config?.rows ?? []).map((r) => r.name).filter(Boolean);
      return names.length ? names.join("・") : "表（未入力）";
    }
    case "priority_list":
      return block.config?.title || "優先順位（未入力）";
    case "icon_grid":
      return block.config?.groupLabel || "組み合わせ";
    case "tiered_effect":
      return `凸効果（${block.config?.rows?.length ?? 0}件）`;
    default:
      return mod.LABEL;
  }
}

let selectedBlockId = null;
let lastRenderedFormBlockId;
let unsubscribe = null;

export function mount({ params }) {
  const gameId = params.gameId;
  const game = getGame(gameId);
  const root = document.getElementById("app");

  if (!game || !game.enabled) {
    navigate("/");
    return;
  }

  restoreOrInitState(gameId);

  selectedBlockId = null;
  lastRenderedFormBlockId = undefined;

  root.innerHTML = buildShell(game);
  wireStaticHandlers(root, game);

  if (unsubscribe) unsubscribe();
  unsubscribe = state.subscribe((s, meta) => renderAll(root, s, meta));

  renderAll(root, state.getState(), {});
}

function restoreOrInitState(gameId) {
  const current = state.getState();
  if (current && current.gameId === gameId) {
    // モード選択画面から遷移した直後は、既にStateが初期化済みなのでそれを使う。
    return;
  }
  // リロード等でStateが失われた場合は、同じゲームの最新の下書きを自動復元する。
  const drafts = listDrafts(gameId);
  const draft = drafts.length > 0 ? loadDraft(gameId, drafts[0].id) : null;
  if (draft) {
    state.loadStateFromDraft(draft);
  } else {
    state.initState({ gameId, title: "", blocks: [] });
  }
}

function buildShell(game) {
  return `
    <div class="app">
      <header class="topbar">
        <a href="#/${game.id}/start" class="topbar__back">← モード選択</a>
        <span class="topbar__spacer"></span>
        <span class="topbar__brand">Guide Maker</span>
      </header>
      <div class="editor-layout">
        <aside class="controls-panel">
          <div class="controls-section">
            <div class="controls-section__title">ガイド情報</div>
            <label class="field">
              <span class="field__label">タイトル</span>
              <input class="input" type="text" id="titleInput" placeholder="例：フリーナ 完凸ガイド" />
            </label>
            <label class="field">
              <span class="field__label">サブタイトル（任意）</span>
              <input class="input" type="text" id="subtitleInput" placeholder="例：前提条件など" />
            </label>
          </div>

          <div class="controls-section">
            <div class="controls-section__title">ブロックを追加</div>
            <div class="block-add-menu">
              ${BLOCK_TYPES.map(
                (t) => `
                <button type="button" class="block-add-btn" data-add-type="${t.type}">
                  <span class="block-add-btn__label">${escapeHtml(t.label)}</span>
                  <span class="block-add-btn__desc">${escapeHtml(t.description)}</span>
                </button>
              `
              ).join("")}
            </div>
          </div>

          <div class="controls-section">
            <div class="controls-section__title">ブロック一覧</div>
            <div class="block-list" id="blockList"></div>
          </div>

          <div class="controls-section controls-section--grow">
            <div class="controls-section__title">選択中のブロックを編集</div>
            <div class="block-edit-form" id="blockEditForm"></div>
          </div>

          <div class="controls-footer">
            <span class="save-status" id="saveStatus">
              <span class="save-status__dot"></span>
              <span id="saveStatusText">保存済み</span>
            </span>
          </div>
        </aside>

        <section class="sheet-panel">
          <div class="sheet-toolbar">
            <button type="button" class="btn btn-primary" id="exportBtn">PNGで書き出す</button>
          </div>
          <div class="sheet-viewport">
            <div class="sheet" id="sheet"></div>
          </div>
        </section>
      </div>
    </div>
  `;
}

function wireStaticHandlers(root, game) {
  root.querySelector("#titleInput").addEventListener("input", (e) => {
    state.setTitle(e.target.value);
  });
  root.querySelector("#subtitleInput").addEventListener("input", (e) => {
    state.setSubtitle(e.target.value);
  });

  root.querySelectorAll("[data-add-type]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mod = getBlockModule(btn.dataset.addType);
      if (!mod) return;
      const block = state.addBlock(mod.TYPE, deepClone(mod.DEFAULT_CONFIG));
      selectedBlockId = block.id;
    });
  });

  root.querySelector("#exportBtn").addEventListener("click", async () => {
    const btn = root.querySelector("#exportBtn");
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = "書き出し中…";
    try {
      const s = state.getState();
      const filename = `${(s.title || "guide").trim() || "guide"}.png`;
      await exportSheetAsImage(root.querySelector("#sheet"), filename);
    } catch (err) {
      alert(`書き出しに失敗しました: ${err.message}`);
    } finally {
      btn.disabled = false;
      btn.textContent = original;
    }
  });
}

function renderAll(root, s, meta) {
  if (!s) return;
  syncInputValue(root.querySelector("#titleInput"), s.title);
  syncInputValue(root.querySelector("#subtitleInput"), s.subtitle);

  renderBlockList(root, s);
  renderPreview(root, s);
  renderEditFormPanel(root, s);
  renderSaveStatus(root, meta);
}

function syncInputValue(input, value) {
  if (!input || document.activeElement === input) return;
  if (input.value !== (value ?? "")) input.value = value ?? "";
}

function renderBlockList(root, s) {
  const listEl = root.querySelector("#blockList");
  if (s.blocks.length === 0) {
    listEl.innerHTML = `<p class="block-list__empty">まだブロックがありません<br>上のメニューから追加してください</p>`;
    return;
  }

  listEl.innerHTML = s.blocks
    .map((block, index) => {
      const mod = getBlockModule(block.type);
      return `
        <div class="block-list-item ${block.id === selectedBlockId ? "is-active" : ""}" data-block-id="${block.id}">
          <span class="block-list-item__type">${mod ? escapeHtml(mod.LABEL) : escapeHtml(block.type)}</span>
          <span class="block-list-item__label" data-action="select">${escapeHtml(blockPreviewLabel(block, mod))}</span>
          <span class="block-list-item__actions">
            <button type="button" class="btn btn-icon" data-action="move-up" title="上へ" ${index === 0 ? "disabled" : ""}>↑</button>
            <button type="button" class="btn btn-icon" data-action="move-down" title="下へ" ${index === s.blocks.length - 1 ? "disabled" : ""}>↓</button>
            <button type="button" class="btn btn-icon btn-danger" data-action="delete" title="削除">✕</button>
          </span>
        </div>
      `;
    })
    .join("");

  listEl.querySelectorAll(".block-list-item").forEach((row) => {
    const blockId = row.dataset.blockId;
    row.querySelector('[data-action="select"]').addEventListener("click", () => {
      selectedBlockId = blockId;
      renderBlockList(root, state.getState());
      renderEditFormPanel(root, state.getState());
    });
    row.querySelector('[data-action="move-up"]').addEventListener("click", () => state.moveBlock(blockId, "up"));
    row.querySelector('[data-action="move-down"]').addEventListener("click", () => state.moveBlock(blockId, "down"));
    row.querySelector('[data-action="delete"]').addEventListener("click", () => {
      if (selectedBlockId === blockId) selectedBlockId = null;
      state.removeBlock(blockId);
    });
  });
}

function renderPreview(root, s) {
  const sheetEl = root.querySelector("#sheet");
  const game = getGame(s.gameId);

  const blocksHtml = s.blocks.length
    ? s.blocks
        .map((block, index) => {
          const mod = getBlockModule(block.type);
          if (!mod) return "";
          return `
            <div class="sheet-block">
              <span class="sheet-block__index">${String(index + 1).padStart(2, "0")}</span>
              <div class="sheet-block__title">${escapeHtml(mod.LABEL)}</div>
              ${mod.render(block.config)}
            </div>
          `;
        })
        .join("")
    : `<p class="sheet-empty">左のメニューからブロックを追加すると、ここにプレビューが表示されます</p>`;

  sheetEl.innerHTML = `
    <div class="sheet-titleblock">
      <div>
        <div class="sheet-titleblock__title">${escapeHtml(s.title) || "無題のガイド"}</div>
        ${s.subtitle ? `<div class="sheet-titleblock__subtitle">${escapeHtml(s.subtitle)}</div>` : ""}
      </div>
      <div class="sheet-titleblock__meta">
        GAME: <span>${game ? escapeHtml(game.label) : ""}</span><br />
        BLOCKS: <span>${s.blocks.length}</span>
      </div>
    </div>
    ${blocksHtml}
  `;
}

function renderEditFormPanel(root, s) {
  const panel = root.querySelector("#blockEditForm");
  const block = s.blocks.find((b) => b.id === selectedBlockId);

  if (!block) {
    lastRenderedFormBlockId = undefined;
    panel.innerHTML = `<p class="block-edit-form__empty">左の一覧からブロックを選択すると、ここに編集フォームが表示されます</p>`;
    return;
  }

  // 同じブロックを編集中はフォームDOMを作り直さない（入力中のフォーカスを失わないため）。
  if (lastRenderedFormBlockId === block.id) return;
  lastRenderedFormBlockId = block.id;

  const mod = getBlockModule(block.type);
  panel.innerHTML = "";
  if (!mod) return;

  mod.renderEditForm(
    panel,
    block.config,
    (newConfig) => state.updateBlockConfig(block.id, newConfig),
    extraForBlockType(s.gameId, block.type)
  );
}

function renderSaveStatus(root, meta) {
  const statusEl = root.querySelector("#saveStatus");
  const textEl = root.querySelector("#saveStatusText");
  if (meta && meta.saving) {
    statusEl.classList.add("is-saving");
    textEl.textContent = "保存中…";
  } else {
    statusEl.classList.remove("is-saving");
    textEl.textContent = "保存済み";
  }
}
