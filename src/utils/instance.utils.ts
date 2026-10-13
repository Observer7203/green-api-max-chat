/**
 * GREEN-API serves an instance from the host named after the first four digits of its id:
 * 3100… lives on 3100.api.green-api.com. The console shows the same address as `apiUrl`.
 */
export const getApiUrl = (idInstance: string): string =>
  `https://${idInstance.slice(0, 4)}.api.green-api.com`;
