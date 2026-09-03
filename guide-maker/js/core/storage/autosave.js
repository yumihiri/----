// core/storage/autosave.js
// localStorageへの自動保存（500msデバウンス）・下書き一覧の管理。
// state.js が変更を検知したタイミングで呼び出される想定。
const DEBOUNCE_MS = 500;
const DRAFT_INDEX_KEY = "ggm:draftIndex";

function draftKey(gameId, draftId) {
  return `ggm:draft:${gameId}:${draftId}`;
}

function readIndex() {
  try {
    const raw = localStorage.getItem(DRAFT_INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeIndex(index) {
  localStorage.setItem(DRAFT_INDEX_KEY, JSON.stringify(index));
}

function updateIndex(state) {
  const index = readIndex();
  const existing = index.find((d) => d.id === state.draftId);
  const entry = {
    id: state.draftId,
    gameId: state.gameId,
    title: state.title || "無題のガイド",
    updatedAt: Date.now(),
  };
  if (existing) {
    Object.assign(existing, entry);
  } else {
    index.push(entry);
  }
  writeIndex(index);
}

export function saveNow(state) {
  if (!state?.draftId || !state?.gameId) return;
  localStorage.setItem(draftKey(state.gameId, state.draftId), JSON.stringify(state));
  updateIndex(state);
}

export function loadDraft(gameId, draftId) {
  try {
    const raw = localStorage.getItem(draftKey(gameId, draftId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function listDrafts(gameId) {
  const index = readIndex();
  const filtered = gameId ? index.filter((d) => d.gameId === gameId) : index;
  return filtered.sort((a, b) => b.updatedAt - a.updatedAt);
}

export function deleteDraft(gameId, draftId) {
  localStorage.removeItem(draftKey(gameId, draftId));
  writeIndex(readIndex().filter((d) => d.id !== draftId));
}

// スケジューラ本体はクロージャで持たせ、呼び出し側（state.js）が
// 1つのコントローラインスタンスを使い回すことでdebounceを成立させる。
export function createAutosaveController({ onSaveStart, onSaveEnd } = {}) {
  let timer = null;
  return {
    schedule(state) {
      if (timer) clearTimeout(timer);
      onSaveStart?.();
      timer = setTimeout(() => {
        saveNow(state);
        timer = null;
        onSaveEnd?.();
      }, DEBOUNCE_MS);
    },
    flush(state) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      saveNow(state);
      onSaveEnd?.();
    },
  };
}
