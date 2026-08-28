import { i as __toESM } from "../_runtime.mjs";
import { _ as TextureLoader, a as useThree, b as require_jsx_runtime, c as BufferAttribute, d as LinearFilter, f as LinearMipmapLinearFilter, g as ShaderMaterial, h as SRGBColorSpace, i as useFrame, l as BufferGeometry, m as Object3D, n as OrbitControls, p as MathUtils, r as Canvas, t as Sky, u as CatmullRomCurve3, v as TubeGeometry, x as require_react, y as Vector3 } from "../_libs/@react-three/drei+[...].mjs";
import { t as create } from "../_libs/zustand.mjs";
import { a as Compass, i as Pause, n as RotateCcw, o as Clapperboard, r as Play } from "../_libs/lucide-react.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/App-jXWaDjfh.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var ORIGIN = {
	lat: 28.27972,
	lon: 85.37778
};
var TERRAIN_META = {
	west: 85.25390625,
	east: 85.693359375,
	north: 28.381735043223106,
	south: 28.07198030177985,
	width: 256,
	height: 192,
	min: 1104.63525390625,
	max: 7191.16552734375
};
var M_PER_DEG_LAT = 111320;
var M_PER_DEG_LON = 111320 * Math.cos(ORIGIN.lat * Math.PI / 180);
var SITES = {
	glacier: {
		lon: 85.52815461726692,
		lat: 28.28731746075177,
		alt: 5125.82,
		label: "冰崩源区",
		sub: "朗塘利鲁峰北坡"
	},
	port: {
		lon: 85.37778,
		lat: 28.27972,
		alt: 1831.55,
		label: "吉隆口岸",
		sub: "日喀则市吉隆县"
	}
};
function toWorld(lat, lon, alt) {
	const x = (lon - ORIGIN.lon) * M_PER_DEG_LON / 10;
	const z = (ORIGIN.lat - lat) * M_PER_DEG_LAT / 10;
	const y = alt / 10;
	return new Vector3(x, y, z);
}
function formatLat(lat) {
	return `${lat.toFixed(5)}°N`;
}
function formatLon(lon) {
	return `${lon.toFixed(5)}°E`;
}
function sampleFlow(points, t) {
	if (points.length === 0) return SITES.glacier;
	const dist = Math.min(1, Math.max(0, t)) * (points[points.length - 1]?.s ?? 1);
	let lo = 0;
	let hi = points.length - 1;
	while (lo < hi) {
		const mid = lo + hi >> 1;
		if ((points[mid].s ?? 0) < dist) lo = mid + 1;
		else hi = mid;
	}
	const i = Math.max(1, lo);
	const a = points[i - 1];
	const b = points[i];
	const sa = a.s ?? 0;
	const sb = b.s ?? sa;
	const u = sb === sa ? 0 : (dist - sa) / (sb - sa);
	return {
		lon: a.lon + (b.lon - a.lon) * u,
		lat: a.lat + (b.lat - a.lat) * u,
		alt: a.alt + (b.alt - a.alt) * u,
		s: dist
	};
}
function flowCurve(points) {
	const vecs = points.map((p) => toWorld(p.lat, p.lon, p.alt + 6));
	return new CatmullRomCurve3(vecs, false, "catmullrom", .12);
}
async function loadSimData() {
	const [heightBuf, flow] = await Promise.all([fetch("/terrain/heightmap.f32").then((r) => r.arrayBuffer()), fetch("/terrain/flow-path.json").then((r) => r.json())]);
	return {
		heights: new Float32Array(heightBuf),
		flow
	};
}
function buildTerrainGeometry(heights) {
	const { width: W, height: H, west, east, north, south } = TERRAIN_META;
	const verts = new Float32Array(W * H * 3);
	const uvs = new Float32Array(W * H * 2);
	let p = 0;
	let u = 0;
	for (let iy = 0; iy < H; iy++) for (let ix = 0; ix < W; ix++) {
		const lon = west + ix / (W - 1) * (east - west);
		const lat = north - iy / (H - 1) * (north - south);
		const alt = heights[iy * W + ix];
		const x = (lon - ORIGIN.lon) * M_PER_DEG_LON / 10;
		const z = (ORIGIN.lat - lat) * M_PER_DEG_LAT / 10;
		const y = alt / 10;
		verts[p++] = x;
		verts[p++] = y;
		verts[p++] = z;
		uvs[u++] = ix / (W - 1);
		uvs[u++] = 1 - iy / (H - 1);
	}
	const idx = [];
	for (let iy = 0; iy < H - 1; iy++) for (let ix = 0; ix < W - 1; ix++) {
		const a = iy * W + ix;
		const b = a + 1;
		const c = a + W;
		const d = c + 1;
		idx.push(a, c, b, b, c, d);
	}
	const geo = new BufferGeometry();
	geo.setAttribute("position", new BufferAttribute(verts, 3));
	geo.setAttribute("uv", new BufferAttribute(uvs, 2));
	geo.setIndex(idx);
	geo.computeVertexNormals();
	geo.computeBoundingSphere();
	return geo;
}
var STAGES = [
	{
		id: "establish",
		t0: 0,
		t1: .12,
		title: "源区定位",
		body: "尼泊尔境内朗塘利鲁峰北坡，海拔约 5,126 米。SRTM 高程与公开崩塌坐标对齐。",
		still: "/stills/01-glacier.jpg"
	},
	{
		id: "collapse",
		t0: .12,
		t1: .2,
		title: "高位冰崩",
		body: "冰体与基岩从约 5,200 米高位崩落，落差约 1,200 米，激发 M5.2 等效地震信号。",
		still: "/stills/01-glacier.jpg"
	},
	{
		id: "debris",
		t0: .2,
		t1: .55,
		title: "高速碎屑流",
		body: "沿错坚河沟道高速下泄，铲刮冰碛物，速度约 50 m/s，几乎没有逃生窗口。",
		still: "/stills/03-debris.jpg"
	},
	{
		id: "mudflow",
		t0: .55,
		t1: .74,
		title: "汇入东林藏布",
		body: "碎屑流汇入郭巴峡曲、东林藏布，演变为含冰、岩块与泥沙的泥石流。",
		still: "/stills/03-debris.jpg"
	},
	{
		id: "impact",
		t0: .74,
		t1: .88,
		title: "冲击吉隆口岸",
		body: "泥石流冲击 28.27972°N 85.37778°E 口岸设施，并继续向尼泊尔下游运动。",
		still: "/stills/05-valley.jpg"
	},
	{
		id: "aftermath",
		t0: .88,
		t1: 1,
		title: "全路径回望",
		body: "链式灾害影响距离约 22 公里，从启动到抵达口岸约 7 分钟。本片为科学数值模拟。",
		still: "/stills/05-valley.jpg"
	}
];
function stageAt(t) {
	return STAGES.find((s) => t >= s.t0 && t < s.t1) ?? STAGES[STAGES.length - 1];
}
/** Map cinematic 0–1 to debris-flow travel 0–1. */
function flowAmount(t) {
	if (t < .18) return 0;
	if (t > .86) return 1;
	return (t - .18) / .68;
}
/** Seconds since collapse, 0–420 (7 min). */
function eventSeconds(t) {
	if (t < .12) return 0;
	return Math.min(420, (t - .12) / .74 * 420);
}
function formatClock(sec) {
	const s = Math.max(0, Math.floor(sec));
	const m = Math.floor(s / 60);
	const r = s % 60;
	return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}
