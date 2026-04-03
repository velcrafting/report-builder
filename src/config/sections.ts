export const REPORTING_SECTIONS = [
  { value: "academy", label: "Academy" },
  { value: "blog", label: "Blog" },
  { value: "defensive-communications", label: "Defensive Communications" },
  { value: "geo", label: "GEO" },
  { value: "brand-os", label: "Brand OS" },
] as const;

export const SECTION_OPTIONS = REPORTING_SECTIONS.map((section) => ({
  label: section.label,
  value: section.value,
}));

export const CADENCE_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "bi-weekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
] as const;

export function getSectionLabel(sectionValue: string) {
  return (
    REPORTING_SECTIONS.find((section) => section.value === sectionValue)?.label ?? "Unknown Section"
  );
}
