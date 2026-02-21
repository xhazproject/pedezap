import { promises as fs } from "node:fs";
import path from "node:path";
import { parseFiniteNumber } from "@/lib/geo";

type AddressBaseItem = {
  label: string;
  latitude: number;
  longitude: number;
};

const addressBasePath = path.join(process.cwd(), "data", "address-base.json");

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

async function loadAddressBase(): Promise<AddressBaseItem[]> {
  try {
    const raw = await fs.readFile(addressBasePath, "utf8");
    const parsed = JSON.parse(raw) as Array<{
      label?: string;
      latitude?: number | string;
      longitude?: number | string;
    }>;

    return parsed
      .map((item) => {
        const latitude = parseFiniteNumber(item.latitude);
        const longitude = parseFiniteNumber(item.longitude);
        const label = (item.label ?? "").trim();
        if (!label || latitude === null || longitude === null) return null;
        return { label, latitude, longitude };
      })
      .filter((item): item is AddressBaseItem => !!item);
  } catch {
    return [];
  }
}

export async function searchAddressBase(query: string, limit = 6) {
  const base = await loadAddressBase();
  const queryNorm = normalize(query);
  if (!queryNorm) return [];
  return base
    .filter((item) => normalize(item.label).includes(queryNorm))
    .slice(0, Math.max(1, Math.min(20, limit)));
}

export async function resolveAddressBase(query: string): Promise<AddressBaseItem | null> {
  const base = await loadAddressBase();
  const queryNorm = normalize(query);
  if (!queryNorm) return null;

  const exact = base.find((item) => normalize(item.label) === queryNorm);
  if (exact) return exact;

  const startsWith = base.find((item) => normalize(item.label).startsWith(queryNorm));
  if (startsWith) return startsWith;

  const includes = base.find((item) => normalize(item.label).includes(queryNorm));
  return includes ?? null;
}
