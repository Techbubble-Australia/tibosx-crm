import { parseStatValue } from "@/lib/parse-stat-value";
import { useCallback, useEffect, useMemo, useRef, useState, type Ref } from "react";

const DEFAULT_THRESHOLD = 0.35;
const DEFAULT_DURATION_MS = 1300;

type UseStatCountUpOnViewOptions = {
  threshold?: number;
  durationMs?: number;
};

/**
 * Same behaviour as the homepage "THE RAPIDLY GROWING COMPANY" stats: when `ref` enters the
 * viewport, numeric prefixes animate with ease-out-quad; non-numeric / literal stats show as-is.
 */
export function useStatCountUpOnView<T extends HTMLElement = HTMLElement>(
  rawNumbers: readonly string[],
  options: UseStatCountUpOnViewOptions = {},
): { ref: Ref<T>; formatAt: (index: number) => string } {
  const { threshold = DEFAULT_THRESHOLD, durationMs = DEFAULT_DURATION_MS } = options;
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  const [animated, setAnimated] = useState<number[]>(() => rawNumbers.map(() => 0));

  const statKey = JSON.stringify(rawNumbers);
  const targets = useMemo(() => rawNumbers.map((s) => parseStatValue(s)), [statKey, rawNumbers]);

  useEffect(() => {
    setAnimated(rawNumbers.map(() => 0));
    setInView(false);
  }, [statKey, rawNumbers]);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }
        setInView(true);
        observer.disconnect();
      },
      { threshold },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [statKey, threshold]);

  useEffect(() => {
    if (!inView) {
      return;
    }

    const start = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - (1 - progress) * (1 - progress);

      setAnimated(targets.map(({ target }) => Math.round(target * eased)));

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [targets, inView, durationMs]);

  const formatAt = useCallback(
    (index: number) => {
      const raw = rawNumbers[index] ?? "";
      const t = targets[index];
      if (!t?.target) {
        return raw;
      }
      return `${animated[index] ?? 0}${t.suffix}`;
    },
    [animated, rawNumbers, targets],
  );

  return { ref: ref as Ref<T>, formatAt };
}
