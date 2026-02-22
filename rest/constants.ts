import { Restaurant as StoreRestaurant } from '@/lib/store-data';
import { Category, Offer, PizzaCrust, PizzaFlavor, Product, Restaurant } from './types';

export let RESTAURANT_DATA: Restaurant = {
  name: 'PedeZap',
  logoUrl: 'https://picsum.photos/200/200?random=1',
  coverUrl: 'https://picsum.photos/800/400?random=2',
  whatsappNumber: '5511999999999',
  isOpen: true,
  openingHours: 'Consulte horarios',
  address: 'Endereco nao informado',
  city: 'Cidade',
  state: 'UF',
  taxId: null,
  minOrderValue: 0,
  deliveryFee: 0
};

export let OFFERS: Offer[] = [
  {
    id: '1',
    title: 'Frete Gratis',
    description: 'Em pedidos acima de R$ 50,00',
    imageUrl: 'https://images.unsplash.com/photo-1606131731446-5568d87113aa?auto=format&fit=crop&q=80&w=600',
    productIds: []
  },
  {
    id: '2',
    title: 'Oferta da Casa',
    description: 'Confira os destaques do cardapio',
    imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=600',
    productIds: []
  }
];

export let CATEGORIES: Category[] = [];
export let PRODUCTS: Product[] = [];
const FEATURED_TAG = '[destaque]';

export const PIZZA_FLAVORS: PizzaFlavor[] = [
  { id: 'mussarela', name: 'Mussarela', description: 'Molho, mussarela e oregano' },
  { id: 'calabresa', name: 'Calabresa', description: 'Molho, mussarela, calabresa e cebola' },
  { id: 'frango', name: 'Frango com Catupiry', description: 'Molho, mussarela, frango desfiado e catupiry' },
  { id: 'portuguesa', name: 'Portuguesa', description: 'Molho, mussarela, presunto, ovo, ervilha e cebola' },
  { id: '4queijos', name: 'Quatro Queijos', description: 'Molho, mussarela, provolone, parmesao e gorgonzola' },
  { id: 'marguerita', name: 'Marguerita', description: 'Molho, mussarela, tomate e manjericao fresco' }
];

export const PIZZA_CRUSTS: PizzaCrust[] = [
  { id: 'tradicional', name: 'Tradicional (Sem recheio)', price: 0 },
  { id: 'catupiry', name: 'Recheada com Catupiry', price: 8 },
  { id: 'cheddar', name: 'Recheada com Cheddar', price: 8 },
  { id: 'chocolate', name: 'Recheada com Chocolate', price: 10 }
];

