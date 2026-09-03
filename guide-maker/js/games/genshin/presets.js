// games/genshin/presets.js
// 「テンプレから作る」で選べる4つのプリセット定義。
// blocks は id を持たない（state側でコピー時に crypto.randomUUID() を振る）。
// 数値・効果文はすべて入力例のサンプルであり、実際の攻略数値ではない。
// テンプレ選択後、ユーザー自身の攻略基準に合わせて編集してもらう前提。
export const PRESETS = [
  {
    id: "target_stats",
    label: "目標ステータス早見表",
    description: "凸数ごとの会心率・会心ダメなどの目標値をまとめる定番テンプレ",
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
                crit_rate: "60~70%（例）",
                crit_dmg: "120~140%（例）",
                hp_percent: "40%以上（例）",
                elemental_mastery: "800~（例）",
              },
            },
            {
              name: "完凸",
              values: {
                crit_rate: "70~80%（例）",
                crit_dmg: "140~160%（例）",
                hp_percent: "50%以上（例）",
                elemental_mastery: "1000~（例）",
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
    description: "武器や聖遺物メインステータスの優先順位を整理するテンプレ",
    blocks: [
      {
        type: "priority_list",
        config: {
          title: "武器優先度（例）",
          items: [
            { label: "候補武器A", note: "最優先（例）" },
            { label: "候補武器B", note: "代用枠（例）" },
            { label: "候補武器C", note: "無凸でも運用可（例）" },
          ],
        },
      },
      {
        type: "priority_list",
        config: {
          title: "聖遺物メインステータス優先度（例）",
          items: [
            { label: "砂：HP%かATK%", note: "キャラの倍率参照元に合わせる" },
            { label: "杯：会心ダメ/元素ダメ", note: "" },
            { label: "冠：会心率↔会心ダメ", note: "比率で調整" },
          ],
        },
      },
    ],
  },
  {
    id: "artifact_combo",
    label: "装備の組み合わせ例",
    description: "キャラごとのおすすめ武器・聖遺物セットを一覧にするテンプレ",
    blocks: [
      {
        type: "icon_grid",
        config: {
          groupLabel: "キャラ",
          entries: [
            {
              character: { name: "キャラA", iconKey: "" },
              items: [
                { label: "聖遺物セットA", iconKey: "" },
                { label: "武器A", iconKey: "" },
              ],
            },
            {
              character: { name: "キャラB", iconKey: "" },
              items: [
                { label: "聖遺物セットB", iconKey: "" },
                { label: "武器B", iconKey: "" },
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
    description: "1凸〜6凸の効果と重要度を整理するテンプレ",
    blocks: [
      {
        type: "tiered_effect",
        config: {
          rows: [
            {
              level: "1凸",
              effect: "特定条件下でダメージが上昇する（例）",
              value: { type: "star", rating: 3, max: 5 },
              highlight: false,
            },
            {
              level: "2凸",
              effect: "パーティメンバーの元素ダメージが上昇する（例）",
              value: { type: "star", rating: 3, max: 5 },
              highlight: false,
            },
            {
              level: "4凸",
              effect: "スキルや必殺技の追加効果が発生する（例）",
              value: { type: "star", rating: 4, max: 5 },
              highlight: true,
            },
            {
              level: "6凸",
              effect: "火力・耐久が大幅に強化される（例）",
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
