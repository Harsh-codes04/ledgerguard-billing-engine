const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

export function formatMoney(paise = 0) {
  return inrFormatter.format(Number(paise || 0) / 100);
}

export function parseRupeesToPaise(value) {
  const text = String(value).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;

  const [rupeesText, paiseText = ""] = text.split(".");
  const paise = Number(rupeesText) * 100 + Number(paiseText.padEnd(2, "0"));
  return Number.isSafeInteger(paise) ? paise : null;
}
