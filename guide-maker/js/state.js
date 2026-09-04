// state.js
// アプリ状態（gameId/title/subtitle/blocks配列）の一元管理。
// ブロックの中身（config）は一切解釈せず、配列の追加・削除・並び替えだけを担当する。
import { uid } from "./core/utils.js";
import { createAutosaveController, saveNow } from "./core/storage/autosave.js";

let state = null;
const listeners = new Set();

const autosave = createAutosaveController({
  onSaveStart: () => notify({ saving: true }),
  onSaveEnd: () => notify({ saving: false }),
});

function notify(meta = {}) {
  listeners.forEach((fn) => fn(state, meta));
}

function persist() {
  autosave.schedule(state);
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getState() {
  return state;
}

export function initState({ gameId, title = "", subtitle = "", blocks = [], draftId } = {}) {
  state = {
    gameId,
    draftId: draftId || uid("draft"),
    title,
    subtitle,
    blocks: blocks.map((b) => ({
      id: b.id || uid("block"),
      type: b.type,
      config: b.config,
    })),
  };
  notify();
  return state;
}

export function loadStateFromDraft(draft) {
  state = draft;
  notify();
  return state;
}

export function setTitle(title) {
  state.title = title;
  notify();
  persist();
}

export function setSubtitle(subtitle) {
  state.subtitle = subtitle;
  notify();
  persist();
}

export function addBlock(type, config) {
  const block = { id: uid("block"), type, config };
  state.blocks.push(block);
  notify();
  persist();
  return block;
}

export function removeBlock(blockId) {
  state.blocks = state.blocks.filter((b) => b.id !== blockId);
  notify();
  persist();
}

export function updateBlockConfig(blockId, config) {
  const block = state.blocks.find((b) => b.id === blockId);
  if (!block) return;
  block.config = config;
  notify();
  persist();
}

export function moveBlock(blockId, direction) {
  const index = state.blocks.findIndex((b) => b.id === blockId);
  if (index === -1) return;
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= state.blocks.length) return;
  [state.blocks[index], state.blocks[target]] = [state.blocks[target], state.blocks[index]];
  notify();
  persist();
}

export function getBlock(blockId) {
  return state.blocks.find((b) => b.id === blockId) || null;
}

// hashchangeなどページ離脱直前にdebounceを待たず即時保存するための退避口。
export function flushSave() {
  if (state) saveNow(state);
}
