export interface ProfileDetailsInput {
  name: string;
  phone: string;
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

  return { data: { name, phone } };
}
