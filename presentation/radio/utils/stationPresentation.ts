import type { Data } from "@/core/radio-podcast/interface/radio/radio-station-responce-by-slug.interface";

export function stationText(value: unknown): string {
  if (typeof value !== "string" && typeof value !== "number") return "";
  const text = String(value).trim();
  return /^(n\/a|null|undefined)$/i.test(text) ? "" : text;
}

export function stationDescription(value: unknown): string {
  return stationText(value)
    .replace(/<(?:br\s*\/?|\/p|\/div)>/gi, "\n\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&(nbsp|amp|quot|apos|lt|gt);/g, (_, entity: string) =>
      ({ nbsp: " ", amp: "&", quot: '"', apos: "'", lt: "<", gt: ">" })[entity] || "")
    .replace(/[ \t]+/g, " ").replace(/\n\s*\n(?:\s*\n)+/g, "\n\n").trim();
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
}

function webUrl(value: string): string | undefined {
  if (!value || /\s/.test(value)) return;
  const url = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes(".") || !/^https?:$/.test(parsed.protocol)) return;
    return url;
  } catch { return; }
}

export function stationPresentation(radio: Data) {
  const fields = record(radio);
  const rawContact = record(radio.contact_info);
  const contact = { ...record(rawContact.contact_info), ...rawContact };
  const strings = (value: unknown) => Array.isArray(value)
    ? [...new Set(value.map(stationText).filter(Boolean))] : [];
  const contacts: { label: string; value: string; icon: "globe-outline" | "call-outline" | "mail-outline" | "logo-facebook" | "logo-twitter" | "logo-instagram" | "logo-youtube"; url?: string }[] = [];
  const definitions = [
    ["website", "Sitio web", "globe-outline"],
    ["phone", "Teléfono", "call-outline"],
    ["email", "Email", "mail-outline"],
    ["facebook", "Facebook", "logo-facebook"],
    ["twitter", "X / Twitter", "logo-twitter"],
    ["instagram", "Instagram", "logo-instagram"],
    ["youtube", "YouTube", "logo-youtube"],
  ] as const;
  for (const [key, label, icon] of definitions) {
    const value = stationText(contact[key]);
    if (!value) continue;
    const url = key === "phone" ? `tel:${value.replace(/[^+\d]/g, "")}`
      : key === "email" ? `mailto:${value}` : webUrl(value);
    contacts.push({ label, value, icon, url });
  }
  return {
    description: stationDescription(radio.description),
    frequency: stationText(radio.frecuencia),
    locations: strings(radio.locations),
    categories: strings(radio.categories),
    country: stationText(fields.country || fields.pais),
    language: stationText(fields.language || fields.idioma),
    address: stationText(contact.address),
    contacts,
  };
}
