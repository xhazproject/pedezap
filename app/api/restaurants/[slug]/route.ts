import { NextResponse } from "next/server";
import { isSubscriptionBlocked, readStore } from "@/lib/store";

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const store = await readStore();
  const restaurant = store.restaurants.find((item) => item.slug === params.slug);

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

  const { ownerEmail: _ownerEmail, ownerPassword: _ownerPassword, ...publicRestaurant } = restaurant;

  return NextResponse.json({
    success: true,
    restaurant: {
      ...publicRestaurant,
      products: publicRestaurant.products.filter((item) => item.active),
      categories: publicRestaurant.categories.filter((item) => item.active)
    }
  });
}
