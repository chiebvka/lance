// Utility for persisting table column visibility in cookies (per table)
// No external libraries

const COOKIE_PREFIX = 'table-columns-';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds

// Default columns for each table
const DEFAULT_COLUMNS: Record<string, string[]> = {
  projects: ['name', 'description', 'type', 'budget', 'state', 'status', 'paymentType'],
  customers: ['name', 'email', 'company', 'phone', 'status'], // Example for future use
  // Add more tables as needed
};

// Get default columns for a table
export function getDefaultColumns(tableKey: string): string[] {
  return DEFAULT_COLUMNS[tableKey] || [];
}

// Set visible columns for a table
export function setTableColumns(tableKey: string, columns: string[]) {
  const cookieName = `${COOKIE_PREFIX}${tableKey}`;
  const value = encodeURIComponent(JSON.stringify(columns));
  document.cookie = `${cookieName}=${value}; path=/; max-age=${COOKIE_MAX_AGE}`;
}

// Get visible columns for a table
export function getTableColumns(tableKey: string): string[] | null {
  const cookieName = `${COOKIE_PREFIX}${tableKey}`;
  const cookies = document.cookie.split('; ');
  for (const cookie of cookies) {
    if (cookie.startsWith(cookieName + '=')) {
      const value = cookie.substring(cookieName.length + 1);
      try {
        return JSON.parse(decodeURIComponent(value));
      } catch {
        return null;
      }
    }
  }
  return null;
}

// Get columns with fallback to defaults
export function getTableColumnsWithDefaults(tableKey: string): string[] {
  const saved = getTableColumns(tableKey);
  return saved || getDefaultColumns(tableKey);
} 