import { NextResponse } from "next/server";
import {
  applyRestaurantCampaignCalendar,
  isSubscriptionBlocked,
  readStore,
  writeStore
} from "@/lib/store";

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const store = await readStore();
  const index = store.restaurants.findIndex((item) => item.slug === params.slug);
  const restaurant = index >= 0 ? store.restaurants[index] : null;

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

  const { restaurant: syncedRestaurant } = applyRestaurantCampaignCalendar(restaurant);

  store.restaurants[index] = {
    ...syncedRestaurant,
    viewCount: (restaurant.viewCount ?? 0) + 1,
    lastViewAt: new Date().toISOString()
  };
  await writeStore(store);

  const { ownerEmail: _ownerEmail, ownerPassword: _ownerPassword, ...publicRestaurant } =
    store.restaurants[index];
  const subscribedPlan = store.plans.find((plan) => plan.id === publicRestaurant.subscribedPlanId);
  const bannerFeatureEnabled = subscribedPlan?.allowedTabs
    ? subscribedPlan.allowedTabs.includes("banners")
    : true;

  return NextResponse.json({
    success: true,
    restaurant: {
      ...publicRestaurant,
      bannerFeatureEnabled,
      banners: bannerFeatureEnabled ? publicRestaurant.banners : [],
      products: publicRestaurant.products.filter((item) => item.active),
      categories: publicRestaurant.categories.filter((item) => item.active)
    }
  });
}
