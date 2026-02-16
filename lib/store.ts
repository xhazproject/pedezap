import { promises as fs } from "node:fs";
import path from "node:path";
import { AppStore, Restaurant, defaultStore } from "@/lib/store-data";
import { prisma } from "@/lib/prisma";

const defaultSeedPath = path.join(process.cwd(), "data", "store.json");
const DB_STATE_KEY = "app_store";
let dbSchemaReady: Promise<boolean> | null = null;
const runtimeStorePath = (() => {
  if (process.env.STORE_FILE_PATH) return process.env.STORE_FILE_PATH;
  if (process.env.STORE_DATA_DIR) return path.join(process.env.STORE_DATA_DIR, "store.json");
  if (process.env.RENDER_DISK_PATH) return path.join(process.env.RENDER_DISK_PATH, "store.json");
  if (process.env.NODE_ENV === "production") {
    // Render and similar hosts keep app dir read-only in runtime; /tmp is writable.
    return path.join("/tmp", "pedezap-data", "store.json");
  }
  return path.join(process.cwd(), "data", "store.json");
})();

export function getNormalizedSubscriptionStatus(
  restaurant: Pick<Restaurant, "subscriptionStatus" | "trialEndsAt" | "nextBillingAt">
): "trial" | "active" | "pending_payment" | "expired" | "canceled" {
  const now = new Date();
  const graceDays = 10;
  const graceMs = graceDays * 24 * 60 * 60 * 1000;
  const status = restaurant.subscriptionStatus ?? "active";
  const trialEndsAt = restaurant.trialEndsAt ? new Date(restaurant.trialEndsAt) : null;
  const nextBillingAt = restaurant.nextBillingAt ? new Date(restaurant.nextBillingAt) : null;

  if (status === "canceled") return "canceled";
  if (status === "trial" && trialEndsAt && trialEndsAt < now) return "expired";
  if (status === "active" && nextBillingAt && nextBillingAt < now) {
    const graceLimit = nextBillingAt.getTime() + graceMs;
    if (now.getTime() > graceLimit) return "expired";
    return "active";
  }
  if (status === "pending_payment") {
    if (trialEndsAt && trialEndsAt < now) return "expired";
    if (nextBillingAt && nextBillingAt < now) {
      const graceLimit = nextBillingAt.getTime() + graceMs;
      if (now.getTime() > graceLimit) return "expired";
    }
  }

  return status;
}

export function isSubscriptionBlocked(
  restaurant: Pick<Restaurant, "subscriptionStatus" | "trialEndsAt" | "nextBillingAt">
) {
  const normalized = getNormalizedSubscriptionStatus(restaurant);
  return normalized === "expired" || normalized === "canceled";
}

export function isRestaurantBlocked(
  restaurant: Pick<Restaurant, "active">
) {
  return restaurant.active === false;
}

async function ensureStoreFile() {
  try {
    await fs.access(runtimeStorePath);
  } catch {
    await fs.mkdir(path.dirname(runtimeStorePath), { recursive: true });
    try {
      const seed = await fs.readFile(defaultSeedPath, "utf8");
      await fs.writeFile(runtimeStorePath, seed, "utf8");
    } catch {
      await fs.writeFile(runtimeStorePath, JSON.stringify(defaultStore, null, 2), "utf8");
    }
  }
}

async function readSeedFromFileOrDefault(): Promise<Partial<AppStore>> {
  try {
    await ensureStoreFile();
    const raw = await fs.readFile(runtimeStorePath, "utf8");
    return JSON.parse(raw) as Partial<AppStore>;
  } catch {
    try {
      const rawSeed = await fs.readFile(defaultSeedPath, "utf8");
      return JSON.parse(rawSeed) as Partial<AppStore>;
    } catch {
      return defaultStore;
    }
  }
}

