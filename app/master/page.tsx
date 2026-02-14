'use client';

import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  BarChart3,
  Calendar,
  Clock3,
  Copy,
  CreditCard,
  ExternalLink,
  Eye,
  LayoutDashboard,
  List,
  LogOut,
  Mail,
  MessageSquare,
  MapPin,
  Megaphone,
  Menu as MenuIcon,
  Pencil,
  PlayCircle,
  Printer,
  QrCode,
  Search,
  Share2,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
  TicketPercent,
  UtensilsCrossed,
  Users,
  Plus,
  Power,
  Trash2,
  ChevronDown,
  Bike,
  Wallet,
  Save,
  X,
  Paperclip
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  Customer,
  Order,
  OrderStatus,
  Restaurant,
  RestaurantBanner,
  RestaurantCategory,
  RestaurantMarketingCampaign,
  RestaurantProduct,
  SupportMessage,
  SupportTicket
} from '@/lib/store-data';
import { BrandLogo } from '@/components/brand-logo';

type MasterSession = {
  restaurantSlug: string;
  restaurantName: string;
  email: string;
};

type RestaurantForm = Pick<
  Restaurant,
  'name' | 'whatsapp' | 'openingHours' | 'address' | 'city' | 'state' | 'minOrderValue' | 'deliveryFee' | 'openForOrders' | 'logoUrl' | 'coverUrl'
>;

type TabKey =
  | 'dashboard'
  | 'menu'
  | 'highlights'
  | 'clients'
  | 'orders'
  | 'billing'
  | 'promotions'
  | 'banners'
  | 'marketing'
  | 'settings'
  | 'plans'
  | 'support';

type ProductKind = 'padrao' | 'pizza' | 'bebida' | 'acai';

type PizzaItemDraft = {
  name: string;
  ingredients: string;
  price: number;
};

type ProductComplementDraft = {
  name: string;
  price: number;
};

type AcaiComplementItemDraft = {
  id: string;
  name: string;
  price: number;
  maxQty: number;
};

type AcaiComplementGroupDraft = {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  items: AcaiComplementItemDraft[];
};

type MenuProductForm = Omit<Partial<RestaurantProduct>, 'kind' | 'pizzaFlavors' | 'crusts'> & {
  kind: ProductKind;
  featured: boolean;
  alcoholic: boolean;
  pizzaFlavors: PizzaItemDraft[];
  crusts: PizzaItemDraft[];
  complements: ProductComplementDraft[];
  acaiComplementGroups: AcaiComplementGroupDraft[];
  draftFlavorName: string;
  draftFlavorIngredients: string;
  draftFlavorPrice: string;
  hasStuffedCrust: boolean;
  draftCrustName: string;
  draftCrustPrice: string;
  draftComplementName: string;
  draftComplementPrice: string;
  draftAcaiGroupName: string;
  draftAcaiGroupMinSelect: string;
  draftAcaiGroupMaxSelect: string;
};

type CouponDiscountType = 'percent' | 'fixed';

type Coupon = {
  id: string;
  code: string;
  uses: number;
  active: boolean;
  discountType: CouponDiscountType;
  discountValue: number;
  minOrderValue: number;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
};

type CouponForm = {
  code: string;
  discountType: CouponDiscountType;
  discountValue: string;
  minOrderValue: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  active: boolean;
};

type WeeklyHours = {
  id: string;
  label: string;
  enabled: boolean;
  open: string;
  close: string;
};

type SettingsPaymentMethods = {
  money: boolean;
  card: boolean;
  pix: boolean;
};

type AvailablePlan = {
  id: string;
  name: string;
  price: number;
  color: string;
  description: string;
  features: string[];
  active: boolean;
  subscribers: number;
};

type SubscriptionSummary = {
  status: 'trial' | 'active' | 'pending_payment' | 'expired' | 'canceled';
  subscribedPlanId: string | null;
  trialEndsAt: string | null;
  trialDaysLeft: number;
  nextBillingAt: string | null;
  lastCheckoutUrl: string | null;
};

type ManualOrderPaymentMethod = 'money' | 'card' | 'pix';

type ManualOrderItem = {
  productId: string;
  quantity: number;
};

type ManualOrderForm = {
  customerName: string;
  customerWhatsapp: string;
  customerAddress: string;
  paymentMethod: ManualOrderPaymentMethod;
  items: ManualOrderItem[];
};

type BannerForm = {
  title: string;
  description: string;
  imageUrl: string;
  active: boolean;
  productIds: string[];
};

type CampaignForm = {
  name: string;
  couponCode: string;
  couponCodes: string[];
  bannerIds: string[];
  period: string;
  active: boolean;
};

type SupportAttachmentDraft = {
  name: string;
  url: string;
  type?: string;
  size?: number;
};

function createDefaultBannerForm(): BannerForm {
  return {
    title: '',
    description: '',
    imageUrl: '',
    active: true,
    productIds: []
  };
}

function createDefaultCampaignForm(campaign?: RestaurantMarketingCampaign): CampaignForm {
  if (!campaign) {
    return {
      name: '',
      couponCode: '',
      couponCodes: [],
      bannerIds: [],
      period: '',
      active: true
    };
  }
  return {
    name: campaign.name,
    couponCode: campaign.couponCode ?? campaign.couponCodes?.[0] ?? '',
    couponCodes: campaign.couponCodes ?? (campaign.couponCode ? [campaign.couponCode] : []),
    bannerIds: campaign.bannerIds ?? [],
    period: campaign.period ?? '',
    active: campaign.active
  };
}

function applyImageFile(event: ChangeEvent<HTMLInputElement>, onReady: (dataUrl: string) => void) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file || !file.type.startsWith('image/')) return;

  const reader = new FileReader();
  reader.onload = () => {
    const result = reader.result;
    if (typeof result === 'string') {
      onReady(result);
    }
  };
  reader.readAsDataURL(file);
}

const FEATURED_TAG = '[destaque]';

const INITIAL_COUPONS: Coupon[] = [
  {
    id: 'coupon_1',
    code: 'BEMVINDO10',
    uses: 45,
    active: true,
    discountType: 'percent',
    discountValue: 10,
    minOrderValue: 50,
    startDate: '2026-01-09',
    endDate: '2026-03-10',
    startTime: '',
    endTime: ''
  },
  {
    id: 'coupon_2',
    code: 'ENTREGAFREE',
    uses: 12,
    active: true,
    discountType: 'fixed',
    discountValue: 8,
    minOrderValue: 80,
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: ''
  },
  {
    id: 'coupon_3',
    code: 'PIZZA20',
    uses: 89,
    active: false,
    discountType: 'percent',
    discountValue: 20,
    minOrderValue: 100,
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: ''
  }
];

function stripFeaturedTag(description: string) {
  return description.replace(FEATURED_TAG, '').trim();
}

