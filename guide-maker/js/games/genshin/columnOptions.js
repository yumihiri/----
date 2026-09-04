// games/genshin/columnOptions.js
// stat_table ブロックで選べる項目候補（原神のステータス名）。
// ここにないステータスは custom_<timestamp> キーで自由入力できる（statTable.js側で対応）。
export const COLUMN_OPTIONS = [
  { key: "hp", label: "HP(実数値)" },
  { key: "hp_percent", label: "HP%" },
  { key: "atk", label: "攻撃力(実数値)" },
  { key: "atk_percent", label: "攻撃力%" },
  { key: "def", label: "防御力(実数値)" },
  { key: "def_percent", label: "防御力%" },
  { key: "elemental_mastery", label: "元素熟知" },
  { key: "energy_recharge", label: "元素チャージ効率" },
  { key: "crit_rate", label: "会心率" },
  { key: "crit_dmg", label: "会心ダメージ" },
  { key: "crit_value", label: "会心値" },
  { key: "dmg_bonus", label: "元素与ダメージ" },
  { key: "healing_bonus", label: "治癒効果" },
  { key: "shield_strength", label: "シールド強化" },
];
