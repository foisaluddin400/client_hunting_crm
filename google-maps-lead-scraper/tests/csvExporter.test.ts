import { describe, it, expect } from 'vitest';
import { generateCsvContent, escapeCsvField } from '../src/csv/csvExporter';
import { BusinessLead } from '../src/types/business';

describe('CSV Generation & Exporting', () => {
  it('escapes fields containing commas, double quotes, and line breaks', () => {
    expect(escapeCsvField('Electrician, Commercial')).toBe('"Electrician, Commercial"');
    expect(escapeCsvField('John "Jack" Smith')).toBe('"John ""Jack"" Smith"');
    expect(escapeCsvField("Line 1\nLine 2")).toBe("\"Line 1\nLine 2\"");
    expect(escapeCsvField(null)).toBe('');
    expect(escapeCsvField(undefined)).toBe('');
    expect(escapeCsvField(4.8)).toBe('4.8');
  });

  it('generates CSV with selected fields and UTF-8 BOM', () => {
    const leads: BusinessLead[] = [
      {
        id: '1',
        name: 'Alberta Spark, Inc.',
        rating: 4.9,
        reviewCount: 42,
        openStatus: 'Open',
        openingHours: 'Closes 5 PM',
        category: 'Electrician',
        phone: '+1 780-555-0199',
        email: 'info@albertaspark.ca',
        website: 'https://albertaspark.ca',
        address: '10045 111 St, Edmonton, AB',
        mapsUrl: 'https://www.google.com/maps/place/Alberta+Spark',
        scrapedAt: Date.now(),
      },
    ];

    const csv = generateCsvContent(leads, ['name', 'rating', 'phone', 'website']);

    // Must start with UTF-8 BOM
    expect(csv.charCodeAt(0)).toBe(0xfeff);

    // Headers
    expect(csv).toContain('Business Name,Rating,Phone Number,Website');

    // Escaped content
    expect(csv).toContain('"Alberta Spark, Inc.",4.9,+1 780-555-0199,https://albertaspark.ca');
  });

  // Test 12: Missing fields remain empty/null and do not crash
  it('handles missing/null fields safely without crashing (Test 12)', () => {
    const leadsWithMissing: BusinessLead[] = [
      {
        id: '2',
        name: 'Mystery Services',
        rating: null,
        reviewCount: null,
        openStatus: null,
        openingHours: null,
        category: null,
        phone: null,
        email: null,
        website: null,
        address: null,
        mapsUrl: null,
        scrapedAt: Date.now(),
      },
    ];

    const csv = generateCsvContent(leadsWithMissing, [
      'name',
      'rating',
      'reviewCount',
      'email',
      'website',
    ]);

    expect(csv).toContain('Business Name,Rating,Total Reviews,Email,Website');
    expect(csv).toContain('Mystery Services,,,,');
  });
});
