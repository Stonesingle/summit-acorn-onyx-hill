import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { World } from "@/components/scene/World";
import { Chrome } from "@/components/hud/Chrome";
import { loadSimData, type FlowData } from "@/lib/geo";

export default function App() {
  const [data, setData] = useState<{
    heights: Float32Array;
    flow: FlowData;
  } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    loadSimData()
      .then(setData)
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : "载入失败"));
  }, []);

  if (err) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-bg px-6 text-center text-fg">
        <p className="text-sm text-muted">{err}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg text-fg">
        <div className="h-px w-24 animate-pulse bg-border-strong" />
        <p className="text-xs tracking-[0.2em] text-muted uppercase">载入地形</p>
      </main>
    );
  }

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-bg">
      <Canvas
        className="absolute inset-0 touch-none"
        camera={{ fov: 48, near: 1.5, far: 14000, position: [-200, 980, 1600] }}
        dpr={[1, 1.6]}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.setClearColor("#8fa3b3");
        }}
      >
        <World heights={data.heights} flow={data.flow} />
      </Canvas>
      <Chrome flow={data.flow} />
    </main>
  );
}