var useSim = create((set, get) => ({
	mode: "title",
	progress: 0,
	speed: 1,
	start: () => set({
		mode: "playing",
		progress: 0
	}),
	pause: () => set({ mode: "paused" }),
	resume: () => set({ mode: "playing" }),
	toggle: () => {
		const { mode } = get();
		if (mode === "playing") set({ mode: "paused" });
		else if (mode === "paused" || mode === "explore") set({ mode: "playing" });
	},
	setProgress: (t) => set({ progress: Math.min(1, Math.max(0, t)) }),
	setSpeed: (s) => set({ speed: s }),
	enterExplore: () => set({ mode: "explore" }),
	exitExplore: () => set({ mode: "paused" }),
	tick: (dt) => {
		const { mode, progress, speed } = get();
		if (mode !== "playing") return;
		const next = progress + dt * speed / 78;
		if (next >= 1) set({
			progress: 1,
			mode: "paused"
		});
		else set({ progress: next });
	}
}));
var _head = new Vector3();
var _look = new Vector3();
var _cam = new Vector3();
var _up = new Vector3(0, 1, 0);
var _tangent = new Vector3();
var _offset = new Vector3();
var _a = new Vector3();
var _b = new Vector3();
var _c = new Vector3();
function World({ heights, flow }) {
	const terrainGeo = (0, import_react.useMemo)(() => buildTerrainGeometry(heights), [heights]);
	const curve = (0, import_react.useMemo)(() => flowCurve(flow.points), [flow.points]);
	const drape = (0, import_react.useMemo)(() => {
		const t = new TextureLoader().load("/terrain/drape.jpg");
		t.colorSpace = SRGBColorSpace;
		t.anisotropy = 8;
		t.minFilter = LinearMipmapLinearFilter;
		t.magFilter = LinearFilter;
		return t;
	}, []);
	(0, import_react.useEffect)(() => {
		return () => {
			terrainGeo.dispose();
			drape.dispose();
		};
	}, [terrainGeo, drape]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("color", {
			attach: "background",
			args: ["#8fa3b3"]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("fog", {
			attach: "fog",
			args: [
				"#9aadb8",
				900,
				6200
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("hemisphereLight", { args: [
			"#d7e3ee",
			"#6a5c4c",
			.55
		] }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ambientLight", { intensity: .22 }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("directionalLight", {
			position: [
				420,
				680,
				280
			],
			intensity: 1.85,
			color: "#fff4e5"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sky, {
			sunPosition: [
				120,
				48,
				70
			],
			mieCoefficient: .004,
			mieDirectionalG: .82,
			rayleigh: 1.6,
			turbidity: 5.5
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("mesh", {
			geometry: terrainGeo,
			frustumCulled: false,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
				map: drape,
				roughness: .94,
				metalness: .02,
				envMapIntensity: .3
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Glacier, { origin: toWorld(SITES.glacier.lat, SITES.glacier.lon, SITES.glacier.alt) }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PortComplex, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DebrisFlow, {
			curve,
			points: flow.points
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteMarkers, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CinematicRig, {
			curve,
			points: flow.points
		})
	] });
}
function SiteMarkers() {
	const g = toWorld(SITES.glacier.lat, SITES.glacier.lon, SITES.glacier.alt + 40);
	const p = toWorld(SITES.port.lat, SITES.port.lon, SITES.port.alt + 30);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("group", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
		position: g,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sphereGeometry", { args: [
			3.2,
			12,
			12
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshBasicMaterial", { color: "#cfe8f2" })]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
		position: p,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sphereGeometry", { args: [
			3.2,
			12,
			12
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshBasicMaterial", { color: "#efe6d2" })]
	})] });
}
function Glacier({ origin }) {
	const chunks = (0, import_react.useMemo)(() => {
		return Array.from({ length: 14 }, (_, i) => {
			const a = i / 14 * Math.PI * 2;
			return {
				pos: new Vector3(origin.x + Math.cos(a) * (4 + i % 5), origin.y + 6 + i % 3 * 2, origin.z + Math.sin(a) * (3 + i % 4)),
				vel: new Vector3((Math.sin(i * 1.7) - .2) * 18, 4 + i % 4, (Math.cos(i * 1.3) - .4) * 10),
				size: 2.2 + i % 5 * .7,
				rot: new Vector3(i * .4, i * .7, i * .2)
			};
		});
	}, [origin]);
	const group = (0, import_react.useRef)(null);
	const iceRef = (0, import_react.useRef)(null);
	useFrame(() => {
		const t = useSim.getState().progress;
		const fall = MathUtils.smoothstep(t, .12, .28);
		const groupObj = group.current;
		if (!groupObj) return;
		groupObj.children.forEach((child, i) => {
			const c = chunks[i];
			if (!c) return;
			const y = c.pos.y + c.vel.y * fall * 4 - 70 * fall * fall;
			child.position.set(c.pos.x + c.vel.x * fall * 6, Math.max(origin.y - 80, y), c.pos.z + c.vel.z * fall * 6);
			child.rotation.set(c.rot.x + fall * 4, c.rot.y + fall * 6, c.rot.z);
			const s = c.size * (1 - fall * .35);
			child.scale.setScalar(s);
			const mat = child.material;
			if (mat) mat.opacity = 1 - fall * .85;
		});
		if (iceRef.current) {
			iceRef.current.scale.setScalar(1 - fall * .55);
			const mat = iceRef.current.material;
			mat.opacity = .92 - fall * .5;
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("group", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
		ref: iceRef,
		position: [
			origin.x,
			origin.y + 8,
			origin.z
		],
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("icosahedronGeometry", { args: [14, 1] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
			color: "#d9eef6",
			roughness: .28,
			metalness: .08,
			transparent: true,
			opacity: .92
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("group", {
		ref: group,
		children: chunks.map((c, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
			position: c.pos,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dodecahedronGeometry", { args: [c.size, 0] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
				color: i % 2 ? "#e8f4f8" : "#c5d5dc",
				roughness: .4,
				transparent: true,
				opacity: 1
			})]
		}, i))
	})] });
}
function PortComplex() {
	const base = toWorld(SITES.port.lat, SITES.port.lon, SITES.port.alt);
	const buried = (0, import_react.useRef)(0);
	const group = (0, import_react.useRef)(null);
	const mud = (0, import_react.useRef)(null);
	useFrame(() => {
		const amt = flowAmount(useSim.getState().progress);
		const hit = MathUtils.smoothstep(amt, .9, 1);
		buried.current = hit;
		if (group.current) group.current.position.y = base.y - hit * 4.5;
		if (mud.current) {
			const s = 2 + hit * 18;
			mud.current.scale.set(s, .4 + hit * 1.6, s * .7);
			const mat = mud.current.material;
			mat.opacity = .15 + hit * .72;
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("group", {
		position: [
			base.x,
			0,
			base.z
		],
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("group", {
			ref: group,
			position: [
				0,
				base.y,
				0
			],
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
					position: [
						0,
						2.4,
						0
					],
					castShadow: true,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("boxGeometry", { args: [
						9.2,
						4.8,
						5.4
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
						color: "#cfc6b6",
						roughness: .86
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
					position: [
						7.4,
						1.5,
						1.2
					],
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("boxGeometry", { args: [
						5.2,
						3,
						4
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
						color: "#b7b0a2",
						roughness: .9
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
					position: [
						-6.8,
						1.2,
						-.6
					],
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("boxGeometry", { args: [
						4.4,
						2.4,
						3.6
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
						color: "#c2b8a8",
						roughness: .88
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
					position: [
						1,
						.12,
						8
					],
					rotation: [
						-Math.PI / 2,
						0,
						.12
					],
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("planeGeometry", { args: [28, 14] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
						color: "#5a5854",
						roughness: 1
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
					position: [
						-2,
						.14,
						-7
					],
					rotation: [
						-Math.PI / 2,
						0,
						.4
					],
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("planeGeometry", { args: [40, 5] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
						color: "#4a4946",
						roughness: 1
					})]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
			ref: mud,
			position: [
				0,
				base.y + .6,
				0
			],
			rotation: [
				-Math.PI / 2,
				0,
				.15
			],
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circleGeometry", { args: [6, 28] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
				color: "#4a3426",
				roughness: 1,
				transparent: true,
				opacity: .1,
				depthWrite: false
			})]
		})]
	});
}
function DebrisFlow({ curve, points }) {
	const iceGeo = (0, import_react.useMemo)(() => new TubeGeometry(curve, 180, 2.1, 8, false), [curve]);
	const mudGeo = (0, import_react.useMemo)(() => new TubeGeometry(curve, 180, 4.6, 10, false), [curve]);
	const iceMat = (0, import_react.useMemo)(() => makeFlowMaterial(true), []);
	const mudMat = (0, import_react.useMemo)(() => makeFlowMaterial(false), []);
	const head = (0, import_react.useRef)(null);
	const dust = (0, import_react.useRef)(null);
	const rocks = (0, import_react.useRef)(null);
	const dustGeo = (0, import_react.useMemo)(() => {
		const g = new BufferGeometry();
		const n = 420;
		const pos = new Float32Array(n * 3);
		for (let i = 0; i < n; i++) {
			const t = i / n;
			const p = curve.getPointAt(t);
			pos[i * 3] = p.x;
			pos[i * 3 + 1] = p.y + 4;
			pos[i * 3 + 2] = p.z;
		}
		g.setAttribute("position", new BufferAttribute(pos, 3));
		return g;
	}, [curve]);
	const dummy = (0, import_react.useMemo)(() => new Object3D(), []);
	useFrame((_, dt) => {
		const t = useSim.getState().progress;
		const amt = flowAmount(t);
		iceMat.uniforms.uProgress.value = amt;
		iceMat.uniforms.uTime.value += dt;
		mudMat.uniforms.uProgress.value = Math.max(0, (amt - .42) / .58);
		mudMat.uniforms.uTime.value += dt;
		const pt = sampleFlow(points, amt);
		_head.copy(toWorld(pt.lat, pt.lon, pt.alt + 10));
		if (head.current) {
			head.current.position.copy(_head);
			const s = 3.5 + amt * 6;
			head.current.scale.setScalar(amt > .02 ? s : .001);
		}
		if (dust.current) {
			const pos = dust.current.geometry.getAttribute("position");
			const shown = Math.floor(amt * 420);
			dust.current.geometry.setDrawRange(0, shown);
			for (let i = Math.max(0, shown - 40); i < shown; i++) pos.setY(i, pos.getY(i) + Math.sin(t * 40 + i) * .04);
			pos.needsUpdate = true;
		}
		if (rocks.current) {
			const n = rocks.current.count;
			for (let i = 0; i < n; i++) {
				const u = i / n;
				if (u > amt) dummy.scale.set(0, 0, 0);
				else {
					const p = curve.getPointAt(Math.min(.999, u));
					curve.getTangentAt(Math.min(.999, u), _tangent);
					_offset.copy(_tangent).cross(_up).normalize().multiplyScalar((i % 7 - 3) * 1.4);
					dummy.position.copy(p).add(_offset);
					dummy.position.y += 1.2;
					dummy.rotation.set(i * .7, i * 1.1, i * .4);
					const sc = .7 + i % 5 * .35;
					dummy.scale.setScalar(sc);
				}
				dummy.updateMatrix();
				rocks.current.setMatrixAt(i, dummy.matrix);
			}
			rocks.current.instanceMatrix.needsUpdate = true;
		}
	});
	(0, import_react.useEffect)(() => {
		return () => {
			iceGeo.dispose();
			mudGeo.dispose();
			iceMat.dispose();
			mudMat.dispose();
			dustGeo.dispose();
		};
	}, [
		iceGeo,
		mudGeo,
		iceMat,
		mudMat,
		dustGeo
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("group", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("mesh", {
			geometry: iceGeo,
			material: iceMat,
			frustumCulled: false
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("mesh", {
			geometry: mudGeo,
			material: mudMat,
			frustumCulled: false
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
			ref: head,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sphereGeometry", { args: [
				1,
				12,
				12
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
				color: "#5a3c28",
				roughness: .95
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("points", {
			ref: dust,
			geometry: dustGeo,
			frustumCulled: false,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pointsMaterial", {
				color: "#c4b09a",
				size: 4.5,
				sizeAttenuation: true,
				transparent: true,
				opacity: .35,
				depthWrite: false
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("instancedMesh", {
			ref: rocks,
			args: [
				void 0,
				void 0,
				90
			],
			frustumCulled: false,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dodecahedronGeometry", { args: [1.1, 0] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
				color: "#6a5340",
				roughness: 1
			})]
		})
	] });
}
function makeFlowMaterial(ice) {
	return new ShaderMaterial({
		transparent: true,
		depthWrite: false,
		uniforms: {
			uProgress: { value: 0 },
			uTime: { value: 0 },
			uIce: { value: ice ? 1 : 0 }
		},
		vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
		fragmentShader: `
      uniform float uProgress;
      uniform float uTime;
      uniform float uIce;
      varying vec2 vUv;
      void main() {
        if (vUv.x > uProgress) discard;
        float edge = 1.0 - smoothstep(uProgress - 0.04, uProgress, vUv.x);
        vec3 iceCol = vec3(0.78, 0.88, 0.93);
        vec3 rockCol = vec3(0.45, 0.32, 0.22);
        vec3 mudCol = vec3(0.28, 0.18, 0.12);
        vec3 col = mix(iceCol, rockCol, smoothstep(0.0, 0.38, vUv.x));
        col = mix(col, mudCol, smoothstep(0.4, 0.85, vUv.x));
        if (uIce < 0.5) col = mix(rockCol, mudCol, vUv.x);
        float foam = pow(abs(vUv.y - 0.5) * 2.0, 4.0);
        float pulse = 0.05 * sin(vUv.x * 55.0 - uTime * 9.0);
        float alpha = (0.55 + 0.35 * uIce) * edge;
        gl_FragColor = vec4(col + foam * 0.14 + pulse, alpha);
      }
    `
	});
}
function CinematicRig({ curve, points }) {
	const { camera } = useThree();
	const target = (0, import_react.useRef)(new Vector3());
	const explore = useSim((s) => s.mode === "explore");
	useFrame((_, rawDt) => {
		const dt = Math.min(rawDt, .1);
		useSim.getState().tick(dt);
		if (explore) return;
		const t = useSim.getState().progress;
		const amt = flowAmount(t);
		const head = sampleFlow(points, Math.max(amt, .001));
		_head.copy(toWorld(head.lat, head.lon, head.alt));
		poseCamera(t, amt, toWorld(SITES.glacier.lat, SITES.glacier.lon, SITES.glacier.alt), toWorld(SITES.port.lat, SITES.port.lon, SITES.port.alt), _head, curve, _cam, _look);
		const k = 1 - Math.exp(-dt * 2.4);
		camera.position.lerp(_cam, k);
		target.current.lerp(_look, k);
		camera.lookAt(target.current);
		camera.updateMatrixWorld();
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrbitControls, {
		enabled: explore,
		enableDamping: true,
		dampingFactor: .08,
		maxPolarAngle: Math.PI / 2.05,
		minDistance: 40,
		maxDistance: 4200,
		target: toWorld(SITES.port.lat, SITES.port.lon, SITES.port.alt + 40).toArray()
	});
}
function poseCamera(t, amt, glacier, port, head, curve, outPos, outLook) {
	if (t < .12) {
		const u = t / .12;
		outPos.set(-200 + u * 400, 980 - u * 220, 1600 - u * 400);
		outLook.lerpVectors(_a.set(400, 420, 0), glacier, u);
		return;
	}
	if (t < .2) {
		const u = (t - .12) / .08;
		outPos.copy(glacier).add(_a.set(-70, 40 - u * 8, 90));
		outLook.copy(glacier);
		return;
	}
	if (t < .86) {
		const u = Math.min(.999, Math.max(.01, amt));
		curve.getPointAt(u, head);
		curve.getTangentAt(u, _tangent).normalize();
		outPos.copy(head).addScaledVector(_tangent, -55).add(_a.set(18, 28 + (1 - u) * 22, 32));
		outLook.copy(head).addScaledVector(_tangent, 40);
		return;
	}
	const u = (t - .86) / .14;
	_a.copy(port).add(_b.set(-40, 55, 80));
	_c.set(420, 920, 1100);
	outPos.lerpVectors(_a, _c, u);
	outLook.lerpVectors(port, _b.set(500, 280, -40), u);
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function Chrome({ flow }) {
	if (useSim((s) => s.mode) === "title") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TitleScreen, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hud, { flow });
}
function TitleScreen() {
	const start = useSim((s) => s.start);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pointer-events-auto absolute inset-0 z-20 flex flex-col justify-end overflow-hidden bg-bg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: "/stills/05-valley.jpg",
				alt: "",
				className: "absolute inset-0 h-full w-full object-cover opacity-50"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-gradient-to-t from-bg via-bg/80 to-bg/30" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 pb-10 pt-24 sm:pb-14",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-medium tracking-[0.22em] text-muted uppercase",
						children: "科学数值模拟 · 2026.08.26"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
						className: "max-w-xl text-balance font-display text-3xl font-semibold leading-tight tracking-tight text-fg sm:text-5xl",
						children: ["吉隆口岸链式灾害", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-2 block text-xl font-medium text-muted sm:text-2xl",
							children: "3D 过程还原"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "max-w-lg text-pretty text-sm leading-relaxed text-muted sm:text-base",
						children: "高位冰崩 — 高速碎屑流 — 泥石流。按自然资源部灾害链分析，在真实经纬度与 SRTM 地形上重建从朗塘利鲁峰北坡到吉隆口岸约 22 公里、约 7 分钟的下泄过程。"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
						className: "grid grid-cols-2 gap-3 sm:grid-cols-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fact, {
								k: "源区",
								v: "28.287°N 85.528°E"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fact, {
								k: "口岸",
								v: "28.280°N 85.378°E"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fact, {
								k: "落差",
								v: "3,306 m"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fact, {
								k: "路径",
								v: "21.7 km"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: start,
							className: "inline-flex h-12 items-center gap-2 rounded-full bg-fg px-6 text-sm font-medium text-bg transition-transform duration-150 hover:opacity-90 active:scale-[0.98]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {
								className: "size-4",
								strokeWidth: 2
							}), "开始还原"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "max-w-sm text-xs leading-relaxed text-subtle",
							children: "非现场实拍。不表现人员伤亡。坐标来自 USGS / 公开口岸位置，高程为 SRTM，路径沿河谷最低线求解。"
						})]
					})
				]
			})
		]
	});
}
function Fact({ k, v }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg border border-border bg-elevated/70 px-3 py-2.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "text-[11px] tracking-wide text-subtle",
			children: k
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: "mt-1 font-mono text-xs text-fg tabular-nums",
			children: v
		})]
	});
}
function Hud({ flow }) {
	const mode = useSim((s) => s.mode);
	const progress = useSim((s) => s.progress);
	const speed = useSim((s) => s.speed);
	const stage = stageAt(progress);
	const amt = flowAmount(progress);
	const head = sampleFlow(flow.points, amt);
	const evt = eventSeconds(progress);
	const dist = (head.s ?? 0) / 1e3;
	const playing = mode === "playing";
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			if (e.code === "Space") {
				e.preventDefault();
				useSim.getState().toggle();
			} else if (e.code === "ArrowRight") useSim.getState().setProgress(progress + .03);
			else if (e.code === "ArrowLeft") useSim.getState().setProgress(progress - .03);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [progress]);
	const beijing = (0, import_react.useMemo)(() => {
		const t = 37380 + evt;
		const h = Math.floor(t / 3600);
		const m = Math.floor(t % 3600 / 60);
		const s = Math.floor(t % 60);
		return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
	}, [evt]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-3 sm:p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "pointer-events-auto rounded-xl border border-border bg-elevated/80 px-3 py-2 backdrop-blur-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[10px] tracking-[0.18em] text-subtle uppercase",
						children: "科学模拟"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-0.5 text-sm font-medium text-fg",
						children: "吉隆链式灾害 3D 还原"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "pointer-events-auto hidden rounded-xl border border-border bg-elevated/80 px-3 py-2 font-mono text-[11px] leading-relaxed text-muted tabular-nums backdrop-blur-sm sm:block",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						formatLat(head.lat),
						" ",
						formatLon(head.lon)
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						"海拔 ",
						Math.round(head.alt).toLocaleString(),
						" m"
					] })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-end justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-w-md rounded-xl border border-border bg-elevated/85 px-4 py-3 backdrop-blur-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] tracking-wide text-subtle",
						children: stage.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-pretty text-sm leading-relaxed text-fg",
						children: stage.body
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: stage.still,
					alt: "",
					className: "hidden h-24 w-40 rounded-lg border border-border object-cover opacity-90 sm:block"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
				className: "pointer-events-auto mt-3 rounded-2xl border border-border bg-elevated/90 p-3 backdrop-blur-sm sm:p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "font-mono tabular-nums",
							children: [
								"T+",
								formatClock(evt),
								" · 北京时间 ",
								beijing
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "font-mono tabular-nums",
							children: [
								dist.toFixed(1),
								" km · ",
								amt > 0 ? "50 m/s" : "—",
								" · ",
								Math.round(progress * 78),
								"s"
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Timeline, { progress }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-wrap items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
								label: playing ? "暂停" : "播放",
								onClick: () => useSim.getState().toggle(),
								children: playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-4" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
								label: "重播",
								onClick: () => {
									useSim.getState().setProgress(0);
									useSim.getState().resume();
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-4" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
								label: mode === "explore" ? "回到镜头" : "自由观察",
								onClick: () => mode === "explore" ? useSim.getState().exitExplore() : useSim.getState().enterExplore(),
								children: mode === "explore" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clapperboard, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Compass, { className: "size-4" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "ml-auto flex items-center gap-1",
								children: [
									1,
									1.5,
									2
								].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => useSim.getState().setSpeed(s),
									className: cn("h-9 min-w-9 rounded-full px-2.5 font-mono text-xs tabular-nums", speed === s ? "bg-fg text-bg" : "text-muted hover:text-fg"),
									children: [s, "×"]
								}, s))
							})
						]
					})
				]
			})
		]
	});
}
function Timeline({ progress }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			type: "range",
			min: 0,
			max: 1e3,
			value: Math.round(progress * 1e3),
			onChange: (e) => useSim.getState().setProgress(Number(e.target.value) / 1e3),
			className: "timeline",
			"aria-label": "时间轴"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "pointer-events-none mt-1 flex justify-between",
			children: STAGES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "hidden text-[10px] text-subtle sm:block",
				style: { width: `${(s.t1 - s.t0) * 100}%` },
				children: s.title
			}, s.id))
		})]
	});
}
function IconBtn({ children, onClick, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		"aria-label": label,
		className: "inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-border bg-card px-3 text-fg transition-opacity hover:opacity-80",
		children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "hidden text-xs sm:inline",
			children: label
		})]
	});
}
function App() {
	const [data, setData] = (0, import_react.useState)(null);
	const [err, setErr] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		loadSimData().then(setData).catch((e) => setErr(e instanceof Error ? e.message : "载入失败"));
	}, []);
	if (err) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "flex min-h-dvh items-center justify-center bg-bg px-6 text-center text-fg",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted",
			children: err
		})
	});
	if (!data) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg text-fg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-px w-24 animate-pulse bg-border-strong" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs tracking-[0.2em] text-muted uppercase",
			children: "载入地形"
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative h-dvh w-full overflow-hidden bg-bg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Canvas, {
			className: "absolute inset-0 touch-none",
			camera: {
				fov: 48,
				near: 1.5,
				far: 14e3,
				position: [
					-200,
					980,
					1600
				]
			},
			dpr: [1, 1.6],
			gl: {
				antialias: true,
				alpha: false,
				powerPreference: "high-performance"
			},
			onCreated: ({ gl }) => {
				gl.setClearColor("#8fa3b3");
			},
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(World, {
				heights: data.heights,
				flow: data.flow
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chrome, { flow: data.flow })]
	});
}
//#endregion
export { App as default };