export function configureRestaurantMenuData(restaurant: StoreRestaurant) {
  const bannerFeatureEnabled = restaurant.bannerFeatureEnabled !== false;
  const whatsappDigits = (restaurant.whatsapp || '').replace(/\D/g, '');
  const activeBanners = Array.isArray(restaurant.banners)
    ? restaurant.banners.filter((banner) => banner.active)
    : [];
  const activeCampaigns = Array.isArray(restaurant.marketingCampaigns)
    ? restaurant.marketingCampaigns.filter((campaign) => campaign.active)
    : [];
  const campaignBannerIds = new Set(
    activeCampaigns.flatMap((campaign) => campaign.bannerIds ?? []).filter(Boolean)
  );
  const promotedProductIds = new Set(
    activeBanners
      .filter((banner) => campaignBannerIds.has(banner.id))
      .flatMap((banner) => banner.productIds ?? [])
      .filter(Boolean)
  );

  RESTAURANT_DATA = {
    slug: restaurant.slug,
    name: restaurant.name,
    logoUrl: restaurant.logoUrl || 'https://picsum.photos/200/200?random=1',
    coverUrl: restaurant.coverUrl || 'https://picsum.photos/800/400?random=2',
    whatsappNumber: whatsappDigits || '5511999999999',
    isOpen: restaurant.openForOrders ?? true,
    openingHours: restaurant.openingHours || 'Consulte horarios',
    address: restaurant.address || 'Endereco nao informado',
    city: restaurant.city || 'Cidade',
    state: restaurant.state || 'UF',
    taxId: restaurant.taxId ?? null,
    minOrderValue: restaurant.minOrderValue ?? 0,
    deliveryFee: restaurant.deliveryFee ?? 0,
    coupons: (restaurant.coupons ?? []).map((coupon) => ({
      ...coupon,
      code: coupon.code.trim().toUpperCase()
    }))
  };

  CATEGORIES = (restaurant.categories || []).map((category) => ({
    id: category.id,
    name: category.name
  }));

  PRODUCTS = (restaurant.products || []).map((product) => {
    const rawDescription = product.description || '';
    const isFeaturedByTag = rawDescription.toLowerCase().includes(FEATURED_TAG);
    const isFeaturedByCampaign = promotedProductIds.has(product.id);
    const cleanDescription = rawDescription.replace(FEATURED_TAG, '').trim();

    const pizzaFlavors = Array.isArray(product.pizzaFlavors)
      ? product.pizzaFlavors.map((flavor, index) => ({
          id: `${product.id}-flavor-${index + 1}`,
          name: flavor.name,
          description: flavor.ingredients ?? '',
          price: Number(flavor.price) || 0
        }))
      : [];

    const pizzaCrusts = Array.isArray(product.crusts)
      ? product.crusts.map((crust, index) => ({
          id: `${product.id}-crust-${index + 1}`,
          name: crust.name,
          price: Number(crust.price) || 0
        }))
      : [];

    const complements = Array.isArray(product.complements)
      ? product.complements.map((complement, index) => ({
          id: `${product.id}-complement-${index + 1}`,
          name: complement.name,
          price: Number(complement.price) || 0
        }))
      : [];

    const acaiComplementGroups = Array.isArray(product.acaiComplementGroups)
      ? product.acaiComplementGroups.map((group, groupIndex) => ({
          id: group.id || `${product.id}-acai-group-${groupIndex + 1}`,
          name: group.name,
          minSelect: Number(group.minSelect) || 0,
          maxSelect: Number(group.maxSelect) || 0,
          items: Array.isArray(group.items)
            ? group.items.map((item, itemIndex) => ({
                id: item.id || `${product.id}-acai-item-${groupIndex + 1}-${itemIndex + 1}`,
                name: item.name,
                price: Number(item.price) || 0,
                maxQty: Math.max(1, Number(item.maxQty) || 1)
              }))
            : []
        }))
      : [];

    const isPizza = product.kind === 'pizza';

    return {
      id: product.id,
      categoryId: product.categoryId,
      name: product.name,
      description: cleanDescription,
      price: Number(product.price) || 0,
      imageUrl: product.imageUrl || 'https://picsum.photos/400/300?random=3',
      isFeatured: isFeaturedByTag || isFeaturedByCampaign,
      isInCampaign: isFeaturedByCampaign,
      kind: product.kind ?? 'padrao',
      isPizza,
      pizzaFlavors,
      pizzaCrusts,
      complements,
      acaiComplementGroups
    };
  });

  const prioritizedBanners = [
    ...activeBanners.filter((banner) => campaignBannerIds.has(banner.id)),
    ...activeBanners.filter((banner) => !campaignBannerIds.has(banner.id))
  ];

  OFFERS = !bannerFeatureEnabled
    ? []
    : prioritizedBanners.length
    ? prioritizedBanners.map((banner) => ({
        id: banner.id,
        title: banner.title,
        description: banner.description,
        imageUrl: banner.imageUrl,
        productIds: banner.productIds ?? []
      }))
    : [
        {
          id: "1",
          title: "Frete Gratis",
          description: "Em pedidos acima de R$ 50,00",
          imageUrl:
            "https://images.unsplash.com/photo-1606131731446-5568d87113aa?auto=format&fit=crop&q=80&w=600",
          productIds: []
        },
        {
          id: "2",
          title: "Oferta da Casa",
          description: "Confira os destaques do cardapio",
          imageUrl:
            "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=600",
          productIds: []
        }
      ];
}
