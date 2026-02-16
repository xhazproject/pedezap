import { NextResponse } from "next/server";
import { z } from "zod";
import { isRestaurantBlocked, isSubscriptionBlocked, makeId, readStore, writeStore } from "@/lib/store";

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
  productIds: z.array(z.string()).default([])
});

const marketingCampaignSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2),
  couponCode: z.string().optional().default(""),
  couponCodes: z.array(z.string()).optional().default([]),
  bannerIds: z.array(z.string()).optional().default([]),
  period: z.string().optional().default(""),
  active: z.boolean().default(true),
  createdAt: z.string().min(1)
});

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const store = await readStore();
  const restaurant = store.restaurants.find((item) => item.slug === params.slug);

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

  const { ownerPassword: _ownerPassword, ...safeRestaurant } = restaurant;
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

  return NextResponse.json(
    { success: false, message: "Acao invalida." },
    { status: 400 }
  );
}
