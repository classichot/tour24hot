"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DomainError } from "@/lib/ios/types";

export type SaveState = "idle" | "saving" | "saved" | "error" | "conflict";

/**
 * Debounced autosave for drafts (UX05): Saving → Saved only after the store acknowledges the write,
 * "Unable to save" on failure, and a conflict state when a newer version exists (UX09).
 */
export function useAutosave<T>(save: (value: T) => { ok: true } | { ok: false; error: DomainError }, delay = 900) {
  const [status, setStatus] = useState<SaveState>("idle");
  const [error, setError] = useState<DomainError | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<T | null>(null);
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const v = pending.current;
    if (v === null) return;
    pending.current = null;
    const r = saveRef.current(v);
    if (r.ok) {
      setStatus("saved");
      setError(null);
    } else {
      setStatus(r.error.code === "conflict" ? "conflict" : "error");
      setError(r.error);
    }
  }, []);

  const queue = useCallback(
    (v: T) => {
      pending.current = v;
      setStatus("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, delay);
    },
    [delay, flush]
  );

  // Warn before leaving with unsaved edits or after a failed save (UX05).
  useEffect(() => {
    const onLeave = (e: BeforeUnloadEvent) => {
      if (pending.current !== null || status === "error" || status === "conflict") {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [status]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return { status, error, queue, flush, reset: () => { setStatus("idle"); setError(null); } };
}
