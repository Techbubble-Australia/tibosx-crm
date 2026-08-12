/** Major cities per ISO 3166-1 alpha-2 country code for career application city select. */
export const COUNTRY_CITIES: Record<string, readonly string[]> = {
  AU: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Canberra", "Hobart", "Darwin"],
  US: ["New York", "San Francisco", "Los Angeles", "Chicago", "Seattle", "Boston", "Austin", "Dallas"],
  GB: ["London", "Manchester", "Birmingham", "Edinburgh", "Leeds", "Bristol"],
  IN: ["Mumbai", "Bangalore", "Delhi", "Hyderabad", "Chennai", "Pune", "Kolkata"],
  PH: ["Manila", "Cebu", "Davao", "Quezon City"],
  AE: ["Dubai", "Abu Dhabi", "Sharjah"],
  NZ: ["Auckland", "Wellington", "Christchurch"],
  SG: ["Singapore"],
  CA: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa"],
  DE: ["Berlin", "Munich", "Frankfurt", "Hamburg"],
  FR: ["Paris", "Lyon", "Marseille"],
  JP: ["Tokyo", "Osaka", "Yokohama"],
};

export function getCitiesForCountryCode(countryCode: string): readonly string[] {
  const code = countryCode.trim().toUpperCase();
  return COUNTRY_CITIES[code] ?? [];
}
