// games/genshin/presets.js
// 「テンプレから作る」で選べる4つのプリセット定義。
// テンプレが提供するのはあくまで「初期配置」（列見出し・タイトル・行や段階の名前などの枠組み）だけ。
// 実際の数値・効果内容・キャラ名といったデータは一切含めず、エディタでユーザー自身が埋める前提。
// blocks は id を持たない（state側でコピー時に crypto.randomUUID() を振る）。
export const PRESETS = [
  {
    id: "target_stats",
    label: "目標ステータス早見表",
    description: "会心率・会心ダメなどの目標値を凸数ごとに整理する表の枠を用意します",
    blocks: [
      {
        type: "stat_table",
        config: {
          columns: [
            { key: "crit_rate", label: "会心率" },
            { key: "crit_dmg", label: "会心ダメージ" },
            { key: "hp_percent", label: "HP%" },
            { key: "elemental_mastery", label: "元素熟知" },
          ],
          rows: [
            { name: "0凸", values: {} },
            { name: "完凸", values: {} },
          ],
        },
      },
    ],
  },
  {
    id: "weapon_priority",
    label: "武器・聖遺物 優先度",
    description: "武器や聖遺物メインステータスの優先順位を並べるリストの枠を用意します",
    blocks: [
      {
        type: "priority_list",
        config: { title: "武器優先度", items: [] },
      },
      {
        type: "priority_list",
        config: { title: "聖遺物メインステータス優先度", items: [] },
      },
    ],
  },
  {
    id: "artifact_combo",
    label: "装備の組み合わせ例",
    description: "キャラごとのおすすめ武器・聖遺物セットをまとめる表の枠を用意します",
    blocks: [
      {
        type: "icon_grid",
        config: { groupLabel: "キャラ", entries: [] },
      },
    ],
  },
  {
    id: "constellation_effect",
    label: "凸効果まとめ",
    description: "1凸〜6凸の効果を整理する表の枠（段階名のみ入力済み）を用意します",
    blocks: [
      {
        type: "tiered_effect",
        config: {
          rows: [
            { level: "1凸", effect: "", value: { type: "text", text: "" }, highlight: false },
            { level: "2凸", effect: "", value: { type: "text", text: "" }, highlight: false },
            { level: "3凸", effect: "", value: { type: "text", text: "" }, highlight: false },
            { level: "4凸", effect: "", value: { type: "text", text: "" }, highlight: false },
            { level: "5凸", effect: "", value: { type: "text", text: "" }, highlight: false },
            { level: "6凸", effect: "", value: { type: "text", text: "" }, highlight: false },
          ],
        },
      },
    ],
  },
];

export function getPreset(presetId) {
  return PRESETS.find((p) => p.id === presetId) || null;
}
