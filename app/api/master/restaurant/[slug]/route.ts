import { NextResponse } from "next/server";
import { z } from "zod";
import {
  applyRestaurantCampaignCalendar,
  isRestaurantBlocked,
  isSubscriptionBlocked,
  makeId,
  readStore,
  writeStore
} from "@/lib/store";
import { geocodeAddress } from "@/lib/geo";

const imageStringSchema = z
  .string()
  .refine(
    (value) =>
      value.length === 0 ||
      value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("data:image/"),
    "Imagem invalida."
  );

const restaurantUpdateSchema = z.object({
  name: z.string().min(2),
  whatsapp: z.string().min(10),
  openingHours: z.string().min(2),
  address: z.string().min(3),
  city: z.string().min(2),
  state: z.string().min(2),
  minOrderValue: z.number().nonnegative(),
  deliveryFee: z.number().nonnegative(),
  deliveryConfig: z
    .object({
      radiusKm: z.number().positive().max(100),
      feeMode: z.enum(["flat", "distance_bands", "neighborhood_fixed", "hybrid"]),
      distanceBands: z
        .array(
          z.object({
            id: z.string().min(1),
            upToKm: z.number().positive(),
            fee: z.number().nonnegative()
          })
        )
        .default([]),
      neighborhoodRates: z
        .array(
          z.object({
            id: z.string().min(1),
            name: z.string().min(1),
            fee: z.number().nonnegative(),
            active: z.boolean().default(true)
          })
        )
        .default([]),
      dispatchMode: z.enum(["manual", "auto"]).default("manual"),
      autoDispatchEnabled: z.boolean().default(false)
    })
    .optional(),
  openForOrders: z.boolean(),
  logoUrl: z.string().optional(),
  coverUrl: z.string().optional()
});

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  active: z.boolean().default(true)
});

const productSchema = z.object({
  id: z.string().optional(),
  categoryId: z.string().min(1),
  name: z.string().min(2),
  description: z.string().min(2),
  price: z.number().nonnegative(),
  active: z.boolean().default(true),
  imageUrl: imageStringSchema.optional(),
  kind: z.enum(["padrao", "pizza", "bebida", "acai"]).optional(),
  pizzaFlavors: z
    .array(
      z.object({
        name: z.string().min(1),
        ingredients: z.string().optional().default(""),
        price: z.number().nonnegative()
      })
    )
    .optional(),
  crusts: z
    .array(
      z.object({
        name: z.string().min(1),
        ingredients: z.string().optional().default(""),
        price: z.number().nonnegative()
      })
    )
    .optional(),
  complements: z
    .array(
      z.object({
        name: z.string().min(1),
        price: z.number().nonnegative()
      })
    )
    .optional(),
  acaiComplementGroups: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        minSelect: z.number().int().nonnegative(),
        maxSelect: z.number().int().nonnegative(),
        items: z.array(
          z.object({
            id: z.string().min(1),
            name: z.string().min(1),
            price: z.number().nonnegative(),
            maxQty: z.number().int().positive()
          })
        )
      })
    )
    .optional()
});

const bannerSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(2),
  description: z.string().default(""),
  imageUrl: imageStringSchema,
  active: z.boolean().default(true),
  productIds: z.array(z.string()).default([]),
  abGroup: z.enum(["A", "B", ""]).optional().default(""),
  clicks: z.number().int().nonnegative().optional().default(0),
  impressions: z.number().int().nonnegative().optional().default(0),
  attributedOrders: z.number().int().nonnegative().optional().default(0),
  lastClickedAt: z.string().nullable().optional()
});

const marketingCampaignSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2),
  couponCode: z.string().optional().default(""),
  couponCodes: z.array(z.string()).optional().default([]),
  bannerIds: z.array(z.string()).optional().default([]),
  period: z.string().optional().default(""),
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default(""),
  autoActivateByCalendar: z.boolean().optional().default(false),
  utmSource: z.string().optional().default(""),
  utmMedium: z.string().optional().default(""),
  utmCampaign: z.string().optional().default(""),
  utmContent: z.string().optional().default(""),
  targetCouponCode: z.string().optional().default(""),
  clicks: z.number().int().nonnegative().optional().default(0),
  attributedOrders: z.number().int().nonnegative().optional().default(0),
  lastClickedAt: z.string().nullable().optional(),
  active: z.boolean().default(true),
  createdAt: z.string().min(1)
});

const couponSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(2),
  uses: z.number().int().nonnegative().default(0),
  active: z.boolean().default(true),
  discountType: z.enum(["percent", "fixed"]),
  discountValue: z.number().nonnegative(),
  minOrderValue: z.number().nonnegative(),
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default(""),
  startTime: z.string().optional().default(""),
  endTime: z.string().optional().default("")
});

