// core/blocks/index.js
// ブロックタイプの一覧。editor.js はこのレジストリ経由でのみ blocks/* を参照する
// （ゲーム固有の知識を持たない、という各モジュールの制約を維持するための集約点）。
import * as statTable from "./statTable.js";
import * as iconGrid from "./iconGrid.js";
import * as priorityList from "./priorityList.js";
import * as tieredEffect from "./tieredEffect.js";
import * as freeText from "./freeText.js";

export const BLOCK_MODULES = {
  [statTable.TYPE]: statTable,
  [iconGrid.TYPE]: iconGrid,
  [priorityList.TYPE]: priorityList,
  [tieredEffect.TYPE]: tieredEffect,
  [freeText.TYPE]: freeText,
};

function toMenuEntry(m) {
  return { type: m.TYPE, label: m.LABEL, description: m.DESCRIPTION };
}

// テンプレート型（プリセット選択／白紙のどちらも含む）のブロック追加メニュー。
export const BLOCK_TYPES = [statTable, iconGrid, priorityList, tieredEffect].map(toMenuEntry);

// 自由型のブロック追加メニュー。今のところ自由記述ボックスのみ。
export const FREEFORM_BLOCK_TYPES = [freeText].map(toMenuEntry);

export function getBlockModule(type) {
  return BLOCK_MODULES[type] ?? null;
}
