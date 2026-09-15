// games/genshin/presets.js
// 「テンプレから作る」で選べる4つのプリセット定義。
// 空の器（列見出しだけ）ではなく、サンプル値まで入った「完成形」として定義する。
// テンプレ型はこのサンプルを自分の内容に書き換えていく「修正」の体験を意図している
// （自由型＝blocks:[]で始める「構築」の体験と対になる）。
// blocks は id を持たない（state側でコピー時に crypto.randomUUID() を振る）。
export const PRESETS = [
  {
    id: "target_stats",
    label: "目標ステータス早見表",
    description: "会心率・会心ダメなどの目標値を凸数ごとに整理したサンプルです。数値を書き換えて使えます",
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
            {
              name: "0凸",
              values: {
                crit_rate: "60~70%",
                crit_dmg: "120~140%",
                hp_percent: "40%以上",
                elemental_mastery: "800",
              },
            },
            {
              name: "完凸",
              values: {
                crit_rate: "70~80%",
                crit_dmg: "140~160%",
                hp_percent: "50%以上",
                elemental_mastery: "1000",
              },
            },
          ],
        },
      },
    ],
  },
  {
    id: "weapon_priority",
    label: "武器・聖遺物 優先度",
    description: "武器や聖遺物メインステータスの優先順位を整理したサンプルです。並び替えて使えます",
    blocks: [
      {
        type: "priority_list",
        config: {
          title: "武器優先度",
          items: [
            { label: "西風剣", note: "" },
            { label: "笹穂突き", note: "凸あり推奨" },
          ],
        },
      },
      {
        type: "priority_list",
        config: {
          title: "聖遺物メインステータス優先度",
          items: [
            { label: "HP%（砂・杯・冠）", note: "HPスケール型の場合" },
            { label: "元素チャージ効率", note: "100%を目安に確保" },
            { label: "会心率・会心ダメ", note: "冠で比率を調整" },
          ],
        },
      },
    ],
  },
  {
    id: "artifact_combo",
    label: "装備の組み合わせ例",
    description: "パーティ4人分の聖遺物組み合わせパターンを一覧にしたサンプルです。内容を書き換えて使えます",
    blocks: [
      {
        type: "icon_grid",
        config: {
          characters: [{ name: "フリーナ" }, { name: "ナヴィア" }, { name: "行秋" }, { name: "香菱" }],
          rows: [
            {
              items: [
                { label: "海祇の御盾" },
                { label: "黄金の劇団" },
                { label: "追憶のしめ縄" },
                { label: "翠緑の影" },
              ],
            },
          ],
        },
      },
    ],
  },
  {
    id: "constellation_effect",
    label: "凸効果まとめ",
    description: "1凸〜6凸の効果を整理したサンプルです。内容を書き換えて使えます",
    blocks: [
      {
        type: "tiered_effect",
        config: {
          rows: [
            {
              level: "1凸",
              effect: "熟知参照の基礎ダメージ加算",
              value: { type: "percent_range", min: 8, max: 12 },
              highlight: false,
            },
            {
              level: "2凸",
              effect: "特定の操作キャラに切り替えた際、元素爆発が即座に使用可能になる",
              value: { type: "text", text: "元素爆発不要" },
              highlight: false,
            },
            {
              level: "3凸",
              effect: "元素爆発のレベルが上昇",
              value: { type: "text", text: "Lv.+3" },
              highlight: false,
            },
            {
              level: "4凸",
              effect: "パーティ全体の元素ダメージが上昇する",
              value: { type: "star", rating: 4, max: 5 },
              highlight: true,
            },
            {
              level: "5凸",
              effect: "元素スキルのレベルが上昇",
              value: { type: "text", text: "Lv.+3" },
              highlight: false,
            },
            {
              level: "6凸",
              effect: "特定条件下でダメージが大幅に上昇する",
              value: { type: "star", rating: 5, max: 5 },
              highlight: true,
            },
          ],
        },
      },
    ],
  },
];

export function getPreset(presetId) {
  return PRESETS.find((p) => p.id === presetId) || null;
}
