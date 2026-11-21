"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ViewerTierId } from "@/lib/entitlements";

export interface EntitlementState {
  /** guest = logged out, free = account without an open subscription. */
  tier: ViewerTierId;
  signedIn: boolean;
  /** True until the first resolution completes; gates must not flash "locked" while loading. */
  loading: boolean;
  refresh: () => void;
}

const DEFAULT_STATE: EntitlementState = {
  tier: "guest",
  signedIn: false,
  loading: true,
  refresh: () => {},
};

const EntitlementContext = createContext<EntitlementState>(DEFAULT_STATE);

export function useEntitlements(): EntitlementState {
  return useContext(EntitlementContext);
}

/**
 * Resolves the viewer's subscription tier once per page session and shares it
 * with every gate/badge on the page. Mount inside AuthProvider in the root
 * layout. The server-side counterpart is getViewerSubscriptionState().
 */
export default function EntitlementProvider({ children }: { children: React.ReactNode }) {
  const [resolved, setResolved] = useState<{ tier: ViewerTierId; signedIn: boolean } | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/subscription", { cache: "no-store" });
      if (!response.ok) throw new Error(`status ${response.status}`);
      const data = (await response.json()) as { tier?: ViewerTierId; signedIn?: boolean };
      setResolved({ tier: data.tier ?? "guest", signedIn: Boolean(data.signedIn) });
    } catch {
      // Fail closed to the most restrictive tier: guests see the same gates as
      // free accounts, so a transient error only affects paid unlocks.
      setResolved({ tier: "guest", signedIn: false });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const value = useMemo<EntitlementState>(
    () => ({
      tier: resolved?.tier ?? "guest",
      signedIn: resolved?.signedIn ?? false,
      loading: resolved === null,
      refresh: load,
    }),
    [resolved, load],
  );

  return <EntitlementContext.Provider value={value}>{children}</EntitlementContext.Provider>;
}
