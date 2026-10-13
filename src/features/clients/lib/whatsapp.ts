/** `https://wa.me/<digits>` for a free-form phone, or null when it has no digits. */
export function whatsappUrl(phone: string | null): string | null {
  const digits = phone?.replace(/\D/g, "") ?? "";
  return digits ? `https://wa.me/${digits}` : null;
}
