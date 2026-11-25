import { clean, toLatinDigits } from "./format";

export { toLatinDigits };

/** Country code prepended to local numbers (e.g. 09xxxxxxxx) for WhatsApp links. */
export const DEFAULT_COUNTRY_CODE = "963";

export type ContactProblem = "missing" | "invalid" | "whatsapp";

export interface ContactLinks {
  /** `tel:` URI, or null when the number can't be dialled. */
  tel: string | null;
  /** `https://wa.me/<digits>` URL, or null when the number can't be used on WhatsApp. */
  whatsapp: string | null;
  problem: ContactProblem | null;
}

export const CONTACT_NOTICES: Record<ContactProblem, string> = {
  missing: "لا يوجد رقم للتواصل",
  invalid: "الرقم غير صالح للاتصال أو واتساب",
  whatsapp: "الرقم غير صالح لواتساب — تأكد من الرقم",
};

/** Builds instant call / WhatsApp links from a free-typed phone number. */
export function contactLinks(
  raw: string | null | undefined,
  countryCode: string = DEFAULT_COUNTRY_CODE,
): ContactLinks {
  const s = toLatinDigits(clean(raw));
  if (!s) return { tel: null, whatsapp: null, problem: "missing" };
  // Only digits and common separators are allowed.
  if (!/^\+?[\d\s\-().]+$/.test(s)) return { tel: null, whatsapp: null, problem: "invalid" };

  const hasPlus = s.startsWith("+");
  const digits = s.replace(/\D/g, "");
  const tel =
    digits.length >= 3 && digits.length <= 15 ? `tel:${hasPlus ? "+" : ""}${digits}` : null;

  let intl: string;
  if (hasPlus) intl = digits;
  else if (digits.startsWith("00")) intl = digits.slice(2);
  else if (digits.startsWith("0")) intl = countryCode + digits.slice(1);
  else if (digits.length === 9 && digits.startsWith("9")) intl = countryCode + digits;
  else intl = digits;
  const whatsapp = /^[1-9]\d{7,14}$/.test(intl) ? `https://wa.me/${intl}` : null;

  const problem: ContactProblem | null = !tel ? "invalid" : !whatsapp ? "whatsapp" : null;
  return { tel, whatsapp: tel ? whatsapp : null, problem };
}
