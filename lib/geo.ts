export function parseFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const parsed = Number(value.replace(",", ".").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

export async function geocodeAddress(
  address: string,
  city: string,
  state: string
): Promise<{ latitude: number; longitude: number } | null> {
  const fullQuery = [address, city, state].filter(Boolean).join(", ");
  return geocodeQuery(fullQuery);
}

export async function geocodeQuery(
  query: string
): Promise<{ latitude: number; longitude: number } | null> {
  const fullQuery = [query, "Brasil"].filter(Boolean).join(", ");
  if (!fullQuery.trim()) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const endpoint = new URL("https://nominatim.openstreetmap.org/search");
    endpoint.searchParams.set("q", fullQuery);
    endpoint.searchParams.set("format", "jsonv2");
    endpoint.searchParams.set("limit", "1");
    endpoint.searchParams.set("addressdetails", "1");
    endpoint.searchParams.set("countrycodes", "br");

    const response = await fetch(endpoint.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "PedeZap/1.0 (support@pedezap.site)"
      },
      signal: controller.signal,
      cache: "no-store"
    });

    if (!response.ok) return null;
    const payload = (await response.json().catch(() => null)) as
      | Array<{ lat?: string; lon?: string }>
      | null;
    const item = payload?.[0];
    if (!item) return null;

    const latitude = parseFiniteNumber(item.lat);
    const longitude = parseFiniteNumber(item.lon);
    if (latitude === null || longitude === null) return null;

    return { latitude, longitude };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function geocodeSuggest(
  query: string,
  limit = 5
): Promise<Array<{ label: string; latitude: number; longitude: number }>> {
  const fullQuery = [query, "Brasil"].filter(Boolean).join(", ");
  if (!fullQuery.trim()) return [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const endpoint = new URL("https://nominatim.openstreetmap.org/search");
    endpoint.searchParams.set("q", fullQuery);
    endpoint.searchParams.set("format", "jsonv2");
    endpoint.searchParams.set("limit", String(Math.max(1, Math.min(10, limit))));
    endpoint.searchParams.set("addressdetails", "1");
    endpoint.searchParams.set("countrycodes", "br");

    const response = await fetch(endpoint.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "PedeZap/1.0 (support@pedezap.site)"
      },
      signal: controller.signal,
      cache: "no-store"
    });
    if (!response.ok) return [];

    const payload = (await response.json().catch(() => null)) as
      | Array<{
          lat?: string;
          lon?: string;
          display_name?: string;
          address?: {
            road?: string;
            pedestrian?: string;
            suburb?: string;
            neighbourhood?: string;
            city_district?: string;
            quarter?: string;
            village?: string;
            city?: string;
            town?: string;
            municipality?: string;
            state?: string;
            state_code?: string;
          };
        }>
      | null;
    const rows = payload ?? [];
    if (!rows.length) return [];

    const ufByState: Record<string, string> = {
      acre: "AC",
      alagoas: "AL",
      amapa: "AP",
      amazonas: "AM",
      bahia: "BA",
      ceara: "CE",
      "distrito federal": "DF",
      "espirito santo": "ES",
      goias: "GO",
      maranhao: "MA",
      "mato grosso": "MT",
      "mato grosso do sul": "MS",
      "minas gerais": "MG",
      para: "PA",
      paraiba: "PB",
      parana: "PR",
      pernambuco: "PE",
      piaui: "PI",
      "rio de janeiro": "RJ",
      "rio grande do norte": "RN",
      "rio grande do sul": "RS",
      rondonia: "RO",
      roraima: "RR",
      "santa catarina": "SC",
      "sao paulo": "SP",
      sergipe: "SE",
      tocantins: "TO"
    };

    const normalize = (value: string) =>
      value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

    return rows
      .map((item) => {
        const latitude = parseFiniteNumber(item.lat);
        const longitude = parseFiniteNumber(item.lon);
        if (latitude === null || longitude === null) return null;

        const address = item.address ?? {};
        const street = address.road || address.pedestrian || "";
        const district =
          address.suburb ||
          address.neighbourhood ||
          address.city_district ||
          address.quarter ||
          "";
        const city =
          address.city || address.town || address.municipality || address.village || "";
        const stateByCode = (address.state_code ?? "").toUpperCase();
        const stateByName = ufByState[normalize(address.state ?? "")] ?? "";
        const stateUf = stateByCode.length === 2 ? stateByCode : stateByName;

        let label = "";
        if (street && district && city && stateUf) {
          label = `${street}, ${district} - ${city}/${stateUf}`;
        } else if (street && city && stateUf) {
          label = `${street} - ${city}/${stateUf}`;
        } else if (street && district) {
          label = `${street}, ${district}`;
        } else {
          label = item.display_name ?? "";
        }

        if (!label) return null;
        return { label, latitude, longitude };
      })
      .filter((item): item is { label: string; latitude: number; longitude: number } => !!item);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}
