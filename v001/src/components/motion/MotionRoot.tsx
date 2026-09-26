"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { initMotion, type MotionController } from "@/lib/client/motion";

/** Mounts the site-wide motion system once and rescans after every client navigation. */
export function MotionRoot() {
  const pathname = usePathname();
  const ctrl = useRef<MotionController | null>(null);

  useEffect(() => {
    const c = initMotion();
    ctrl.current = c;
    return () => {
      c.destroy();
      ctrl.current = null;
    };
  }, []);

  useEffect(() => {
    ctrl.current?.refresh();
  }, [pathname]);

  return null;
}
