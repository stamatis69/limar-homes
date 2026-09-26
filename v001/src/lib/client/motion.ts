import Lenis from "lenis";

/**
 * Site-wide motion system (client only).
 *
 * - Smooth wheel scrolling (Lenis) on fine pointers; native scrolling on touch.
 * - Reveal-on-scroll for the structural blocks listed in REVEAL. CSS (experience.css) hides them
 *   only under `@media (scripting: enabled)`, and a CSS failsafe shows everything if this module
 *   never reports ready, so content is never lost.
 * - Scroll progress as CSS custom properties: [data-progress] → --p (0 → 1 while crossing the
 *   viewport), [data-enter] → --enter, [data-exit] → --exit, [data-pin] → --pin (sticky run).
 * - Word-by-word ink fill for [data-words], count-up for [data-count], pointer tilt for [data-tilt].
 * - Header state on <html>: data-scrolled, data-scroll-dir, data-header-tone, --page-p.
 *
 * Performance: visibility comes from IntersectionObserver and sizes from ResizeObserver, so nothing
 * forces a synchronous layout during hydration. Each animation frame reads all geometry first and
 * writes all styles afterwards (no read/write interleaving, so no layout thrash).
 *
 * prefers-reduced-motion: no smooth scroll, reveals, tilt or counters; progress still updates so
 * layouts that depend on it stay correct, and CSS maps it to static end states.
 */

export const REVEAL = [
  ".chapter-head",
  ".practice > div",
  ".routes > .route",
  ".evidence > div",
  ".steps > li",
  ".articles > .article-item",
  ".dev-entry",
  ".ledger-row",
  ".feature",
  ".three > *",
  ".spec-list > li",
  ".faq details",
  ".finale > *",
  ".footer-grid > *",
  ".reveal",
].join(", ");

const PROGRESS = "[data-progress], [data-enter], [data-exit], [data-pin], [data-words]";

/** Interactive regions never animate in: they must be immediately operable. */
const NO_REVEAL = "form, .explorer, .pf, .compare-wrap, .compare-mobile, [data-no-reveal]";

type Cleanup = () => void;

export interface MotionController {
  refresh(): void;
  destroy(): void;
  lenis: Lenis | null;
}

