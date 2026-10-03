import { useEffect, useState } from "react";
import { saveStoredJson, type StorageKey } from "@/lib/persistence";

/** LocalStorage에서 초기값을 읽고, 값이 바뀔 때마다 JSON으로 다시 저장하는 state */
export function useStoredState<T>(key: StorageKey, load: () => T) {
  const [value, setValue] = useState(load);
  useEffect(() => {
    saveStoredJson(key, value);
  }, [key, value]);
  return [value, setValue] as const;
}
