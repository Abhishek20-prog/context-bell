import { useCallback, useEffect, useState } from "react";
import { readStore, writeStore } from "@/lib/storage";

/** Reactive localStorage state that syncs across components and tabs. */
export function useLocalStore<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setValue(readStore<T>(key, fallback));
    setHydrated(true);
    const sync = () => setValue(readStore<T>(key, fallback));
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (!detail || detail === key) sync();
    };
    window.addEventListener("contextbell:store", onCustom);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("contextbell:store", onCustom);
      window.removeEventListener("storage", sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved =
          typeof next === "function" ? (next as (p: T) => T)(readStore<T>(key, prev)) : next;
        writeStore(key, resolved);
        return resolved;
      });
    },
    [key],
  );

  return { value, setValue: update, hydrated };
}