const bioLinkSchema = z.object({
  appearance: z.enum(["dark", "light", "brand"]).default("dark"),
  headline: z.string().max(80).default("Nossos Links Oficiais"),
  whatsappEnabled: z.boolean().default(true),
  whatsappValue: z.string().max(120).default(""),
  instagramEnabled: z.boolean().default(false),
  instagramValue: z.string().max(240).default(""),
  customEnabled: z.boolean().default(false),
  customLabel: z.string().max(60).default(""),
  customUrl: z.string().max(240).default("")
});

const adsAiPlanHistoryItemSchema = z.object({
  id: z.string().min(1),
  createdAt: z.string().min(1),
  campaignName: z.string().min(1),
  campaignObjective: z.string().min(1),
  suggestedPeriod: z.string().default(""),
  targetAudience: z.string().default(""),
  recommendedRadiusKm: z.number().nonnegative(),
  dailyBudgetSuggestion: z.string().default(""),
  channels: z.array(z.string()).default([]),
  couponSuggestion: z.string().default(""),
  couponDiscountHint: z.string().default(""),
  bannerHeadline: z.string().default(""),
  bannerDescription: z.string().default(""),
  adCopyPrimary: z.string().default(""),
  adCopyVariants: z.array(z.string()).default([]),
  headline: z.string().default(""),
  cta: z.string().default(""),
  implementationChecklist: z.array(z.string()).default([]),
  trackingSuggestion: z.string().default(""),
  reason: z.string().default("")
});

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const store = await readStore();
  const restaurantIndex = store.restaurants.findIndex((item) => item.slug === params.slug);
  const restaurant = restaurantIndex >= 0 ? store.restaurants[restaurantIndex] : undefined;

  if (!restaurant) {
    return NextResponse.json(
      { success: false, message: "Restaurante nao encontrado." },
      { status: 404 }
    );
  }

  if (isRestaurantBlocked(restaurant)) {
    return NextResponse.json(
      { success: false, message: "Sistema bloqueado. Entre em contato com o suporte." },
      { status: 403 }
    );
  }

  if (isSubscriptionBlocked(restaurant)) {
    return NextResponse.json(
      { success: false, message: "Assinatura expirada. Renove seu plano para acessar o painel." },
      { status: 402 }
    );
  }

  const { restaurant: syncedRestaurant, changed } = applyRestaurantCampaignCalendar(restaurant);
  if (changed) {
    store.restaurants[restaurantIndex] = syncedRestaurant;
    await writeStore(store);
  }

  const { ownerPassword: _ownerPassword, ...safeRestaurant } = (changed
    ? store.restaurants[restaurantIndex]
    : syncedRestaurant);
  return NextResponse.json({ success: true, restaurant: safeRestaurant });
}

