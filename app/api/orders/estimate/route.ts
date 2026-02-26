import { NextResponse } from "next/server";
import { z } from "zod";
import { isSubscriptionBlocked, readStore } from "@/lib/store";
import { haversineDistanceKm, geocodeQuery } from "@/lib/geo";
import { Order } from "@/lib/store-data";

const estimateSchema = z.object({
  restaurantSlug: z.string().min(1),
  customerAddress: z.string().min(5)
});

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function resolveDeliveryFeeConfig(restaurant: any, customerAddress: string) {
  const config = restaurant.deliveryConfig ?? {
    radiusKm: 10,
    feeMode: "flat",
    distanceBands: [],
    neighborhoodRates: [],
    dispatchMode: "manual",
    autoDispatchEnabled: false
  };
  const addressNorm = normalizeText(customerAddress);

  const activeNeighborhood = (config.neighborhoodRates ?? []).find((zone: any) => {
    if (!zone?.active || !zone?.name) return false;
    return addressNorm.includes(normalizeText(zone.name));
  });

  const pickDistanceBandFee = (distanceKm: number | null) => {
    if (distanceKm === null) return null;
    const sortedBands = [...(config.distanceBands ?? [])]
      .filter((band: any) => Number.isFinite(band?.upToKm) && Number.isFinite(band?.fee))
      .sort((a: any, b: any) => a.upToKm - b.upToKm);
    const matched = sortedBands.find((band: any) => distanceKm <= band.upToKm);
    return matched ? { fee: Number(matched.fee) || 0, upToKm: Number(matched.upToKm) } : null;
  };

  return {
    config,
    activeNeighborhood,
    pickDistanceBandFee
  };
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = estimateSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Dados invalidos para estimativa." },
      { status: 400 }
    );
  }

  const store = await readStore();
  const restaurant = store.restaurants.find((item) => item.slug === parsed.data.restaurantSlug);

  if (!restaurant || !restaurant.active) {
    return NextResponse.json(
      { success: false, message: "Restaurante nao encontrado." },
      { status: 404 }
    );
  }
  if (isSubscriptionBlocked(restaurant)) {
    return NextResponse.json(
      { success: false, message: "Restaurante temporariamente indisponivel." },
      { status: 402 }
    );
  }

  let customerGeo: { latitude: number; longitude: number } | null = null;
  try {
    customerGeo = await geocodeQuery(parsed.data.customerAddress);
  } catch {
    customerGeo = null;
  }

  const storeLat = typeof restaurant.latitude === "number" ? restaurant.latitude : null;
  const storeLng = typeof restaurant.longitude === "number" ? restaurant.longitude : null;
  const deliveryDistanceKm =
    customerGeo && storeLat !== null && storeLng !== null
      ? haversineDistanceKm(storeLat, storeLng, customerGeo.latitude, customerGeo.longitude)
      : null;

  const { config, activeNeighborhood, pickDistanceBandFee } = resolveDeliveryFeeConfig(
    restaurant,
    parsed.data.customerAddress
  );

  const radiusKm = Number(config.radiusKm ?? 10) || 10;
  if (deliveryDistanceKm !== null && deliveryDistanceKm > radiusKm) {
    return NextResponse.json(
      {
        success: false,
        outOfRange: true,
        radiusKm,
        deliveryDistanceKm: Number(deliveryDistanceKm.toFixed(2)),
        message: `Endereco fora do raio de entrega da loja (maximo ${radiusKm.toFixed(1)} km).`
      },
      { status: 409 }
    );
  }

  let deliveryFee = Number(restaurant.deliveryFee ?? 0);
  let deliveryZoneName: string | null = null;
  let deliveryFeeSource: Order["deliveryFeeSource"] = "fallback";

  const distanceBand = pickDistanceBandFee(deliveryDistanceKm);
  const neighborhoodFee =
    activeNeighborhood && Number.isFinite(activeNeighborhood.fee)
      ? Number(activeNeighborhood.fee) || 0
      : null;

  const feeMode = config.feeMode ?? "flat";
  if (feeMode === "flat") {
    deliveryFeeSource = "flat";
  } else if (feeMode === "distance_bands") {
    if (distanceBand) {
      deliveryFee = distanceBand.fee;
      deliveryFeeSource = "distance_band";
    } else {
      deliveryFeeSource = "fallback";
    }
  } else if (feeMode === "neighborhood_fixed") {
    if (neighborhoodFee !== null) {
      deliveryFee = neighborhoodFee;
      deliveryZoneName = activeNeighborhood?.name ?? null;
      deliveryFeeSource = "neighborhood_fixed";
    } else {
      deliveryFeeSource = "fallback";
    }
  } else if (feeMode === "hybrid") {
    if (neighborhoodFee !== null) {
      deliveryFee = neighborhoodFee;
      deliveryZoneName = activeNeighborhood?.name ?? null;
      deliveryFeeSource = "hybrid";
    } else if (distanceBand) {
      deliveryFee = distanceBand.fee;
      deliveryFeeSource = "hybrid";
    } else {
      deliveryFeeSource = "fallback";
    }
  }

  return NextResponse.json({
    success: true,
    deliveryFee: Number(deliveryFee.toFixed(2)),
    radiusKm,
    deliveryDistanceKm: deliveryDistanceKm !== null ? Number(deliveryDistanceKm.toFixed(2)) : null,
    deliveryZoneName,
    deliveryFeeSource,
    geocoded: !!customerGeo
  });
}

