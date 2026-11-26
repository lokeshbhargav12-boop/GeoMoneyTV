export interface ProfileDetailsInput {
  name: string;
  phone: string;
  /** Why the user is using the platform — optional at this layer; one of: trader, researcher, casual. */
  userPersona: string | null;
}

export const USER_PERSONAS = ["trader", "researcher", "casual"] as const;
export type UserPersona = (typeof USER_PERSONAS)[number];

export function isUserPersona(value: unknown): value is UserPersona {
  return typeof value === "string" && (USER_PERSONAS as readonly string[]).includes(value);
}

export function parseProfileDetails(
  value: unknown
): { data: ProfileDetailsInput } | { error: string } {
  if (!value || typeof value !== "object") {
    return { error: "Name and phone number are required." };
  }

  const body = value as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const userPersona = isUserPersona(body.userPersona) ? body.userPersona : null;

  if (!name || name.length > 100) {
    return { error: "Enter a valid name (up to 100 characters)." };
  }

  const digitCount = phone.replace(/\D/g, "").length;
  if (
    !phone ||
    phone.length > 32 ||
    !/^[+()\d\s.-]+$/.test(phone) ||
    digitCount < 7 ||
    digitCount > 15
  ) {
    return { error: "Enter a valid phone number, including the country code." };
  }

  return { data: { name, phone, userPersona } };
}
