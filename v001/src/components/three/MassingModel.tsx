"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { DrawingSpec } from "@/lib/types";

interface Props {
  spec: DrawingSpec;
  /** Accessible description of the model (it is a schematic, and says so). */
  label: string;
  /** Caption for the 3D model (shown once it renders). */
  caption: string;
  /** Caption for the drawn poster (shown while loading, and where WebGL is not used). */
  posterCaption: string;
  hint?: string;
  tone?: "dark" | "light";
  scrollExplode?: boolean;
  /** Shown until WebGL renders its first frame, and kept if WebGL is unavailable. */
  poster: ReactNode;
  className?: string;
}

/**
 * Lazy WebGL massing model. three.js is fetched only when the model approaches the viewport and the
 * main thread is idle, so it never competes with first paint or hydration.
 */
export function MassingModel({ spec, label, caption, posterCaption, hint, tone = "dark", scrollExplode = false, poster, className }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    let disposed = false;
    let handle: { dispose(): void } | null = null;
    let idleId = 0;

    // Progressive enhancement: only hardware-accelerated WebGL gets the live model. Without it
    // (software rasterisers, blocklisted GPUs) the drawn elevation poster stays and three.js is
    // never downloaded. NEXT_PUBLIC_FORCE_WEBGL=1 (e2e builds only) exercises the 3D path anyway.
    if (process.env.NEXT_PUBLIC_FORCE_WEBGL !== "1" && !hasHardwareWebGL()) return;

    const start = () => {
      const run = async () => {
        const { createMassing } = await import("./massing-scene");
        if (disposed) return;
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        handle = createMassing(canvas, spec, { reduced, tone, scrollExplode, onReady: () => !disposed && setReady(true) });
      };
      const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
      if (w.requestIdleCallback) idleId = w.requestIdleCallback(() => void run(), { timeout: 1200 });
      else idleId = window.setTimeout(() => void run(), 200);
    };

    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return;
        io.disconnect();
        start();
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(host);

    return () => {
      disposed = true;
      io.disconnect();
      const w = window as Window & { cancelIdleCallback?: (id: number) => void };
      if (w.cancelIdleCallback) w.cancelIdleCallback(idleId);
      window.clearTimeout(idleId);
      handle?.dispose();
    };
  }, [spec, tone, scrollExplode]);

  return (
    <figure className={`massing massing--${tone}${ready ? " is-ready" : ""}${className ? ` ${className}` : ""}`}>
      <div className="massing-stage" ref={hostRef}>
        {/* Exactly one of poster / canvas is exposed to assistive technology: whichever is shown. */}
        <div className="massing-poster" aria-hidden={ready ? "true" : undefined}>
          {poster}
        </div>
        <canvas ref={canvasRef} className="massing-canvas" role="img" aria-label={label} aria-hidden={ready ? undefined : "true"} />
        {hint && (
          <span className="massing-hint" aria-hidden="true">
            {hint}
          </span>
        )}
      </div>
      <figcaption className="massing-caption">{ready ? caption : posterCaption}</figcaption>
    </figure>
  );
}

/** True when the browser offers WebGL without a "major performance caveat" (i.e. on a GPU). */
function hasHardwareWebGL(): boolean {
  try {
    const probe = document.createElement("canvas");
    const opts = { failIfMajorPerformanceCaveat: true } as const;
    const gl = (probe.getContext("webgl2", opts) ?? probe.getContext("webgl", opts)) as WebGLRenderingContext | null;
    if (!gl) return false;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const name = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return !/swiftshader|llvmpipe|softpipe|software|basic render/i.test(name);
  } catch {
    return false;
  }
}
