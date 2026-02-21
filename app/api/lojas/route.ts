import { NextResponse } from "next/server";
import { isSubscriptionBlocked, readStore } from "@/lib/store";
import { geocodeAddress, haversineDistanceKm, parseFiniteNumber } from "@/lib/geo";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city")?.trim() ?? "";
  const state = searchParams.get("state")?.trim() ?? "";
  const query = searchParams.get("q")?.trim() ?? "";
  const userLat = parseFiniteNumber(searchParams.get("lat"));
  const userLng = parseFiniteNumber(searchParams.get("lng"));
  const radiusKmInput = parseFiniteNumber(searchParams.get("radiusKm"));
  const radiusKm = Math.min(50, Math.max(1, radiusKmInput ?? 10));
  const hasUserLocation = userLat !== null && userLng !== null;

  const cityNorm = normalize(city);
  const stateNorm = normalize(state);
  const queryNorm = normalize(query);

  const store = await readStore();

  const filteredRestaurants = store.restaurants
    .filter((restaurant) => restaurant.active && !isSubscriptionBlocked(restaurant))
    .filter((restaurant) => {
      const restCity = normalize(restaurant.city ?? "");
      const restState = normalize(restaurant.state ?? "");
      const restName = normalize(restaurant.name ?? "");
      const restAddress = normalize(restaurant.address ?? "");
      const hasValidLocation =
        restCity.length >= 2 &&
        restState.length >= 2 &&
        restCity !== "cidade" &&
        restState !== "uf" &&
        restAddress.length >= 3;

      const cityMatch = !cityNorm || restCity.includes(cityNorm);
      const stateMatch = !stateNorm || restState === stateNorm;
      const queryMatch =
        !queryNorm ||
        restName.includes(queryNorm) ||
        restAddress.includes(queryNorm) ||
        restCity.includes(queryNorm);

      return hasValidLocation && cityMatch && stateMatch && queryMatch;
    });

  const storesWithDistance = await Promise.all(
    filteredRestaurants.map(async (restaurant) => {
      const persistedLat = parseFiniteNumber(restaurant.latitude);
      const persistedLng = parseFiniteNumber(restaurant.longitude);
      const geocoded =
        persistedLat === null || persistedLng === null
          ? await geocodeAddress(restaurant.address ?? "", restaurant.city ?? "", restaurant.state ?? "")
          : null;
      const storeLat = persistedLat ?? geocoded?.latitude ?? null;
      const storeLng = persistedLng ?? geocoded?.longitude ?? null;
      const distanceKm =
        hasUserLocation && storeLat !== null && storeLng !== null
          ? haversineDistanceKm(userLat, userLng, storeLat, storeLng)
          : null;
      return {
        id: restaurant.id,
        slug: restaurant.slug,
        name: restaurant.name,
        logoUrl: restaurant.logoUrl,
        coverUrl: restaurant.coverUrl,
        city: restaurant.city,
        state: restaurant.state,
        address: restaurant.address,
        openingHours: restaurant.openingHours,
        openForOrders: restaurant.openForOrders ?? true,
        whatsapp: restaurant.whatsapp,
        deliveryFee: restaurant.deliveryFee ?? 0,
        latitude: storeLat,
        longitude: storeLng,
        distanceKm
      };
    })
  );

  const stores = storesWithDistance
    .filter((restaurant) => {
      if (!hasUserLocation) return true;
      return restaurant.distanceKm !== null && restaurant.distanceKm <= radiusKm;
    })
    .sort((a, b) => {
      if (a.distanceKm !== null && b.distanceKm !== null) return a.distanceKm - b.distanceKm;
      if (a.distanceKm !== null) return -1;
      if (b.distanceKm !== null) return 1;
      return a.name.localeCompare(b.name, "pt-BR");
    });

  return NextResponse.json({
    success: true,
    filters: { city, state, q: query, radiusKm, hasUserLocation },
    stores
  });
}
