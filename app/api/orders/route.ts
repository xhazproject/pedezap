import { NextResponse } from "next/server";
import { z } from "zod";
import { isSubscriptionBlocked, makeId, readStore, writeStore } from "@/lib/store";
import { Order, OrderPaymentMethod } from "@/lib/store-data";
import { geocodeQuery, haversineDistanceKm } from "@/lib/geo";

const orderSchema = z.object({
  restaurantSlug: z.string().min(1),
  source: z.enum(["catalog", "panel"]).optional(),
  customerName: z.string().min(2),
  customerWhatsapp: z.string().min(10),
  customerEmail: z.string().email().optional(),
  customerAddress: z.string().min(5),
  couponCode: z.string().optional(),
  trafficSource: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmContent: z.string().optional(),
  utmTerm: z.string().optional(),
  attributionBannerId: z.string().optional(),
  attributionCampaignId: z.string().optional(),
  paymentMethod: z.enum(["money", "card", "pix"]),
  generalNotes: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string(),
      name: z.string(),
      price: z.number().min(0),
      quantity: z.number().int().positive(),
      notes: z.string().optional()
    })
  )
});

function normalizeCouponCode(value: string) {
  return value.trim().toUpperCase();
}

function isCouponWithinDateTime(coupon: {
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
}) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const parseTime = (time: string) => {
    const [hh, mm] = time.split(":").map(Number);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
    return hh * 60 + mm;
  };

  if (coupon.startDate && coupon.startDate > today) return false;
  if (coupon.endDate && coupon.endDate < today) return false;

  const startMinutes = coupon.startTime ? parseTime(coupon.startTime) : null;
  const endMinutes = coupon.endTime ? parseTime(coupon.endTime) : null;
  if (startMinutes !== null && currentMinutes < startMinutes) return false;
  if (endMinutes !== null && currentMinutes > endMinutes) return false;

  return true;
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function resolveDeliveryFee(restaurant: any, customerAddress: string) {
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const store = await readStore();

  const orders = slug
    ? store.orders.filter((item) => item.restaurantSlug === slug)
    : store.orders;

  return NextResponse.json({ success: true, orders });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = orderSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Pedido invalido." },
      { status: 400 }
    );
  }

  const store = await readStore();
  const restaurant = store.restaurants.find(
    (item) => item.slug === parsed.data.restaurantSlug
  );

  if (!restaurant) {
    return NextResponse.json(
      { success: false, message: "Restaurante nao encontrado." },
      { status: 404 }
    );
  }
  if (restaurant.openForOrders === false) {
    return NextResponse.json(
      { success: false, message: "Loja fechada no momento para novos pedidos." },
      { status: 409 }
    );
  }
  if (isSubscriptionBlocked(restaurant)) {
    return NextResponse.json(
      { success: false, message: "Restaurante com assinatura inativa no momento." },
      { status: 402 }
    );
  }

  const subtotal = parsed.data.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const normalizedCoupon = parsed.data.couponCode
    ? normalizeCouponCode(parsed.data.couponCode)
    : "";
  let discountValue = 0;
  let appliedCouponCode = "";

  if (normalizedCoupon) {
    const couponIndex = (restaurant.coupons ?? []).findIndex(
      (coupon) => normalizeCouponCode(coupon.code) === normalizedCoupon
    );
    if (couponIndex === -1) {
      return NextResponse.json(
        { success: false, message: "Cupom invalido para esta loja." },
        { status: 400 }
      );
    }

    const coupon = restaurant.coupons![couponIndex];
    if (!coupon.active || !isCouponWithinDateTime(coupon)) {
      return NextResponse.json(
        { success: false, message: "Cupom inativo ou fora da validade." },
        { status: 400 }
      );
    }
    if (subtotal < (coupon.minOrderValue ?? 0)) {
      return NextResponse.json(
        {
          success: false,
          message: `Cupom disponivel apenas para pedidos acima de R$ ${Number(coupon.minOrderValue ?? 0).toFixed(2)}.`
        },
        { status: 400 }
      );
    }

    const normalizedWhatsapp = parsed.data.customerWhatsapp.replace(/\D/g, "");
    const customer = store.customers.find(
      (item) =>
        item.restaurantSlug === restaurant.slug &&
        item.whatsapp.replace(/\D/g, "") === normalizedWhatsapp
    );

    if (customer?.usedCouponCodes?.includes(normalizedCoupon)) {
      return NextResponse.json(
        { success: false, message: "Este cupom ja foi utilizado por este cliente nesta loja." },
        { status: 409 }
      );
    }

    discountValue =
      coupon.discountType === "percent"
        ? (subtotal * coupon.discountValue) / 100
        : coupon.discountValue;
    discountValue = Math.max(0, Math.min(subtotal, Number(discountValue.toFixed(2))));
    appliedCouponCode = normalizedCoupon;
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

  const { config: deliveryConfig, activeNeighborhood, pickDistanceBandFee } = resolveDeliveryFee(
    restaurant,
    parsed.data.customerAddress
  );

  const radiusKm = Number(deliveryConfig.radiusKm ?? 10) || 10;
  if (deliveryDistanceKm !== null && deliveryDistanceKm > radiusKm) {
    return NextResponse.json(
      {
        success: false,
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

  const feeMode = deliveryConfig.feeMode ?? "flat";
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

  const total = subtotal - discountValue + deliveryFee;

  const paymentLabels: Record<OrderPaymentMethod, string> = {
    money: "Dinheiro",
    card: "Cartao",
    pix: "Pix"
  };

  const createdOrder: Order = {
    id: makeId("order"),
    restaurantSlug: restaurant.slug,
    source: parsed.data.source ?? "catalog",
    customerName: parsed.data.customerName,
    customerWhatsapp: parsed.data.customerWhatsapp,
    customerAddress: parsed.data.customerAddress,
    customerLatitude: customerGeo?.latitude ?? null,
    customerLongitude: customerGeo?.longitude ?? null,
    deliveryDistanceKm: deliveryDistanceKm !== null ? Number(deliveryDistanceKm.toFixed(2)) : null,
    deliveryZoneName,
    deliveryFeeSource,
    dispatchStatus: "pending",
    dispatchMode: deliveryConfig.dispatchMode === "auto" && deliveryConfig.autoDispatchEnabled ? "auto" : "manual",
    trafficSource: parsed.data.trafficSource?.trim() || undefined,
    utmSource: parsed.data.utmSource?.trim() || undefined,
    utmMedium: parsed.data.utmMedium?.trim() || undefined,
    utmCampaign: parsed.data.utmCampaign?.trim() || undefined,
    utmContent: parsed.data.utmContent?.trim() || undefined,
    utmTerm: parsed.data.utmTerm?.trim() || undefined,
    attributionBannerId: parsed.data.attributionBannerId?.trim() || undefined,
    attributionCampaignId: parsed.data.attributionCampaignId?.trim() || undefined,
    paymentMethod: parsed.data.paymentMethod,
    items: parsed.data.items,
    subtotal,
    discountValue,
    couponCode: appliedCouponCode || undefined,
    deliveryFee,
    total,
    generalNotes: parsed.data.generalNotes,
    status: "Recebido",
    createdAt: new Date().toISOString()
  };

  store.orders.unshift(createdOrder);

  const normalizedWhatsapp = parsed.data.customerWhatsapp.replace(/\D/g, "");
  const customerIndex = store.customers.findIndex(
    (item) =>
      item.restaurantSlug === restaurant.slug &&
      item.whatsapp.replace(/\D/g, "") === normalizedWhatsapp
  );

  if (customerIndex >= 0) {
    const current = store.customers[customerIndex];
    store.customers[customerIndex] = {
      ...current,
      name: parsed.data.customerName,
      whatsapp: parsed.data.customerWhatsapp,
      totalOrders: current.totalOrders + 1,
      totalSpent: current.totalSpent + total,
      usedCouponCodes:
        appliedCouponCode && !current.usedCouponCodes?.includes(appliedCouponCode)
          ? [...(current.usedCouponCodes ?? []), appliedCouponCode]
          : current.usedCouponCodes ?? [],
      lastOrderAt: new Date().toISOString()
    };
  } else {
    store.customers.unshift({
      id: makeId("customer"),
      restaurantSlug: restaurant.slug,
      name: parsed.data.customerName,
      whatsapp: parsed.data.customerWhatsapp,
      totalOrders: 1,
      totalSpent: total,
      usedCouponCodes: appliedCouponCode ? [appliedCouponCode] : [],
      lastOrderAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });
  }

  if (appliedCouponCode) {
    const targetRestaurant = store.restaurants.find((item) => item.slug === restaurant.slug);
    if (targetRestaurant?.coupons?.length) {
      targetRestaurant.coupons = targetRestaurant.coupons.map((coupon) =>
        normalizeCouponCode(coupon.code) === appliedCouponCode
          ? { ...coupon, uses: (coupon.uses ?? 0) + 1 }
          : coupon
      );
    }
  }

  if (createdOrder.attributionBannerId || createdOrder.attributionCampaignId) {
    const targetRestaurant = store.restaurants.find((item) => item.slug === restaurant.slug);
    if (targetRestaurant) {
      if (createdOrder.attributionBannerId && targetRestaurant.banners?.length) {
        targetRestaurant.banners = targetRestaurant.banners.map((banner) =>
          banner.id === createdOrder.attributionBannerId
            ? { ...banner, attributedOrders: (banner.attributedOrders ?? 0) + 1 }
            : banner
        );
      }
      if (createdOrder.attributionCampaignId && targetRestaurant.marketingCampaigns?.length) {
        targetRestaurant.marketingCampaigns = targetRestaurant.marketingCampaigns.map((campaign) =>
          campaign.id === createdOrder.attributionCampaignId
            ? { ...campaign, attributedOrders: (campaign.attributedOrders ?? 0) + 1 }
            : campaign
        );
      }
    }
  }

  await writeStore(store);

  let message = `*NOVO PEDIDO - ${restaurant.name}*\n`;
  message += "------------------------------\n";
  parsed.data.items.forEach((item) => {
    message += `${item.quantity}x ${item.name} (R$ ${item.price.toFixed(2)})\n`;
    if (item.notes) message += `Obs: ${item.notes}\n`;
  });
  message += "------------------------------\n";
  message += `Subtotal: R$ ${subtotal.toFixed(2)}\n`;
  if (discountValue > 0) {
    message += `Desconto (${appliedCouponCode}): -R$ ${discountValue.toFixed(2)}\n`;
  }
  message += `Taxa entrega: R$ ${deliveryFee.toFixed(2)}\n`;
  if (createdOrder.deliveryDistanceKm !== null && createdOrder.deliveryDistanceKm !== undefined) {
    message += `Distancia: ${createdOrder.deliveryDistanceKm.toFixed(2)} km\n`;
  }
  if (deliveryZoneName) {
    message += `Regiao: ${deliveryZoneName}\n`;
  }
  message += `*TOTAL: R$ ${total.toFixed(2)}*\n\n`;
  message += "*DADOS DO CLIENTE*\n";
  message += `Nome: ${parsed.data.customerName}\n`;
  message += `WhatsApp: ${parsed.data.customerWhatsapp}\n`;
  message += `Endereco: ${parsed.data.customerAddress}\n`;
  message += `Pagamento: ${paymentLabels[parsed.data.paymentMethod]}\n`;
  if (parsed.data.generalNotes) {
    message += `\nObs geral: ${parsed.data.generalNotes}`;
  }

  return NextResponse.json({
    success: true,
    order: createdOrder,
    whatsappUrl: `https://wa.me/${restaurant.whatsapp}?text=${encodeURIComponent(message)}`
  });
}