interface Read {
  el: HTMLElement;
  top: number;
  height: number;
}

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export function initMotion(): MotionController {
  const root = document.documentElement;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const cleanups: Cleanup[] = [];

  // Frame state (declared first: observers below may flag work before the first frame).
  let dirty = true;
  let travelDirty = true;
  let lastY = -1;
  let lastDirY = window.scrollY;
  let raf = 0;
  let vw = window.innerWidth;
  let vh = window.innerHeight;
  let docH = 0;
  let darkSections: HTMLElement[] = [];
  const trackWidth = new Map<Element, number>();

  // ---------- Smooth scroll ----------
  let lenis: Lenis | null = null;
  if (!reduced && finePointer) {
    lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 3.2), smoothWheel: true, anchors: false, autoRaf: false });
    root.classList.add("has-smooth-scroll");
  }

  // Overlays (mobile menu) lock page scrolling; smooth scroll must pause with them.
  const onLock = (e: Event) => {
    if (!lenis) return;
    if ((e as CustomEvent<boolean>).detail) lenis.stop();
    else lenis.start();
  };
  window.addEventListener("limar:scroll-lock", onLock);
  cleanups.push(() => window.removeEventListener("limar:scroll-lock", onLock));

  // ---------- Sizes, reported after layout (never read synchronously) ----------
  const sizeRO = new ResizeObserver((entries) => {
    for (const e of entries) {
      const box = e.borderBoxSize?.[0];
      if (e.target === document.body) docH = box?.blockSize ?? e.contentRect.height;
      else trackWidth.set(e.target, box?.inlineSize ?? e.contentRect.width);
    }
    dirty = true;
    travelDirty = true;
  });
  sizeRO.observe(document.body);
  cleanups.push(() => sizeRO.disconnect());

  // ---------- Reveal ----------
  const seen = new WeakSet<Element>();
  const revealIO = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add("is-in");
        revealIO.unobserve(e.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.01 },
  );
  cleanups.push(() => revealIO.disconnect());

  // SVG drawings draw themselves when they reach the viewport.
  const drawIO = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add("is-drawn");
        drawIO.unobserve(e.target);
      }
    },
    { rootMargin: "0px 0px -12% 0px" },
  );
  cleanups.push(() => drawIO.disconnect());

  // ---------- Progress-tracked elements ----------
  const tracked = new Set<HTMLElement>();
  const visible = new Set<HTMLElement>();
  const settle = new Set<HTMLElement>(); // needs one more update (entered tracking, or left view)
  const progressIO = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const el = e.target as HTMLElement;
        if (e.isIntersecting) visible.add(el);
        else {
          visible.delete(el);
          settle.add(el);
        }
      }
      dirty = true;
    },
    { rootMargin: "25% 0px 25% 0px" },
  );
  cleanups.push(() => progressIO.disconnect());

  // ---------- Counters: only for figures that are off-screen when the page opens ----------
  const countFirst = new WeakSet<Element>();
  const countIO = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const el = e.target as HTMLElement;
        const first = !countFirst.has(el);
        countFirst.add(el);
        if (first && e.isIntersecting) {
          countIO.unobserve(el); // already visible: keep the final value, never animate under the reader
          continue;
        }
        if (first) {
          prepareCounter(el);
          continue;
        }
        if (!e.isIntersecting || e.intersectionRatio < 0.6) continue;
        countIO.unobserve(el);
        runCounter(el);
      }
    },
    { threshold: [0, 0.6] },
  );
  cleanups.push(() => countIO.disconnect());

  function scan() {
    const groups = new Map<Element, number>();
    document.querySelectorAll<HTMLElement>(REVEAL).forEach((el) => {
      if (seen.has(el)) return;
      seen.add(el);
      if (reduced || el.closest(NO_REVEAL)) {
        el.classList.add("is-in");
        return;
      }
      // Stagger siblings that reveal together.
      const parent = el.parentElement ?? root;
      const i = groups.get(parent) ?? 0;
      groups.set(parent, i + 1);
      el.style.setProperty("--ri", String(Math.min(i, 6)));
      revealIO.observe(el);
    });
    document.querySelectorAll<HTMLElement>(".elevation.is-animated").forEach((el) => {
      if (seen.has(el)) return;
      seen.add(el);
      if (reduced) el.classList.add("is-drawn");
      else drawIO.observe(el);
    });
    document.querySelectorAll<HTMLElement>(PROGRESS).forEach((el) => {
      if (tracked.has(el)) return;
      tracked.add(el);
      progressIO.observe(el);
      settle.add(el);
    });
    document.querySelectorAll<HTMLElement>("[data-pin-track]").forEach((el) => {
      if (seen.has(el)) return;
      seen.add(el);
      sizeRO.observe(el);
    });
    if (!reduced) {
      document.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        countIO.observe(el);
      });
    }
    darkSections = Array.from(document.querySelectorAll<HTMLElement>("[data-tone='dark'], .night, .obsidian"));
    dirty = true;
  }

  // ---------- Per-frame update: all reads, then all writes ----------
  function frame(time: number) {
    lenis?.raf(time);
    const y = window.scrollY;
    if (y !== lastY || dirty) {
      lastY = y;
      dirty = false;

      // READ
      const reads: Read[] = [];
      const collect = (el: HTMLElement) => {
        if (!el.isConnected) {
          tracked.delete(el);
          visible.delete(el);
          progressIO.unobserve(el);
          return;
        }
        const r = el.getBoundingClientRect();
        reads.push({ el, top: r.top, height: r.height });
      };
      visible.forEach(collect);
      settle.forEach((el) => {
        if (!visible.has(el)) collect(el);
      });
      settle.clear();
      const bar = document.querySelector<HTMLElement>(".site-header");
      const probe = bar ? bar.getBoundingClientRect().bottom + 1 : 70;
      const dark = darkSections.some((s) => {
        if (!s.isConnected) return false;
        const r = s.getBoundingClientRect();
        return r.top <= probe && r.bottom > probe;
      });

      // WRITE
      for (const r of reads) write(r);
      writeHeader(y, dark);
    }
    if (travelDirty) writeTravel();
    raf = requestAnimationFrame(frame);
  }

  function write({ el, top, height }: Read) {
    if (el.hasAttribute("data-progress") || el.hasAttribute("data-words")) {
      el.style.setProperty("--p", clamp((vh - top) / (vh + height)).toFixed(4));
      if (el.hasAttribute("data-words")) fillWords(el, top, height);
    }
    if (el.hasAttribute("data-enter")) el.style.setProperty("--enter", clamp((vh - top) / Math.max(1, height)).toFixed(4));
    if (el.hasAttribute("data-exit")) el.style.setProperty("--exit", clamp(-top / Math.max(1, height)).toFixed(4));
    if (el.hasAttribute("data-pin")) el.style.setProperty("--pin", clamp(-top / Math.max(1, height - vh)).toFixed(4));
  }

  function fillWords(el: HTMLElement, top: number, height: number) {
    const words = el.querySelectorAll<HTMLElement>(".w");
    if (!words.length) return;
    if (reduced) {
      words.forEach((w) => w.classList.add("is-lit"));
      return;
    }
    // Fill runs while the block travels from 85% to 35% of the viewport height.
    const start = vh * 0.85;
    const end = vh * 0.35;
    const t = clamp((start - top) / Math.max(1, start - end + height * 0.5));
    const lit = Math.round(t * words.length);
    words.forEach((w, i) => w.classList.toggle("is-lit", i < lit));
  }

  function writeHeader(y: number, dark: boolean) {
    if (docH) root.style.setProperty("--page-p", clamp(y / Math.max(1, docH - vh)).toFixed(4));
    if (root.hasAttribute("data-scrolled") !== y > 8) root.toggleAttribute("data-scrolled", y > 8);
    if (Math.abs(y - lastDirY) > 6) {
      const dir = y > lastDirY && y > 480 ? "down" : "up";
      if (root.getAttribute("data-scroll-dir") !== dir) root.setAttribute("data-scroll-dir", dir);
      lastDirY = y;
    }
    const tone = dark ? "dark" : "light";
    if (root.getAttribute("data-header-tone") !== tone) root.setAttribute("data-header-tone", tone);
  }

  /** Horizontal travel for pinned tracks = how far the track overflows the viewport. */
  function writeTravel() {
    travelDirty = false;
    document.querySelectorAll<HTMLElement>("[data-pin]").forEach((el) => {
      const track = el.querySelector("[data-pin-track]");
      const w = track ? trackWidth.get(track) : undefined;
      if (w == null) return;
      el.style.setProperty("--travel", `${Math.round(Math.max(0, w - vw))}px`);
    });
  }

  raf = requestAnimationFrame(frame);
  cleanups.push(() => cancelAnimationFrame(raf));

  const onResize = () => {
    vw = window.innerWidth;
    vh = window.innerHeight;
    dirty = true;
    travelDirty = true;
    tracked.forEach((el) => settle.add(el));
  };
  window.addEventListener("resize", onResize, { passive: true });
  cleanups.push(() => window.removeEventListener("resize", onResize));

  // Keyboard users: focusing a card that is off to the side of a pinned track scrolls the page to
  // the point where that card is on screen (WCAG 2.4.11, focus not obscured).
  const onFocusIn = (e: FocusEvent) => {
    const t = e.target as HTMLElement | null;
    const track = t?.closest?.<HTMLElement>("[data-pin-track]");
    const pin = track?.closest<HTMLElement>("[data-pin]");
    if (!t || !track || !pin || getComputedStyle(track).transform === "none") return;
    const travel = Math.max(1, track.scrollWidth - window.innerWidth);
    const card = t.closest<HTMLElement>("[data-pin-track] > *") ?? t;
    const want = clamp((card.offsetLeft + card.offsetWidth / 2 - window.innerWidth / 2) / travel);
    const top = pin.getBoundingClientRect().top + window.scrollY;
    const run = Math.max(1, pin.offsetHeight - window.innerHeight);
    const target = Math.round(top + want * run);
    if (lenis) lenis.scrollTo(target, { immediate: true, force: true });
    else window.scrollTo({ top: target, behavior: "instant" as ScrollBehavior });
  };
  document.addEventListener("focusin", onFocusIn);
  cleanups.push(() => document.removeEventListener("focusin", onFocusIn));

  // ---------- Tilt (pointer-driven 3D) ----------
  if (!reduced && finePointer) {
    let active: HTMLElement | null = null;
    const onMove = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest?.<HTMLElement>("[data-tilt]") ?? null;
      if (active && active !== el) resetTilt(active);
      active = el;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = clamp((e.clientX - r.left) / r.width);
      const yy = clamp((e.clientY - r.top) / r.height);
      const max = Number(el.dataset.tilt) || 5;
      el.style.setProperty("--rx", `${((0.5 - yy) * max * 2).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${((x - 0.5) * max * 2).toFixed(2)}deg`);
      el.style.setProperty("--gx", `${(x * 100).toFixed(1)}%`);
      el.style.setProperty("--gy", `${(yy * 100).toFixed(1)}%`);
      el.classList.add("is-tilting");
    };
    const onLeave = () => {
      if (active) resetTilt(active);
      active = null;
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    cleanups.push(() => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    });
  }

  // ---------- Keep new content (client navigation, filters) in the system ----------
  let pending = 0;
  const mo = new MutationObserver((records) => {
    // Only element insertions can add targets (counter text updates are ignored).
    if (pending || !records.some((r) => Array.from(r.addedNodes).some((n) => n.nodeType === Node.ELEMENT_NODE))) return;
    pending = window.setTimeout(() => {
      pending = 0;
      scan();
    }, 80);
  });
  mo.observe(document.body, { childList: true, subtree: true });
  cleanups.push(() => {
    mo.disconnect();
    window.clearTimeout(pending);
  });

  scan();
  root.setAttribute("data-motion-ready", "");

  return {
    lenis,
    refresh() {
      if (lenis && lenis.isScrolling) lenis.scrollTo(window.scrollY, { immediate: true, force: true });
      lenis?.resize();
      travelDirty = true;
      scan();
    },
    destroy() {
      cleanups.forEach((c) => c());
      lenis?.destroy();
      root.classList.remove("has-smooth-scroll");
      root.removeAttribute("data-motion-ready");
    },
  };
}

