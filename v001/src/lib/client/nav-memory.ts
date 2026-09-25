"use client";
/** Remembers the previous in-app path (client-side navigations do not update document.referrer). */
let current: string | null = null;
let previous: string | null = null;

export function notePath(path: string) {
  if (path !== current) {
    previous = current;
    current = path;
  }
}

export function previousPath(): string | null {
  return previous;
}
