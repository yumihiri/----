// core/blocks/index.js
// 4ブロックタイプの一覧。editor.js はこのレジストリ経由でのみ blocks/* を参照する
// （ゲーム固有の知識を持たない、という各モジュールの制約を維持するための集約点）。
import * as statTable from "./statTable.js";
import * as iconGrid from "./iconGrid.js";
import * as priorityList from "./priorityList.js";
import * as tieredEffect from "./tieredEffect.js";

export const BLOCK_MODULES = {
  [statTable.TYPE]: statTable,
  [iconGrid.TYPE]: iconGrid,
  [priorityList.TYPE]: priorityList,
  [tieredEffect.TYPE]: tieredEffect,
};

export const BLOCK_TYPES = Object.values(BLOCK_MODULES).map((m) => ({
  type: m.TYPE,
  label: m.LABEL,
  description: m.DESCRIPTION,
}));

export function getBlockModule(type) {
  return BLOCK_MODULES[type] ?? null;
}
