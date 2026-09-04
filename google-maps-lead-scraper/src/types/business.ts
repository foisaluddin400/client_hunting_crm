export interface BusinessLead {
  id: string; // Unique identifier (mapsUrl or normalized name+address)
  name: string | null;
  rating: number | null;
  reviewCount: number | null;
  openStatus: string | null;
  openingHours: string | null;
  category: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  mapsUrl: string | null;
  scrapedAt: number;
}

export type ScrapableFieldKey = keyof Omit<BusinessLead, 'id' | 'scrapedAt'>;

export interface FieldDefinition {
  key: ScrapableFieldKey;
  label: string;
  defaultSelected: boolean;
}

export const SCRAPABLE_FIELDS: FieldDefinition[] = [
  { key: 'name', label: 'Business Name', defaultSelected: true },
  { key: 'rating', label: 'Rating', defaultSelected: true },
  { key: 'reviewCount', label: 'Total Reviews', defaultSelected: true },
  { key: 'openStatus', label: 'Open / Closed', defaultSelected: true },
  { key: 'openingHours', label: 'Opening Hours', defaultSelected: false },
  { key: 'category', label: 'Business Category', defaultSelected: true },
  { key: 'phone', label: 'Phone Number', defaultSelected: true },
  { key: 'email', label: 'Email', defaultSelected: false },
  { key: 'website', label: 'Website', defaultSelected: true },
  { key: 'address', label: 'Address', defaultSelected: true },
  { key: 'mapsUrl', label: 'Google Maps URL', defaultSelected: true },
];
