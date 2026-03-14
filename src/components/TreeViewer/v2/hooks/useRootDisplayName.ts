"use client";

import { useMemo, useEffect } from "react";
import { getPeople } from "@/descendancy-chart";

export function useRootDisplayName(
  rootId: string,
  effectiveRootId: string,
  rootDisplayNames: Record<string, string>,
  setRootDisplayNames: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >,
  /** When this changes (e.g. after descendancy fetch), the hook recomputes so getPeople() is read again. */
  dataKey?: number
): string | null {
  const rootDisplayName = useMemo(() => {
    const stored = rootDisplayNames[rootId] ?? rootDisplayNames[effectiveRootId];
    if (stored) return stored;
    const p = getPeople().get(effectiveRootId);
    return p ? `${p.firstName} ${p.lastName}`.trim() : null;
  }, [rootId, effectiveRootId, rootDisplayNames, dataKey]);

  useEffect(() => {
    if (rootDisplayName == null) return;
    const alreadyStored =
      rootDisplayNames[rootId] ?? rootDisplayNames[effectiveRootId];
    if (alreadyStored) return;
    setRootDisplayNames((prev) => ({
      ...prev,
      [rootId]: rootDisplayName,
      ...(effectiveRootId !== rootId
        ? { [effectiveRootId]: rootDisplayName }
        : {}),
    }));
  }, [rootDisplayName, rootId, effectiveRootId, rootDisplayNames, setRootDisplayNames]);

  return rootDisplayName;
}
