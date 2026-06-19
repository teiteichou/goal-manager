import type { Language } from "../../app/types";

export function formatMoney(amount: number, language: Language) {
  const locale = language === "ja" ? "ja-JP" : language === "zh" ? "zh-CN" : "en-US";
  return new Intl.NumberFormat(locale, { style: "currency", currency: "JPY", maximumFractionDigits: 0 }).format(amount);
}
