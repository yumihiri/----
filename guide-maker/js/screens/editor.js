// screens/editor.js
// ③エディタ画面。ブロック追加・プレビュー上の直接編集・ドラッグ配置・リサイズ・削除・
// 自動保存・PNG書き出しを統合するメイン画面。
// 「ラベルや値のテキスト」はプレビュー上で直接編集し、「列/行の追加削除」のような
// 構造操作だけは選択中のブロックのそばに浮かぶ小さいパネル（mini-panel）で行う。
import { getGame } from "../games/registry.js";
import { getBlockModule, BLOCK_TYPES } from "../core/blocks/index.js";
import { COLUMN_OPTIONS } from "../games/genshin/columnOptions.js";
import { exportSheetAsImage } from "../core/export/toImage.js";
import { listDrafts, loadDraft } from "../core/storage/autosave.js";
import { escapeHtml, deepClone } from "../core/utils.js";
import { navigate } from "../router.js";
import * as state from "../state.js";

const DEFAULT_BLOCK_WIDTH = 420;

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
let lastRenderedPanelBlockId;
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

  // テンプレ型（blocksが埋まった状態）で開いた場合は最初のブロックを自動選択し、
  // 「これを自分の内容に書き換えればいい」と一目で分かる修正体験にする。
  // 自由型（blocks:[]）で開いた場合は何も選択せず、ブロック追加メニューが主役になる。
  selectedBlockId = state.getState()?.blocks[0]?.id ?? null;
  lastRenderedPanelBlockId = undefined;

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

          <div class="controls-section controls-section--grow">
            <div class="controls-section__title">ブロックを追加</div>
            <p class="field__hint">クリック、またはドラッグしてプレビューに配置できます</p>
            <div class="block-add-menu">
              ${BLOCK_TYPES.map(
                (t) => `
                <button type="button" class="block-add-btn" draggable="true" data-add-type="${t.type}">
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
            <p class="field__hint">プレビュー上の文字はクリックすると直接編集できます</p>
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
      selectBlock(block.id);
    });
    btn.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", btn.dataset.addType);
      e.dataTransfer.effectAllowed = "copy";
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
    .map((block) => {
      const mod = getBlockModule(block.type);
      return `
        <div class="block-list-item ${block.id === selectedBlockId ? "is-active" : ""}" data-block-id="${block.id}">
          <span class="block-list-item__type">${mod ? escapeHtml(mod.LABEL) : escapeHtml(block.type)}</span>
          <span class="block-list-item__label" data-action="select">${escapeHtml(blockPreviewLabel(block, mod))}</span>
          <span class="block-list-item__actions">
            <button type="button" class="btn btn-icon btn-danger" data-action="delete" title="削除">✕</button>
          </span>
        </div>
      `;
    })
    .join("");

  listEl.querySelectorAll(".block-list-item").forEach((row) => {
    const blockId = row.dataset.blockId;
    row.querySelector('[data-action="select"]').addEventListener("click", () => selectBlock(blockId));
    row.querySelector('[data-action="delete"]').addEventListener("click", () => deleteBlock(blockId));
  });
}

function selectBlock(blockId) {
  selectedBlockId = blockId;
  renderAll(document.getElementById("app"), state.getState(), {});
}

function deleteBlock(blockId) {
  if (selectedBlockId === blockId) selectedBlockId = null;
  state.removeBlock(blockId);
}

// ブロックのドラッグ移動。移動量が小さい（クリック相当）場合は選択として扱う。
// contenteditable要素やリサイズハンドルの上ではドラッグを開始しない。
// ドラッグ中はstateを更新せずスタイルを直接操作し、pointerup時にのみ位置を確定させる
// （毎フレームstate経由で再描画するとDOMが作り直されドラッグが破綻するため）。
function attachDrag(blockEl, blockId) {
  const DRAG_THRESHOLD = 4;
  let dragging = false;
  let moved = false;
  let startClientX = 0;
  let startClientY = 0;
  let startLeft = 0;
  let startTop = 0;

  blockEl.addEventListener("pointerdown", (e) => {
    if (e.target.closest('[data-action="delete-block"]')) return;
    if (e.target.closest('[data-action="resize-block"]')) return;
    if (e.target.closest('[contenteditable="true"]')) return;
    dragging = true;
    moved = false;
    blockEl.setPointerCapture(e.pointerId);
    startClientX = e.clientX;
    startClientY = e.clientY;
    startLeft = parseFloat(blockEl.style.left) || 0;
    startTop = parseFloat(blockEl.style.top) || 0;
  });

  blockEl.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - startClientX;
    const dy = e.clientY - startClientY;
    if (!moved && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
      moved = true;
      blockEl.classList.add("is-dragging");
    }
    if (moved) {
      blockEl.style.left = `${Math.max(0, startLeft + dx)}px`;
      blockEl.style.top = `${Math.max(0, startTop + dy)}px`;
    }
  });

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    blockEl.classList.remove("is-dragging");
    if (moved) {
      const x = parseFloat(blockEl.style.left) || 0;
      const y = parseFloat(blockEl.style.top) || 0;
      state.updateBlockPosition(blockId, { x, y });
    } else {
      selectBlock(blockId);
    }
  }

  blockEl.addEventListener("pointerup", endDrag);
  blockEl.addEventListener("pointercancel", endDrag);
}

// ブロック右下角のハンドルで幅・高さを変更する。
function attachResize(blockEl, blockId) {
  const handle = blockEl.querySelector('[data-action="resize-block"]');
  if (!handle) return;
  let resizing = false;
  let startClientX = 0;
  let startClientY = 0;
  let startWidth = 0;
  let startHeight = 0;

  handle.addEventListener("pointerdown", (e) => {
    e.stopPropagation();
    resizing = true;
    handle.setPointerCapture(e.pointerId);
    startClientX = e.clientX;
    startClientY = e.clientY;
    const rect = blockEl.getBoundingClientRect();
    startWidth = rect.width;
    startHeight = rect.height;
  });

  handle.addEventListener("pointermove", (e) => {
    if (!resizing) return;
    const dx = e.clientX - startClientX;
    const dy = e.clientY - startClientY;
    blockEl.style.width = `${Math.max(220, startWidth + dx)}px`;
    blockEl.style.height = `${Math.max(120, startHeight + dy)}px`;
  });

  function endResize(e) {
    if (!resizing) return;
    resizing = false;
    const width = parseFloat(blockEl.style.width);
    const height = parseFloat(blockEl.style.height);
    state.updateBlockSize(blockId, { width, height });
  }

  handle.addEventListener("pointerup", endResize);
  handle.addEventListener("pointercancel", endResize);
}

// sheet要素の骨組み（表題欄+キャンバス）は初回だけ作る。以降renderPreviewは
// この骨組みの中身を差分更新する。canvasEl自体を使い回すことで、選択ブロックの
// contenteditableや、後述のミニパネルのDOMを不要に壊さずに済む。
function ensureSheetSkeleton(sheetEl) {
  if (sheetEl.querySelector("#sheetCanvas")) return;
  sheetEl.innerHTML = `
    <div class="sheet-titleblock" id="sheetTitleblock"></div>
    <div class="sheet-canvas" id="sheetCanvas"></div>
  `;
  wireCanvasDropTarget(sheetEl.querySelector("#sheetCanvas"));
}

function renderPreview(root, s) {
  const sheetEl = root.querySelector("#sheet");
  ensureSheetSkeleton(sheetEl);
  const game = getGame(s.gameId);

  sheetEl.querySelector("#sheetTitleblock").innerHTML = `
    <div>
      <div class="sheet-titleblock__title">${escapeHtml(s.title) || "無題のガイド"}</div>
      ${s.subtitle ? `<div class="sheet-titleblock__subtitle">${escapeHtml(s.subtitle)}</div>` : ""}
    </div>
    <div class="sheet-titleblock__meta">
      GAME: <span>${game ? escapeHtml(game.label) : ""}</span><br />
      BLOCKS: <span>${s.blocks.length}</span>
    </div>
  `;

  const canvasEl = sheetEl.querySelector("#sheetCanvas");
  const existingBlockEls = new Map();
  canvasEl.querySelectorAll(".sheet-block").forEach((el) => existingBlockEls.set(el.dataset.blockId, el));

  const currentIds = new Set(s.blocks.map((b) => b.id));
  existingBlockEls.forEach((el, id) => {
    if (!currentIds.has(id)) el.remove();
  });

  if (s.blocks.length === 0) {
    if (!canvasEl.querySelector(".sheet-empty")) {
      canvasEl.innerHTML = `<p class="sheet-empty">左のメニューからブロックを追加すると、ここに自由に配置できます</p>`;
    }
    lastRenderedPanelBlockId = undefined;
    return;
  }
  canvasEl.querySelector(".sheet-empty")?.remove();

  let selectedBlockEl = null;
  let selectedBlock = null;
  let selectedMod = null;

  s.blocks.forEach((block, index) => {
    const mod = getBlockModule(block.type);
    if (!mod) return;

    let blockEl = existingBlockEls.get(block.id);
    if (!blockEl) {
      blockEl = document.createElement("div");
      blockEl.dataset.blockId = block.id;
      blockEl.innerHTML = `
        <button type="button" class="sheet-block__delete" data-action="delete-block" title="このブロックを削除">✕</button>
        <span class="sheet-block__index"></span>
        <div class="sheet-block__title"></div>
        <div class="sheet-block__content"></div>
        <div class="sheet-block__resize" data-action="resize-block" title="ドラッグでサイズ変更"></div>
      `;
      blockEl.querySelector('[data-action="delete-block"]').addEventListener("click", (e) => {
        e.stopPropagation();
        deleteBlock(block.id);
      });
      attachDrag(blockEl, block.id);
      attachResize(blockEl, block.id);
      canvasEl.appendChild(blockEl);
    }

    const pos = block.position || { x: 24, y: 24 };
    const size = block.size || {};
    blockEl.className = `sheet-block ${block.id === selectedBlockId ? "is-selected" : ""}`;
    blockEl.style.left = `${pos.x}px`;
    blockEl.style.top = `${pos.y}px`;
    if (size.width) blockEl.style.width = `${size.width}px`;
    if (size.height) blockEl.style.height = `${size.height}px`;
    blockEl.querySelector(".sheet-block__index").textContent = String(index + 1).padStart(2, "0");
    blockEl.querySelector(".sheet-block__title").textContent = mod.LABEL;

    // 中身はフォーカスが無い時だけ再描画する（編集中に別ブロックの操作で
    // DOMが作り直され、contenteditableのカーソルが飛ぶのを防ぐため）。
    const contentEl = blockEl.querySelector(".sheet-block__content");
    if (!contentEl.contains(document.activeElement)) {
      contentEl.innerHTML = mod.render(block.config);
      if (mod.bindInlineEdit) {
        mod.bindInlineEdit(contentEl, block.config, (newConfig) => state.updateBlockConfig(block.id, newConfig));
      }
    }

    if (block.id === selectedBlockId) {
      selectedBlockEl = blockEl;
      selectedBlock = block;
      selectedMod = mod;
    }
  });

  if (selectedBlockEl) {
    renderMiniPanel(root, canvasEl, selectedBlockEl, selectedBlock, s, selectedMod);
  } else {
    lastRenderedPanelBlockId = undefined;
    canvasEl.querySelector("#miniPanel")?.remove();
  }

  // PNG書き出し時に全ブロックが収まるよう、一番下のブロックに合わせて高さを広げる。
  let maxBottom = 200;
  canvasEl.querySelectorAll(".sheet-block").forEach((el) => {
    const top = parseFloat(el.style.top) || 0;
    maxBottom = Math.max(maxBottom, top + el.offsetHeight + 24);
  });
  canvasEl.style.minHeight = `${maxBottom}px`;
}

// 左のブロック追加ボタンをドラッグ&ドロップしてキャンバスの好きな位置に配置できるようにする。
// canvasEl自体はensureSheetSkeletonで初回にしか作られないため、ここも1回だけ呼ばれる。
function wireCanvasDropTarget(canvasEl) {
  canvasEl.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  });
  canvasEl.addEventListener("drop", (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("text/plain");
    const mod = getBlockModule(type);
    if (!mod) return;
    const rect = canvasEl.getBoundingClientRect();
    const x = Math.max(0, Math.round(e.clientX - rect.left - 20));
    const y = Math.max(0, Math.round(e.clientY - rect.top - 20));
    const block = state.addBlock(mod.TYPE, deepClone(mod.DEFAULT_CONFIG));
    state.updateBlockPosition(block.id, { x, y });
    selectBlock(block.id);
  });
}

// 選択中ブロックのそばに浮かぶ、列/行の追加削除など構造操作専用の小さいパネル。
// 中身の再構築は選択ブロックが変わった時だけ行い、位置だけ毎回更新する
// （数値入力欄などのフォーカスを、無関係な再描画で失わないため）。
function renderMiniPanel(root, canvasEl, blockEl, block, s, mod) {
  let panel = canvasEl.querySelector("#miniPanel");
  if (!panel) {
    panel = document.createElement("div");
    panel.className = "mini-panel";
    panel.id = "miniPanel";
    panel.addEventListener("pointerdown", (e) => e.stopPropagation());
    canvasEl.appendChild(panel);
  }

  const left = parseFloat(blockEl.style.left) || 0;
  const top = parseFloat(blockEl.style.top) || 0;
  const blockWidth = parseFloat(blockEl.style.width) || blockEl.offsetWidth || DEFAULT_BLOCK_WIDTH;
  const viewport = root.querySelector(".sheet-viewport");
  const viewportRect = viewport.getBoundingClientRect();
  const canvasRect = canvasEl.getBoundingClientRect();
  const wouldOverflowRight = canvasRect.left + left + blockWidth + 250 > viewportRect.right;

  panel.style.left = wouldOverflowRight ? `${Math.max(0, left - 250)}px` : `${left + blockWidth + 10}px`;
  panel.style.top = `${top}px`;

  // 直接編集で列名などを変えた後もチップ表示を最新化したいので、パネル内に
  // フォーカスが無い限りは（ブロックが同じでも）毎回中身を作り直す。
  // 入力中（数値欄など）だけは再構築をスキップしてフォーカスを守る。
  const blockChanged = lastRenderedPanelBlockId !== block.id;
  lastRenderedPanelBlockId = block.id;
  if (blockChanged || !panel.contains(document.activeElement)) {
    panel.innerHTML = "";
    mod.renderEditForm(
      panel,
      block.config,
      (newConfig) => state.updateBlockConfig(block.id, newConfig),
      extraForBlockType(s.gameId, block.type)
    );
  }
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
