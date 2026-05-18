/** Human-readable labels for GEDCOM event type tags. */
export const GEDCOM_EVENT_TYPE_LABELS: Record<string, string> = {
  BIRT: "Birth",
  CHR: "Christening",
  CHRA: "Adult christening",
  BAPM: "Baptism",
  CONF: "Confirmation",
  DEAT: "Death",
  BURI: "Burial",
  CREM: "Cremation",
  ADOP: "Adoption",
  MARR: "Marriage",
  DIV: "Divorce",
  ENGA: "Engagement",
  ANUL: "Annulment",
  RESI: "Residence",
  OCCU: "Occupation",
  EDUC: "Education",
  GRAD: "Graduation",
  IMMI: "Immigration",
  EMIG: "Emigration",
  NATU: "Naturalization",
  CENS: "Census",
  PROP: "Property",
  WILL: "Will",
  EVEN: "Event",
  CUST: "Custom",
};

export function labelGedcomEventType(eventType: string): string {
  const key = (eventType ?? "").toUpperCase().trim();
  return GEDCOM_EVENT_TYPE_LABELS[key] ?? eventType ?? "Event";
}

export function humanizeGedcomCustomType(customType: string): string {
  const t = customType.trim();
  if (!t) return "";
  if (/^[A-Z][A-Z0-9_]*$/.test(t)) {
    return t
      .split("_")
      .filter(Boolean)
      .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
      .join(" ");
  }
  return t;
}

export function formatNoteLinkedEventLabel(eventType: string, customType: string | null | undefined): string {
  const et = (eventType ?? "").trim().toUpperCase();
  const ct = (customType ?? "").trim();
  if (et === "CUST" && ct) return humanizeGedcomCustomType(ct);
  const base = labelGedcomEventType(et);
  if (!ct) return base;
  const hum = humanizeGedcomCustomType(ct);
  const baseNorm = base.toLowerCase().replace(/\s+/g, "");
  const humNorm = hum.toLowerCase().replace(/\s+/g, "");
  if (humNorm === baseNorm) return base;
  return `${base} (${hum})`;
}
