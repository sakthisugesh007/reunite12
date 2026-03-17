const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  displayName: string;
}

class GeocodingService {
  async geocode(query: string): Promise<GeocodeResult | null> {
    const params = new URLSearchParams({ q: query });
    const response = await fetch(`${API_BASE_URL}/geocode/search?${params.toString()}`);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error || "Failed to geocode location");
    }

    const data = await response.json();
    return data.result;
  }
}

export const geocodingService = new GeocodingService();