function hasFeaturedTag(description: string) {
  return description.toLowerCase().includes(FEATURED_TAG);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function createDefaultProductForm(categoryId = ''): MenuProductForm {
  return {
    categoryId,
    name: '',
    description: '',
    price: 0,
    imageUrl: '',
    active: true,
    kind: 'padrao',
    featured: false,
    alcoholic: false,
    pizzaFlavors: [],
    crusts: [],
    complements: [],
    acaiComplementGroups: [],
    draftFlavorName: '',
    draftFlavorIngredients: '',
    draftFlavorPrice: '',
    hasStuffedCrust: false,
    draftCrustName: '',
    draftCrustPrice: '',
    draftComplementName: '',
    draftComplementPrice: '',
    draftAcaiGroupName: '',
    draftAcaiGroupMinSelect: '0',
    draftAcaiGroupMaxSelect: '1'
  };
}

function createDefaultCouponForm(coupon?: Coupon): CouponForm {
  if (!coupon) {
    return {
      code: '',
      discountType: 'percent',
      discountValue: '',
      minOrderValue: '0',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      active: true
    };
  }

  return {
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue.toString(),
    minOrderValue: coupon.minOrderValue.toString(),
    startDate: coupon.startDate,
    endDate: coupon.endDate,
    startTime: coupon.startTime,
    endTime: coupon.endTime,
    active: coupon.active
  };
}

function createDefaultManualOrderForm(): ManualOrderForm {
  return {
    customerName: '',
    customerWhatsapp: '',
    customerAddress: '',
    paymentMethod: 'money',
    items: []
  };
}

function getLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function MasterPage() {
  const router = useRouter();
  const [session, setSession] = useState<MasterSession | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [ordersView, setOrdersView] = useState<'board' | 'table'>('board');
  const [ordersQuery, setOrdersQuery] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [showManualOrderModal, setShowManualOrderModal] = useState(false);
  const [manualOrderForm, setManualOrderForm] = useState<ManualOrderForm>(createDefaultManualOrderForm());
  const [manualSelectedProductId, setManualSelectedProductId] = useState('');
  const [manualSelectedQuantity, setManualSelectedQuantity] = useState(1);
  const [creatingManualOrder, setCreatingManualOrder] = useState(false);
  const [clientsQuery, setClientsQuery] = useState('');
  const [highlightsQuery, setHighlightsQuery] = useState('');
  const [billingRange, setBillingRange] = useState<'today' | '7d' | '30d'>('7d');
  const [coupons, setCoupons] = useState<Coupon[]>(INITIAL_COUPONS);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponForm, setCouponForm] = useState<CouponForm>(createDefaultCouponForm());
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [showSupportChat, setShowSupportChat] = useState(false);
  const [supportOpening, setSupportOpening] = useState(false);
  const [supportSending, setSupportSending] = useState(false);
  const [supportError, setSupportError] = useState<string | null>(null);
  const [supportTicket, setSupportTicket] = useState<SupportTicket | null>(null);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [supportDraft, setSupportDraft] = useState('');
  const [supportAttachment, setSupportAttachment] = useState<SupportAttachmentDraft | null>(null);
  const [settingsSection, setSettingsSection] = useState<'store' | 'hours' | 'address' | 'delivery' | 'messages' | 'orderMessages' | 'payments'>('store');
  const [marketingSection, setMarketingSection] = useState<'overview' | 'performance' | 'tools' | 'campaigns'>('overview');
  const [settingsDraft, setSettingsDraft] = useState<RestaurantForm | null>(null);
  const [settingsDeliveryEta, setSettingsDeliveryEta] = useState('45-60 min');
  const [settingsMessageTemplate, setSettingsMessageTemplate] = useState('Ola, gostaria de fazer um pedido pelo catalogo!');
  const [settingsOrderPreparingMessage, setSettingsOrderPreparingMessage] = useState(
    'Ola, {nome}! Seu pedido #{id} ja esta em preparo na cozinha.'
  );
  const [settingsOrderOutForDeliveryMessage, setSettingsOrderOutForDeliveryMessage] = useState(
    'Ola, {nome}! Seu pedido #{id} saiu para entrega.'
  );
  const [settingsPaymentMethods, setSettingsPaymentMethods] = useState<SettingsPaymentMethods>({
    money: true,
    card: true,
    pix: true
  });
  const [settingsPixInstructions, setSettingsPixInstructions] = useState(
    'Chave PIX: 12.345.678/0001-90 (CNPJ). Envie o comprovante no WhatsApp.'
  );
  const [banners, setBanners] = useState<RestaurantBanner[]>([]);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [bannerForm, setBannerForm] = useState<BannerForm>(createDefaultBannerForm());
  const [bannerProductQuery, setBannerProductQuery] = useState('');
  const [marketingCampaigns, setMarketingCampaigns] = useState<RestaurantMarketingCampaign[]>([]);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [campaignForm, setCampaignForm] = useState<CampaignForm>(createDefaultCampaignForm());
  const [settingsHours, setSettingsHours] = useState<WeeklyHours[]>([
    { id: 'mon', label: 'Segunda', enabled: true, open: '18:00', close: '23:00' },
    { id: 'tue', label: 'Terca', enabled: true, open: '18:00', close: '23:00' },
    { id: 'wed', label: 'Quarta', enabled: true, open: '18:00', close: '23:00' },
    { id: 'thu', label: 'Quinta', enabled: true, open: '18:00', close: '23:00' },
    { id: 'fri', label: 'Sexta', enabled: true, open: '18:00', close: '00:00' },
    { id: 'sat', label: 'Sabado', enabled: true, open: '18:00', close: '00:00' },
    { id: 'sun', label: 'Domingo', enabled: true, open: '18:00', close: '23:00' }
  ]);
  const [availablePlans, setAvailablePlans] = useState<AvailablePlan[]>([]);
  const [subscriptionSummary, setSubscriptionSummary] = useState<SubscriptionSummary | null>(null);
  const [plansLoading, setPlansLoading] = useState(false);
  const [planCheckoutLoadingId, setPlanCheckoutLoadingId] = useState<string | null>(null);

  const [newCategory, setNewCategory] = useState('');
  const [productForm, setProductForm] = useState<MenuProductForm>(createDefaultProductForm());
  const [acaiDraftItemByGroup, setAcaiDraftItemByGroup] = useState<
    Record<string, { name: string; price: string; maxQty: string }>
  >({});
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const weekDayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

  const weekSalesData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(today);
      day.setDate(today.getDate() - (6 - index));
      const dayKey = getLocalDateKey(day);

      const totalDaySales = orders.reduce((sum, order) => {
        const createdAt = new Date(order.createdAt);
        if (Number.isNaN(createdAt.getTime())) return sum;
        return getLocalDateKey(createdAt) === dayKey ? sum + (Number(order.total) || 0) : sum;
      }, 0);

      return {
        name: weekDayLabels[day.getDay()],
        vendas: Number(totalDaySales.toFixed(2))
      };
    });
  }, [orders]);

  const restaurantForm = useMemo<RestaurantForm | null>(() => {
    if (!restaurant) return null;
    return {
      name: restaurant.name,
      whatsapp: restaurant.whatsapp,
      openingHours: restaurant.openingHours,
      address: restaurant.address,
      city: restaurant.city,
      state: restaurant.state,
      minOrderValue: restaurant.minOrderValue,
      deliveryFee: restaurant.deliveryFee,
      openForOrders: restaurant.openForOrders ?? true,
      logoUrl: restaurant.logoUrl,
      coverUrl: restaurant.coverUrl
    };
  }, [restaurant]);

  useEffect(() => {
    if (!restaurantForm) return;
    setSettingsDraft(restaurantForm);
  }, [restaurantForm]);

  useEffect(() => {
    if (!session) return;
    const key = `pedezap_message_template_${session.restaurantSlug}`;
    const saved = localStorage.getItem(key);
    if (saved) setSettingsMessageTemplate(saved);
    const preparingMessageRaw = localStorage.getItem(`pedezap_order_msg_preparing_${session.restaurantSlug}`);
    const outForDeliveryMessageRaw = localStorage.getItem(`pedezap_order_msg_out_for_delivery_${session.restaurantSlug}`);
    const paymentMethodsRaw = localStorage.getItem(`pedezap_payment_methods_${session.restaurantSlug}`);
    const pixInstructionsRaw = localStorage.getItem(`pedezap_pix_instructions_${session.restaurantSlug}`);
    if (paymentMethodsRaw) {
      try {
        setSettingsPaymentMethods(JSON.parse(paymentMethodsRaw) as SettingsPaymentMethods);
      } catch {}
    }
    if (preparingMessageRaw) setSettingsOrderPreparingMessage(preparingMessageRaw);
    if (outForDeliveryMessageRaw) setSettingsOrderOutForDeliveryMessage(outForDeliveryMessageRaw);
    if (pixInstructionsRaw) setSettingsPixInstructions(pixInstructionsRaw);
  }, [session]);

  useEffect(() => {
    const bootstrap = async () => {
      const raw = localStorage.getItem('pedezap_master_session');
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as MasterSession;
          if (parsed?.restaurantSlug && parsed?.email) {
            setSession(parsed);
            return;
          }
        } catch {}
      }

      const response = await fetch('/api/master/session');
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success || !payload?.user?.restaurantSlug || !payload?.user?.email) {
        localStorage.removeItem('pedezap_master_session');
        router.replace('/master/login');
        return;
      }

      const restoredSession: MasterSession = {
        restaurantSlug: payload.user.restaurantSlug,
        restaurantName: payload.user.restaurantName ?? 'Painel',
        email: payload.user.email
      };
      localStorage.setItem('pedezap_master_session', JSON.stringify(restoredSession));
      setSession(restoredSession);
    };

    bootstrap().finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (!session) return;
    setLoadError(null);
    setLoading(true);
    const createTimedFetch = async (url: string) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      try {
        const response = await fetch(url, { signal: controller.signal });
        return await response.json();
      } finally {
        clearTimeout(timer);
      }
    };

    Promise.all([
      createTimedFetch(`/api/master/restaurant/${session.restaurantSlug}`),
      createTimedFetch(`/api/orders?slug=${session.restaurantSlug}`),
      createTimedFetch(`/api/master/customers/${session.restaurantSlug}`),
      createTimedFetch(`/api/master/plans/${session.restaurantSlug}`)
    ])
      .then(([restaurantPayload, ordersPayload, customersPayload, plansPayload]) => {
        if (restaurantPayload?.restaurant) {
          setRestaurant(restaurantPayload.restaurant);
        } else {
          setRestaurant(null);
          setLoadError(restaurantPayload?.message ?? 'Restaurante nao encontrado para esta sessao.');
        }
        if (ordersPayload?.orders) setOrders(ordersPayload.orders);
        if (customersPayload?.customers) setCustomers(customersPayload.customers);
        if (plansPayload?.plans) setAvailablePlans(plansPayload.plans);
        if (plansPayload?.subscription) setSubscriptionSummary(plansPayload.subscription);
      })
      .catch(() => {
        setRestaurant(null);
        setLoadError('Nao foi possivel carregar os dados do painel.');
      })
      .finally(() => setLoading(false));
  }, [session]);

  const loadSubscriptionPlans = async (silent = false) => {
    if (!session) return;
    if (!silent) setPlansLoading(true);
    const response = await fetch(`/api/master/plans/${session.restaurantSlug}`);
    const payload = await response.json().catch(() => null);
    if (payload?.plans) setAvailablePlans(payload.plans);
    if (payload?.subscription) setSubscriptionSummary(payload.subscription);
    if (!silent) setPlansLoading(false);
  };

  useEffect(() => {
    if (activeTab !== 'plans') return;
    loadSubscriptionPlans();
  }, [activeTab]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const checkoutStatus = params.get('checkout');
    const externalId = params.get('externalId');
    if (!session || checkoutStatus !== 'success') return;
    fetch(`/api/master/plans/${session.restaurantSlug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ externalId: externalId || undefined })
    })
      .then((response) => response.json().catch(() => null))
      .then((payload) => {
        if (payload?.success) {
          setMessage('Pagamento confirmado e assinatura ativada.');
          loadSubscriptionPlans(true);
        }
      })
      .finally(() => {
        router.replace('/master');
      });
  }, [session, router]);

  useEffect(() => {
    if (!session || subscriptionSummary?.status !== 'pending_payment') return;
    const interval = setInterval(() => {
      loadSubscriptionPlans(true);
    }, 7000);
    return () => clearInterval(interval);
  }, [session, subscriptionSummary?.status]);

  useEffect(() => {
    if (!restaurant || selectedCategoryId) return;
    setSelectedCategoryId(restaurant.categories[0]?.id ?? null);
  }, [restaurant, selectedCategoryId]);

  useEffect(() => {
    setBanners(restaurant?.banners ?? []);
  }, [restaurant?.banners]);

  useEffect(() => {
    setMarketingCampaigns(restaurant?.marketingCampaigns ?? []);
  }, [restaurant?.marketingCampaigns]);

  async function saveRestaurant(data: RestaurantForm) {
    if (!session) return;
    setSaving(true);
    const response = await fetch(`/api/master/restaurant/${session.restaurantSlug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const payload = await response.json();
    if (payload?.restaurant) {
      setRestaurant(payload.restaurant);
      setMessage('Dados do restaurante atualizados.');
    }
    setSaving(false);
  }

  async function handleStartPlanCheckout(planId: string) {
    if (!session) return;
    setPlanCheckoutLoadingId(planId);
    const response = await fetch(`/api/master/plans/${session.restaurantSlug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId })
    });
    const payload = await response.json().catch(() => null);
    setPlanCheckoutLoadingId(null);
    if (!response.ok || !payload?.success) {
      alert(payload?.message ?? 'Nao foi possivel iniciar a contratacao.');
      return;
    }
    if (payload?.checkoutUrl) {
      window.open(payload.checkoutUrl, '_blank');
    } else {
      alert('Cobranca criada, mas sem URL de checkout retornada pela API.');
    }
    await loadSubscriptionPlans();
  }

  async function saveCategory(category: Partial<RestaurantCategory>) {
    if (!session) return;
    const response = await fetch(`/api/master/restaurant/${session.restaurantSlug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'saveCategory', data: category })
    });
    const payload = await response.json();
    if (payload?.categories && restaurant) {
      setRestaurant({ ...restaurant, categories: payload.categories });
      setNewCategory('');
      setEditingCategoryId(null);
      setShowCategoryForm(false);
    }
  }

  async function deleteCategory(categoryId: string) {
    if (!session) return;
    const response = await fetch(`/api/master/restaurant/${session.restaurantSlug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deleteCategory', categoryId })
    });
    const payload = await response.json();
    if (payload?.categories && payload?.products && restaurant) {
      setRestaurant({
        ...restaurant,
        categories: payload.categories,
        products: payload.products
      });
    }
  }

  const editCategory = (category: RestaurantCategory) => {
    setEditingCategoryId(category.id);
    setNewCategory(category.name);
    setShowCategoryForm(true);
  };

  async function saveProduct() {
    const isPizzaProduct = productForm.kind === 'pizza';
    const hasPizzaFlavors = productForm.pizzaFlavors.length > 0;
    const parsedFormPrice = Number(productForm.price) || 0;
    const basePriceForSave = isPizzaProduct
      ? (hasPizzaFlavors
          ? Math.min(...productForm.pizzaFlavors.map((flavor) => Number(flavor.price) || 0))
          : 0)
      : parsedFormPrice;

    if (!session || !productForm.name || !productForm.categoryId || !productForm.description) return;
    if (isPizzaProduct && !hasPizzaFlavors) return;
    if (!isPizzaProduct && basePriceForSave <= 0) return;

    const cleanDescription = stripFeaturedTag(productForm.description);
    const normalizedDescription = productForm.featured
      ? `${FEATURED_TAG} ${cleanDescription}`.trim()
      : cleanDescription;
    const response = await fetch(`/api/master/restaurant/${session.restaurantSlug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'saveProduct',
        data: {
          ...productForm,
          description: normalizedDescription,
          price: basePriceForSave,
          active: productForm.active ?? true,
          kind: productForm.kind,
          pizzaFlavors:
            productForm.kind === 'pizza'
              ? productForm.pizzaFlavors.map((flavor) => ({
                  name: flavor.name,
                  ingredients: flavor.ingredients,
                  price: Number(flavor.price) || 0
                }))
              : undefined,
          crusts:
            productForm.kind === 'pizza' && productForm.hasStuffedCrust
              ? productForm.crusts.map((crust) => ({
                  name: crust.name,
                  ingredients: crust.ingredients ?? '',
                  price: Number(crust.price) || 0
                }))
              : [],
          complements: productForm.complements.map((complement) => ({
            name: complement.name,
            price: Number(complement.price) || 0
          })),
          acaiComplementGroups:
            productForm.kind === 'acai'
              ? productForm.acaiComplementGroups.map((group) => ({
                  id: group.id,
                  name: group.name,
                  minSelect: Number(group.minSelect) || 0,
                  maxSelect: Number(group.maxSelect) || 0,
                  items: group.items.map((item) => ({
                    id: item.id,
                    name: item.name,
                    price: Number(item.price) || 0,
                    maxQty: Number(item.maxQty) || 1
                  }))
                }))
              : []
        }
      })
    });
    const payload = await response.json();
    if (payload?.products && restaurant) {
      setRestaurant({ ...restaurant, products: payload.products });
      setProductForm(createDefaultProductForm(selectedCategoryId ?? ''));
      setShowProductForm(false);
    }
  }

  async function deleteProduct(productId: string) {
    if (!session) return;
    const response = await fetch(`/api/master/restaurant/${session.restaurantSlug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deleteProduct', productId })
    });
    const payload = await response.json();
    if (payload?.products && restaurant) {
      setRestaurant({ ...restaurant, products: payload.products });
    }
  }

  const editProduct = (product: RestaurantProduct) => {
    const pizzaFlavors = Array.isArray(product.pizzaFlavors)
      ? product.pizzaFlavors.map((flavor) => ({
          name: flavor.name,
          ingredients: flavor.ingredients ?? '',
          price: Number(flavor.price) || 0
        }))
      : [];
    const crusts = Array.isArray(product.crusts)
      ? product.crusts.map((crust) => ({
          name: crust.name,
          ingredients: crust.ingredients ?? '',
          price: Number(crust.price) || 0
        }))
      : [];
    const complements = Array.isArray(product.complements)
      ? product.complements.map((complement) => ({
          name: complement.name,
          price: Number(complement.price) || 0
        }))
      : [];
    const acaiComplementGroups = Array.isArray(product.acaiComplementGroups)
      ? product.acaiComplementGroups.map((group) => ({
          id: group.id,
          name: group.name,
          minSelect: Number(group.minSelect) || 0,
          maxSelect: Number(group.maxSelect) || 0,
          items: (group.items ?? []).map((item) => ({
            id: item.id,
            name: item.name,
            price: Number(item.price) || 0,
            maxQty: Number(item.maxQty) || 1
          }))
        }))
      : [];

    setProductForm({
      ...createDefaultProductForm(product.categoryId),
      ...product,
      kind: product.kind ?? 'padrao',
      featured: hasFeaturedTag(product.description),
      description: stripFeaturedTag(product.description),
      pizzaFlavors,
      crusts,
      complements,
      acaiComplementGroups,
      hasStuffedCrust: crusts.length > 0
    });
    setShowProductForm(true);
  };

  const duplicateProduct = async (product: RestaurantProduct) => {
    if (!session) return;
    const response = await fetch(`/api/master/restaurant/${session.restaurantSlug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'saveProduct',
        data: {
          categoryId: product.categoryId,
          name: `${product.name} (Copia)`,
          description: product.description,
          price: product.price,
          active: product.active,
          imageUrl: product.imageUrl ?? '',
          kind: product.kind ?? 'padrao',
          pizzaFlavors: product.pizzaFlavors ?? [],
          crusts: product.crusts ?? [],
          complements: product.complements ?? [],
          acaiComplementGroups: product.acaiComplementGroups ?? []
        }
      })
    });
    const payload = await response.json();
    if (payload?.products && restaurant) {
      setRestaurant({ ...restaurant, products: payload.products });
    }
  };

  const setProductFeatured = async (product: RestaurantProduct, featured: boolean) => {
    if (!session || !restaurant) return;
    const cleanDescription = stripFeaturedTag(product.description);
    const nextDescription = featured ? `${FEATURED_TAG} ${cleanDescription}`.trim() : cleanDescription;

    const response = await fetch(`/api/master/restaurant/${session.restaurantSlug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'saveProduct',
        data: {
          id: product.id,
          categoryId: product.categoryId,
          name: product.name,
          description: nextDescription,
          price: product.price,
          active: product.active,
          imageUrl: product.imageUrl ?? '',
          kind: product.kind ?? 'padrao',
          pizzaFlavors: product.pizzaFlavors ?? [],
          crusts: product.crusts ?? [],
          complements: product.complements ?? [],
          acaiComplementGroups: product.acaiComplementGroups ?? []
        }
      })
    });
    const payload = await response.json();
    if (payload?.products) {
      setRestaurant({ ...restaurant, products: payload.products });
    }
  };

  const copyLink = () => {
    if (!restaurant) return;
    const link = `pedezap.site/${restaurant.slug}`;
    navigator.clipboard.writeText(link);
    alert('Link copiado!');
  };

  const selectedCategory = restaurant?.categories.find((cat) => cat.id === selectedCategoryId) ?? null;
  const availableProductCategories = useMemo(() => {
    if (!restaurant) return [] as RestaurantCategory[];
    const activeCategories = restaurant.categories.filter((category) => category.active);
    if (!productForm.categoryId) return activeCategories;
    const selected = restaurant.categories.find((category) => category.id === productForm.categoryId);
    if (!selected || selected.active || activeCategories.some((category) => category.id === selected.id)) {
      return activeCategories;
    }
    return [...activeCategories, selected];
  }, [restaurant, productForm.categoryId]);
  const filteredProducts = restaurant
    ? restaurant.products.filter((product) => product.categoryId === (selectedCategoryId ?? product.categoryId))
    : [];
  const highlightedProducts = restaurant ? restaurant.products.filter((product) => hasFeaturedTag(product.description)) : [];
  const highlightSearch = highlightsQuery.trim().toLowerCase();
  const availableHighlights = restaurant
    ? restaurant.products.filter(
        (product) =>
          !hasFeaturedTag(product.description) &&
          (!highlightSearch ||
            product.name.toLowerCase().includes(highlightSearch) ||
            stripFeaturedTag(product.description).toLowerCase().includes(highlightSearch))
      )
    : [];
  const pageTitle = {
    dashboard: 'Visao Geral',
    menu: 'Gestao de Cardapio',
    highlights: 'Destaques',
    clients: 'Clientes',
    orders: 'Pedidos',
    billing: 'Financeiro',
    promotions: 'Promocoes',
    banners: 'Banners',
    marketing: 'Marketing',
    settings: 'Configuracoes',
    plans: 'Meu Plano',
    support: 'Central de Ajuda'
  }[activeTab];
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Pedidos', icon: ShoppingBag },
    { id: 'menu', label: 'Cardapio', icon: UtensilsCrossed },
    { id: 'highlights', label: 'Destaques', icon: Star },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'billing', label: 'Faturamento', icon: CreditCard },
    { id: 'promotions', label: 'Promocoes', icon: List },
    { id: 'banners', label: 'Banners', icon: LayoutDashboard },
    { id: 'marketing', label: 'Marketing', icon: MessageSquare },
    { id: 'settings', label: 'Configuracoes', icon: Settings },
    { id: 'plans', label: 'Plano', icon: CreditCard },
    { id: 'support', label: 'Suporte', icon: AlertCircle }
  ] as const;
  const moneyFormatter = useMemo(
    () => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }),
    []
  );
  const currentSubscribedPlan = useMemo(
    () => availablePlans.find((item) => item.id === subscriptionSummary?.subscribedPlanId) ?? null,
    [availablePlans, subscriptionSummary?.subscribedPlanId]
  );
  const subscriptionStatusLabel = {
    trial: 'Periodo Gratis',
    active: 'Ativo',
    pending_payment: 'Aguardando Pagamento',
    expired: 'Expirado',
    canceled: 'Cancelado'
  }[subscriptionSummary?.status ?? 'expired'];
  const subscriptionStatusTone = {
    trial: 'bg-slate-100 text-slate-800',
    active: 'bg-slate-100 text-slate-900',
    pending_payment: 'bg-slate-100 text-slate-800',
    expired: 'bg-red-100 text-red-700',
    canceled: 'bg-slate-200 text-slate-700'
  }[subscriptionSummary?.status ?? 'expired'];
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const ordersThisMonth = orders.filter((order) => new Date(order.createdAt) >= monthStart);
  const totalSalesThisMonth = ordersThisMonth.reduce((sum, order) => sum + order.total, 0);
  const totalSoldItemsThisMonth = ordersThisMonth.reduce(
    (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  );
  const estimatedMonthlyViews = Math.max(180, ordersThisMonth.length * 18 + totalSoldItemsThisMonth * 2);
  const conversionRate = estimatedMonthlyViews
    ? (ordersThisMonth.length / estimatedMonthlyViews) * 100
    : 0;
  const linkDirectPercent = 65;
  const instagramPercent = 25;
  const othersPercent = 10;
  const funnelBars = [
    { label: 'Visualizacoes', value: estimatedMonthlyViews, color: 'bg-slate-700' },
    { label: 'Acoes no Carrinho', value: Math.max(0, Math.round(estimatedMonthlyViews * 0.35)), color: 'bg-violet-500' },
    { label: 'Pedidos', value: ordersThisMonth.length, color: 'bg-slate-1000' }
  ];
  const productSalesMap = new Map<string, { quantity: number; revenue: number }>();
  ordersThisMonth.forEach((order) => {
    order.items.forEach((item) => {
      const current = productSalesMap.get(item.productId) ?? { quantity: 0, revenue: 0 };
      productSalesMap.set(item.productId, {
        quantity: current.quantity + item.quantity,
        revenue: current.revenue + item.quantity * item.price
      });
    });
  });
  const topProducts = (restaurant?.products ?? [])
    .map((product) => {
      const sales = productSalesMap.get(product.id) ?? { quantity: 0, revenue: 0 };
      return {
        ...product,
        soldQuantity: sales.quantity,
        revenue: sales.revenue
      };
    })
    .sort((a, b) => {
      if (b.soldQuantity !== a.soldQuantity) return b.soldQuantity - a.soldQuantity;
      return b.revenue - a.revenue;
    });
  const leastSoldProducts = [...topProducts].sort((a, b) => a.soldQuantity - b.soldQuantity).slice(0, 4);
  const marketingLink = restaurant ? `https://pedezap.site/${restaurant.slug}` : '';
  const marketingActiveBanners = useMemo(
    () => banners.filter((item) => item.active).slice(0, 4),
    [banners]
  );
  const marketingTopProductsForFlyer = useMemo(() => {
    const withSales = topProducts.filter((item) => item.soldQuantity > 0).slice(0, 6);
    if (withSales.length > 0) return withSales;
    return topProducts.slice(0, 6);
  }, [topProducts]);

  const getOrderAgeMinutes = (createdAt: string) => {
    const diffMs = Date.now() - new Date(createdAt).getTime();
    return Math.max(1, Math.round(diffMs / 60000));
  };

  const getOrderStatus = (order: Order): OrderStatus => {
    return order.status ?? 'Recebido';
  };

  const paymentMethodLabel = (method: Order['paymentMethod']) => {
    if (method === 'pix') return 'PIX';
    if (method === 'card') return 'Cartao';
    return 'Dinheiro';
  };

  const openMarketingPrintWindow = (content: string, title: string) => {
    if (typeof window === 'undefined') return;
    const win = window.open('', '_blank', 'width=1024,height=768');
    if (!win) {
      alert('Nao foi possivel abrir a janela. Verifique o bloqueador de pop-up.');
      return;
    }

    win.document.open();
    win.document.write(`<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, sans-serif; background: #f4f6f8; color: #0f172a; }
    .toolbar { position: sticky; top: 0; z-index: 30; background: #ffffff; border-bottom: 1px solid #e2e8f0; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; }
    .toolbar h1 { margin: 0; font-size: 16px; }
    .toolbar .actions { display: flex; gap: 8px; }
    .btn { border: 1px solid #cbd5e1; border-radius: 8px; background: #fff; color: #334155; padding: 8px 12px; font-size: 13px; cursor: pointer; }
    .btn-primary { border-color: #059669; background: #059669; color: #fff; }
    .page { max-width: 980px; margin: 20px auto; padding: 0 16px 24px; }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; }
    .hero { background: linear-gradient(135deg, #047857, #10b981); color: #fff; padding: 22px; }
    .hero h2 { margin: 0 0 4px; font-size: 28px; }
    .hero p { margin: 0; opacity: 0.95; }
    .grid { display: grid; gap: 14px; }
    .grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .banner { border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; }
    .banner img { width: 100%; height: 150px; object-fit: cover; display: block; }
    .banner .meta { padding: 10px; }
    .banner .meta h4 { margin: 0 0 4px; font-size: 15px; }
    .banner .meta p { margin: 0; color: #475569; font-size: 13px; }
    .section { padding: 18px; }
    .section h3 { margin: 0 0 10px; font-size: 18px; }
    .products { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
    .product { border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; display: flex; gap: 10px; align-items: center; }
    .product img { width: 54px; height: 54px; border-radius: 8px; object-fit: cover; }
    .product .name { margin: 0; font-weight: 700; font-size: 14px; }
    .product .price { margin: 2px 0 0; color: #047857; font-weight: 700; font-size: 14px; }
    .footer { padding: 14px 18px; border-top: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; gap: 14px; }
    .qrcode { width: 110px; height: 110px; border: 1px solid #e2e8f0; border-radius: 10px; padding: 6px; background: #fff; }
    .muted { color: #64748b; font-size: 12px; }
    @media print {
      body { background: #fff; }
      .toolbar { display: none; }
      .page { margin: 0; max-width: 100%; padding: 0; }
      .card { border: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <h1>${escapeHtml(title)}</h1>
    <div class="actions">
      <button class="btn" onclick="window.close()">Fechar</button>
      <button class="btn btn-primary" onclick="window.print()">Imprimir / Salvar PDF</button>
    </div>
  </div>
  ${content}
</body>
</html>`);
    win.document.close();
    win.focus();
  };

  const openFlyerOffers = () => {
    if (!restaurant) return;
    const bannerCards = (marketingActiveBanners.length > 0
      ? marketingActiveBanners
      : [
          {
            id: 'fallback-banner',
            title: 'Promocao Especial',
            description: 'Confira nossos melhores produtos com ofertas do dia.',
            imageUrl: restaurant.coverUrl || 'https://picsum.photos/seed/pedezap-flyer/1200/600',
            active: true,
            productIds: []
          }
        ]
    )
      .map(
        (banner) => `
        <article class="banner">
          <img src="${escapeHtml(banner.imageUrl)}" alt="${escapeHtml(banner.title)}" />
          <div class="meta">
            <h4>${escapeHtml(banner.title)}</h4>
            <p>${escapeHtml(banner.description || 'Oferta especial por tempo limitado')}</p>
          </div>
        </article>
      `
      )
      .join('');

    const productCards = marketingTopProductsForFlyer
      .map(
        (product) => `
        <article class="product">
          <img src="${escapeHtml(product.imageUrl || 'https://picsum.photos/seed/pedezap-produto/240/240')}" alt="${escapeHtml(product.name)}" />
          <div>
            <p class="name">${escapeHtml(product.name)}</p>
            <p class="price">${moneyFormatter.format(product.price)}</p>
          </div>
        </article>
      `
      )
      .join('');

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(marketingLink)}`;
    const content = `
      <main class="page">
        <section class="card">
          <header class="hero">
            <h2>${escapeHtml(restaurant.name)}</h2>
            <p>Flyer automatico com banners e produtos para divulgacao.</p>
          </header>
          <div class="section">
            <h3>Destaques Promocionais</h3>
            <div class="grid grid-2">${bannerCards}</div>
          </div>
          <div class="section">
            <h3>Produtos em Evidencia</h3>
            <div class="products">${productCards || '<p class="muted">Nenhum produto disponivel no momento.</p>'}</div>
          </div>
          <footer class="footer">
            <div>
              <p style="margin:0 0 4px;font-weight:700;">Peca agora</p>
              <p style="margin:0;font-size:13px;">${escapeHtml(marketingLink)}</p>
              <p class="muted" style="margin:6px 0 0;">WhatsApp: ${escapeHtml(restaurant.whatsapp)}</p>
            </div>
            <img class="qrcode" src="${qrUrl}" alt="QR Code do cardapio" />
          </footer>
        </section>
      </main>
    `;
    openMarketingPrintWindow(content, `Flyer de Ofertas - ${restaurant.name}`);
  };

  const openDigitalBusinessCard = () => {
    if (!restaurant) return;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(marketingLink)}`;
    const logo = settingsDraft?.logoUrl || restaurant.logoUrl;
    const content = `
      <main class="page" style="max-width:760px;">
        <section class="card">
          <header class="hero" style="display:flex;align-items:center;gap:14px;">
            ${
              logo
                ? `<img src="${escapeHtml(logo)}" alt="Logo ${escapeHtml(restaurant.name)}" style="width:68px;height:68px;border-radius:999px;object-fit:cover;border:2px solid rgba(255,255,255,.45);" />`
                : `<div style="width:68px;height:68px;border-radius:999px;background:#065f46;color:#fff;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;">${escapeHtml(restaurant.name.charAt(0).toUpperCase())}</div>`
            }
            <div>
              <h2 style="margin:0 0 4px;font-size:30px;">${escapeHtml(restaurant.name)}</h2>
              <p style="margin:0;">Cartao digital para compartilhamento rapido.</p>
            </div>
          </header>
          <div class="section" style="display:grid;grid-template-columns:1.1fr .9fr;gap:16px;align-items:center;">
            <div>
              <p style="margin:0 0 10px;font-size:15px;"><strong>Link do cardapio:</strong><br/>${escapeHtml(marketingLink)}</p>
              <p style="margin:0 0 10px;font-size:15px;"><strong>WhatsApp:</strong><br/>${escapeHtml(restaurant.whatsapp)}</p>
              <p style="margin:0;font-size:15px;"><strong>Endereco:</strong><br/>${escapeHtml(restaurant.address)} - ${escapeHtml(restaurant.city)}/${escapeHtml(restaurant.state)}</p>
            </div>
            <div style="text-align:center;">
              <img class="qrcode" style="width:180px;height:180px;" src="${qrUrl}" alt="QR Code do cardapio" />
              <p class="muted" style="margin-top:8px;">Escaneie para abrir o cardapio</p>
            </div>
          </div>
        </section>
      </main>
    `;
    openMarketingPrintWindow(content, `Cartao Digital - ${restaurant.name}`);
  };

  const normalizeWhatsapp = (value: string) => value.replace(/\D/g, '');

  const buildOrderTemplateMessage = (template: string, order: Order) => {
    const items = order.items.map((item) => `${item.quantity}x ${item.name}`).join(', ');
    const notes = order.items
      .map((item) => item.notes?.trim())
      .filter(Boolean)
      .join(' | ');
    const replacements: Record<string, string> = {
      '{id}': order.id,
      '{nome}': order.customerName,
      '{itens}': items || 'Itens do pedido',
      '{total}': moneyFormatter.format(order.total),
      '{pagamento}': paymentMethodLabel(order.paymentMethod),
      '{endereco}': order.customerAddress,
      '{obs}': notes || '-'
    };

    return Object.entries(replacements).reduce((text, [key, value]) => {
      return text.replace(new RegExp(key.replace('{', '\\{').replace('}', '\\}'), 'g'), value);
    }, template);
  };

  const openCustomerStatusMessage = (order: Order, nextStatus: 'Em preparo' | 'Concluido') => {
    const phone = normalizeWhatsapp(order.customerWhatsapp);
    if (!phone) return;

    const text =
      nextStatus === 'Em preparo'
        ? buildOrderTemplateMessage(settingsOrderPreparingMessage, order)
        : buildOrderTemplateMessage(settingsOrderOutForDeliveryMessage, order);

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const manualOrderProducts = useMemo(
    () => (restaurant?.products ?? []).filter((product) => product.active),
    [restaurant?.products]
  );

  const manualOrderTotal = useMemo(
    () =>
      manualOrderForm.items.reduce((sum, item) => {
        const product = manualOrderProducts.find((entry) => entry.id === item.productId);
        if (!product) return sum;
        return sum + product.price * item.quantity;
      }, 0),
    [manualOrderForm.items, manualOrderProducts]
  );

  const addItemToManualOrder = () => {
    if (!manualSelectedProductId) return;
    const quantity = Math.max(1, manualSelectedQuantity);
    setManualOrderForm((prev) => {
      const existingIndex = prev.items.findIndex((item) => item.productId === manualSelectedProductId);
      if (existingIndex >= 0) {
        const nextItems = [...prev.items];
        nextItems[existingIndex] = {
          ...nextItems[existingIndex],
          quantity: nextItems[existingIndex].quantity + quantity
        };
        return { ...prev, items: nextItems };
      }
      return {
        ...prev,
        items: [...prev.items, { productId: manualSelectedProductId, quantity }]
      };
    });
  };

  const removeItemFromManualOrder = (productId: string) => {
    setManualOrderForm((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.productId !== productId)
    }));
  };

  const createManualOrder = async () => {
    if (!session || !restaurant) return;
    if (!manualOrderForm.customerName.trim() || !manualOrderForm.customerWhatsapp.trim() || !manualOrderForm.customerAddress.trim()) {
      alert('Preencha os dados do cliente.');
      return;
    }
    if (!manualOrderForm.items.length) {
      alert('Adicione pelo menos um item no pedido.');
      return;
    }

    const itemsPayload = manualOrderForm.items
      .map((item) => {
        const product = manualOrderProducts.find((entry) => entry.id === item.productId);
        if (!product) return null;
        return {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: item.quantity
        };
      })
      .filter(Boolean) as Array<{ productId: string; name: string; price: number; quantity: number }>;

    if (!itemsPayload.length) {
      alert('Nao foi possivel montar os itens do pedido.');
      return;
    }

    setCreatingManualOrder(true);
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantSlug: session.restaurantSlug,
        customerName: manualOrderForm.customerName.trim(),
        customerWhatsapp: manualOrderForm.customerWhatsapp.trim(),
        customerAddress: manualOrderForm.customerAddress.trim(),
        paymentMethod: manualOrderForm.paymentMethod,
        items: itemsPayload
      })
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      alert(payload?.message ?? 'Nao foi possivel criar o pedido manual.');
      setCreatingManualOrder(false);
      return;
    }

    if (payload?.order) {
      setOrders((prev) => [payload.order, ...prev]);
    }
    setShowManualOrderModal(false);
    setManualOrderForm(createDefaultManualOrderForm());
    setManualSelectedProductId('');
    setManualSelectedQuantity(1);
    setCreatingManualOrder(false);
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    if (!session) return;
    setUpdatingOrderId(orderId);
    const currentOrder = orders.find((order) => order.id === orderId) ?? null;
    const response = await fetch(`/api/master/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantSlug: session.restaurantSlug,
        status
      })
    });
    const payload = await response.json().catch(() => null);
    if (response.ok && payload?.order) {
      setOrders((prev) => prev.map((order) => (order.id === orderId ? payload.order : order)));
      if (currentOrder && (status === 'Em preparo' || status === 'Concluido')) {
        const shouldSend = window.confirm(
          status === 'Em preparo'
            ? 'Enviar mensagem para o cliente informando que o pedido esta em preparo?'
            : 'Enviar mensagem para o cliente informando que o pedido saiu para entrega?'
        );
        if (shouldSend) {
          openCustomerStatusMessage(payload.order, status);
        }
      }
    }
    setUpdatingOrderId(null);
  };

  const printOrderTicket = (order: Order) => {
    const itemsHtml = order.items
      .map((item) => {
        const totalItem = item.price * item.quantity;
        const notes = item.notes ? `<div class="item-notes">Obs: ${escapeHtml(item.notes)}</div>` : '';
        return `
          <div class="item-row">
            <div class="item-main">
              <span>${item.quantity}x ${escapeHtml(item.name)}</span>
              <span>R$ ${totalItem.toFixed(2)}</span>
            </div>
            ${notes}
          </div>
        `;
      })
      .join('');

    const paymentLabel =
      order.paymentMethod === 'pix' ? 'PIX' : order.paymentMethod === 'card' ? 'Cartao' : 'Dinheiro';
    const restaurantName = restaurant?.name ?? 'PedeZap';
    const createdAtLabel = new Date(order.createdAt).toLocaleString('pt-BR');

    const printWindow = window.open('', '_blank', 'width=420,height=760');
    if (!printWindow) return;

    printWindow.document.write(`
      <!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>Comanda #${escapeHtml(order.id)}</title>
          <style>
            body {
              margin: 0;
              font-family: Arial, sans-serif;
              color: #111827;
              padding: 18px;
              font-size: 13px;
            }
            .header {
              text-align: center;
              border-bottom: 1px dashed #9ca3af;
              padding-bottom: 10px;
              margin-bottom: 12px;
            }
            .title {
              font-size: 18px;
              font-weight: 700;
              margin: 0;
            }
            .muted {
              color: #6b7280;
              font-size: 12px;
              margin-top: 4px;
            }
            .section {
              margin-top: 10px;
            }
            .line {
              display: flex;
              justify-content: space-between;
              gap: 8px;
              margin: 4px 0;
            }
            .item-row {
              margin: 8px 0;
              border-bottom: 1px dashed #e5e7eb;
              padding-bottom: 6px;
            }
            .item-main {
              display: flex;
              justify-content: space-between;
              gap: 8px;
              font-weight: 600;
            }
            .item-notes {
              margin-top: 4px;
              font-size: 12px;
              color: #4b5563;
            }
            .totals {
              margin-top: 12px;
              border-top: 1px dashed #9ca3af;
              padding-top: 8px;
            }
            .grand-total {
              font-size: 15px;
              font-weight: 700;
            }
            .footer {
              margin-top: 14px;
              text-align: center;
              color: #6b7280;
              font-size: 11px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <p class="title">${escapeHtml(restaurantName)}</p>
            <div class="muted">Comanda de Pedido</div>
            <div class="muted">#${escapeHtml(order.id)} - ${escapeHtml(createdAtLabel)}</div>
          </div>

          <div class="section">
            <div class="line"><span><strong>Cliente</strong></span><span>${escapeHtml(order.customerName)}</span></div>
            <div class="line"><span><strong>WhatsApp</strong></span><span>${escapeHtml(order.customerWhatsapp)}</span></div>
            <div class="line"><span><strong>Endereco</strong></span><span>${escapeHtml(order.customerAddress)}</span></div>
            <div class="line"><span><strong>Pagamento</strong></span><span>${paymentLabel}</span></div>
          </div>

          <div class="section">
            <strong>Itens</strong>
            ${itemsHtml}
          </div>

          <div class="totals">
            <div class="line"><span>Subtotal</span><span>R$ ${order.subtotal.toFixed(2)}</span></div>
            <div class="line"><span>Entrega</span><span>R$ ${order.deliveryFee.toFixed(2)}</span></div>
            <div class="line grand-total"><span>Total</span><span>R$ ${order.total.toFixed(2)}</span></div>
          </div>

          ${
            order.generalNotes
              ? `<div class="section"><strong>Observacoes</strong><div>${escapeHtml(order.generalNotes)}</div></div>`
              : ''
          }

          <div class="footer">Impresso via Painel PedeZap</div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredOrders = orders.filter((order) => {
    const q = ordersQuery.toLowerCase();
    return (
      order.id.toLowerCase().includes(q) ||
      order.customerName.toLowerCase().includes(q) ||
      order.customerWhatsapp.toLowerCase().includes(q)
    );
  });

  const customersByPhone = new Map<string, Customer>();
  customers.forEach((customer) => {
    customersByPhone.set(customer.whatsapp.replace(/\D/g, ''), customer);
  });
  orders.forEach((order) => {
    const phone = order.customerWhatsapp.replace(/\D/g, '');
    if (!phone) return;
    const existing = customersByPhone.get(phone);
    if (existing) return;
    customersByPhone.set(phone, {
      id: `legacy_${phone}`,
      restaurantSlug: order.restaurantSlug,
      name: order.customerName,
      whatsapp: order.customerWhatsapp,
      totalOrders: 1,
      totalSpent: order.total,
      lastOrderAt: order.createdAt,
      createdAt: order.createdAt
    });
  });
  const allCustomers = Array.from(customersByPhone.values()).sort((a, b) =>
    (a.lastOrderAt ?? a.createdAt) < (b.lastOrderAt ?? b.createdAt) ? 1 : -1
  );

  const filteredCustomers = allCustomers.filter((customer) => {
    const q = clientsQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      customer.name.toLowerCase().includes(q) ||
      customer.whatsapp.toLowerCase().includes(q)
    );
  });

  const ordersByStatus = {
    Recebido: filteredOrders.filter((order) => getOrderStatus(order) === 'Recebido'),
    'Em preparo': filteredOrders.filter((order) => getOrderStatus(order) === 'Em preparo'),
    Concluido: filteredOrders.filter((order) => getOrderStatus(order) === 'Concluido')
  } as const;
  const faqItems = [
    'Como altero o horario de funcionamento?',
    'Posso pausar a loja temporariamente?',
    'Como crio um cupom de desconto?',
    'Meu cliente pediu reembolso, o que faco?'
  ];
  const tutorialItems = ['Como cadastrar produtos', 'Configurando a impressora', 'Gerenciando entregadores'];

  const formatMoney = (value: number) => {
    return `R$ ${value.toFixed(2)}`;
  };

  const formatShortDate = (value: string) => {
    if (!value) return '';
    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const formatCouponDiscount = (coupon: Coupon) => {
    if (coupon.discountType === 'percent') return `${coupon.discountValue}%`;
    const fixedValue = Number.isInteger(coupon.discountValue) ? coupon.discountValue.toString() : coupon.discountValue.toFixed(2);
    return `R$ ${fixedValue}`;
  };

  const formatCouponValidity = (coupon: Coupon) => {
    if (coupon.startDate && coupon.endDate) {
      return `${formatShortDate(coupon.startDate)} ate ${formatShortDate(coupon.endDate)}`;
    }
    return 'Valido sempre';
  };

  const openCreateCouponModal = () => {
    setEditingCouponId(null);
    setCouponForm(createDefaultCouponForm());
    setShowCouponForm(true);
  };

  const openEditCouponModal = (coupon: Coupon) => {
    setEditingCouponId(coupon.id);
    setCouponForm(createDefaultCouponForm(coupon));
    setShowCouponForm(true);
  };

  const closeCouponModal = () => {
    setEditingCouponId(null);
    setCouponForm(createDefaultCouponForm());
    setShowCouponForm(false);
  };

  const saveCoupon = () => {
    const code = couponForm.code.trim().toUpperCase();
    if (!code) return;

    const nextCoupon: Coupon = {
      id: editingCouponId ?? `coupon_${Date.now()}`,
      code,
      uses: editingCouponId ? coupons.find((item) => item.id === editingCouponId)?.uses ?? 0 : 0,
      active: couponForm.active,
      discountType: couponForm.discountType,
      discountValue: Number(couponForm.discountValue) || 0,
      minOrderValue: Number(couponForm.minOrderValue) || 0,
      startDate: couponForm.startDate,
      endDate: couponForm.endDate,
      startTime: couponForm.startTime,
      endTime: couponForm.endTime
    };

    if (editingCouponId) {
      setCoupons((prev) => prev.map((coupon) => (coupon.id === editingCouponId ? nextCoupon : coupon)));
    } else {
      setCoupons((prev) => [nextCoupon, ...prev]);
    }

    closeCouponModal();
  };

  const toggleCouponStatus = (couponId: string) => {
    setCoupons((prev) =>
      prev.map((coupon) => (coupon.id === couponId ? { ...coupon, active: !coupon.active } : coupon))
    );
  };

  const removeCoupon = (couponId: string) => {
    setCoupons((prev) => prev.filter((coupon) => coupon.id !== couponId));
  };

  const buildOpeningHoursSummary = (hours: WeeklyHours[]) => {
    return hours
      .filter((day) => day.enabled)
      .map((day) => `${day.label} ${day.open}-${day.close}`)
      .join(' | ');
  };

  const updateSettingsHour = (dayId: string, key: 'enabled' | 'open' | 'close', value: boolean | string) => {
    setSettingsHours((prev) =>
      prev.map((day) => (day.id === dayId ? { ...day, [key]: value } : day))
    );
  };

  const availableMessageVars = ['{id}', '{nome}', '{itens}', '{total}', '{pagamento}', '{endereco}', '{obs}'];

  const insertMessageVariable = (variable: string) => {
    setSettingsMessageTemplate((prev) => `${prev} ${variable}`.trim());
  };

  const insertOrderMessageVariable = (
    field: 'preparing' | 'outForDelivery',
    variable: string
  ) => {
    if (field === 'preparing') {
      setSettingsOrderPreparingMessage((prev) => `${prev} ${variable}`.trim());
      return;
    }
    setSettingsOrderOutForDeliveryMessage((prev) => `${prev} ${variable}`.trim());
  };

  const persistMessageTemplate = () => {
    if (!session) return;
    const key = `pedezap_message_template_${session.restaurantSlug}`;
    localStorage.setItem(key, settingsMessageTemplate);
  };

  const persistOrderMessageTemplates = () => {
    if (!session) return;
    localStorage.setItem(`pedezap_order_msg_preparing_${session.restaurantSlug}`, settingsOrderPreparingMessage);
    localStorage.setItem(`pedezap_order_msg_out_for_delivery_${session.restaurantSlug}`, settingsOrderOutForDeliveryMessage);
  };

  const persistPaymentSettings = () => {
    if (!session) return;
    localStorage.setItem(
      `pedezap_payment_methods_${session.restaurantSlug}`,
      JSON.stringify(settingsPaymentMethods)
    );
    localStorage.setItem(`pedezap_pix_instructions_${session.restaurantSlug}`, settingsPixInstructions);
  };

  const previewMessage = availableMessageVars.reduce(
    (text, variable) =>
      text.replace(
        new RegExp(variable.replace('{', '\\{').replace('}', '\\}'), 'g'),
        {
          '{id}': '#A12B',
          '{nome}': 'Joao',
          '{itens}': '2x X-Burger',
          '{total}': 'R$ 48,00',
          '{pagamento}': 'Pix',
          '{endereco}': 'Rua Central, 123',
          '{obs}': 'Sem cebola'
        }[variable] ?? variable
      ),
    settingsMessageTemplate
  );
  const previewPreparingMessage = buildOrderTemplateMessage(settingsOrderPreparingMessage, {
    id: 'A12B',
    restaurantSlug: session?.restaurantSlug ?? 'rest_demo',
    customerName: 'Joao',
    customerWhatsapp: '11999999999',
    customerAddress: 'Rua Central, 123',
    paymentMethod: 'pix',
    subtotal: 48,
    deliveryFee: 0,
    total: 48,
    createdAt: new Date().toISOString(),
    status: 'Recebido',
    items: [
      {
        productId: 'item_1',
        name: 'X-Burger',
        quantity: 2,
        price: 24,
        notes: 'Sem cebola'
      }
    ]
  });
  const previewOutForDeliveryMessage = buildOrderTemplateMessage(settingsOrderOutForDeliveryMessage, {
    id: 'A12B',
    restaurantSlug: session?.restaurantSlug ?? 'rest_demo',
    customerName: 'Joao',
    customerWhatsapp: '11999999999',
    customerAddress: 'Rua Central, 123',
    paymentMethod: 'pix',
    subtotal: 48,
    deliveryFee: 0,
    total: 48,
    createdAt: new Date().toISOString(),
    status: 'Em preparo',
    items: [
      {
        productId: 'item_1',
        name: 'X-Burger',
        quantity: 2,
        price: 24,
        notes: 'Sem cebola'
      }
    ]
  });

  const loadSupportTicketDetails = async (ticketId: string) => {
    const response = await fetch(`/api/admin/support/tickets/${ticketId}`);
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) return;
    setSupportTicket(payload.ticket);
    setSupportMessages(payload.messages ?? []);
  };

  const ensureSupportTicket = async () => {
    if (!session || !restaurant) return null;
    const sessionEmail = (session.email ?? '').trim().toLowerCase();
    const ownerEmail = (restaurant.ownerEmail ?? '').trim().toLowerCase();
    const requesterEmail = (sessionEmail.includes('@') ? sessionEmail : ownerEmail.includes('@') ? ownerEmail : `${session.restaurantSlug}@pedezap.local`);

    const params = new URLSearchParams();
    params.set('type', 'Parceiro');
    params.set('q', requesterEmail);

    const listResponse = await fetch(`/api/admin/support/tickets?${params.toString()}`);
    const listPayload = await listResponse.json().catch(() => null);
    const existingTickets = (listPayload?.tickets ?? []) as (SupportTicket & { restaurantSlug?: string })[];
    const openTicket =
      existingTickets.find((ticket) => ticket.restaurantSlug === session.restaurantSlug && ticket.status !== 'Fechado') ??
      existingTickets.find((ticket) => ticket.status !== 'Fechado');

    if (openTicket) {
      await loadSupportTicketDetails(openTicket.id);
      return openTicket.id;
    }

    const createResponse = await fetch('/api/admin/support/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: `Atendimento ${restaurant.name}`,
        requesterName: restaurant.name,
        requesterEmail,
        requesterType: 'Parceiro',
        restaurantName: restaurant.name,
        restaurantSlug: session.restaurantSlug,
        category: 'Suporte'
      })
    });
    const createPayload = await createResponse.json().catch(() => null);
    if (!createResponse.ok || !createPayload?.ticket?.id) {
      setSupportError(createPayload?.message ?? 'Nao foi possivel abrir chamado agora. Tente novamente.');
      return null;
    }

    const newTicketId = createPayload.ticket.id as string;
    await loadSupportTicketDetails(newTicketId);
    return newTicketId;
  };

  const openSupportChat = async () => {
    setShowSupportChat(true);
    setSupportOpening(true);
    setSupportError(null);
    const ticketId = await ensureSupportTicket();
    if (!ticketId) {
      setSupportError('Nao foi possivel abrir chamado agora. Tente novamente.');
    }
    setSupportOpening(false);
  };

  const sendSupportMessage = async () => {
    if (!supportTicket || (!supportDraft.trim() && !supportAttachment) || !restaurant) return;
    setSupportSending(true);
    const response = await fetch(`/api/admin/support/tickets/${supportTicket.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        body: supportDraft.trim(),
        authorName: restaurant.name,
        authorRole: 'customer',
        internal: false,
        attachments: supportAttachment ? [supportAttachment] : []
      })
    });
    const payload = await response.json().catch(() => null);
    if (response.ok && payload?.success) {
      setSupportDraft('');
      setSupportAttachment(null);
      setSupportError(null);
      await loadSupportTicketDetails(supportTicket.id);
    } else {
      setSupportError(payload?.message ?? 'Nao foi possivel enviar sua mensagem.');
    }
    setSupportSending(false);
  };

  const handleSupportAttachmentUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setSupportError('Arquivo muito grande. Limite de 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') return;
      setSupportAttachment({
        name: file.name,
        url: result,
        type: file.type || 'application/octet-stream',
        size: file.size
      });
      setSupportError(null);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!showSupportChat || !supportTicket?.id) return;
    const intervalId = setInterval(() => {
      loadSupportTicketDetails(supportTicket.id);
    }, 4000);
    return () => clearInterval(intervalId);
  }, [showSupportChat, supportTicket?.id]);

  const now = new Date();
  const rangeStart = new Date(now);
  if (billingRange === 'today') {
    rangeStart.setHours(0, 0, 0, 0);
  } else if (billingRange === '7d') {
    rangeStart.setDate(rangeStart.getDate() - 6);
    rangeStart.setHours(0, 0, 0, 0);
  } else {
    rangeStart.setDate(rangeStart.getDate() - 29);
    rangeStart.setHours(0, 0, 0, 0);
  }

  const billingOrders = orders.filter((order) => new Date(order.createdAt) >= rangeStart);
  const billingRevenue = billingOrders.reduce((sum, order) => sum + order.total, 0);
  const billingCount = billingOrders.length;
  const ticketMedio = billingCount ? billingRevenue / billingCount : 0;

  const buildDailySeries = () => {
    const days = billingRange === 'today' ? 7 : billingRange === '7d' ? 7 : 30;
    const start = new Date(rangeStart);
    const series = Array.from({ length: days }, (_, idx) => {
      const date = new Date(start);
      date.setDate(start.getDate() + idx);
      const label = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      return { label, value: 0 };
    });
    billingOrders.forEach((order) => {
      const orderDate = new Date(order.createdAt);
      const label = orderDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const item = series.find((s) => s.label === label);
      if (item) item.value += order.total;
    });
    return series;
  };

  const paymentTotals = billingOrders.reduce(
    (acc, order) => {
      acc[order.paymentMethod] = (acc[order.paymentMethod] ?? 0) + order.total;
      return acc;
    },
    {} as Record<string, number>
  );

  const paymentChart = [
    { name: 'Cartao', value: paymentTotals.card ?? 0, color: '#3b82f6' },
    { name: 'Dinheiro', value: paymentTotals.money ?? 0, color: '#f59e0b' },
    { name: 'Pix', value: paymentTotals.pix ?? 0, color: '#10b981' }
  ];

  const addPizzaFlavor = () => {
    if (!productForm.draftFlavorName || !productForm.draftFlavorPrice) return;
    setProductForm((prev) => ({
      ...(function () {
        const nextFlavors = [
          ...prev.pizzaFlavors,
          {
            name: prev.draftFlavorName.trim(),
            ingredients: (prev.draftFlavorIngredients ?? '').trim(),
            price: Number(prev.draftFlavorPrice) || 0
          }
        ];
        const nextBasePrice = nextFlavors.length
          ? Math.min(...nextFlavors.map((flavor) => Number(flavor.price) || 0))
          : 0;
        return {
          ...prev,
          pizzaFlavors: nextFlavors,
          price: nextBasePrice,
          draftFlavorName: '',
          draftFlavorIngredients: '',
          draftFlavorPrice: ''
        };
      })()
    }));
  };

  const removePizzaFlavor = (index: number) => {
    setProductForm((prev) => ({
      ...(function () {
        const nextFlavors = prev.pizzaFlavors.filter((_, idx) => idx !== index);
        const nextBasePrice = nextFlavors.length
          ? Math.min(...nextFlavors.map((flavor) => Number(flavor.price) || 0))
          : 0;
        return {
          ...prev,
          pizzaFlavors: nextFlavors,
          price: nextBasePrice
        };
      })()
    }));
  };

  const addPizzaCrust = () => {
    if (!productForm.draftCrustName) return;
    setProductForm((prev) => ({
      ...prev,
      crusts: [
        ...prev.crusts,
        {
          name: prev.draftCrustName.trim(),
          ingredients: '',
          price: Number(prev.draftCrustPrice) || 0
        }
      ],
      draftCrustName: '',
      draftCrustPrice: ''
    }));
  };

  const removePizzaCrust = (index: number) => {
    setProductForm((prev) => ({
      ...prev,
      crusts: prev.crusts.filter((_, idx) => idx !== index)
    }));
  };

  const addProductComplement = () => {
    if (!productForm.draftComplementName) return;
    setProductForm((prev) => ({
      ...prev,
      complements: [
        ...prev.complements,
        {
          name: prev.draftComplementName.trim(),
          price: Number(prev.draftComplementPrice) || 0
        }
      ],
      draftComplementName: '',
      draftComplementPrice: ''
    }));
  };

  const removeProductComplement = (index: number) => {
    setProductForm((prev) => ({
      ...prev,
      complements: prev.complements.filter((_, idx) => idx !== index)
    }));
  };

  const addAcaiComplementGroup = () => {
    const groupName = productForm.draftAcaiGroupName.trim();
    if (!groupName) return;
    const minSelect = Math.max(0, Number(productForm.draftAcaiGroupMinSelect) || 0);
    const maxSelect = Math.max(minSelect, Number(productForm.draftAcaiGroupMaxSelect) || minSelect || 1);
    const groupId = `acai-group-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setProductForm((prev) => ({
      ...prev,
      acaiComplementGroups: [
        ...prev.acaiComplementGroups,
        { id: groupId, name: groupName, minSelect, maxSelect, items: [] }
      ],
      draftAcaiGroupName: '',
      draftAcaiGroupMinSelect: '0',
      draftAcaiGroupMaxSelect: '1'
    }));
  };

  const removeAcaiComplementGroup = (groupId: string) => {
    setAcaiDraftItemByGroup((prev) => {
      const next = { ...prev };
      delete next[groupId];
      return next;
    });
    setProductForm((prev) => ({
      ...prev,
      acaiComplementGroups: prev.acaiComplementGroups.filter((group) => group.id !== groupId)
    }));
  };

  const addAcaiComplementItem = (groupId: string) => {
    const draft = acaiDraftItemByGroup[groupId];
    const itemName = draft?.name?.trim() ?? '';
    if (!groupId || !itemName) return;
    const itemPrice = Math.max(0, Number(draft?.price) || 0);
    const itemMaxQty = Math.max(1, Number(draft?.maxQty) || 1);
    const itemId = `acai-item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    setProductForm((prev) => ({
      ...prev,
      acaiComplementGroups: prev.acaiComplementGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              items: [...group.items, { id: itemId, name: itemName, price: itemPrice, maxQty: itemMaxQty }]
            }
          : group
      ),
    }));
    setAcaiDraftItemByGroup((prev) => ({
      ...prev,
      [groupId]: { name: '', price: '0', maxQty: '1' }
    }));
  };

  const removeAcaiComplementItem = (groupId: string, itemId: string) => {
    setProductForm((prev) => ({
      ...prev,
      acaiComplementGroups: prev.acaiComplementGroups.map((group) =>
        group.id === groupId ? { ...group, items: group.items.filter((item) => item.id !== itemId) } : group
      )
    }));
  };

  const handleProductImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Selecione um arquivo de imagem valido.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) return;
      setProductForm((prev) => ({ ...prev, imageUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
    event.currentTarget.value = '';
  };

  const persistBanners = async (nextBanners: RestaurantBanner[]) => {
    if (!session || !restaurant) return false;
    const currentRestaurant = restaurant;
    const response = await fetch(`/api/master/restaurant/${session.restaurantSlug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'saveBanners', data: nextBanners })
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      alert(payload?.message ?? 'Nao foi possivel salvar os banners.');
      return false;
    }
    setBanners(payload.banners ?? nextBanners);
    setRestaurant({ ...currentRestaurant, banners: payload.banners ?? nextBanners });
    return true;
  };

  const persistMarketingCampaigns = async (nextCampaigns: RestaurantMarketingCampaign[]) => {
    if (!session || !restaurant) return false;
    const currentRestaurant = restaurant;
    const response = await fetch(`/api/master/restaurant/${session.restaurantSlug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'saveMarketingCampaigns', data: nextCampaigns })
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      alert(payload?.message ?? 'Nao foi possivel salvar as campanhas.');
      return false;
    }
    setMarketingCampaigns(payload.marketingCampaigns ?? nextCampaigns);
    setRestaurant({
      ...currentRestaurant,
      marketingCampaigns: payload.marketingCampaigns ?? nextCampaigns
    });
    return true;
  };

  const applyCampaignAutomation = async (
    campaign: RestaurantMarketingCampaign,
    activate: boolean
  ) => {
    const linkedCouponCodes = new Set(
      (campaign.couponCodes?.length ? campaign.couponCodes : campaign.couponCode ? [campaign.couponCode] : [])
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean)
    );
    if (linkedCouponCodes.size) {
      setCoupons((prev) =>
        prev.map((coupon) =>
          linkedCouponCodes.has(coupon.code.toUpperCase()) ? { ...coupon, active: activate } : coupon
        )
      );
    }

    const linkedBannerIds = new Set((campaign.bannerIds ?? []).filter(Boolean));
    if (!linkedBannerIds.size) return true;

    const nextBanners = banners.map((item) =>
      linkedBannerIds.has(item.id) ? { ...item, active: activate } : item
    );
    return persistBanners(nextBanners);
  };

  const toggleCampaignCouponCode = (couponCode: string) => {
    const normalized = couponCode.trim().toUpperCase();
    if (!normalized) return;
    setCampaignForm((prev) => {
      const exists = prev.couponCodes.includes(normalized);
      const nextCodes = exists
        ? prev.couponCodes.filter((code) => code !== normalized)
        : [...prev.couponCodes, normalized];
      return {
        ...prev,
        couponCodes: nextCodes,
        couponCode: nextCodes[0] ?? ''
      };
    });
  };

  const toggleCampaignBanner = (bannerId: string) => {
    setCampaignForm((prev) => {
      const exists = prev.bannerIds.includes(bannerId);
      return {
        ...prev,
        bannerIds: exists ? prev.bannerIds.filter((id) => id !== bannerId) : [...prev.bannerIds, bannerId]
      };
    });
  };

  const openCreateCampaignModal = () => {
    setEditingCampaignId(null);
    setCampaignForm(createDefaultCampaignForm());
    setShowCampaignModal(true);
  };

  const openEditCampaignModal = (campaign: RestaurantMarketingCampaign) => {
    setEditingCampaignId(campaign.id);
    setCampaignForm(createDefaultCampaignForm(campaign));
    setShowCampaignModal(true);
  };

  const closeCampaignModal = () => {
    setShowCampaignModal(false);
    setEditingCampaignId(null);
    setCampaignForm(createDefaultCampaignForm());
  };

  const saveCampaign = async () => {
    if (!campaignForm.name.trim()) {
      alert('Informe o nome da campanha.');
      return;
    }

    const normalizedCouponCodes = Array.from(
      new Set(
        [...campaignForm.couponCodes, campaignForm.couponCode]
          .map((item) => item.trim().toUpperCase())
          .filter(Boolean)
      )
    );
    const normalizedCampaign: RestaurantMarketingCampaign = {
      id: editingCampaignId ?? `mkc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: campaignForm.name.trim(),
      couponCode: normalizedCouponCodes[0] ?? campaignForm.couponCode.trim().toUpperCase(),
      couponCodes: normalizedCouponCodes,
      bannerIds: campaignForm.bannerIds,
      period: campaignForm.period.trim(),
      active: campaignForm.active,
      createdAt:
        marketingCampaigns.find((item) => item.id === editingCampaignId)?.createdAt ?? new Date().toISOString()
    };

    const nextCampaigns = editingCampaignId
      ? marketingCampaigns.map((item) => (item.id === editingCampaignId ? normalizedCampaign : item))
      : [normalizedCampaign, ...marketingCampaigns];

    const ok = await persistMarketingCampaigns(nextCampaigns);
    if (!ok) return;
    if (normalizedCampaign.active) {
      await applyCampaignAutomation(normalizedCampaign, true);
    }
    closeCampaignModal();
    setMessage('Campanhas atualizadas.');
  };

  const toggleCampaignActive = async (campaignId: string) => {
    const current = marketingCampaigns.find((item) => item.id === campaignId);
    if (!current) return;
    const nextActive = !current.active;
    const nextCampaigns = marketingCampaigns.map((item) =>
      item.id === campaignId ? { ...item, active: nextActive } : item
    );
    const ok = await persistMarketingCampaigns(nextCampaigns);
    if (!ok) return;
    await applyCampaignAutomation({ ...current, active: nextActive }, nextActive);
    setMessage('Status da campanha atualizado.');
  };

  const removeCampaign = async (campaignId: string) => {
    const nextCampaigns = marketingCampaigns.filter((item) => item.id !== campaignId);
    const ok = await persistMarketingCampaigns(nextCampaigns);
    if (ok) setMessage('Campanha removida.');
  };

  const openCreateBannerModal = () => {
    setEditingBannerId(null);
    setBannerForm(createDefaultBannerForm());
    setBannerProductQuery('');
    setShowBannerModal(true);
  };

  const openEditBannerModal = (banner: RestaurantBanner) => {
    setEditingBannerId(banner.id);
    setBannerForm({
      title: banner.title,
      description: banner.description,
      imageUrl: banner.imageUrl,
      active: banner.active,
      productIds: banner.productIds ?? []
    });
    setBannerProductQuery('');
    setShowBannerModal(true);
  };

  const closeBannerModal = () => {
    setShowBannerModal(false);
    setEditingBannerId(null);
    setBannerForm(createDefaultBannerForm());
    setBannerProductQuery('');
  };

  const toggleBannerProduct = (productId: string) => {
    setBannerForm((prev) => {
      const exists = prev.productIds.includes(productId);
      return {
        ...prev,
        productIds: exists ? prev.productIds.filter((id) => id !== productId) : [...prev.productIds, productId]
      };
    });
  };

  const saveBanner = async () => {
    if (!bannerForm.title.trim() || !bannerForm.imageUrl.trim()) {
      alert('Preencha titulo e imagem do banner.');
      return;
    }

    const normalizedBanner: RestaurantBanner = {
      id: editingBannerId ?? `bnr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: bannerForm.title.trim(),
      description: bannerForm.description.trim(),
      imageUrl: bannerForm.imageUrl.trim(),
      active: bannerForm.active,
      productIds: bannerForm.productIds
    };

    const nextBanners = editingBannerId
      ? banners.map((item) => (item.id === editingBannerId ? normalizedBanner : item))
      : [normalizedBanner, ...banners];

    const ok = await persistBanners(nextBanners);
    if (!ok) return;
    closeBannerModal();
    setMessage('Banners atualizados.');
  };

  const toggleBannerActive = async (bannerId: string) => {
    const nextBanners = banners.map((item) =>
      item.id === bannerId ? { ...item, active: !item.active } : item
    );
    const ok = await persistBanners(nextBanners);
    if (ok) setMessage('Status do banner atualizado.');
  };

  const removeBanner = async (bannerId: string) => {
    const nextBanners = banners.filter((item) => item.id !== bannerId);
    const ok = await persistBanners(nextBanners);
    if (ok) setMessage('Banner removido.');
  };

  const bannerAvailableProducts = (restaurant?.products ?? []).filter((product) => product.active);
  const filteredBannerProducts = bannerAvailableProducts.filter((product) => {
    const q = bannerProductQuery.trim().toLowerCase();
    if (!q) return true;
    return product.name.toLowerCase().includes(q) || product.description.toLowerCase().includes(q);
  });

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Carregando painel...</div>;
  }

  if (!restaurant || !restaurantForm) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-6 text-center space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Painel indisponivel</h2>
          <p className="text-sm text-gray-600">{loadError ?? 'Sessao invalida para este restaurante.'}</p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={async () => {
                await fetch('/api/master/logout', { method: 'POST' }).catch(() => null);
                localStorage.removeItem('pedezap_master_session');
                router.push('/master/login');
              }}
              className="px-4 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-slate-900"
            >
              Ir para login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSelectTab = (tabId: TabKey) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen lg:h-screen bg-gray-50 flex overflow-hidden">
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/35 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 lg:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 px-4 flex items-center justify-between border-b border-gray-100">
          <BrandLogo src="/pedezappp.png" imageClassName="h-10 w-auto object-contain" />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="h-9 w-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.id ? 'bg-slate-100 text-slate-900' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <aside className="w-64 h-screen bg-white border-r border-gray-200 hidden lg:flex flex-col">
        <div className="h-16 px-6 flex items-center gap-3 border-b border-gray-100">
          <BrandLogo src="/pedezappp.png" imageClassName="h-14 w-auto object-contain" />
          <div>
            <p className="text-xs text-gray-500">Painel</p>
          </div>
        </div>
        <nav className="flex-1 min-h-0 overflow-y-auto px-4 py-6 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.id ? 'bg-slate-100 text-slate-900' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={async () => {
              await fetch('/api/master/logout', { method: 'POST' }).catch(() => null);
              localStorage.removeItem('pedezap_master_session');
              router.push('/master/login');
            }}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      <div className="flex-1 min-h-0 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden h-9 w-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center"
              aria-label="Abrir menu"
            >
              <MenuIcon size={18} />
            </button>
            <h1 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">{pageTitle}</h1>
          </div>
          <div className="hidden md:flex flex-1 px-6">
            <div className="relative w-full max-w-xl">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400 transition-all"
                placeholder="Buscar global (cardapio, pedidos, config)..."
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-gray-900">{session?.restaurantName}</span>
              <span className="text-xs text-gray-500">Restaurante</span>
            </div>
            <div className="h-9 w-9 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold">
              {session?.restaurantName?.charAt(0).toUpperCase() ?? 'R'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {message && (
              <p className="text-sm text-slate-800 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2">
                {message}
              </p>
            )}

            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  <section className="lg:col-span-2 bg-black text-white rounded-xl p-6">
                    <h3 className="text-lg font-semibold">Seu Link de Pedidos</h3>
                    <p className="text-slate-300 text-sm mt-1">Compartilhe com seus clientes</p>
                    <div className="mt-6 flex gap-2">
                      <div className="flex-1 bg-white/20 rounded-lg px-3 py-2 text-sm font-mono truncate">
                        pedezap.site/{restaurant.slug}
                      </div>
                      <button onClick={copyLink} className="bg-white text-slate-800 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                        <Copy size={18} />
                      </button>
                      <button
                        onClick={() => window.open(`https://pedezap.site/${restaurant.slug}`, '_blank')}
                        className="bg-white/15 border border-white/20 text-white p-2 rounded-lg hover:bg-white/20 transition-colors"
                      >
                        <ExternalLink size={18} />
                      </button>
                    </div>
                  </section>

                  <section className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col items-center text-center">
                    <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Status da Loja</span>
                    <div className={`mt-2 px-4 py-1 rounded-full text-xs font-bold ${(restaurant.openForOrders ?? true) ? 'bg-slate-100 text-slate-900' : 'bg-red-100 text-red-700'}`}>
                      {(restaurant.openForOrders ?? true) ? 'ABERTA' : 'FECHADA'}
                    </div>
                    <div className="mt-4 w-full">
                      <button
                        onClick={() =>
                          saveRestaurant({
                            ...restaurantForm,
                            openForOrders: !(restaurant.openForOrders ?? true)
                          })
                        }
                        className={`w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          (restaurant.openForOrders ?? true) ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-black text-white hover:bg-slate-900'
                        }`}
                      >
                        {(restaurant.openForOrders ?? true) ? 'Fechar Loja' : 'Abrir Loja'}
                      </button>
                    </div>
                  </section>

                  <section className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col justify-between">
                    <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Plano Atual</span>
                    <h3 className="text-xl font-bold text-gray-900 mt-1">{restaurant.plan}</h3>
                    <button
                      onClick={() => setActiveTab('plans')}
                      className="mt-4 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Ver Detalhes
                    </button>
                  </section>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                      <List size={22} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Categorias</p>
                      <p className="text-xl font-bold text-gray-900">{restaurant.categories.length}</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                      <ShoppingBag size={22} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Produtos</p>
                      <p className="text-xl font-bold text-gray-900">{restaurant.products.length}</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
                      <Eye size={22} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Visualizacoes</p>
                      <p className="text-xl font-bold text-gray-900">1.2k</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl border border-gray-100 p-6 lg:col-span-2 h-80">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendas da Semana</h3>
                    <div className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weekSalesData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" tickLine={false} axisLine={false} />
                          <YAxis tickLine={false} axisLine={false} />
                          <Tooltip
                            cursor={{ fill: '#f3f4f6' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value) => [
                              `R$ ${Number(value ?? 0).toFixed(2).replace('.', ',')}`,
                              'Vendas'
                            ]}
                          />
                          <Bar dataKey="vendas" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Dicas de Sucesso</h3>
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-1 text-slate-800">
                          <AlertCircle size={18} />
                        </div>
                        <div className="text-sm text-gray-600">
                          <p className="font-medium text-gray-900 mb-1">Fotos vendem mais!</p>
                          Adicione fotos reais e atraentes aos seus produtos para aumentar a conversao.
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-1 text-slate-800">
                          <AlertCircle size={18} />
                        </div>
                        <div className="text-sm text-gray-600">
                          <p className="font-medium text-gray-900 mb-1">Descricao detalhada</p>
                          Liste todos os ingredientes para evitar duvidas e agilizar o pedido.
                        </div>
                      </div>
                    </div>
                    <button className="mt-6 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      Ver todas as dicas
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <section className="mx-auto max-w-5xl space-y-4">
                <div className="rounded-xl border border-gray-200 bg-white px-4 py-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-3xl font-semibold text-gray-900">Configuracoes</h2>
                    <p className="text-sm text-gray-500">Gerencie as informacoes principais do seu negocio</p>
                  </div>
                  <button
                    disabled={saving || !settingsDraft}
                    onClick={() => {
                      if (!settingsDraft) return;
                      persistMessageTemplate();
                      persistOrderMessageTemplates();
                      persistPaymentSettings();
                      saveRestaurant({
                        ...settingsDraft,
                        openingHours: buildOpeningHoursSummary(settingsHours)
                      });
                    }}
                    className="inline-flex items-center gap-2 rounded-lg bg-black text-white px-4 py-2 text-sm font-semibold hover:bg-slate-900 disabled:opacity-60"
                  >
                    <Save size={14} />
                    {saving ? 'Salvando...' : 'Salvar Alteracoes'}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
                  <div className="rounded-xl border border-gray-200 bg-white p-3 h-fit">
                    {[
                      { id: 'store' as const, label: 'Identidade Visual', icon: Store },
                      { id: 'hours' as const, label: 'Horarios', icon: Clock3 },
                      { id: 'address' as const, label: 'Endereco', icon: MapPin },
                      { id: 'delivery' as const, label: 'Pedidos & Delivery', icon: Bike },
                      { id: 'messages' as const, label: 'Mensagens', icon: MessageSquare },
                      { id: 'orderMessages' as const, label: 'Mensagens de Pedido', icon: MessageSquare },
                      { id: 'payments' as const, label: 'Pagamentos', icon: Wallet }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSettingsSection(item.id)}
                        className={`w-full rounded-lg px-3 py-2.5 text-sm flex items-center gap-2 ${
                          settingsSection === item.id
                            ? 'bg-slate-100 text-slate-900 font-semibold'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <item.icon size={16} />
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4">
                    {settingsSection === 'hours' && (
                      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <h3 className="text-2xl font-semibold text-gray-900">Horarios de Funcionamento</h3>
                        </div>
                        <div className="p-4 space-y-4">
                          <div className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-800">
                            <p className="font-medium">Defina sua grade de horarios</p>
                            <p className="text-xs mt-1">Desmarque os dias que o estabelecimento nao abre. Fora destes horarios, sua loja aparecera como "Fechada".</p>
                          </div>

                          <div className="rounded-xl border border-gray-200 overflow-hidden">
                            <div className="grid grid-cols-[1.2fr_1fr_1fr] bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                              <span>Dia da Semana</span>
                              <span>Abertura</span>
                              <span>Fechamento</span>
                            </div>
                            {settingsHours.map((day) => (
                              <div key={day.id} className="grid grid-cols-[1.2fr_1fr_1fr] gap-2 px-4 py-2 border-t border-gray-100 items-center">
                                <label className="text-sm text-gray-800 inline-flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={day.enabled}
                                    onChange={(event) => updateSettingsHour(day.id, 'enabled', event.target.checked)}
                                  />
                                  {day.label}
                                </label>
                                <input
                                  type="time"
                                  value={day.open}
                                  disabled={!day.enabled}
                                  onChange={(event) => updateSettingsHour(day.id, 'open', event.target.value)}
                                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                                />
                                <input
                                  type="time"
                                  value={day.close}
                                  disabled={!day.enabled}
                                  onChange={(event) => updateSettingsHour(day.id, 'close', event.target.value)}
                                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {settingsSection === 'address' && settingsDraft && (
                      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <h3 className="text-2xl font-semibold text-gray-900">Localizacao</h3>
                        </div>
                        <div className="p-4 space-y-4">
                          <div className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-800 inline-flex items-start gap-3 w-full">
                            <AlertCircle size={16} className="mt-0.5" />
                            <p>
                              Este endereco sera exibido para seus clientes e usado para calcular rotas de entrega se voce usar entregadores parceiros.
                            </p>
                          </div>

                          <div>
                            <label className="text-sm text-gray-700">Endereco Completo (Rua, Numero, Bairro)</label>
                            <input
                              value={settingsDraft.address}
                              onChange={(event) => setSettingsDraft((prev) => (prev ? { ...prev, address: event.target.value } : prev))}
                              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm text-gray-700">Cidade</label>
                              <input
                                value={settingsDraft.city}
                                onChange={(event) => setSettingsDraft((prev) => (prev ? { ...prev, city: event.target.value } : prev))}
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-gray-700">Estado (UF)</label>
                              <input
                                value={settingsDraft.state}
                                onChange={(event) => setSettingsDraft((prev) => (prev ? { ...prev, state: event.target.value } : prev))}
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                              />
                            </div>
                          </div>

                          <div className="h-36 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400">
                            <div className="text-center">
                              <MapPin size={26} className="mx-auto" />
                              <p className="mt-2 text-xs">Mapa indisponivel na visualizacao</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {settingsSection === 'delivery' && settingsDraft && (
                      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <h3 className="text-2xl font-semibold text-gray-900">Configuracao de Pedidos</h3>
                        </div>
                        <div className="p-4 space-y-4">
                          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-base font-semibold text-gray-900">Aceitar Novos Pedidos</p>
                              <p className="text-sm text-gray-500">Controle global de recebimento de pedidos.</p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setSettingsDraft((prev) =>
                                  prev ? { ...prev, openForOrders: !prev.openForOrders } : prev
                                )
                              }
                              className={`h-6 w-11 rounded-full p-1 transition-colors ${settingsDraft.openForOrders ? 'bg-slate-1000' : 'bg-gray-300'}`}
                              aria-label="Alternar recebimento de pedidos"
                            >
                              <span
                                className={`block h-4 w-4 rounded-full bg-white transition-transform ${
                                  settingsDraft.openForOrders ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              ></span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="text-sm text-gray-700">Pedido Minimo</label>
                              <input
                                type="number"
                                step="0.01"
                                value={settingsDraft.minOrderValue}
                                onChange={(event) =>
                                  setSettingsDraft((prev) =>
                                    prev ? { ...prev, minOrderValue: Number(event.target.value || 0) } : prev
                                  )
                                }
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-gray-700">Taxa de Entrega Padrao</label>
                              <input
                                type="number"
                                step="0.01"
                                value={settingsDraft.deliveryFee}
                                onChange={(event) =>
                                  setSettingsDraft((prev) =>
                                    prev ? { ...prev, deliveryFee: Number(event.target.value || 0) } : prev
                                  )
                                }
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-gray-700">Tempo Estimado</label>
                              <input
                                value={settingsDeliveryEta}
                                onChange={(event) => setSettingsDeliveryEta(event.target.value)}
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {settingsSection === 'messages' && (
                      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <h3 className="text-2xl font-semibold text-gray-900">Personalizacao da Mensagem</h3>
                        </div>
                        <div className="p-4 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-4">
                          <div>
                            <div className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-800">
                              Esta e a mensagem que o seu cliente enviara automaticamente para o seu WhatsApp ao finalizar um pedido no catalogo.
                              Personalize-a para facilitar o seu atendimento.
                            </div>

                            <div className="mt-4">
                              <label className="text-sm text-gray-700">Template da Mensagem</label>
                              <textarea
                                value={settingsMessageTemplate}
                                onChange={(event) => setSettingsMessageTemplate(event.target.value)}
                                className="mt-1 h-44 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm"
                              />
                              <p className="mt-1 text-right text-xs text-gray-400">{settingsMessageTemplate.length} caracteres</p>
                            </div>

                            <div className="mt-4">
                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Variaveis disponiveis</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {availableMessageVars.map((variable) => (
                                  <button
                                    key={variable}
                                    type="button"
                                    onClick={() => insertMessageVariable(variable)}
                                    className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-700 hover:bg-gray-100"
                                  >
                                    + {variable}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-gray-200 bg-[#ece5dd] overflow-hidden h-[370px] flex flex-col">
                            <div className="bg-slate-900 text-white px-4 py-3">
                              <p className="text-sm font-semibold">{restaurant.name}</p>
                              <p className="text-[11px] text-slate-300">Online</p>
                            </div>
                            <div className="p-4">
                              <div className="ml-auto w-[88%] rounded-xl bg-[#dcf8c6] px-3 py-2 text-sm text-gray-800 shadow-sm">
                                <p>{previewMessage || 'Digite a mensagem...'}</p>
                                <p className="mt-1 text-[10px] text-right text-gray-500">14:47</p>
                              </div>
                            </div>
                            <div className="mt-auto p-3">
                              <div className="rounded-full bg-white/90 px-4 py-2 text-xs text-gray-400">Mensagem</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {settingsSection === 'payments' && (
                      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <h3 className="text-2xl font-semibold text-gray-900">Metodos de Pagamento</h3>
                        </div>
                        <div className="p-4 space-y-4">
                          <div>
                            <p className="text-sm text-gray-700">Formas aceitas na entrega/retirada</p>
                            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                              {[
                                { key: 'money' as const, label: 'Dinheiro' },
                                { key: 'card' as const, label: 'Cartao' },
                                { key: 'pix' as const, label: 'PIX' }
                              ].map((item) => (
                                <button
                                  key={item.key}
                                  type="button"
                                  onClick={() =>
                                    setSettingsPaymentMethods((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
                                  }
                                  className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                                    settingsPaymentMethods[item.key]
                                      ? 'border-slate-900 bg-slate-100 text-slate-900'
                                      : 'border-gray-300 bg-white text-gray-500'
                                  }`}
                                >
                                  {settingsPaymentMethods[item.key] ? '• ' : ''}
                                  {item.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="rounded-xl border border-slate-200 bg-slate-100 p-4">
                            <p className="text-base font-semibold text-slate-900">Configuracao do PIX</p>
                            <div className="mt-2">
                              <label className="text-sm text-slate-900">Chave PIX ou Instrucoes</label>
                              <input
                                value={settingsPixInstructions}
                                onChange={(event) => setSettingsPixInstructions(event.target.value)}
                                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                              />
                            </div>
                            <p className="mt-2 text-xs text-slate-700">
                              Essa informacao sera exibida para o cliente na etapa de pagamento.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {settingsSection === 'orderMessages' && (
                      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <h3 className="text-2xl font-semibold text-gray-900">Mensagens de Pedido</h3>
                        </div>
                        <div className="p-4 space-y-5">
                          <div className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-800">
                            Personalize os textos enviados ao cliente durante o fluxo do pedido.
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Quando iniciar preparo</label>
                            <textarea
                              value={settingsOrderPreparingMessage}
                              onChange={(event) => setSettingsOrderPreparingMessage(event.target.value)}
                              className="h-28 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            />
                            <p className="text-xs text-gray-500">Preview: {previewPreparingMessage}</p>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Quando sair para entrega</label>
                            <textarea
                              value={settingsOrderOutForDeliveryMessage}
                              onChange={(event) => setSettingsOrderOutForDeliveryMessage(event.target.value)}
                              className="h-28 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            />
                            <p className="text-xs text-gray-500">Preview: {previewOutForDeliveryMessage}</p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Variaveis disponiveis</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {availableMessageVars.map((variable) => (
                                <button
                                  key={variable}
                                  type="button"
                                  onClick={() => insertOrderMessageVariable('preparing', variable)}
                                  className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-700 hover:bg-gray-100"
                                >
                                  Preparo + {variable}
                                </button>
                              ))}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {availableMessageVars.map((variable) => (
                                <button
                                  key={`out_${variable}`}
                                  type="button"
                                  onClick={() => insertOrderMessageVariable('outForDelivery', variable)}
                                  className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-700 hover:bg-gray-100"
                                >
                                  Entrega + {variable}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {settingsSection !== 'hours' && settingsSection !== 'address' && settingsSection !== 'delivery' && settingsSection !== 'messages' && settingsSection !== 'orderMessages' && settingsSection !== 'payments' && (
                      <>
                        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                          <div className="px-4 py-3 border-b border-gray-100">
                            <h3 className="text-2xl font-semibold text-gray-900">Identidade Visual</h3>
                          </div>
                          <div className="p-4">
                            <div className="relative overflow-hidden rounded-xl border border-gray-200">
                              <img
                                src={settingsDraft?.coverUrl || restaurant.coverUrl || 'https://picsum.photos/seed/pedezap-cover/1200/300'}
                                alt="Capa da loja"
                                className="h-44 w-full object-cover"
                              />
                              <input
                                id="settings-cover-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(event) =>
                                  applyImageFile(event, (imageUrl) =>
                                    setSettingsDraft((prev) => (prev ? { ...prev, coverUrl: imageUrl } : prev))
                                  )
                                }
                              />
                              <label
                                htmlFor="settings-cover-upload"
                                className="absolute right-3 bottom-3 cursor-pointer rounded-lg bg-black/70 text-white px-3 py-1.5 text-xs font-medium"
                              >
                                Alterar Capa
                              </label>
                            </div>
                            <div className="mt-4 flex items-end gap-3">
                              <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-gray-200 bg-black text-white flex items-center justify-center font-bold text-lg shadow-sm">
                                {settingsDraft?.logoUrl ? (
                                  <img src={settingsDraft.logoUrl} alt="Logo da loja" className="h-full w-full object-cover" />
                                ) : (
                                  restaurant.name.charAt(0).toUpperCase()
                                )}
                              </div>
                              <input
                                id="settings-logo-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(event) =>
                                  applyImageFile(event, (imageUrl) =>
                                    setSettingsDraft((prev) => (prev ? { ...prev, logoUrl: imageUrl } : prev))
                                  )
                                }
                              />
                              <label
                                htmlFor="settings-logo-upload"
                                className="cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                              >
                                Alterar Logo
                              </label>
                            </div>
                            <p className="mt-3 text-xs text-gray-400">
                              Tamanho recomendado para capa: 1200x300px. Para logo: 500x500 px.
                            </p>
                          </div>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                          <div className="px-4 py-3 border-b border-gray-100">
                            <h3 className="text-2xl font-semibold text-gray-900">Informacoes Basicas</h3>
                          </div>
                          {settingsDraft && (
                            <div className="p-4 space-y-4">
                              <div>
                                <label className="text-sm text-gray-700">Nome do Restaurante</label>
                                <input
                                  value={settingsDraft.name}
                                  onChange={(event) => setSettingsDraft((prev) => (prev ? { ...prev, name: event.target.value } : prev))}
                                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                />
                              </div>

                              <div>
                                <label className="text-sm text-gray-700">WhatsApp (com DDD)</label>
                                <input
                                  value={settingsDraft.whatsapp}
                                  onChange={(event) => setSettingsDraft((prev) => (prev ? { ...prev, whatsapp: event.target.value } : prev))}
                                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'menu' && (
              <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
                <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 h-fit">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-gray-900">Categorias</h2>
                    <button
                      onClick={() => {
                        setShowCategoryForm(true);
                        setEditingCategoryId(null);
                        setNewCategory('');
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-black text-white px-3 py-1.5 text-xs font-medium hover:bg-slate-900"
                    >
                      <Plus size={14} />
                      Nova
                    </button>
                  </div>

                  {showCategoryForm && (
                    <div className="mb-4 space-y-2">
                      <input
                        value={newCategory}
                        onChange={(event) => setNewCategory(event.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        placeholder="Nome da categoria"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const currentActive =
                              editingCategoryId
                                ? restaurant.categories.find((item) => item.id === editingCategoryId)?.active ?? true
                                : true;
                            saveCategory({ id: editingCategoryId ?? undefined, name: newCategory, active: currentActive });
                          }}
                          className="inline-flex items-center justify-center rounded-lg font-medium transition-colors bg-black text-white hover:bg-slate-900 px-3 py-2 text-xs"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={() => {
                            setShowCategoryForm(false);
                            setNewCategory('');
                            setEditingCategoryId(null);
                          }}
                          className="inline-flex items-center justify-center rounded-lg font-medium transition-colors border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {restaurant.categories.map((category) => (
                      <div
                        key={category.id}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                          selectedCategoryId === category.id
                            ? category.active
                              ? 'border-emerald-300 bg-emerald-50'
                              : 'border-red-300 bg-red-50'
                            : category.active
                            ? 'border-emerald-200 bg-emerald-50/40'
                            : 'border-red-200 bg-red-50/40'
                        }`}
                      >
                        <button
                          onClick={() => setSelectedCategoryId(category.id)}
                          className="flex items-center gap-2 text-left flex-1"
                        >
                          <span className={`h-2 w-2 rounded-full ${category.active ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                          <span className={`text-sm font-medium ${category.active ? 'text-emerald-800' : 'text-red-700'}`}>
                            {category.name} {!category.active ? '(Inativa)' : ''}
                          </span>
                        </button>
                        <div className="flex items-center gap-2 text-gray-400">
                          <button
                            onClick={() => saveCategory({ id: category.id, name: category.name, active: !category.active })}
                            className={`h-5 w-10 rounded-full p-0.5 transition-colors ${
                              category.active ? 'bg-emerald-500' : 'bg-red-400'
                            }`}
                            title={category.active ? 'Desativar categoria' : 'Ativar categoria'}
                            aria-label={category.active ? 'Desativar categoria' : 'Ativar categoria'}
                          >
                            <span
                              className={`block h-4 w-4 rounded-full bg-white transition-transform ${
                                category.active ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <button onClick={() => editCategory(category)} className="hover:text-slate-900">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => deleteCategory(category.id)} className="hover:text-red-600">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-semibold text-gray-900">{selectedCategory?.name ?? 'Produtos'}</h2>
                      <p className="text-xs text-gray-500">{filteredProducts.length} produtos cadastrados</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowProductForm(true);
                        setProductForm(createDefaultProductForm(selectedCategoryId ?? ''));
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-black text-white px-3 py-1.5 text-xs font-medium hover:bg-slate-900"
                    >
                      <Plus size={14} />
                      Novo Produto
                    </button>
                  </div>

                  <div className="space-y-3">
                    {filteredProducts.map((product) => (
                      <div key={product.id} className="border border-gray-200 rounded-xl p-4 flex gap-4">
                        <img
                          src={product.imageUrl || `https://picsum.photos/seed/${product.id}/80/80`}
                          alt={product.name}
                          className="h-16 w-16 rounded-lg object-cover bg-gray-100"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-semibold text-gray-900">{product.name}</p>
                              <p className="text-xs text-gray-500">{stripFeaturedTag(product.description)}</p>
                              {hasFeaturedTag(product.description) && (
                                <span className="mt-2 inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-800">
                                  Destaque
                                </span>
                              )}
                            </div>
                            <span className="text-slate-800 font-semibold text-sm">R$ {product.price.toFixed(2)}</span>
                          </div>
                          <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                            <button onClick={() => editProduct(product)} className="hover:text-slate-900">
                              Editar
                            </button>
                            <button onClick={() => duplicateProduct(product)} className="hover:text-slate-900">
                              Duplicar
                            </button>
                            <button onClick={() => deleteProduct(product.id)} className="hover:text-red-600">
                              Excluir
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {!filteredProducts.length && (
                      <div className="text-sm text-gray-500">Nenhum produto nesta categoria.</div>
                    )}
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'orders' && (
              <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Gestao de Pedidos</h2>
                    <p className="text-sm text-gray-500">Acompanhe o fluxo da cozinha em tempo real</p>
                  </div>
	                  <div className="flex items-center gap-2">
	                    <button
	                      onClick={() => setShowManualOrderModal(true)}
	                      className="inline-flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-sm font-semibold text-white hover:bg-slate-900"
	                    >
	                      <Plus size={16} />
	                      Novo Pedido
	                    </button>
	                    <div className="relative">
	                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
	                      <input
                        value={ordersQuery}
                        onChange={(event) => setOrdersQuery(event.target.value)}
                        className="w-48 rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 py-2 text-sm"
                        placeholder="Buscar cliente ou ID..."
                      />
                    </div>
                    <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-1">
                      <button
                        onClick={() => setOrdersView('board')}
                        className={`h-8 w-8 rounded-md flex items-center justify-center ${
                          ordersView === 'board' ? 'bg-slate-100 text-slate-900' : 'text-gray-400'
                        }`}
                      >
                        <LayoutDashboard size={16} />
                      </button>
                      <button
                        onClick={() => setOrdersView('table')}
                        className={`h-8 w-8 rounded-md flex items-center justify-center ${
                          ordersView === 'table' ? 'bg-slate-100 text-slate-900' : 'text-gray-400'
                        }`}
                      >
                        <List size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {ordersView === 'board' ? (
                  <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {[
                      { key: 'Recebido', label: 'Recebidos', color: 'bg-slate-100 border-slate-200' },
                      { key: 'Em preparo', label: 'Na Cozinha', color: 'bg-slate-100 border-slate-200' },
                      { key: 'Concluido', label: 'Prontos / Historico', color: 'bg-slate-100 border-slate-200' }
                    ].map((column) => (
                      <div key={column.key} className={`rounded-xl border ${column.color} p-4`}>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-gray-800">{column.label}</h3>
                          <span className="text-xs text-gray-500">{ordersByStatus[column.key as keyof typeof ordersByStatus].length}</span>
                        </div>
                        <div className="space-y-3">
                          {ordersByStatus[column.key as keyof typeof ordersByStatus].map((order) => (
                            <div key={order.id} className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">#{order.id}</p>
                                  <p className="text-xs text-gray-500">{order.customerName}</p>
                                </div>
                                <span className="text-[10px] text-gray-400">{getOrderAgeMinutes(order.createdAt)} min</span>
                              </div>
                              <div className="mt-2 text-xs text-gray-600 space-y-1">
                                {order.items.map((item) => (
                                  <p key={item.productId}>
                                    {item.quantity}x {item.name}
                                  </p>
                                ))}
                              </div>
                              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                                <span>{paymentMethodLabel(order.paymentMethod)}</span>
                                <span className="font-semibold text-slate-900">R$ {order.total.toFixed(2)}</span>
                              </div>
                              <div className="mt-3 flex items-center gap-2">
                                {column.key === 'Recebido' && (
                                  <button
                                    onClick={() => updateOrderStatus(order.id, 'Em preparo')}
                                    disabled={updatingOrderId === order.id}
                                    className="flex-1 rounded-lg bg-black text-white py-1.5 text-xs font-medium hover:bg-slate-900 disabled:opacity-60"
                                  >
                                    {updatingOrderId === order.id ? 'Atualizando...' : 'Aceitar & Preparar'}
                                  </button>
                                )}
                                {column.key === 'Em preparo' && (
                                  <button
                                    onClick={() => updateOrderStatus(order.id, 'Concluido')}
                                    disabled={updatingOrderId === order.id}
                                    className="flex-1 rounded-lg border border-slate-200 text-slate-900 py-1.5 text-xs font-medium hover:bg-slate-100 disabled:opacity-60"
                                  >
                                    {updatingOrderId === order.id ? 'Atualizando...' : 'Marcar Pronto'}
                                  </button>
                                )}
                                {column.key === 'Concluido' && (
                                  <button className="flex-1 rounded-lg border border-slate-200 text-slate-900 py-1.5 text-xs font-medium bg-slate-100">
                                    Concluido
                                  </button>
                                )}
                                <button
                                  onClick={() => printOrderTicket(order)}
                                  className="h-8 w-10 rounded-lg border border-gray-200 text-gray-500 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-100 flex items-center justify-center"
                                  title={`Imprimir comanda #${order.id}`}
                                  aria-label={`Imprimir comanda #${order.id}`}
                                >
                                  <Printer size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                          {!ordersByStatus[column.key as keyof typeof ordersByStatus].length && (
                            <div className="text-xs text-gray-400">Nenhum pedido.</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase text-gray-400 border-b border-gray-100">
                        <tr>
                          <th className="px-4 py-3">Pedido</th>
                          <th className="px-4 py-3">Cliente</th>
                          <th className="px-4 py-3">Itens</th>
                          <th className="px-4 py-3">Total</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Acoes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredOrders.map((order) => {
                          const status = getOrderStatus(order);
                          return (
                            <tr key={order.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="font-semibold text-gray-900">#{order.id}</div>
                                <div className="text-xs text-gray-400">{getOrderAgeMinutes(order.createdAt)} min</div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-gray-900 font-medium">{order.customerName}</div>
                                <div className="text-xs text-gray-400">{order.customerWhatsapp}</div>
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-500">
                                {order.items.map((item) => `${item.quantity}x ${item.name}`).join(', ')}
                              </td>
                              <td className="px-4 py-3 font-semibold text-gray-900">R$ {order.total.toFixed(2)}</td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                                    status === 'Recebido'
                                      ? 'bg-slate-100 text-slate-800'
                                      : status === 'Em preparo'
                                      ? 'bg-slate-100 text-slate-800'
                                      : 'bg-slate-100 text-slate-900'
                                  }`}
                                >
                                  {status === 'Recebido' ? 'RECEBIDO' : status === 'Em preparo' ? 'EM PREPARO' : 'CONCLUIDO'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right text-slate-900 font-medium">
                                <div className="inline-flex items-center justify-end gap-3">
                                  <button
                                    onClick={() => printOrderTicket(order)}
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-100"
                                    title={`Imprimir comanda #${order.id}`}
                                    aria-label={`Imprimir comanda #${order.id}`}
                                  >
                                    <Printer size={14} />
                                  </button>
                                  {status === 'Recebido' && (
                                    <button
                                      onClick={() => updateOrderStatus(order.id, 'Em preparo')}
                                      className="hover:underline"
                                    >
                                      Aceitar
                                    </button>
                                  )}
                                  {status === 'Em preparo' && (
                                    <button
                                      onClick={() => updateOrderStatus(order.id, 'Concluido')}
                                      className="hover:underline"
                                    >
                                      Finalizar
                                    </button>
                                  )}
                                  {status === 'Concluido' && <button>Detalhes</button>}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {!filteredOrders.length && (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                              Nenhum pedido encontrado.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {activeTab === 'billing' && (
              <section className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Financeiro</h2>
                    <p className="text-sm text-gray-500">Acompanhe o desempenho do seu negocio</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-gray-100 p-1">
                    {[
                      { key: 'today', label: 'Hoje' },
                      { key: '7d', label: '7 Dias' },
                      { key: '30d', label: '30 Dias' }
                    ].map((item) => (
                      <button
                        key={item.key}
                        onClick={() => setBillingRange(item.key as typeof billingRange)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                          billingRange === item.key ? 'bg-white text-slate-900 shadow' : 'text-gray-500'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Faturamento no Periodo</p>
                      <p className="text-xl font-bold text-gray-900">R$ {billingRevenue.toFixed(2)}</p>
                      <span className="text-[10px] text-slate-800 bg-slate-100 px-2 py-1 rounded-full">+12.5% vs. anterior</span>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center">
                      <CreditCard size={18} />
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Pedidos no Periodo</p>
                      <p className="text-xl font-bold text-gray-900">{billingCount}</p>
                      <span className="text-[10px] text-slate-700 bg-slate-100 px-2 py-1 rounded-full">+5% vs. anterior</span>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
                      <ShoppingBag size={18} />
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Ticket Medio</p>
                      <p className="text-xl font-bold text-gray-900">R$ {ticketMedio.toFixed(2)}</p>
                      <span className="text-[10px] text-slate-700 bg-slate-100 px-2 py-1 rounded-full">-2.1% vs. anterior</span>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
                      <AlertCircle size={18} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl border border-gray-100 p-6 lg:col-span-2">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Evolucao de Vendas (Por Dia)</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={buildDailySeries()}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="label" tickLine={false} axisLine={false} />
                          <YAxis tickLine={false} axisLine={false} />
                          <Tooltip
                            cursor={{ fill: '#f3f4f6' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Metodos de Pagamento</h3>
                    <div className="h-56 flex items-center justify-center">
                      <div className="relative h-40 w-40 rounded-full border-[14px] border-slate-900 border-l-slate-600 border-r-slate-500"></div>
                    </div>
                    <div className="flex items-center justify-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-700"></span>Cartao</span>
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-1000"></span>Dinheiro</span>
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-1000"></span>Pix</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Ultimas Transacoes</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase text-gray-400 border-b border-gray-100">
                        <tr>
                          <th className="px-2 py-2">Data</th>
                          <th className="px-2 py-2">Pedido</th>
                          <th className="px-2 py-2">Metodo</th>
                          <th className="px-2 py-2 text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {billingOrders.slice(0, 5).map((order) => (
                          <tr key={order.id}>
                            <td className="px-2 py-3 text-xs text-gray-500">{new Date(order.createdAt).toLocaleString('pt-BR')}</td>
                            <td className="px-2 py-3 font-semibold text-gray-900">#{order.id}</td>
                            <td className="px-2 py-3 text-xs text-gray-500">{paymentMethodLabel(order.paymentMethod)}</td>
                            <td className="px-2 py-3 text-right font-semibold text-gray-900">R$ {order.total.toFixed(2)}</td>
                          </tr>
                        ))}
                        {!billingOrders.length && (
                          <tr>
                            <td colSpan={4} className="px-2 py-6 text-center text-sm text-gray-500">
                              Nenhuma transacao no periodo.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'highlights' && (
              <section className="space-y-5">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Destaques do Cardapio</h2>
                  <p className="text-sm text-gray-500">
                    Selecione os produtos que aparecerao no topo do seu cardapio digital para impulsionar as vendas.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Produtos em Destaque ({highlightedProducts.length})</h3>
                  {highlightedProducts.length ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {highlightedProducts.map((product) => (
                        <div key={product.id} className="rounded-xl border border-slate-200 bg-white p-3">
                          <div className="relative">
                            <img
                              src={product.imageUrl || `https://picsum.photos/seed/${product.id}/320/180`}
                              alt={product.name}
                              className="h-40 w-full rounded-lg object-cover bg-gray-100"
                            />
                            <button
                              onClick={() => setProductFeatured(product, false)}
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white border border-red-200 text-red-500 text-xs"
                              title="Remover destaque"
                            >
                              -
                            </button>
                          </div>
                          <p className="mt-3 font-semibold text-gray-900">{product.name}</p>
                          <p className="text-sm font-semibold text-slate-800">R$ {product.price.toFixed(2)}</p>
                          <span className="mt-2 inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-900">
                            Em Destaque
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-sm text-gray-500">
                      Nenhum produto em destaque.
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Adicionar aos Destaques</h3>
                  <div className="mb-3">
                    <input
                      value={highlightsQuery}
                      onChange={(event) => setHighlightsQuery(event.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      placeholder="Buscar produtos para destacar..."
                    />
                  </div>
                  <div className="space-y-2">
                    {availableHighlights.map((product) => (
                      <div
                        key={product.id}
                        className="rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={product.imageUrl || `https://picsum.photos/seed/${product.id}/64/64`}
                            alt={product.name}
                            className="h-10 w-10 rounded-lg object-cover bg-gray-100"
                          />
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{product.name}</p>
                            <p className="text-xs text-gray-500">R$ {product.price.toFixed(2)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setProductFeatured(product, true)}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Destacar
                        </button>
                      </div>
                    ))}
                    {!availableHighlights.length && (
                      <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                        Nenhum produto disponivel para destaque.
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'clients' && (
              <section className="space-y-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">Base de Clientes</h2>
                    <p className="text-sm text-gray-500">{allCustomers.length} clientes cadastrados</p>
                  </div>
                  <div className="relative w-full max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={clientsQuery}
                      onChange={(event) => setClientsQuery(event.target.value)}
                      className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm"
                      placeholder="Buscar por nome ou telefone..."
                    />
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 overflow-x-auto">
                  <table className="w-full text-sm text-left min-w-[760px]">
                    <thead className="text-xs uppercase text-gray-400 border-b border-gray-100">
                      <tr>
                        <th className="px-3 py-3">Cliente</th>
                        <th className="px-3 py-3">Pedidos</th>
                        <th className="px-3 py-3">Total Gasto</th>
                        <th className="px-3 py-3">Ultimo Pedido</th>
                        <th className="px-3 py-3 text-right">Acoes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredCustomers.map((customer) => (
                        <tr key={customer.id}>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-900 flex items-center justify-center font-semibold">
                                {customer.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {customer.name} {customer.totalOrders >= 10 ? 'â­' : ''}
                                </p>
                                <p className="text-xs text-gray-500">{customer.whatsapp}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-gray-700">{customer.totalOrders}</td>
                          <td className="px-3 py-3">
                            <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-900">
                              R$ {customer.totalSpent.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-gray-700">
                            {customer.lastOrderAt ? new Date(customer.lastOrderAt).toLocaleDateString('pt-BR') : 'Sem pedidos'}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <a
                              href={`https://wa.me/${customer.whatsapp.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-800 font-medium hover:text-slate-900"
                            >
                              WhatsApp
                            </a>
                          </td>
                        </tr>
                      ))}
                      {!filteredCustomers.length && (
                        <tr>
                          <td colSpan={5} className="px-3 py-8 text-center text-sm text-gray-500">
                            Nenhum cliente encontrado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeTab === 'promotions' && (
              <section className="space-y-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-3xl font-semibold text-gray-900">Meus Cupons</h2>
                    <p className="text-sm text-gray-500">Crie codigos de desconto para atrair mais clientes.</p>
                  </div>
                  <button
                    onClick={openCreateCouponModal}
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-semibold hover:bg-slate-900"
                  >
                    <Plus size={14} />
                    Novo Cupom
                  </button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                  {coupons.map((coupon) => (
                    <div
                      key={coupon.id}
                      className={`rounded-xl border bg-white p-5 shadow-sm ${
                        coupon.active ? 'border-slate-200 border-b-4 border-b-slate-900' : 'border-gray-200 border-b-4 border-b-gray-300 opacity-80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`h-7 w-7 rounded-md flex items-center justify-center ${coupon.active ? 'bg-slate-100 text-slate-900' : 'bg-gray-100 text-gray-400'}`}>
                            <TicketPercent size={14} />
                          </div>
                          <div>
                            <p className="text-lg font-bold tracking-wide text-gray-900">{coupon.code}</p>
                            <p className="text-xs text-gray-500">{coupon.uses} usos</p>
                          </div>
                        </div>
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                            coupon.active ? 'bg-slate-100 text-slate-900' : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          {coupon.active ? 'ATIVO' : 'INATIVO'}
                        </span>
                      </div>

                      <div className="mt-4">
                        <p className="text-3xl font-bold leading-none text-slate-900">{formatCouponDiscount(coupon)} <span className="text-lg font-medium text-gray-500">OFF</span></p>
                        <p className="mt-1 text-sm text-gray-500">
                          Pedido minimo: <span className="font-semibold text-gray-700">{formatMoney(coupon.minOrderValue)}</span>
                        </p>
                      </div>

                      <div className="mt-3 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-500 flex items-center gap-2">
                        <Calendar size={12} />
                        {formatCouponValidity(coupon)}
                      </div>

                      <div className="mt-4 border-t border-gray-100 pt-4 flex items-center justify-between">
                        <button
                          onClick={() => toggleCouponStatus(coupon.id)}
                          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                        >
                          <Power size={14} />
                          {coupon.active ? 'Pausar' : 'Ativar'}
                        </button>
                        <button
                          onClick={() => openEditCouponModal(coupon)}
                          className="inline-flex items-center gap-2 text-sm text-slate-700 hover:text-slate-900"
                        >
                          <Pencil size={14} />
                          Editar
                        </button>
                        <button
                          onClick={() => removeCoupon(coupon.id)}
                          className="text-red-500 hover:text-red-600"
                          aria-label={`Excluir cupom ${coupon.code}`}
                          title={`Excluir cupom ${coupon.code}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {!coupons.length && (
                  <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                    Nenhum cupom criado.
                  </div>
                )}
              </section>
            )}

            {showCouponForm && (
              <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
                <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="text-2xl font-semibold text-gray-900">{editingCouponId ? 'Editar Cupom' : 'Novo Cupom'}</h3>
                  </div>

                  <div className="p-5 space-y-4">
                    <div>
                      <label className="text-sm text-gray-700">Codigo do Cupom</label>
                      <input
                        value={couponForm.code}
                        onChange={(event) => setCouponForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                        placeholder="EX: PROMO10"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-gray-700">Tipo de Desconto</label>
                        <select
                          value={couponForm.discountType}
                          onChange={(event) =>
                            setCouponForm((prev) => ({ ...prev, discountType: event.target.value as CouponDiscountType }))
                          }
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        >
                          <option value="percent">Porcentagem (%)</option>
                          <option value="fixed">Valor Fixo (R$)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-gray-700">
                          {couponForm.discountType === 'percent' ? 'Valor (%)' : 'Valor (R$)'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={couponForm.discountValue}
                          onChange={(event) => setCouponForm((prev) => ({ ...prev, discountValue: event.target.value }))}
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-gray-700">Pedido Minimo (R$)</label>
                      <input
                        type="number"
                        min="0"
                        value={couponForm.minOrderValue}
                        onChange={(event) => setCouponForm((prev) => ({ ...prev, minOrderValue: event.target.value }))}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="border-t border-gray-100 pt-3">
                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Calendar size={14} />
                        Validade (Opcional)
                      </p>
                      <div className="mt-2 grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm text-gray-700">Data Inicio</label>
                          <input
                            type="date"
                            value={couponForm.startDate}
                            onChange={(event) => setCouponForm((prev) => ({ ...prev, startDate: event.target.value }))}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-700">Data Termino</label>
                          <input
                            type="date"
                            value={couponForm.endDate}
                            onChange={(event) => setCouponForm((prev) => ({ ...prev, endDate: event.target.value }))}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-3">
                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Clock3 size={14} />
                        Horario Diario (Opcional)
                      </p>
                      <div className="mt-2 grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm text-gray-700">Hora Inicio</label>
                          <input
                            type="time"
                            value={couponForm.startTime}
                            onChange={(event) => setCouponForm((prev) => ({ ...prev, startTime: event.target.value }))}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-700">Hora Fim</label>
                          <input
                            type="time"
                            value={couponForm.endTime}
                            onChange={(event) => setCouponForm((prev) => ({ ...prev, endTime: event.target.value }))}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={couponForm.active}
                        onChange={(event) => setCouponForm((prev) => ({ ...prev, active: event.target.checked }))}
                        className="h-4 w-4 rounded border-gray-300 text-slate-800"
                      />
                      Cupom Ativo
                    </label>
                  </div>

                  <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
                    <button
                      onClick={closeCouponModal}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={saveCoupon}
                      className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
                    >
                      Salvar Cupom
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'banners' && (
              <section className="space-y-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-3xl font-semibold text-gray-900">Banners Promocionais</h2>
                    <p className="text-sm text-gray-500">Gerencie os destaques visuais e vincule produtos as promocoes.</p>
                  </div>
                  <button
                    onClick={openCreateBannerModal}
                    className="inline-flex items-center gap-2 rounded-lg bg-black text-white px-4 py-2 text-sm font-semibold hover:bg-slate-900"
                  >
                    <Plus size={14} />
                    Novo Banner
                  </button>
                </div>

                {banners.length > 0 ? (
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {banners.map((banner) => (
                      <div key={banner.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="relative">
                          <img src={banner.imageUrl} alt={banner.title} className="h-40 w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeBanner(banner.id)}
                            className="absolute right-3 top-3 h-8 w-8 rounded-full bg-white/90 text-red-500 flex items-center justify-center hover:bg-white"
                            title="Excluir banner"
                          >
                            <Trash2 size={14} />
                          </button>
                          <span className="absolute bottom-3 left-3 rounded-full bg-black px-2.5 py-1 text-xs font-semibold text-white">
                            {banner.productIds.length} produto{banner.productIds.length === 1 ? '' : 's'}
                          </span>
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">{banner.title}</h3>
                              <p className="mt-1 text-sm text-gray-500 line-clamp-1">{banner.description || 'Sem descricao'}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleBannerActive(banner.id)}
                              className={`h-6 w-11 rounded-full p-1 transition-colors ${banner.active ? 'bg-slate-1000' : 'bg-gray-300'}`}
                            >
                              <span
                                className={`block h-4 w-4 rounded-full bg-white transition-transform ${
                                  banner.active ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>
                          <button
                            onClick={() => openEditBannerModal(banner)}
                            className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Editar Detalhes
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
                    <p className="text-lg font-semibold text-gray-900">Nenhum banner criado</p>
                    <p className="mt-1 text-sm text-gray-500">Crie banners para substituir os destaques padrao do catalogo.</p>
                    <button
                      onClick={openCreateBannerModal}
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-black text-white px-4 py-2 text-sm font-semibold hover:bg-slate-900"
                    >
                      <Plus size={14} />
                      Criar primeiro banner
                    </button>
                  </div>
                )}
              </section>
            )}

            {showBannerModal && (
              <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
                <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl">
                  <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
                    <h3 className="text-2xl font-semibold text-gray-900">{editingBannerId ? 'Editar Banner' : 'Novo Banner'}</h3>
                    <button onClick={closeBannerModal} className="rounded-full p-2 text-gray-500 hover:bg-gray-100">
                      <X size={18} />
                    </button>
                  </div>

                  <div className="p-5 space-y-5">
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.1fr]">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Imagem Promocional</p>
                        <input
                          id="banner-image-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) =>
                            applyImageFile(event, (imageUrl) => setBannerForm((prev) => ({ ...prev, imageUrl })))
                          }
                        />
                        <label
                          htmlFor="banner-image-upload"
                          className="mt-2 flex h-44 w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100"
                        >
                          <span className="text-sm font-medium">{bannerForm.imageUrl ? 'Alterar imagem' : 'Clique para enviar'}</span>
                          <span className="text-xs">1200x400px (Recomendado)</span>
                        </label>
                        {bannerForm.imageUrl && (
                          <img src={bannerForm.imageUrl} alt="Preview do banner" className="mt-3 h-36 w-full rounded-lg object-cover" />
                        )}
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm text-gray-700">Titulo do Banner</label>
                          <input
                            value={bannerForm.title}
                            onChange={(event) => setBannerForm((prev) => ({ ...prev, title: event.target.value }))}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            placeholder="Ex: Terca Maluca"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-700">Descricao</label>
                          <textarea
                            value={bannerForm.description}
                            onChange={(event) => setBannerForm((prev) => ({ ...prev, description: event.target.value }))}
                            className="mt-1 h-20 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            placeholder="Ex: Todos os lanches com 20% de desconto. Aproveite!"
                          />
                        </div>
                        <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                          <input
                            type="checkbox"
                            checked={bannerForm.active}
                            onChange={(event) => setBannerForm((prev) => ({ ...prev, active: event.target.checked }))}
                            className="h-4 w-4 rounded border-gray-300 text-slate-800"
                          />
                          Banner ativo no cardapio
                        </label>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <h4 className="text-xl font-semibold text-gray-900">Produtos da Promocao</h4>
                          <p className="text-sm text-gray-500">Selecione os produtos que fazem parte deste banner.</p>
                        </div>
                        <div className="relative w-full max-w-xs">
                          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            value={bannerProductQuery}
                            onChange={(event) => setBannerProductQuery(event.target.value)}
                            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm"
                            placeholder="Buscar produto..."
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        {filteredBannerProducts.map((product) => {
                          const selected = bannerForm.productIds.includes(product.id);
                          return (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => toggleBannerProduct(product.id)}
                              className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left ${
                                selected ? 'border-slate-400 bg-slate-100' : 'border-gray-200 bg-white'
                              }`}
                            >
                              <img
                                src={product.imageUrl || 'https://picsum.photos/seed/product/80/80'}
                                alt={product.name}
                                className="h-11 w-11 rounded-md object-cover"
                              />
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{product.name}</p>
                                <p className="text-xs text-gray-500">{moneyFormatter.format(product.price)}</p>
                              </div>
                            </button>
                          );
                        })}
                        {!filteredBannerProducts.length && (
                          <div className="col-span-full rounded-lg border border-dashed border-gray-300 p-5 text-center text-sm text-gray-500">
                            Nenhum produto encontrado.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-gray-100 bg-white px-5 py-4">
                    <button
                      onClick={closeBannerModal}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={saveBanner}
                      className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
                    >
                      Salvar Banner
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showCampaignModal && (
              <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
                <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
                  <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <h3 className="text-2xl font-semibold text-gray-900">
                      {editingCampaignId ? 'Editar Campanha' : 'Nova Campanha'}
                    </h3>
                    <button onClick={closeCampaignModal} className="rounded-full p-2 text-gray-500 hover:bg-gray-100">
                      <X size={18} />
                    </button>
                  </div>

                  <div className="space-y-4 p-5">
                    <div>
                      <label className="text-sm text-gray-700">Nome da Campanha</label>
                      <input
                        value={campaignForm.name}
                        onChange={(event) => setCampaignForm((prev) => ({ ...prev, name: event.target.value }))}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        placeholder="Ex: Semana do Burger"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <label className="text-sm text-gray-700">Periodo (Opcional)</label>
                        <input
                          value={campaignForm.period}
                          onChange={(event) => setCampaignForm((prev) => ({ ...prev, period: event.target.value }))}
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          placeholder="Ex: 01/03 ate 10/03"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-700">Cupom Manual (Opcional)</label>
                        <input
                          value={campaignForm.couponCode}
                          onChange={(event) =>
                            setCampaignForm((prev) => ({
                              ...prev,
                              couponCode: event.target.value.toUpperCase()
                            }))
                          }
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          placeholder="Ex: BURGER10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-gray-700">Vincular Cupons</label>
                      <div className="mt-1 max-h-28 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-2">
                        {coupons.length ? (
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {coupons.map((coupon) => {
                              const selected = campaignForm.couponCodes.includes(coupon.code.toUpperCase());
                              return (
                                <label
                                  key={coupon.id}
                                  className={`flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 text-xs ${
                                    selected ? 'border-slate-300 bg-slate-100 text-slate-900' : 'border-gray-200 bg-white text-gray-700'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selected}
                                    onChange={() => toggleCampaignCouponCode(coupon.code)}
                                    className="h-3.5 w-3.5 rounded border-gray-300 text-slate-800"
                                  />
                                  <span className="font-medium">{coupon.code}</span>
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500">Sem cupons cadastrados na aba Promocoes.</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-gray-700">Vincular Banners</label>
                      <div className="mt-1 max-h-36 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-2">
                        {banners.length ? (
                          <div className="grid grid-cols-1 gap-2">
                            {banners.map((banner) => {
                              const selected = campaignForm.bannerIds.includes(banner.id);
                              return (
                                <label
                                  key={banner.id}
                                  className={`flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 text-xs ${
                                    selected ? 'border-slate-300 bg-slate-100 text-slate-900' : 'border-gray-200 bg-white text-gray-700'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selected}
                                    onChange={() => toggleCampaignBanner(banner.id)}
                                    className="h-3.5 w-3.5 rounded border-gray-300 text-slate-800"
                                  />
                                  <span className="font-medium">{banner.title}</span>
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500">Sem banners cadastrados na aba Banners.</p>
                        )}
                      </div>
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={campaignForm.active}
                        onChange={(event) => setCampaignForm((prev) => ({ ...prev, active: event.target.checked }))}
                        className="h-4 w-4 rounded border-gray-300 text-slate-800"
                      />
                      Campanha ativa
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-4">
                    <button
                      onClick={closeCampaignModal}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={saveCampaign}
                      className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
                    >
                      Salvar Campanha
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'marketing' && (
              <section className="space-y-4">
                <div className="rounded-xl border border-gray-200 bg-white px-4 py-4">
                  <h2 className="text-3xl font-semibold text-gray-900">Central de Marketing</h2>
                  <p className="text-sm text-gray-500">Estrategias e dados para vender mais.</p>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
                  <div className="rounded-xl border border-gray-200 bg-white p-2 h-fit">
                    {[
                      { key: 'overview' as const, label: 'Visao Geral', icon: BarChart3, disabled: false },
                      { key: 'performance' as const, label: 'Performance de Produtos', icon: ShoppingBag, disabled: false },
                      { key: 'tools' as const, label: 'Ferramentas de Divulgacao', icon: Share2, disabled: false },
                      { key: 'campaigns' as const, label: 'Campanhas', icon: Megaphone, disabled: false }
                    ].map((item) => {
                      const active = marketingSection === item.key;
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.key}
                          onClick={() => {
                            if (!item.disabled) setMarketingSection(item.key);
                          }}
                          className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition ${
                            active ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                          } ${item.disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                        >
                          <Icon size={16} />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-4">
                    {marketingSection === 'overview' && (
                      <>
                        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                          <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                              <Eye size={16} />
                            </div>
                            <p className="text-sm font-medium text-gray-600">Acessos (Mes)</p>
                            <p className="mt-1 text-3xl font-bold text-gray-900">{estimatedMonthlyViews.toLocaleString('pt-BR')}</p>
                            <p className="mt-1 text-xs text-slate-800">+12% vs mes anterior</p>
                          </div>
                          <div className="rounded-xl border border-violet-200 bg-white p-4">
                            <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                              <BarChart3 size={16} />
                            </div>
                            <p className="text-sm font-medium text-gray-600">Conversao</p>
                            <p className="mt-1 text-3xl font-bold text-gray-900">{conversionRate.toFixed(1)}%</p>
                            <p className="mt-1 text-xs text-gray-500">Media do setor: 2.5%</p>
                          </div>
                          <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-800">
                              <Wallet size={16} />
                            </div>
                            <p className="text-sm font-medium text-gray-600">Vendas Totais</p>
                            <p className="mt-1 text-3xl font-bold text-gray-900">{moneyFormatter.format(totalSalesThisMonth)}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                          <div className="rounded-xl border border-gray-200 bg-white p-4">
                            <h3 className="text-xl font-semibold text-gray-900">Funil de Vendas</h3>
                            <div className="mt-5 space-y-4">
                              {funnelBars.map((bar) => {
                                const width = estimatedMonthlyViews ? Math.max(8, (bar.value / estimatedMonthlyViews) * 100) : 8;
                                return (
                                  <div key={bar.label}>
                                    <div className="mb-1 flex items-center justify-between text-sm">
                                      <span className="text-gray-600">{bar.label}</span>
                                      <span className="font-semibold text-gray-800">{bar.value.toLocaleString('pt-BR')}</span>
                                    </div>
                                    <div className="h-3 rounded-full bg-gray-100">
                                      <div className={`h-3 rounded-full ${bar.color}`} style={{ width: `${Math.min(100, width)}%` }} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="rounded-xl border border-gray-200 bg-white p-4">
                            <h3 className="text-xl font-semibold text-gray-900">Origem do Trafego</h3>
                            <div className="mt-5 flex items-center gap-6">
                              <div
                                className="h-40 w-40 rounded-full"
                                style={{
                                  background: `conic-gradient(#22c55e 0 ${linkDirectPercent}%, #ec4899 ${linkDirectPercent}% ${
                                    linkDirectPercent + instagramPercent
                                  }%, #f59e0b ${linkDirectPercent + instagramPercent}% 100%)`
                                }}
                              >
                                <div className="m-auto mt-5 h-30 w-30 rounded-full bg-white" />
                              </div>
                              <div className="space-y-3 text-sm">
                                <p className="flex items-center gap-2 text-gray-700">
                                  <span className="h-2.5 w-2.5 rounded-full bg-slate-700" /> Link Direto (WhatsApp): {linkDirectPercent}%
                                </p>
                                <p className="flex items-center gap-2 text-gray-700">
                                  <span className="h-2.5 w-2.5 rounded-full bg-pink-500" /> Instagram: {instagramPercent}%
                                </p>
                                <p className="flex items-center gap-2 text-gray-700">
                                  <span className="h-2.5 w-2.5 rounded-full bg-slate-1000" /> Google / Outros: {othersPercent}%
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {marketingSection === 'performance' && (
                      <>
                        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                          <div className="border-b border-gray-100 px-4 py-3">
                            <h3 className="text-xl font-semibold text-gray-900">Campeoes de Venda (Curva A)</h3>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] text-sm">
                              <thead className="bg-slate-100 text-slate-900">
                                <tr>
                                  <th className="px-4 py-3 text-left">Ranking</th>
                                  <th className="px-4 py-3 text-left">Produto</th>
                                  <th className="px-4 py-3 text-right">Qtd. Vendida</th>
                                  <th className="px-4 py-3 text-right">Receita Gerada</th>
                                </tr>
                              </thead>
                              <tbody>
                                {topProducts.slice(0, 5).map((product, index) => (
                                  <tr key={product.id} className="border-t border-gray-100">
                                    <td className="px-4 py-3 font-semibold text-gray-700">{index + 1}o</td>
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-3">
                                        <img src={product.imageUrl} alt={product.name} className="h-10 w-10 rounded-lg object-cover" />
                                        <div>
                                          <p className="font-semibold text-gray-900">{product.name}</p>
                                          <p className="text-xs text-gray-500">{moneyFormatter.format(product.price)}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{product.soldQuantity}</td>
                                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                                      {moneyFormatter.format(product.revenue)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-100 p-4">
                          <h4 className="text-lg font-semibold text-slate-900">Oportunidades (Menos Vendidos)</h4>
                          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                            {leastSoldProducts.map((product) => (
                              <div key={product.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                                <p className="text-sm font-semibold text-gray-900">{product.name}</p>
                                <p className="text-xs text-gray-600">
                                  Vendidos: {product.soldQuantity} | Receita: {moneyFormatter.format(product.revenue)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {marketingSection === 'tools' && (
                      <>
                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                            <div className="border-b border-gray-100 px-4 py-3">
                              <h3 className="text-xl font-semibold text-gray-900">Seu QR Code</h3>
                            </div>
                            <div className="p-4">
                              <div className="flex flex-col items-center gap-4 md:flex-row">
                                <img
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(marketingLink)}`}
                                  alt="QR Code do cardapio"
                                  className="h-40 w-40 rounded-xl border border-gray-200 p-2"
                                />
                                <div className="text-sm text-gray-600">
                                  <p>Imprima este QR Code e coloque nas mesas ou no balcao para facilitar o acesso.</p>
                                  <div className="mt-3 flex items-center gap-2">
                                    <a
                                      href={`https://api.qrserver.com/v1/create-qr-code/?size=800x800&data=${encodeURIComponent(marketingLink)}`}
                                      download="qrcode-cardapio.png"
                                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
                                    >
                                      Baixar
                                    </a>
                                    <button
                                      onClick={() => window.print()}
                                      className="rounded-lg bg-black px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-900"
                                    >
                                      Imprimir
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                            <div className="border-b border-gray-100 px-4 py-3">
                              <h3 className="text-xl font-semibold text-gray-900">Link do Cardapio</h3>
                            </div>
                            <div className="space-y-3 p-4">
                              <div className="flex items-center gap-2">
                                <input
                                  readOnly
                                  value={marketingLink}
                                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
                                />
                                <button
                                  onClick={() => navigator.clipboard.writeText(marketingLink)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-black px-3 py-2 text-sm font-semibold text-white hover:bg-slate-900"
                                >
                                  <Copy size={14} />
                                  Copiar
                                </button>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  onClick={() =>
                                    window.open(`https://wa.me/?text=${encodeURIComponent(`Confira nosso cardapio: ${marketingLink}`)}`, '_blank')
                                  }
                                  className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                                >
                                  WhatsApp
                                </button>
                                <button
                                  onClick={() =>
                                    window.open(
                                      `https://www.instagram.com/?url=${encodeURIComponent(marketingLink)}`,
                                      '_blank'
                                    )
                                  }
                                  className="rounded-lg bg-pink-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-pink-600"
                                >
                                  Stories
                                </button>
                                <button
                                  onClick={() =>
                                    window.open(
                                      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(marketingLink)}`,
                                      '_blank'
                                    )
                                  }
                                  className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-900"
                                >
                                  Facebook
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                          <div className="border-b border-gray-100 px-4 py-3">
                            <h3 className="text-xl font-semibold text-gray-900">Materiais de Campanha (Flyers)</h3>
                          </div>
                          <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
                            <button
                              onClick={openFlyerOffers}
                              className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-left hover:bg-gray-100"
                            >
                              <p className="flex items-center gap-2 text-base font-semibold text-gray-900">
                                <Megaphone size={16} className="text-slate-700" />
                                Flyer de Ofertas
                              </p>
                              <p className="mt-1 text-sm text-gray-600">Gerar material com banners ativos e top produtos para imprimir/salvar PDF.</p>
                            </button>
                            <button
                              onClick={openDigitalBusinessCard}
                              className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-left hover:bg-gray-100"
                            >
                              <p className="flex items-center gap-2 text-base font-semibold text-gray-900">
                                <QrCode size={16} className="text-slate-700" />
                                Cartao Digital
                              </p>
                              <p className="mt-1 text-sm text-gray-600">Abrir cartao com QR Code, link e dados da loja para divulgacao.</p>
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    {marketingSection === 'campaigns' && (
                      <div className="space-y-4">
                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900">Campanhas de Marketing</h3>
                              <p className="text-sm text-gray-500">Crie campanhas para organizar cupons, periodos e objetivos.</p>
                            </div>
                            <button
                              onClick={openCreateCampaignModal}
                              className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
                            >
                              <Plus size={14} />
                              Nova Campanha
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                          <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <p className="text-sm text-gray-600">Total de Campanhas</p>
                            <p className="mt-1 text-3xl font-bold text-gray-900">{marketingCampaigns.length}</p>
                          </div>
                          <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <p className="text-sm text-gray-600">Campanhas Ativas</p>
                            <p className="mt-1 text-3xl font-bold text-slate-900">
                              {marketingCampaigns.filter((item) => item.active).length}
                            </p>
                          </div>
                          <div className="rounded-xl border border-gray-200 bg-white p-4">
                            <p className="text-sm text-gray-600">Ultima Atualizacao</p>
                            <p className="mt-1 text-sm font-semibold text-gray-900">
                              {marketingCampaigns[0]?.createdAt
                                ? new Date(marketingCampaigns[0].createdAt).toLocaleString('pt-BR')
                                : 'Sem campanhas'}
                            </p>
                          </div>
                        </div>

                        {marketingCampaigns.length > 0 ? (
                          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                            {marketingCampaigns.map((campaign) => (
                              <div key={campaign.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <h4 className="text-lg font-semibold text-gray-900">{campaign.name}</h4>
                                    <p className="text-xs text-gray-500">
                                      Criada em {new Date(campaign.createdAt).toLocaleDateString('pt-BR')}
                                    </p>
                                  </div>
                                  <span
                                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                      campaign.active ? 'bg-slate-100 text-slate-900' : 'bg-gray-100 text-gray-600'
                                    }`}
                                  >
                                    {campaign.active ? 'Ativa' : 'Inativa'}
                                  </span>
                                </div>

                                <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                                  <p>
                                    <span className="font-semibold">Cupons:</span>{' '}
                                    {(campaign.couponCodes?.length
                                      ? campaign.couponCodes.join(', ')
                                      : campaign.couponCode || 'Nao informado')}
                                  </p>
                                  <p className="mt-1">
                                    <span className="font-semibold">Periodo:</span> {campaign.period || 'Nao informado'}
                                  </p>
                                  <p className="mt-1">
                                    <span className="font-semibold">Banners vinculados:</span> {campaign.bannerIds?.length ?? 0}
                                  </p>
                                </div>

                                <div className="mt-4 flex items-center gap-2">
                                  <button
                                    onClick={() => toggleCampaignActive(campaign.id)}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                      campaign.active
                                        ? 'border border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200'
                                        : 'border border-slate-200 bg-slate-100 text-slate-900 hover:bg-slate-100'
                                    }`}
                                  >
                                    {campaign.active ? 'Pausar' : 'Ativar'}
                                  </button>
                                  <button
                                    onClick={() => openEditCampaignModal(campaign)}
                                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => removeCampaign(campaign.id)}
                                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                                  >
                                    Remover
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                              <Megaphone size={20} className="text-gray-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900">Nenhuma campanha criada</h3>
                            <p className="mt-1 text-sm text-gray-500">Crie sua primeira campanha para organizar suas acoes.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'support' && (
              <section className="mx-auto max-w-5xl space-y-4">
                <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 flex items-center justify-between">
                  <p className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-1000" />
                    Todos os sistemas operacionais
                  </p>
                  <button className="text-xs text-slate-800 hover:text-slate-900">Ver historico</button>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_2fr]">
                  <div className="space-y-4">
                    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                      <div className="border-b border-gray-100 px-4 py-3">
                        <h3 className="text-2xl font-semibold text-gray-900">Fale Conosco</h3>
                      </div>
                      <div className="p-4 space-y-3">
                        <button
                          onClick={openSupportChat}
                          disabled={supportOpening}
                          className="w-full rounded-lg bg-black text-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-900 inline-flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                          <MessageSquare size={15} />
                          {supportOpening ? 'Abrindo...' : 'Abrir chamado'}
                        </button>
                        <a
                          href="mailto:support@pedezap.site?subject=Suporte%20PedeZap%20-%20Painel%20Restaurante"
                          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 inline-flex items-center justify-center gap-2"
                        >
                          <Mail size={15} />
                          Enviar Email
                        </a>
                        <p className="pt-1 text-center text-xs text-gray-400">Seg a Sex, das 09h as 18h</p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                      <div className="border-b border-gray-100 px-4 py-3">
                        <h3 className="text-2xl font-semibold text-gray-900">Tutoriais em Video</h3>
                      </div>
                      <div className="p-4 space-y-4">
                        {tutorialItems.map((item) => (
                          <button
                            key={item}
                            className="w-full text-left inline-flex items-center gap-3 text-sm text-gray-700 hover:text-gray-900"
                          >
                            <PlayCircle size={18} className="text-red-500" />
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                    <div className="border-b border-gray-100 px-4 py-3">
                      <h3 className="text-2xl font-semibold text-gray-900">Perguntas Frequentes</h3>
                    </div>
                    <div className="p-4">
                      {faqItems.map((question, index) => (
                        <button
                          key={question}
                          className={`w-full py-4 text-left flex items-center justify-between gap-3 ${
                            index !== faqItems.length - 1 ? 'border-b border-gray-100' : ''
                          }`}
                        >
                          <span className="text-sm font-medium text-gray-800">{question}</span>
                          <ChevronDown size={16} className="text-gray-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

                        {activeTab === 'plans' && (
              <section className="mx-auto max-w-5xl space-y-5">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-black p-6 text-white shadow-lg">
                  <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full border border-slate-300/40" />
                  <div className="absolute right-10 top-0 h-full w-20 -skew-x-12 bg-slate-400/20" />
                  <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-full bg-white/15 flex items-center justify-center">
                        <ShieldCheck size={30} />
                      </div>
                      <div>
                        <h2 className="text-4xl font-bold leading-none">
                          {subscriptionSummary?.status === 'trial' ? 'Periodo de Teste Ativo' : 'Gestao da Assinatura'}
                        </h2>
                        <p className="mt-2 text-sm text-slate-300">
                          {subscriptionSummary?.status === 'trial'
                            ? `Voce tem ${subscriptionSummary.trialDaysLeft} dia(s) gratis restantes.`
                            : 'Selecione um plano e gerencie sua renovacao com a Stripe.'}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/20 bg-white/10 px-5 py-3">
                      <p className="text-[10px] uppercase tracking-wider text-slate-300 font-semibold">Status</p>
                      <p className="mt-1 text-2xl font-bold">{subscriptionStatusLabel}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
                  <div className="rounded-2xl border border-gray-200 bg-white p-5">
                    <h3 className="text-xl font-semibold text-gray-900">Plano Atual</h3>
                    {currentSubscribedPlan ? (
                      <div className="mt-4 space-y-4">
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-lg font-bold text-gray-900">{currentSubscribedPlan.name}</p>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${subscriptionStatusTone}`}>
                              {subscriptionStatusLabel}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-gray-600">{currentSubscribedPlan.description}</p>
                          <p className="mt-3 text-lg font-bold text-gray-900">
                            {moneyFormatter.format(currentSubscribedPlan.price)} <span className="text-xs text-gray-500">/mes</span>
                          </p>
                        </div>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          {currentSubscribedPlan.features.map((feature) => (
                            <div
                              key={feature}
                              className="rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3 text-sm font-medium text-gray-700 flex items-center gap-2"
                            >
                              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-800 text-xs">
                                ok
                              </span>
                              {feature}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-100 p-4 text-sm text-slate-800">
                        Nenhum plano ativo no momento. Escolha um plano abaixo para efetuar a contratacao.
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-gray-200 bg-white p-5">
                      <h3 className="text-xl font-semibold text-gray-900">Faturamento</h3>
                      <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Proxima renovacao</p>
                        <p className="mt-2 text-base font-bold text-gray-900">
                          {subscriptionSummary?.nextBillingAt
                            ? new Date(subscriptionSummary.nextBillingAt).toLocaleDateString('pt-BR')
                            : 'A definir'}
                        </p>
                      </div>
                      {subscriptionSummary?.trialEndsAt && subscriptionSummary.status === 'trial' && (
                        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-100 p-4">
                          <p className="text-[11px] uppercase tracking-wide text-slate-700 font-semibold">Fim do teste gratis</p>
                          <p className="mt-2 text-base font-bold text-slate-900">
                            {new Date(subscriptionSummary.trialEndsAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-100 p-4 text-xs text-slate-800">
                      Pagamentos e renovacoes sao processados pela Stripe.
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xl font-semibold text-gray-900">Planos Disponiveis</h3>
                    {plansLoading && <span className="text-xs text-gray-500">Carregando...</span>}
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {availablePlans.map((plan) => {
                      const isCurrent = subscriptionSummary?.subscribedPlanId === plan.id;
                      const actionLabel =
                        subscriptionSummary?.status === 'active' && isCurrent
                          ? 'Plano Atual'
                          : subscriptionSummary?.status === 'active'
                            ? 'Renovar Assinatura'
                            : 'Efetuar Contratacao';
                      return (
                        <div key={plan.id} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                          <div className="h-1.5" style={{ backgroundColor: plan.color }} />
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-lg font-bold text-gray-900">{plan.name}</p>
                              {isCurrent && (
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-900">
                                  Atual
                                </span>
                              )}
                            </div>
                            <p className="mt-2 text-sm text-gray-600">{plan.description}</p>
                            <p className="mt-3 text-2xl font-black text-gray-900">
                              {moneyFormatter.format(plan.price)} <span className="text-xs font-medium text-gray-500">/mes</span>
                            </p>
                            <div className="mt-3 space-y-1">
                              {plan.features.slice(0, 4).map((feature) => (
                                <p key={`${plan.id}_${feature}`} className="text-xs text-gray-600">
                                  - {feature}
                                </p>
                              ))}
                            </div>
                            <button
                              disabled={planCheckoutLoadingId === plan.id || (subscriptionSummary?.status === 'active' && isCurrent)}
                              onClick={() => handleStartPlanCheckout(plan.id)}
                              className="mt-4 w-full rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
                            >
                              {planCheckoutLoadingId === plan.id ? 'Gerando checkout...' : actionLabel}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {!availablePlans.length && (
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                        Nenhum plano ativo cadastrado no painel admin.
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>

      {showManualOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-start justify-center overflow-y-auto p-3 sm:items-center sm:p-4">
          <div className="w-full max-w-4xl rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-2xl font-semibold text-gray-900">Novo Pedido Manual</h3>
              <button
                onClick={() => {
                  setShowManualOrderModal(false);
                  setManualOrderForm(createDefaultManualOrderForm());
                  setManualSelectedProductId('');
                  setManualSelectedQuantity(1);
                }}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 p-5 flex-1 overflow-y-auto">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">Dados do Cliente</h4>
                <div>
                  <label className="text-sm text-gray-700">Nome do Cliente</label>
                  <input
                    value={manualOrderForm.customerName}
                    onChange={(event) =>
                      setManualOrderForm((prev) => ({ ...prev, customerName: event.target.value }))
                    }
                    placeholder="Ex: Joao Silva"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-700">Telefone / WhatsApp</label>
                  <input
                    value={manualOrderForm.customerWhatsapp}
                    onChange={(event) =>
                      setManualOrderForm((prev) => ({ ...prev, customerWhatsapp: event.target.value }))
                    }
                    placeholder="Ex: 11999999999"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-700">Endereco de Entrega</label>
                  <textarea
                    value={manualOrderForm.customerAddress}
                    onChange={(event) =>
                      setManualOrderForm((prev) => ({ ...prev, customerAddress: event.target.value }))
                    }
                    placeholder="Rua, Numero, Bairro, Complemento..."
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm resize-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-700">Forma de Pagamento</label>
                  <select
                    value={manualOrderForm.paymentMethod}
                    onChange={(event) =>
                      setManualOrderForm((prev) => ({
                        ...prev,
                        paymentMethod: event.target.value as ManualOrderPaymentMethod
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                  >
                    <option value="money">Dinheiro</option>
                    <option value="card">Cartao</option>
                    <option value="pix">PIX</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">Itens do Pedido</h4>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_82px_auto]">
                  <select
                    value={manualSelectedProductId}
                    onChange={(event) => setManualSelectedProductId(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                  >
                    <option value="">Selecione um produto...</option>
                    {manualOrderProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} - R$ {product.price.toFixed(2)}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={manualSelectedQuantity}
                    onChange={(event) => setManualSelectedQuantity(Number(event.target.value) || 1)}
                    className="w-full rounded-lg border border-gray-300 px-2 py-2.5 text-sm"
                  />
                  <button
                    type="button"
                    onClick={addItemToManualOrder}
                    className="w-full rounded-lg bg-slate-100 px-3 py-2.5 text-slate-900 text-sm font-semibold hover:bg-slate-200"
                  >
                    Adicionar
                  </button>
                </div>

                <div className="rounded-lg border border-gray-200 min-h-[180px] max-h-[220px] overflow-y-auto p-3">
                  {manualOrderForm.items.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm text-gray-400">
                      Nenhum item adicionado
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {manualOrderForm.items.map((item) => {
                        const product = manualOrderProducts.find((entry) => entry.id === item.productId);
                        if (!product) return null;
                        return (
                          <div key={item.productId} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {item.quantity}x {product.name}
                              </p>
                              <p className="text-xs text-gray-500">R$ {(product.price * item.quantity).toFixed(2)}</p>
                            </div>
                            <button
                              onClick={() => removeItemFromManualOrder(item.productId)}
                              className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                            >
                              Remover
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-semibold text-gray-800">TOTAL DO PEDIDO</span>
                  <span className="text-2xl font-bold text-slate-900 sm:text-3xl">R$ {manualOrderTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
              <button
                onClick={() => {
                  setShowManualOrderModal(false);
                  setManualOrderForm(createDefaultManualOrderForm());
                  setManualSelectedProductId('');
                  setManualSelectedQuantity(1);
                }}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 sm:w-auto"
              >
                Cancelar
              </button>
              <button
                onClick={createManualOrder}
                disabled={creatingManualOrder}
                className="w-full rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60 sm:w-auto"
              >
                {creatingManualOrder ? 'Criando...' : 'Criar Pedido'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSupportChat && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl h-[80vh] rounded-2xl border border-gray-200 bg-white shadow-2xl flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Chat de Suporte</h3>
                <p className="text-xs text-gray-500">
                  {supportTicket ? `Chamado #${supportTicket.id} - ${supportTicket.status}` : 'Abrindo chamado...'}
                </p>
              </div>
              <button
                onClick={() => setShowSupportChat(false)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Fechar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:18px_18px]">
              {supportError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{supportError}</p>
              )}
              {!supportMessages.length && !supportOpening && (
                <p className="text-sm text-gray-500">Escreva sua primeira mensagem para abrir o atendimento.</p>
              )}
              {supportMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.authorRole === 'customer' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow ${
                      msg.authorRole === 'customer'
                        ? 'bg-black text-white'
                        : 'bg-white border border-gray-200 text-gray-700'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.body}</p>
                    {msg.attachments?.length ? (
                      <div className="mt-2 space-y-1">
                        {msg.attachments.map((attachment, index) => (
                          <a
                            key={`${msg.id}-att-${index}`}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={attachment.name}
                            className={`block rounded-lg border px-2 py-1 text-xs ${
                              msg.authorRole === 'customer'
                                ? 'border-white/30 text-white/90 hover:bg-white/10'
                                : 'border-gray-200 text-slate-700 hover:bg-gray-50'
                            }`}
                          >
                            Anexo: {attachment.name}
                          </a>
                        ))}
                      </div>
                    ) : null}
                    <span className="mt-2 block text-[10px] opacity-70">
                      {msg.authorName} - {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 p-4">
              <div className="rounded-xl border border-gray-200 p-3">
                <textarea
                  value={supportDraft}
                  onChange={(event) => setSupportDraft(event.target.value)}
                  placeholder="Descreva seu problema para o suporte..."
                  className="w-full h-24 resize-none text-sm outline-none"
                />
                {supportAttachment ? (
                  <div className="mt-2 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                    <span className="truncate pr-3">Anexo: {supportAttachment.name}</span>
                    <button
                      type="button"
                      onClick={() => setSupportAttachment(null)}
                      className="rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100"
                    >
                      Remover
                    </button>
                  </div>
                ) : null}
                <div className="mt-2 flex items-center justify-between">
                  <div>
                    <input
                      id="support-attachment-upload"
                      type="file"
                      className="hidden"
                      onChange={handleSupportAttachmentUpload}
                    />
                    <label
                      htmlFor="support-attachment-upload"
                      className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      <Paperclip size={13} />
                      Anexar arquivo
                    </label>
                  </div>
                  <button
                    onClick={sendSupportMessage}
                    disabled={supportSending || (!supportDraft.trim() && !supportAttachment) || !supportTicket}
                    className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-60"
                  >
                    {supportSending ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProductForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">{productForm.id ? 'Editar Produto' : 'Novo Produto'}</h3>
                <p className="text-xs text-gray-500">Preencha as informacoes abaixo</p>
              </div>
              <button
                onClick={() => {
                  setShowProductForm(false);
                  setProductForm(createDefaultProductForm(selectedCategoryId ?? ''));
                }}
                className="rounded-lg px-2 py-1 text-gray-400 hover:bg-gray-100"
              >
                x
              </button>
            </div>
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {[
                  { key: 'padrao' as const, title: 'Padrao', subtitle: 'Lanches, Pratos, Porcoes', icon: 'PD' },
                  { key: 'pizza' as const, title: 'Pizza', subtitle: 'Sabores, Bordas, Tamanhos', icon: 'PZ' },
                  { key: 'bebida' as const, title: 'Bebida', subtitle: 'Refrigerantes, Sucos, Alcoolicos', icon: 'BB' },
                  { key: 'acai' as const, title: 'Acai', subtitle: 'Tamanhos, Frutas e Coberturas', icon: 'AC' }
                ].map((kind) => {
                  const active = productForm.kind === kind.key;
                  return (
                    <button
                      key={kind.key}
                      onClick={() => setProductForm((prev) => ({ ...prev, kind: kind.key }))}
                      className={`rounded-xl border p-4 text-left transition ${
                        active ? 'border-slate-900 bg-slate-100 shadow-sm' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xl">{kind.icon}</span>
                        {active && <span className="text-slate-800 text-xs font-semibold">ok</span>}
                      </div>
                      <p className="mt-2 font-semibold text-gray-900">{kind.title}</p>
                      <p className="text-[11px] text-gray-500">{kind.subtitle}</p>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-[96px_1fr] gap-4">
                  <div className="h-24 w-24 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-400 bg-gray-50">
                    {productForm.imageUrl ? (
                      <img src={productForm.imageUrl} alt="Preview" className="h-full w-full object-cover rounded-lg" />
                    ) : (
                      <span className="text-xs">Upload</span>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500">Nome do Produto</label>
                      <input
                        value={productForm.name ?? ''}
                        onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        placeholder={
                          productForm.kind === 'pizza'
                            ? 'Ex: Pizza Grande (8 Fatias)'
                            : productForm.kind === 'acai'
                            ? 'Ex: Acai 500ml'
                            : 'Ex: X-Bacon'
                        }
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500">Categoria</label>
                        <select
                          value={productForm.categoryId ?? ''}
                          onChange={(event) => setProductForm((prev) => ({ ...prev, categoryId: event.target.value }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        >
                          <option value="">Selecione</option>
                          {availableProductCategories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name} {!category.active ? '(Inativa)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Imagem do Produto</label>
                        <input
                          id="product-image-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleProductImageUpload}
                        />
                        <div className="mt-1 flex items-center gap-2">
                          <label
                            htmlFor="product-image-upload"
                            className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            {productForm.imageUrl ? 'Trocar imagem' : 'Enviar imagem'}
                          </label>
                          {productForm.imageUrl ? (
                            <button
                              type="button"
                              onClick={() => setProductForm((prev) => ({ ...prev, imageUrl: '' }))}
                              className="inline-flex items-center justify-center rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              Remover
                            </button>
                          ) : null}
                        </div>
                        <p className="mt-1 text-[11px] text-gray-400">PNG, JPG ou WEBP.</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Descricao / Ingredientes</label>
                      <textarea
                        value={productForm.description ?? ''}
                        onChange={(event) => setProductForm((prev) => ({ ...prev, description: event.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm h-20 resize-none"
                        placeholder="Descreva os detalhes deste item..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {productForm.kind === 'pizza' && (
                <>
                  <div className="rounded-xl border border-slate-200">
                    <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">Sabores da Pizza</p>
                        <p className="text-[11px] text-gray-500">Adicione todos os sabores disponiveis</p>
                      </div>
                      <span className="text-[10px] rounded-full bg-slate-100 px-2 py-1 text-slate-800 font-semibold">
                        {productForm.pizzaFlavors.length} sabores
                      </span>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_120px_44px] gap-2">
                        <input
                          value={productForm.draftFlavorName}
                          onChange={(event) => setProductForm((prev) => ({ ...prev, draftFlavorName: event.target.value }))}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          placeholder="Nome do sabor"
                        />
                        <input
                          value={productForm.draftFlavorIngredients}
                          onChange={(event) => setProductForm((prev) => ({ ...prev, draftFlavorIngredients: event.target.value }))}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          placeholder="Ingredientes"
                        />
                        <input
                          value={productForm.draftFlavorPrice}
                          onChange={(event) => setProductForm((prev) => ({ ...prev, draftFlavorPrice: event.target.value }))}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          placeholder="R$ 25,90"
                        />
                        <button onClick={addPizzaFlavor} className="rounded-lg bg-slate-1000 text-white hover:bg-slate-900">
                          <Plus size={16} className="mx-auto" />
                        </button>
                      </div>
                      <div className="space-y-2">
                        {productForm.pizzaFlavors.map((flavor, idx) => (
                          <div key={`${flavor.name}-${idx}`} className="rounded-lg border border-gray-200 px-3 py-2 text-sm flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{flavor.name}</p>
                              <p className="text-xs text-gray-500">{flavor.ingredients}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-slate-800 font-semibold">R$ {flavor.price.toFixed(2)}</span>
                              <button onClick={() => removePizzaFlavor(idx)} className="text-red-500 hover:text-red-600">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {!productForm.pizzaFlavors.length && (
                          <div className="rounded-lg bg-gray-50 border border-gray-200 py-6 text-center text-xs text-gray-500">
                            Nenhum sabor adicionado ainda.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-4">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <input
                        type="checkbox"
                        checked={productForm.hasStuffedCrust}
                        onChange={(event) =>
                          setProductForm((prev) => ({ ...prev, hasStuffedCrust: event.target.checked }))
                        }
                      />
                      Bordas Recheadas
                    </label>
                    {productForm.hasStuffedCrust && (
                      <div className="mt-3 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_44px] gap-2">
                          <input
                            value={productForm.draftCrustName}
                            onChange={(event) => setProductForm((prev) => ({ ...prev, draftCrustName: event.target.value }))}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            placeholder="Nome da borda (Ex: Catupiry)"
                          />
                          <input
                            value={productForm.draftCrustPrice}
                            onChange={(event) => setProductForm((prev) => ({ ...prev, draftCrustPrice: event.target.value }))}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            placeholder="R$ 0,00"
                          />
                          <button onClick={addPizzaCrust} className="rounded-lg bg-slate-1000 text-white hover:bg-black">
                            <Plus size={16} className="mx-auto" />
                          </button>
                        </div>
                        <div className="space-y-2">
                          {productForm.crusts.map((crust, idx) => (
                            <div key={`${crust.name}-${idx}`} className="rounded-lg border border-gray-200 px-3 py-2 text-sm flex items-center justify-between">
                              <p className="font-medium text-gray-900">{crust.name}</p>
                              <div className="flex items-center gap-3">
                                <span className="text-slate-800 font-semibold">R$ {crust.price.toFixed(2)}</span>
                                <button onClick={() => removePizzaCrust(idx)} className="text-red-500 hover:text-red-600">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {productForm.kind === 'acai' ? (
                <div className="rounded-xl border border-violet-200 bg-violet-50/30 p-4 space-y-4">
                  <div className="flex items-start justify-between gap-3 border-b border-violet-100 pb-3">
                    <div>
                      <p className="font-semibold text-gray-900">Grupos de Adicionais</p>
                      <p className="text-[11px] text-gray-500">Ex: "Escolha as Frutas", "Caldas", "Adicionais Pagos".</p>
                    </div>
                    <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-semibold text-violet-700">
                      {productForm.acaiComplementGroups.length} grupos
                    </span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Criar novo grupo de adicionais</p>
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_84px_84px_44px] gap-2">
                      <input
                        value={productForm.draftAcaiGroupName}
                        onChange={(event) => setProductForm((prev) => ({ ...prev, draftAcaiGroupName: event.target.value }))}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                        placeholder="Nome do Grupo (Ex: Frutas)"
                      />
                      <input
                        type="number"
                        min={0}
                        value={productForm.draftAcaiGroupMinSelect}
                        onChange={(event) => setProductForm((prev) => ({ ...prev, draftAcaiGroupMinSelect: event.target.value }))}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-center"
                        placeholder="Min"
                      />
                      <input
                        type="number"
                        min={0}
                        value={productForm.draftAcaiGroupMaxSelect}
                        onChange={(event) => setProductForm((prev) => ({ ...prev, draftAcaiGroupMaxSelect: event.target.value }))}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-center"
                        placeholder="Max"
                      />
                      <button onClick={addAcaiComplementGroup} className="rounded-lg bg-violet-500 text-white hover:bg-violet-600">
                        <Plus size={16} className="mx-auto" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {productForm.acaiComplementGroups.map((group) => (
                      <div key={group.id} className="rounded-lg border border-violet-100 bg-white p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="rounded bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                                {group.minSelect === 0 ? 'OPCIONAL' : 'OBRIGATORIO'}
                              </span>
                              <p className="font-semibold text-gray-900">{group.name}</p>
                              <span className="text-xs text-gray-500">Escolha ate {group.maxSelect}</span>
                            </div>
                          </div>
                          <button onClick={() => removeAcaiComplementGroup(group.id)} className="text-red-500 hover:text-red-600">
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="mt-2 space-y-2">
                          <div className="grid grid-cols-1 md:grid-cols-[1fr_110px_120px_40px] gap-2">
                            <div className="space-y-1">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Item</p>
                              <input
                                value={acaiDraftItemByGroup[group.id]?.name ?? ''}
                                onChange={(event) =>
                                  setAcaiDraftItemByGroup((prev) => ({
                                    ...prev,
                                    [group.id]: {
                                      name: event.target.value,
                                      price: prev[group.id]?.price ?? '0',
                                      maxQty: prev[group.id]?.maxQty ?? '1'
                                    }
                                  }))
                                }
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                placeholder="Novo Item (Ex: Leite Ninho)"
                              />
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Preco</p>
                              <input
                                value={acaiDraftItemByGroup[group.id]?.price ?? '0'}
                                onChange={(event) =>
                                  setAcaiDraftItemByGroup((prev) => ({
                                    ...prev,
                                    [group.id]: {
                                      name: prev[group.id]?.name ?? '',
                                      price: event.target.value,
                                      maxQty: prev[group.id]?.maxQty ?? '1'
                                    }
                                  }))
                                }
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                placeholder="R$ 0,00"
                              />
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Max por item</p>
                              <input
                                type="number"
                                min={1}
                                value={acaiDraftItemByGroup[group.id]?.maxQty ?? '1'}
                                onChange={(event) =>
                                  setAcaiDraftItemByGroup((prev) => ({
                                    ...prev,
                                    [group.id]: {
                                      name: prev[group.id]?.name ?? '',
                                      price: prev[group.id]?.price ?? '0',
                                      maxQty: event.target.value
                                    }
                                  }))
                                }
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                placeholder="Max"
                              />
                            </div>
                            <button
                              onClick={() => addAcaiComplementItem(group.id)}
                              className="rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 mt-5"
                            >
                              <Plus size={16} className="mx-auto" />
                            </button>
                          </div>
                          {group.items.map((item) => (
                            <div key={item.id} className="rounded-md border border-gray-200 px-3 py-2 text-sm flex items-center justify-between">
                              <p className="font-medium text-gray-900">
                                {item.name} <span className="text-gray-500">(max {item.maxQty}x)</span>
                              </p>
                              <div className="flex items-center gap-3">
                                <span className="text-slate-800 font-semibold">R$ {item.price.toFixed(2)}</span>
                                <button onClick={() => removeAcaiComplementItem(group.id, item.id)} className="text-red-500 hover:text-red-600">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                          {!group.items.length && (
                            <div className="rounded-md bg-gray-50 border border-gray-200 py-3 text-center text-xs text-gray-500">
                              Nenhum item nesta categoria.
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {!productForm.acaiComplementGroups.length && (
                      <div className="rounded-lg bg-gray-50 border border-gray-200 py-4 text-center text-xs text-gray-500">
                        Nenhuma categoria de complemento criada.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">Complementos (Opcional)</p>
                      <p className="text-[11px] text-gray-500">
                        Ex: queijo extra, bacon, maionese especial.
                      </p>
                    </div>
                    <span className="text-[10px] rounded-full bg-slate-100 px-2 py-1 text-slate-800 font-semibold">
                      {productForm.complements.length} itens
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_44px] gap-2">
                    <input
                      value={productForm.draftComplementName}
                      onChange={(event) => setProductForm((prev) => ({ ...prev, draftComplementName: event.target.value }))}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      placeholder="Nome do complemento"
                    />
                    <input
                      value={productForm.draftComplementPrice}
                      onChange={(event) => setProductForm((prev) => ({ ...prev, draftComplementPrice: event.target.value }))}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      placeholder="R$ 0,00"
                    />
                    <button onClick={addProductComplement} className="rounded-lg bg-slate-1000 text-white hover:bg-black">
                      <Plus size={16} className="mx-auto" />
                    </button>
                  </div>

                  <div className="mt-3 space-y-2">
                    {productForm.complements.map((complement, idx) => (
                      <div key={`${complement.name}-${idx}`} className="rounded-lg border border-gray-200 px-3 py-2 text-sm flex items-center justify-between">
                        <p className="font-medium text-gray-900">{complement.name}</p>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-800 font-semibold">R$ {complement.price.toFixed(2)}</span>
                          <button onClick={() => removeProductComplement(idx)} className="text-red-500 hover:text-red-600">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {!productForm.complements.length && (
                      <div className="rounded-lg bg-gray-50 border border-gray-200 py-4 text-center text-xs text-gray-500">
                        Nenhum complemento cadastrado.
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-gray-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">
                      {productForm.kind === 'pizza' ? 'Preco Base (calculado pelos sabores)' : 'Preco de Venda'}
                    </label>
                    <input
                      value={productForm.price ?? ''}
                      onChange={(event) => setProductForm((prev) => ({ ...prev, price: Number(event.target.value) }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      type="number"
                      step="0.01"
                      disabled={productForm.kind === 'pizza'}
                    />
                  </div>
                  {productForm.kind === 'bebida' && (
                    <label className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-800 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={productForm.alcoholic}
                        onChange={(event) => setProductForm((prev) => ({ ...prev, alcoholic: event.target.checked }))}
                      />
                      Bebida Alcoolica (+18)
                    </label>
                  )}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={productForm.active ?? true}
                  onChange={(event) => setProductForm((prev) => ({ ...prev, active: event.target.checked }))}
                />
                Produto Ativo
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={productForm.featured}
                  onChange={(event) => setProductForm((prev) => ({ ...prev, featured: event.target.checked }))}
                />
                Destaque
              </label>
              <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowProductForm(false);
                  setProductForm(createDefaultProductForm(selectedCategoryId ?? ''));
                }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={saveProduct}
                className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-slate-900"
              >
                Salvar Produto
              </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}





