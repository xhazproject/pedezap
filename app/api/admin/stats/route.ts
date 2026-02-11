import { NextResponse } from "next/server";
import { readStore } from "@/lib/store";

export async function GET() {
  const store = await readStore();
  const activeRestaurants = store.restaurants.filter((item) => item.active).length;
  const totalOrders = store.orders.length;
  const totalLeads = store.leads.length;
  const grossRevenue = store.orders.reduce((sum, item) => sum + item.total, 0);

  return NextResponse.json({
    success: true,
    stats: {
      totalRestaurants: store.restaurants.length,
      activeRestaurants,
      totalOrders,
      totalLeads,
      grossRevenue
    }
  });
}