function resetTilt(el: HTMLElement) {
  el.classList.remove("is-tilting");
  el.style.setProperty("--rx", "0deg");
  el.style.setProperty("--ry", "0deg");
}

// ---------- Counters: animate the number inside the text, keep everything else verbatim ----------
const NUM = /(\d[\d.,   ]*\d|\d)/;

function prepareCounter(el: HTMLElement) {
  const text = el.textContent ?? "";
  if (!NUM.test(text)) return;
  el.dataset.final = text;
  // Reserve the final width so nothing shifts while counting (the element is off-screen here).
  el.style.minWidth = `${el.getBoundingClientRect().width}px`;
  if (getComputedStyle(el).display === "inline") el.style.display = "inline-block";
}

function runCounter(el: HTMLElement) {
  const final = el.dataset.final;
  if (!final) return;
  const m = final.match(NUM);
  if (!m) return;
  const raw = m[1]!;
  const sep = raw.match(/[.,   ]/)?.[0] ?? "";
  const target = Number(raw.replace(/[^\d]/g, ""));
  if (!Number.isFinite(target)) return;
  const group = (n: number) => (sep ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, sep) : String(n));
  const dur = Math.min(1800, 700 + target.toString().length * 180);
  const t0 = performance.now();
  el.setAttribute("aria-hidden", "true"); // announce only the final value
  const live = document.createElement("span");
  live.className = "visually-hidden";
  live.textContent = final;
  el.after(live);
  const step = (now: number) => {
    const t = clamp((now - t0) / dur);
    const eased = 1 - Math.pow(1 - t, 4);
    el.textContent = final.replace(raw, group(Math.round(target * eased)));
    if (t < 1) requestAnimationFrame(step);
    else {
      el.textContent = final;
      el.removeAttribute("aria-hidden");
      live.remove();
    }
  };
  requestAnimationFrame(step);
}
