export const WAITLIST_LAUNCH_MESSAGE =
  "GeoMoney Intelligence Platform will be launching soon. Please join the Waitlist to join GeoMoney Pro to get priority access upon launch";

export interface WaitlistMetadata {
  waitlist: boolean;
  name: string | null;
  joinedAt: string | null;
  source: string | null;
}

export function isWaitlistRecord(
  materialPreferences: string | null | undefined
): boolean {
  if (!materialPreferences) return false;

  try {
    const parsed = JSON.parse(materialPreferences);
    if (parsed && typeof parsed === "object") {
      return Boolean(parsed.waitlist);
    }
    return false;
  } catch {
    return materialPreferences.toLowerCase().includes("waitlist");
  }
}

export function parseWaitlistMetadata(
  materialPreferences: string | null | undefined
): WaitlistMetadata {
  if (!materialPreferences) {
    return { waitlist: false, name: null, joinedAt: null, source: null };
  }

  try {
    const parsed = JSON.parse(materialPreferences);
    if (!parsed || typeof parsed !== "object") {
      return { waitlist: false, name: null, joinedAt: null, source: null };
    }

    let previousName: string | null = null;
    if (parsed.previous) {
      if (typeof parsed.previous === "string") {
        try {
          const prevParsed = JSON.parse(parsed.previous);
          previousName = prevParsed?.name || null;
        } catch {
          previousName = null;
        }
      } else if (typeof parsed.previous === "object") {
        previousName = parsed.previous?.name || null;
      }
    }

    return {
      waitlist: Boolean(parsed.waitlist),
      name:
        typeof parsed.name === "string" && parsed.name.trim()
          ? parsed.name.trim()
          : previousName,
      joinedAt: typeof parsed.joinedAt === "string" ? parsed.joinedAt : null,
      source: typeof parsed.source === "string" ? parsed.source : null,
    };
  } catch {
    const hasWaitlist = materialPreferences.toLowerCase().includes("waitlist");
    return {
      waitlist: hasWaitlist,
      name: null,
      joinedAt: null,
      source: null,
    };
  }
}

export function buildWaitlistPreferences(
  existingPreferences: string | null | undefined,
  data: { name: string; source?: string }
): string {
  let baseObj: Record<string, any> = {};

  if (existingPreferences) {
    try {
      const parsed = JSON.parse(existingPreferences);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        baseObj = { ...parsed };
      } else if (Array.isArray(parsed)) {
        baseObj = { categories: parsed };
      }
    } catch {
      baseObj = { rawPreferences: existingPreferences };
    }
  }

  const trimmedName = data.name.trim();

  return JSON.stringify({
    ...baseObj,
    waitlist: true,
    name: trimmedName || baseObj.name || null,
    source: data.source || baseObj.source || "waitlist",
    joinedAt: baseObj.joinedAt || new Date().toISOString(),
  });
}

export function removeWaitlistFromPreferences(
  existingPreferences: string | null | undefined
): { shouldDeleteRecord: boolean; updatedPreferences: string | null } {
  if (!existingPreferences) {
    return { shouldDeleteRecord: true, updatedPreferences: null };
  }

  try {
    const parsed = JSON.parse(existingPreferences);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { shouldDeleteRecord: true, updatedPreferences: null };
    }

    const { waitlist, name, source, joinedAt, previous, ...rest } = parsed;
    const remainingKeys = Object.keys(rest);

    if (remainingKeys.length === 0 && !previous) {
      return { shouldDeleteRecord: true, updatedPreferences: null };
    }

    if (remainingKeys.length === 0 && typeof previous === "string") {
      // Check if previous itself was only a waitlist record
      if (isWaitlistRecord(previous)) {
        return { shouldDeleteRecord: true, updatedPreferences: null };
      }
      return { shouldDeleteRecord: false, updatedPreferences: previous };
    }

    return {
      shouldDeleteRecord: false,
      updatedPreferences: JSON.stringify(rest),
    };
  } catch {
    return { shouldDeleteRecord: true, updatedPreferences: null };
  }
}