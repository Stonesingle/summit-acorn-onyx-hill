import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";

const App = lazy(() => import("@/components/App"));

export const Route = createFileRoute("/")({
  ssr: false,
  component: Home,
});

function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-bg">
        <p className="text-xs tracking-[0.2em] text-muted uppercase">载入</p>
      </main>
    );
  }
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center bg-bg">
          <p className="text-xs tracking-[0.2em] text-muted uppercase">载入</p>
        </main>
      }
    >
      <App />
    </Suspense>
  );
}
