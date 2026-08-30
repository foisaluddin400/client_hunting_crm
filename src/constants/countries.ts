export interface CountryItem {
  id: string;
  name: string;
  isDefault?: boolean;
}

export const DEFAULT_COUNTRIES: string[] = [
  "United States",
  "Canada",
  "Australia",
  "United Kingdom",
  "Netherlands",
  "Germany",
  "France",
  "New Zealand",
  "Ireland",
  "Spain",
  "Italy",
  "Sweden",
  "Norway",
  "Denmark",
  "Finland",
  "Belgium",
  "Austria",
  "Switzerland",
];

export const COUNTRIES_STORAGE_KEY = "leadflow_target_countries";
