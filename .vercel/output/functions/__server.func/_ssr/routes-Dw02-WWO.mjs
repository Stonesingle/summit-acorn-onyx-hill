import { i as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, x as require_react } from "../_libs/@react-three/drei+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Dw02-WWO.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var App = (0, import_react.lazy)(() => import("./App-jXWaDjfh.mjs"));
function Home() {
	const [mounted, setMounted] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => setMounted(true), []);
	if (!mounted) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "flex min-h-dvh items-center justify-center bg-bg",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs tracking-[0.2em] text-muted uppercase",
			children: "载入"
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Suspense, {
		fallback: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
			className: "flex min-h-dvh items-center justify-center bg-bg",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs tracking-[0.2em] text-muted uppercase",
				children: "载入"
			})
		}),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(App, {})
	});
}
//#endregion
export { Home as component };
