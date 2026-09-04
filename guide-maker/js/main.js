// main.js
// 起動処理・ルーター初期化。
import { registerRoute, startRouter } from "./router.js";
import { flushSave } from "./state.js";
import * as gameSelect from "./screens/gameSelect.js";
import * as modeSelect from "./screens/modeSelect.js";
import * as editor from "./screens/editor.js";

registerRoute("/", gameSelect.mount);
registerRoute("/:gameId/start", modeSelect.mount);
registerRoute("/:gameId/edit", editor.mount);

window.addEventListener("beforeunload", flushSave);

startRouter();
