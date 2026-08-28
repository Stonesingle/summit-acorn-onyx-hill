import { useEffect, useMemo } from "react";
import {
  Pause,
  Play,
  RotateCcw,
  Compass,
  Clapperboard,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  formatLat,
  formatLon,
  sampleFlow,
  type FlowData,
} from "@/lib/geo";
import {
  CINEMATIC_SEC,
  eventSeconds,
  flowAmount,
  formatClock,
  stageAt,
  STAGES,
  useSim,
} from "@/lib/sim-store";

export function Chrome({ flow }: { flow: FlowData }) {
  const mode = useSim((s) => s.mode);
  if (mode === "title") return <TitleScreen />;
  return <Hud flow={flow} />;
}

function TitleScreen() {
  const start = useSim((s) => s.start);
  return (
    <div className="pointer-events-auto absolute inset-0 z-20 flex flex-col justify-end overflow-hidden bg-bg">
      <img
        src="/stills/05-valley.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-50"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/80 to-bg/30" />
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 pb-10 pt-24 sm:pb-14">
        <p className="text-xs font-medium tracking-[0.22em] text-muted uppercase">
          科学数值模拟 · 2026.08.26
        </p>
        <h1 className="max-w-xl text-balance font-display text-3xl font-semibold leading-tight tracking-tight text-fg sm:text-5xl">
          吉隆口岸链式灾害
          <span className="mt-2 block text-xl font-medium text-muted sm:text-2xl">
            3D 过程还原
          </span>
        </h1>
        <p className="max-w-lg text-pretty text-sm leading-relaxed text-muted sm:text-base">
          高位冰崩 — 高速碎屑流 — 泥石流。按自然资源部灾害链分析，在真实经纬度与
          SRTM 地形上重建从朗塘利鲁峰北坡到吉隆口岸约 22 公里、约 7 分钟的下泄过程。
        </p>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Fact k="源区" v="28.287°N 85.528°E" />
          <Fact k="口岸" v="28.280°N 85.378°E" />
          <Fact k="落差" v="3,306 m" />
          <Fact k="路径" v="21.7 km" />
        </dl>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={start}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-fg px-6 text-sm font-medium text-bg transition-transform duration-150 hover:opacity-90 active:scale-[0.98]"
          >
            <Play className="size-4" strokeWidth={2} />
            开始还原
          </button>
          <p className="max-w-sm text-xs leading-relaxed text-subtle">
            非现场实拍。不表现人员伤亡。坐标来自 USGS / 公开口岸位置，高程为
            SRTM，路径沿河谷最低线求解。
          </p>
        </div>
      </div>
    </div>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg border border-border bg-elevated/70 px-3 py-2.5">
      <dt className="text-[11px] tracking-wide text-subtle">{k}</dt>
      <dd className="mt-1 font-mono text-xs text-fg tabular-nums">{v}</dd>
    </div>
  );
}

function Hud({ flow }: { flow: FlowData }) {
  const mode = useSim((s) => s.mode);
  const progress = useSim((s) => s.progress);
  const speed = useSim((s) => s.speed);
  const stage = stageAt(progress);
  const amt = flowAmount(progress);
  const head = sampleFlow(flow.points, amt);
  const evt = eventSeconds(progress);
  const dist = (head.s ?? 0) / 1000;
  const playing = mode === "playing";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        useSim.getState().toggle();
      } else if (e.code === "ArrowRight") {
        useSim.getState().setProgress(progress + 0.03);
      } else if (e.code === "ArrowLeft") {
        useSim.getState().setProgress(progress - 0.03);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [progress]);

  const beijing = useMemo(() => {
    const base = 10 * 3600 + 23 * 60;
    const t = base + evt;
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = Math.floor(t % 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [evt]);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-3 sm:p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="pointer-events-auto rounded-xl border border-border bg-elevated/80 px-3 py-2 backdrop-blur-sm">
          <p className="text-[10px] tracking-[0.18em] text-subtle uppercase">
            科学模拟
          </p>
          <p className="mt-0.5 text-sm font-medium text-fg">吉隆链式灾害 3D 还原</p>
        </div>
        <div className="pointer-events-auto hidden rounded-xl border border-border bg-elevated/80 px-3 py-2 font-mono text-[11px] leading-relaxed text-muted tabular-nums backdrop-blur-sm sm:block">
          <div>{formatLat(head.lat)} {formatLon(head.lon)}</div>
          <div>海拔 {Math.round(head.alt).toLocaleString()} m</div>
        </div>
      </header>

      <div className="flex items-end justify-between gap-3">
        <div className="max-w-md rounded-xl border border-border bg-elevated/85 px-4 py-3 backdrop-blur-sm">
          <p className="text-[11px] tracking-wide text-subtle">{stage.title}</p>
          <p className="mt-1 text-pretty text-sm leading-relaxed text-fg">{stage.body}</p>
        </div>
        <img
          src={stage.still}
          alt=""
          className="hidden h-24 w-40 rounded-lg border border-border object-cover opacity-90 sm:block"
        />
      </div>

      <footer className="pointer-events-auto mt-3 rounded-2xl border border-border bg-elevated/90 p-3 backdrop-blur-sm sm:p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted">
          <span className="font-mono tabular-nums">
            T+{formatClock(evt)} · 北京时间 {beijing}
          </span>
          <span className="font-mono tabular-nums">
            {dist.toFixed(1)} km · {amt > 0 ? "50 m/s" : "—"} · {Math.round(progress * CINEMATIC_SEC)}s
          </span>
        </div>
        <Timeline progress={progress} />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <IconBtn
            label={playing ? "暂停" : "播放"}
            onClick={() => useSim.getState().toggle()}
          >
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          </IconBtn>
          <IconBtn
            label="重播"
            onClick={() => {
              useSim.getState().setProgress(0);
              useSim.getState().resume();
            }}
          >
            <RotateCcw className="size-4" />
          </IconBtn>
          <IconBtn
            label={mode === "explore" ? "回到镜头" : "自由观察"}
            onClick={() =>
              mode === "explore"
                ? useSim.getState().exitExplore()
                : useSim.getState().enterExplore()
            }
          >
            {mode === "explore" ? (
              <Clapperboard className="size-4" />
            ) : (
              <Compass className="size-4" />
            )}
          </IconBtn>
          <div className="ml-auto flex items-center gap-1">
            {[1, 1.5, 2].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => useSim.getState().setSpeed(s)}
                className={cn(
                  "h-9 min-w-9 rounded-full px-2.5 font-mono text-xs tabular-nums",
                  speed === s ? "bg-fg text-bg" : "text-muted hover:text-fg",
                )}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

function Timeline({ progress }: { progress: number }) {
  return (
    <div className="relative">
      <input
        type="range"
        min={0}
        max={1000}
        value={Math.round(progress * 1000)}
        onChange={(e) => useSim.getState().setProgress(Number(e.target.value) / 1000)}
        className="timeline"
        aria-label="时间轴"
      />
      <div className="pointer-events-none mt-1 flex justify-between">
        {STAGES.map((s) => (
          <span
            key={s.id}
            className="hidden text-[10px] text-subtle sm:block"
            style={{ width: `${(s.t1 - s.t0) * 100}%` }}
          >
            {s.title}
          </span>
        ))}
      </div>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-border bg-card px-3 text-fg transition-opacity hover:opacity-80"
    >
      {children}
      <span className="hidden text-xs sm:inline">{label}</span>
    </button>
  );
}
