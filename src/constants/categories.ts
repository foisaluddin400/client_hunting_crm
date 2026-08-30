export interface BusinessCategoryItem {
  id: string;
  name: string;
  isDefault?: boolean;
}

export const DEFAULT_BUSINESS_CATEGORIES: string[] = [
  "Restaurants",
  "Real Estate Agencies",
  "Cleaning Services",
  "Construction Companies",
  "Dental Clinics",
  "Law Firms",
  "Hotels",
  "Gyms",
  "Salons",
  "Accounting Firms",
  "Auto Repair Shops",
  "Plumbing Services",
  "Roofing Companies",
  "Landscaping Services",
  "Marketing Agencies",
  "Photography Studios",
  "Beauty Clinics",
  "Furniture Stores",
  "Retail Stores",
  "Moving Companies",
];

export const CATEGORIES_STORAGE_KEY = "leadflow_business_categories";
