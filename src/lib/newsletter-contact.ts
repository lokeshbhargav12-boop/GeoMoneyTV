export interface NewsletterContactInput {
  name: string;
  phone: string;
  email: string;
}

export function parseNewsletterContact(
  value: unknown
): { data: NewsletterContactInput } | { error: string } {
  if (!value || typeof value !== "object") {
    return { error: "Name, phone number, and email address are required." };
  }

  const body = value as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

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

  if (!email || email.length > 191 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }

  return { data: { name, phone, email } };
}
