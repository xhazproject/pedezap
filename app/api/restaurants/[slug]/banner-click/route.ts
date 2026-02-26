import { NextResponse } from "next/server";
import { readStore, writeStore } from "@/lib/store";

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const payload = (await request.json().catch(() => null)) as
    | { bannerId?: string; campaignId?: string }
    | null;
  const bannerId = payload?.bannerId?.trim();
  if (!bannerId) {
    return NextResponse.json(
      { success: false, message: "Banner invalido." },
      { status: 400 }
    );
  }

  const store = await readStore();
  const restaurantIndex = store.restaurants.findIndex((r) => r.slug === params.slug);
  if (restaurantIndex < 0) {
    return NextResponse.json(
      { success: false, message: "Restaurante nao encontrado." },
      { status: 404 }
    );
  }

  const restaurant = store.restaurants[restaurantIndex];
  let changed = false;
  restaurant.banners = (restaurant.banners ?? []).map((banner) => {
    if (banner.id !== bannerId) return banner;
    changed = true;
    return {
      ...banner,
      clicks: (banner.clicks ?? 0) + 1,
      lastClickedAt: new Date().toISOString()
    };
  });
  const campaignId = payload?.campaignId?.trim();
  if (campaignId && restaurant.marketingCampaigns?.length) {
    restaurant.marketingCampaigns = restaurant.marketingCampaigns.map((campaign) =>
      campaign.id === campaignId
        ? {
            ...campaign,
            clicks: (campaign.clicks ?? 0) + 1,
            lastClickedAt: new Date().toISOString()
          }
        : campaign
    );
    changed = true;
  }

  if (changed) {
    store.restaurants[restaurantIndex] = restaurant;
    await writeStore(store);
  }

  return NextResponse.json({ success: true });
}
