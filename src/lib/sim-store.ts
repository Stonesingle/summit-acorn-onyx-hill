import { create } from "zustand";

export const CINEMATIC_SEC = 78;

export type SimMode = "title" | "playing" | "paused" | "explore";

export const STAGES = [
  {
    id: "establish",
    t0: 0,
    t1: 0.12,
    title: "源区定位",
    body: "尼泊尔境内朗塘利鲁峰北坡，海拔约 5,126 米。SRTM 高程与公开崩塌坐标对齐。",
    still: "/stills/01-glacier.jpg",
  },
  {
    id: "collapse",
    t0: 0.12,
    t1: 0.2,
    title: "高位冰崩",
    body: "冰体与基岩从约 5,200 米高位崩落，落差约 1,200 米，激发 M5.2 等效地震信号。",
    still: "/stills/01-glacier.jpg",
  },
  {
    id: "debris",
    t0: 0.2,
    t1: 0.55,
    title: "高速碎屑流",
    body: "沿错坚河沟道高速下泄，铲刮冰碛物，速度约 50 m/s，几乎没有逃生窗口。",
    still: "/stills/03-debris.jpg",
  },
  {
    id: "mudflow",
    t0: 0.55,
    t1: 0.74,
    title: "汇入东林藏布",
    body: "碎屑流汇入郭巴峡曲、东林藏布，演变为含冰、岩块与泥沙的泥石流。",
    still: "/stills/03-debris.jpg",
  },
  {
    id: "impact",
    t0: 0.74,
    t1: 0.88,
    title: "冲击吉隆口岸",
    body: "泥石流冲击 28.27972°N 85.37778°E 口岸设施，并继续向尼泊尔下游运动。",
    still: "/stills/05-valley.jpg",
  },
  {
    id: "aftermath",
    t0: 0.88,
    t1: 1,
    title: "全路径回望",
    body: "链式灾害影响距离约 22 公里，从启动到抵达口岸约 7 分钟。本片为科学数值模拟。",
    still: "/stills/05-valley.jpg",
  },
] as const;

export function stageAt(t: number) {
  return STAGES.find((s) => t >= s.t0 && t < s.t1) ?? STAGES[STAGES.length - 1];
}

/** Map cinematic 0–1 to debris-flow travel 0–1. */
export function flowAmount(t: number) {
  if (t < 0.18) return 0;
  if (t > 0.86) return 1;
  return (t - 0.18) / 0.68;
}

/** Seconds since collapse, 0–420 (7 min). */
export function eventSeconds(t: number) {
  if (t < 0.12) return 0;
  return Math.min(420, ((t - 0.12) / 0.74) * 420);
}

export function formatClock(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

type SimState = {
  mode: SimMode;
  progress: number;
  speed: number;
  start: () => void;
  pause: () => void;
  resume: () => void;
  toggle: () => void;
  setProgress: (t: number) => void;
  setSpeed: (s: number) => void;
  enterExplore: () => void;
  exitExplore: () => void;
  tick: (dt: number) => void;
};

export const useSim = create<SimState>((set, get) => ({
  mode: "title",
  progress: 0,
  speed: 1,
  start: () => set({ mode: "playing", progress: 0 }),
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
    const next = progress + (dt * speed) / CINEMATIC_SEC;
    if (next >= 1) set({ progress: 1, mode: "paused" });
    else set({ progress: next });
  },
}));
