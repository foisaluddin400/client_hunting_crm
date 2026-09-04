import { BusinessLead, SCRAPABLE_FIELDS, ScrapableFieldKey } from '../types/business';

/**
 * Escapes a field value according to RFC 4180 CSV standard.
 * Strings containing quotes, commas, or line breaks are wrapped in double quotes,
 * and internal double quotes are escaped as two double quotes ("").
 */
export function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  const str = String(value);

  // If contains commas, double quotes, or line breaks, enclose in quotes
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Generates an RFC 4180-compliant CSV string for the collected leads,
 * filtered by the user's selected fields, prepended with UTF-8 BOM.
 */
export function generateCsvContent(
  businesses: BusinessLead[],
  selectedFields: ScrapableFieldKey[]
): string {
  if (selectedFields.length === 0) {
    return '';
  }

  // Header row
  const headers = selectedFields.map((fieldKey) => {
    const def = SCRAPABLE_FIELDS.find((f) => f.key === fieldKey);
    return escapeCsvField(def ? def.label : fieldKey);
  });

  const rows: string[] = [headers.join(',')];

  // Data rows
  for (const business of businesses) {
    const row = selectedFields.map((fieldKey) => {
      const val = business[fieldKey];
      return escapeCsvField(val);
    });
    rows.push(row.join(','));
  }

  // Prepend UTF-8 BOM (\uFEFF) for Excel and international spreadsheet compatibility
  return '\uFEFF' + rows.join('\r\n');
}

/**
 * Triggers a browser download of the CSV file.
 */
export function downloadCsv(
  businesses: BusinessLead[],
  selectedFields: ScrapableFieldKey[],
  customFilename?: string
): void {
  const csvText = generateCsvContent(businesses, selectedFields);
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = customFilename || `google-maps-leads_${timestamp}.csv`;

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
