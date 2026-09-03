// screens/modeSelect.js
// ②モード選択画面。「テンプレから作る」「白紙から作る」の2択。
// テンプレを選ぶと該当プリセットのblocksを、白紙を選ぶと空blocksをStateにセットしてeditorへ。
import { getGame } from "../games/registry.js";
import { getBlockModule } from "../core/blocks/index.js";
import { PRESETS } from "../games/genshin/presets.js";
import { escapeHtml } from "../core/utils.js";
import { navigate } from "../router.js";
import * as state from "../state.js";

// v1では原神のみプリセットを持つ。他ゲームは registry.js の enabled 拡張時にここへ追加する。
function getPresetsForGame(gameId) {
  if (gameId === "genshin") return PRESETS;
  return [];
}

export function mount({ params, query }) {
  const gameId = params.gameId;
  const game = getGame(gameId);
  const root = document.getElementById("app");

  if (!game || !game.enabled) {
    navigate("/");
    return;
  }

  if (query.template) {
    renderConfirm(root, game, query.template);
  } else {
    renderChoice(root, game);
  }
}

function shell(game, inner) {
  return `
    <div class="app">
      <header class="topbar">
        <a href="#/" class="topbar__back">← ゲーム選択</a>
        <span class="topbar__spacer"></span>
        <span class="topbar__brand">Guide Maker</span>
      </header>
      <main class="screen">
        <div class="screen-center">${inner}</div>
      </main>
    </div>
  `;
}

function renderChoice(root, game) {
  root.innerHTML = shell(
    game,
    `
    <div class="screen-heading">
      <h1 class="screen-heading__title">${escapeHtml(game.label)} のガイドを作成</h1>
      <p class="screen-heading__desc">テンプレを使うか、白紙から自由に組み立てるかを選べます</p>
    </div>
    <div class="mode-grid">
      <button type="button" class="mode-card" data-action="template">
        <span class="mode-card__icon">▦</span>
        <span class="mode-card__title">テンプレから作る</span>
        <span class="mode-card__desc">目標ステータス表や優先度リストなど、よく使う構成から始められます</span>
      </button>
      <button type="button" class="mode-card" data-action="blank">
        <span class="mode-card__icon">＋</span>
        <span class="mode-card__title">白紙から作る</span>
        <span class="mode-card__desc">ブロックを1つずつ追加して、自由にガイドを組み立てます</span>
      </button>
    </div>
  `
  );

  root.querySelector('[data-action="template"]').addEventListener("click", () => {
    renderTemplateList(root, game);
  });
  root.querySelector('[data-action="blank"]').addEventListener("click", () => {
    startEditor(game.id, { title: "", blocks: [] });
  });
}

function renderTemplateList(root, game) {
  const presets = getPresetsForGame(game.id);
  root.innerHTML = shell(
    game,
    `
    <div class="screen-heading">
      <h1 class="screen-heading__title">テンプレを選択</h1>
      <p class="screen-heading__desc">選んだ後も内容は自由に編集できます</p>
    </div>
    <div class="template-panel">
      <div class="template-list">
        ${presets
          .map(
            (p) => `
          <button type="button" class="template-card" data-preset-id="${p.id}">
            <span class="template-card__title">${escapeHtml(p.label)}</span>
            <span class="template-card__desc">${escapeHtml(p.description)}</span>
          </button>
        `
          )
          .join("")}
      </div>
      <div class="screen-back-link">
        <a class="btn btn-ghost" href="#/${game.id}/start">← 選び方に戻る</a>
      </div>
    </div>
  `
  );

  root.querySelectorAll(".template-card").forEach((card) => {
    card.addEventListener("click", () => {
      navigate(`/${game.id}/start?template=${card.dataset.presetId}`);
    });
  });
}

function renderConfirm(root, game, presetId) {
  const presets = getPresetsForGame(game.id);
  const preset = presets.find((p) => p.id === presetId);
  if (!preset) {
    renderTemplateList(root, game);
    return;
  }

  const blockLabels = preset.blocks
    .map((b) => getBlockModule(b.type)?.LABEL || b.type)
    .join(" / ");

  root.innerHTML = shell(
    game,
    `
    <div class="screen-heading">
      <h1 class="screen-heading__title">${escapeHtml(preset.label)}</h1>
      <p class="screen-heading__desc">${escapeHtml(preset.description)}</p>
    </div>
    <div class="template-panel">
      <p class="template-panel__hint">含まれるブロック：${escapeHtml(blockLabels)}（内容は入力例です。作成後に自由に編集できます）</p>
      <div class="mode-grid">
        <button type="button" class="btn btn-primary btn-block" data-action="use">このテンプレで作成する</button>
      </div>
      <div class="screen-back-link">
        <a class="btn btn-ghost" href="#/${game.id}/start">← テンプレ一覧に戻る</a>
      </div>
    </div>
  `
  );

  root.querySelector('[data-action="use"]').addEventListener("click", () => {
    startEditor(game.id, { title: preset.label, blocks: preset.blocks });
  });
}

function startEditor(gameId, { title, blocks }) {
  state.initState({ gameId, title, blocks });
  navigate(`/${gameId}/edit`);
}
