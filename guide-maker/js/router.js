// router.js
// hashベースの簡易画面遷移（フレームワーク不使用）。location.hash を監視して
// 登録済みルートのハンドラ（screens/*.js の mount 関数）を呼び出す。
const routes = [];

export function registerRoute(pattern, handler) {
  const paramNames = [];
  const regexStr = pattern
    .split("/")
    .map((seg) => {
      if (seg.startsWith(":")) {
        paramNames.push(seg.slice(1));
        return "([^/]+)";
      }
      return seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("/");
  routes.push({ regex: new RegExp(`^${regexStr}$`), paramNames, handler });
}

function parseHash() {
  const raw = location.hash.slice(1) || "/";
  const [path, queryString] = raw.split("?");
  return { path: path || "/", query: Object.fromEntries(new URLSearchParams(queryString || "")) };
}

function resolve() {
  const { path, query } = parseHash();
  for (const route of routes) {
    const match = path.match(route.regex);
    if (match) {
      const params = {};
      route.paramNames.forEach((name, i) => {
        params[name] = decodeURIComponent(match[i + 1]);
      });
      route.handler({ params, query });
      return;
    }
  }
  navigate("/");
}

export function startRouter() {
  window.addEventListener("hashchange", resolve);
  resolve();
}

export function navigate(path) {
  location.hash = `#${path}`;
}
