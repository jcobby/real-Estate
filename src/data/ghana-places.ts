/**
 * Offline gazetteer of Ghanaian regions and towns, so the listing wizard's
 * "find my land" search works with no geocoding backend. Coordinates are town
 * centres; selecting one flies the map there and can auto-fill region/town.
 */
export interface GhanaPlace {
  name: string;
  region: string;
  lat: number;
  lng: number;
  /** true for a region capital / major landmark → shown first in search */
  major?: boolean;
}

export const GHANA_PLACES: GhanaPlace[] = [
  // Greater Accra
  { name: "Accra", region: "Greater Accra", lat: 5.556, lng: -0.1969, major: true },
  { name: "Tema", region: "Greater Accra", lat: 5.6698, lng: -0.0166, major: true },
  { name: "Tema Community 25", region: "Greater Accra", lat: 5.7161, lng: -0.0432 },
  { name: "Adenta", region: "Greater Accra", lat: 5.7092, lng: -0.1597 },
  { name: "Madina", region: "Greater Accra", lat: 5.6837, lng: -0.1669 },
  { name: "Oyibi", region: "Greater Accra", lat: 5.8265, lng: -0.0866 },
  { name: "Dodowa", region: "Greater Accra", lat: 5.883, lng: -0.096 },
  { name: "East Legon Hills", region: "Greater Accra", lat: 5.7174, lng: -0.0963 },
  { name: "Amasaman", region: "Greater Accra", lat: 5.7014, lng: -0.2967 },
  { name: "Prampram", region: "Greater Accra", lat: 5.7172, lng: 0.1063 },
  { name: "Ada Foah", region: "Greater Accra", lat: 5.7847, lng: 0.6337 },
  { name: "Kasoa", region: "Central", lat: 5.5344, lng: -0.4171 },

  // Ashanti
  { name: "Kumasi", region: "Ashanti", lat: 6.6885, lng: -1.6244, major: true },
  { name: "Ahodwo, Kumasi", region: "Ashanti", lat: 6.6666, lng: -1.6303 },
  { name: "Ejisu", region: "Ashanti", lat: 6.7196, lng: -1.4738 },
  { name: "Kuntanase", region: "Ashanti", lat: 6.5383, lng: -1.4892 },
  { name: "Obuasi", region: "Ashanti", lat: 6.2027, lng: -1.6663 },
  { name: "Mampong", region: "Ashanti", lat: 7.0646, lng: -1.4 },

  // Eastern
  { name: "Koforidua", region: "Eastern", lat: 6.0941, lng: -0.2591, major: true },
  { name: "Aburi", region: "Eastern", lat: 5.8481, lng: -0.1744 },
  { name: "Akosombo", region: "Eastern", lat: 6.2673, lng: 0.0459 },
  { name: "Nsawam", region: "Eastern", lat: 5.8092, lng: -0.3517 },
  { name: "Nkawkaw", region: "Eastern", lat: 6.5497, lng: -0.7712 },

  // Central
  { name: "Cape Coast", region: "Central", lat: 5.1315, lng: -1.2795, major: true },
  { name: "Winneba", region: "Central", lat: 5.3511, lng: -0.6252 },
  { name: "Mankessim", region: "Central", lat: 5.2667, lng: -1.0167 },

  // Western
  { name: "Takoradi", region: "Western", lat: 4.9016, lng: -1.7831, major: true },
  { name: "Sekondi", region: "Western", lat: 4.9344, lng: -1.7133 },
  { name: "Tarkwa", region: "Western", lat: 5.3006, lng: -1.9967 },

  // Volta
  { name: "Ho", region: "Volta", lat: 6.6113, lng: 0.4724, major: true },
  { name: "Keta", region: "Volta", lat: 5.9186, lng: 0.9887 },
  { name: "Hohoe", region: "Volta", lat: 7.1515, lng: 0.4735 },

  // Northern
  { name: "Tamale", region: "Northern", lat: 9.4433, lng: -0.8983, major: true },
  { name: "Sagnarigu", region: "Northern", lat: 9.4667, lng: -0.87 },
  { name: "Yendi", region: "Northern", lat: 9.4427, lng: -0.0093 },

  // Upper East / West / Bono
  { name: "Bolgatanga", region: "Upper East", lat: 10.7856, lng: -0.8514, major: true },
  { name: "Wa", region: "Upper West", lat: 10.0602, lng: -2.5019, major: true },
  { name: "Sunyani", region: "Bono", lat: 7.3349, lng: -2.3123, major: true },
  { name: "Techiman", region: "Bono East", lat: 7.5907, lng: -1.939 },
];

/** Simple case-insensitive prefix/substring search, majors first. */
export function searchPlaces(query: string, limit = 6): GhanaPlace[] {
  const q = query.trim().toLowerCase();
  if (!q) return GHANA_PLACES.filter((p) => p.major).slice(0, limit);
  const scored = GHANA_PLACES.map((p) => {
    const name = p.name.toLowerCase();
    let score = -1;
    if (name === q) score = 100;
    else if (name.startsWith(q)) score = 80;
    else if (name.includes(q)) score = 60;
    else if (p.region.toLowerCase().includes(q)) score = 40;
    if (score >= 0 && p.major) score += 5;
    return { p, score };
  }).filter((s) => s.score >= 0);
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.p);
}
