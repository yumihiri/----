// games/registry.js
// 対応ゲーム一覧・有効/準備中フラグ。
// 新ゲームを追加する場合は、この配列に1行足して games/{id}/ の中身を埋める。
export const GAMES = [
  { id: "genshin", label: "原神", enabled: true },
  { id: "hsr", label: "崩壊：スターレイル", enabled: false },
  { id: "zzz", label: "ゼンレスゾーンゾーン", enabled: false },
];

export function getGame(gameId) {
  return GAMES.find((g) => g.id === gameId) || null;
}
