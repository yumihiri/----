// screens/gameSelect.js
// ①ゲーム選択画面。対応ゲームをカードで表示。原神以外は「準備中」でクリック不可。
import { GAMES } from "../games/registry.js";
import { navigate } from "../router.js";

export function mount() {
  const root = document.getElementById("app");
  root.innerHTML = `
    <div class="app">
      <header class="topbar">
        <span class="topbar__brand">Guide Maker</span>
      </header>
      <main class="screen">
        <div class="screen-center">
          <div class="screen-heading">
            <h1 class="screen-heading__title">攻略ガイドを作るゲームを選択</h1>
            <p class="screen-heading__desc">テンプレまたは白紙から、ブループリント風の攻略ガイドを作成できます</p>
          </div>
          <div class="game-grid">
            ${GAMES.map(renderCard).join("")}
          </div>
        </div>
      </main>
    </div>
  `;

  root.querySelectorAll(".game-card.is-enabled").forEach((card) => {
    card.addEventListener("click", () => {
      navigate(`/${card.dataset.gameId}/start`);
    });
  });
}

function renderCard(game) {
  return `
    <div class="game-card ${game.enabled ? "is-enabled" : "is-disabled"}" data-game-id="${game.id}">
      ${!game.enabled ? `<span class="badge badge--soon game-card__badge">準備中</span>` : ""}
      <span class="game-card__title">${game.label}</span>
    </div>
  `;
}
