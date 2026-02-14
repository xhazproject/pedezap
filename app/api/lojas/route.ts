import { NextResponse } from "next/server";
import { isSubscriptionBlocked, readStore } from "@/lib/store";

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

  const cityNorm = normalize(city);
  const stateNorm = normalize(state);
  const queryNorm = normalize(query);

  const store = await readStore();

  const stores = store.restaurants
    .filter((restaurant) => restaurant.active && !isSubscriptionBlocked(restaurant))
    .filter((restaurant) => {
      const restCity = normalize(restaurant.city ?? "");
      const restState = normalize(restaurant.state ?? "");
      const restName = normalize(restaurant.name ?? "");
      const restAddress = normalize(restaurant.address ?? "");

      const cityMatch = !cityNorm || restCity.includes(cityNorm);
      const stateMatch = !stateNorm || restState === stateNorm;
      const queryMatch =
        !queryNorm ||
        restName.includes(queryNorm) ||
        restAddress.includes(queryNorm) ||
        restCity.includes(queryNorm);

      return cityMatch && stateMatch && queryMatch;
    })
    .map((restaurant) => ({
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
      deliveryFee: restaurant.deliveryFee ?? 0
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  return NextResponse.json({
    success: true,
    filters: { city, state, q: query },
    stores
  });
}