async function ensureDbSchemaReady(): Promise<boolean> {
  if (!process.env.DATABASE_URL) return false;
  if (!dbSchemaReady) {
    dbSchemaReady = (async () => {
      try {
        const db = prisma as any;
        await db.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "SystemState" (
            "key" TEXT PRIMARY KEY,
            "payload" JSONB NOT NULL,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `);
        return true;
      } catch {
        return false;
      }
    })();
  }
  return dbSchemaReady;
}

function normalizeStore(parsed: Partial<AppStore>): AppStore {
  const now = new Date().toISOString();
  const restaurants = (parsed.restaurants ?? defaultStore.restaurants).map((item) => ({
    ...item,
    createdAt: item.createdAt ?? now,
    openForOrders: item.openForOrders ?? item.active ?? true,
    canceledAt: item.canceledAt ?? null,
    subscribedPlanId:
      item.subscribedPlanId ??
      (item.plan === "Local + Online" ? "plan_local_online" : "plan_local"),
    subscriptionStatus: getNormalizedSubscriptionStatus(item),
    trialStartedAt: item.trialStartedAt ?? null,
    trialEndsAt: item.trialEndsAt ?? null,
    nextBillingAt: item.nextBillingAt ?? null,
    subscriptionStartedAt: item.subscriptionStartedAt ?? null,
    subscriptionEndsAt: item.subscriptionEndsAt ?? null,
    pendingPlanId: item.pendingPlanId ?? null,
    pendingCheckoutExternalId: item.pendingCheckoutExternalId ?? null,
    lastCheckoutUrl: item.lastCheckoutUrl ?? null,
    passwordResetToken: item.passwordResetToken ?? null,
    passwordResetExpiresAt: item.passwordResetExpiresAt ?? null,
    banners: item.banners ?? [],
    marketingCampaigns: item.marketingCampaigns ?? []
  }));
  const adminUsers = (parsed.adminUsers ?? defaultStore.adminUsers).map((user) => ({
    ...user,
    createdAt: user.createdAt ?? now,
    lastAccessAt: user.lastAccessAt ?? null,
    permissions: user.permissions ?? []
  }));
  const adminRoles = (parsed.adminRoles ?? defaultStore.adminRoles).map((role) => ({
    ...role,
    createdAt: role.createdAt ?? now,
    permissions: role.permissions ?? []
  }));
  const orders = (parsed.orders ?? []).map((order) => ({
    ...order,
    status: order.status ?? "Recebido"
  }));

  return {
    leads: parsed.leads ?? [],
    restaurants,
    orders,
    customers: parsed.customers ?? [],
    auditLogs: parsed.auditLogs ?? [],
    invoices: parsed.invoices ?? defaultStore.invoices,
    adminUsers,
    adminRoles,
    supportTickets: parsed.supportTickets ?? defaultStore.supportTickets,
    supportMessages: parsed.supportMessages ?? defaultStore.supportMessages,
    supportQuickReplies: parsed.supportQuickReplies ?? defaultStore.supportQuickReplies,
    plans: (parsed.plans ?? defaultStore.plans).map((plan) => ({
      ...plan,
      updatedAt: plan.updatedAt ?? now,
      createdAt: plan.createdAt ?? now
    })),
    paymentsConfig: {
      ...defaultStore.paymentsConfig,
      ...(parsed.paymentsConfig ?? {}),
      methods: {
        ...defaultStore.paymentsConfig.methods,
        ...(parsed.paymentsConfig?.methods ?? {})
      }
    },
    payouts: parsed.payouts ?? defaultStore.payouts,
    adminSettings: { ...defaultStore.adminSettings, ...(parsed.adminSettings ?? {}) }
  };
}

async function readStoreFromDb(): Promise<AppStore | null> {
  if (!process.env.DATABASE_URL) return null;
  try {
    const schemaReady = await ensureDbSchemaReady();
    if (!schemaReady) return null;
    const db = prisma as any;
    const state = await db.systemState.findUnique({ where: { key: DB_STATE_KEY } });
    if (!state) {
      const initialPayload = await readSeedFromFileOrDefault();
      const normalized = normalizeStore(initialPayload);
      await db.systemState.create({
        data: { key: DB_STATE_KEY, payload: normalized as unknown as object }
      });
      return normalized;
    }
    return normalizeStore(state.payload as Partial<AppStore>);
  } catch {
    return null;
  }
}

async function writeStoreToDb(store: AppStore): Promise<boolean> {
  if (!process.env.DATABASE_URL) return false;
  try {
    const schemaReady = await ensureDbSchemaReady();
    if (!schemaReady) return false;
    const db = prisma as any;
    await db.systemState.upsert({
      where: { key: DB_STATE_KEY },
      update: { payload: store as unknown as object },
      create: { key: DB_STATE_KEY, payload: store as unknown as object }
    });
    return true;
  } catch {
    return false;
  }
}

export async function readStore(): Promise<AppStore> {
  const dbStore = await readStoreFromDb();
  if (dbStore) return dbStore;
  await ensureStoreFile();

  try {
    const raw = await fs.readFile(runtimeStorePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<AppStore>;
    return normalizeStore(parsed);
  } catch {
    return normalizeStore(defaultStore);
  }
}

export async function writeStore(store: AppStore): Promise<void> {
  const wroteDb = await writeStoreToDb(store);
  if (wroteDb) return;
  await ensureStoreFile();
  await fs.writeFile(runtimeStorePath, JSON.stringify(store, null, 2), "utf8");
}

export function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function sanitizeSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