export async function PUT(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const payload = await request.json().catch(() => null);
  const parsed = restaurantUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Dados invalidos para atualizacao." },
      { status: 400 }
    );
  }

  const store = await readStore();
  const index = store.restaurants.findIndex((item) => item.slug === params.slug);
  if (index === -1) {
    return NextResponse.json(
      { success: false, message: "Restaurante nao encontrado." },
      { status: 404 }
    );
  }
  if (isRestaurantBlocked(store.restaurants[index])) {
    return NextResponse.json(
      { success: false, message: "Sistema bloqueado. Entre em contato com o suporte." },
      { status: 403 }
    );
  }
  if (isSubscriptionBlocked(store.restaurants[index])) {
    return NextResponse.json(
      { success: false, message: "Assinatura expirada. Renove seu plano para editar dados." },
      { status: 402 }
    );
  }

  store.restaurants[index] = {
    ...store.restaurants[index],
    ...parsed.data
  };
  const geocoded = await geocodeAddress(
    parsed.data.address,
    parsed.data.city,
    parsed.data.state
  );
  if (geocoded) {
    store.restaurants[index].latitude = geocoded.latitude;
    store.restaurants[index].longitude = geocoded.longitude;
  }
  await writeStore(store);
  return NextResponse.json({ success: true, restaurant: store.restaurants[index] });
}

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const payload = await request.json().catch(() => null);
  const action = payload?.action;

  const store = await readStore();
  const index = store.restaurants.findIndex((item) => item.slug === params.slug);
  if (index === -1) {
    return NextResponse.json(
      { success: false, message: "Restaurante nao encontrado." },
      { status: 404 }
    );
  }
  if (isRestaurantBlocked(store.restaurants[index])) {
    return NextResponse.json(
      { success: false, message: "Sistema bloqueado. Entre em contato com o suporte." },
      { status: 403 }
    );
  }
  if (isSubscriptionBlocked(store.restaurants[index])) {
    return NextResponse.json(
      { success: false, message: "Assinatura expirada. Renove seu plano para continuar." },
      { status: 402 }
    );
  }

  if (action === "saveCategory") {
    const parsed = categorySchema.safeParse(payload?.data);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Categoria invalida." },
        { status: 400 }
      );
    }

    if (parsed.data.id) {
      store.restaurants[index].categories = store.restaurants[index].categories.map((item) =>
        item.id === parsed.data.id ? { ...item, ...parsed.data } : item
      );
    } else {
      store.restaurants[index].categories.push({
        id: makeId("cat"),
        ...parsed.data
      });
    }

    await writeStore(store);
    return NextResponse.json({
      success: true,
      categories: store.restaurants[index].categories
    });
  }

  if (action === "deleteCategory") {
    const categoryId = payload?.categoryId as string | undefined;
    if (!categoryId) {
      return NextResponse.json(
        { success: false, message: "Categoria obrigatoria." },
        { status: 400 }
      );
    }
    store.restaurants[index].categories = store.restaurants[index].categories.filter(
      (item) => item.id !== categoryId
    );
    store.restaurants[index].products = store.restaurants[index].products.filter(
      (item) => item.categoryId !== categoryId
    );
    await writeStore(store);
    return NextResponse.json({
      success: true,
      categories: store.restaurants[index].categories,
      products: store.restaurants[index].products
    });
  }

  if (action === "saveProduct") {
    const parsed = productSchema.safeParse(payload?.data);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Produto invalido." },
        { status: 400 }
      );
    }

    if (parsed.data.id) {
      const { id: _id, ...productPayload } = parsed.data;
      store.restaurants[index].products = store.restaurants[index].products.map((item) =>
        item.id === parsed.data.id ? { ...item, ...productPayload } : item
      );
    } else {
      store.restaurants[index].products.push({
        id: makeId("prod"),
        ...parsed.data
      });
    }

    await writeStore(store);
    return NextResponse.json({
      success: true,
      products: store.restaurants[index].products
    });
  }

  if (action === "deleteProduct") {
    const productId = payload?.productId as string | undefined;
    if (!productId) {
      return NextResponse.json(
        { success: false, message: "Produto obrigatorio." },
        { status: 400 }
      );
    }
    store.restaurants[index].products = store.restaurants[index].products.filter(
      (item) => item.id !== productId
    );
    await writeStore(store);
    return NextResponse.json({
      success: true,
      products: store.restaurants[index].products
    });
  }

  if (action === "saveBanners") {
    const parsed = z.array(bannerSchema).safeParse(payload?.data);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Banners invalidos." },
        { status: 400 }
      );
    }
    store.restaurants[index].banners = parsed.data;
    await writeStore(store);
    return NextResponse.json({
      success: true,
      banners: store.restaurants[index].banners
    });
  }

  if (action === "saveMarketingCampaigns") {
    const parsed = z.array(marketingCampaignSchema).safeParse(payload?.data);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Campanhas invalidas." },
        { status: 400 }
      );
    }
    store.restaurants[index].marketingCampaigns = parsed.data;
    await writeStore(store);
    return NextResponse.json({
      success: true,
      marketingCampaigns: store.restaurants[index].marketingCampaigns
    });
  }

  if (action === "saveCoupons") {
    const parsed = z.array(couponSchema).safeParse(payload?.data);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Cupons invalidos." },
        { status: 400 }
      );
    }
    store.restaurants[index].coupons = parsed.data.map((coupon) => ({
      ...coupon,
      code: coupon.code.trim().toUpperCase()
    }));
    await writeStore(store);
    return NextResponse.json({
      success: true,
      coupons: store.restaurants[index].coupons
    });
  }

  if (action === "saveBioLink") {
    const parsed = bioLinkSchema.safeParse(payload?.data);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Bio link invalido." },
        { status: 400 }
      );
    }
    store.restaurants[index].bioLink = parsed.data;
    await writeStore(store);
    return NextResponse.json({
      success: true,
      bioLink: store.restaurants[index].bioLink
    });
  }

  if (action === "saveAdsAiPlansHistory") {
    const parsed = z.array(adsAiPlanHistoryItemSchema).safeParse(payload?.data);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Historico de ADS IA invalido." },
        { status: 400 }
      );
    }
    store.restaurants[index].adsAiPlansHistory = parsed.data.slice(0, 30);
    await writeStore(store);
    return NextResponse.json({
      success: true,
      adsAiPlansHistory: store.restaurants[index].adsAiPlansHistory
    });
  }

  return NextResponse.json(
    { success: false, message: "Acao invalida." },
    { status: 400 }
  );
}
