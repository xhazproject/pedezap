import { NextResponse } from "next/server";
import { z } from "zod";
import { readStore, writeStore } from "@/lib/store";

const settingsSchema = z.object({
  platformName: z.string().min(1),
  supportUrl: z.string().min(1),
  contactEmail: z.string().min(1),
  maintenanceMode: z.boolean(),
  versionLabel: z.string().min(1),
  logoUrl: z.string(),
  faviconUrl: z.string(),
  colorPrimary: z.string(),
  colorSecondary: z.string(),
  colorAccent: z.string(),
  notificationTemplates: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      message: z.string().min(1),
      variables: z.array(z.string()),
      active: z.boolean()
    })
  ),
  integrations: z.object({
    abacatepay: z.object({
      connected: z.boolean(),
      environment: z.enum(["Producao", "Teste"]),
      webhookUrl: z.string().min(1)
    }),
    stripe: z.object({
      connected: z.boolean(),
      webhookUrl: z.string().min(1)
    }),
    whatsappEvolution: z.object({
      connected: z.boolean(),
      webhookUrl: z.string().min(1)
    })
  }),
  securityPolicies: z.object({
    enforce2FA: z.boolean(),
    auditLogs: z.boolean(),
    suspiciousLoginAlert: z.boolean()
  })
});

export async function GET() {
  const store = await readStore();
  return NextResponse.json({ success: true, settings: store.adminSettings });
}

export async function PUT(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = settingsSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Dados invalidos." }, { status: 400 });
  }

  const store = await readStore();
  store.adminSettings = parsed.data;
  await writeStore(store);
  return NextResponse.json({ success: true, settings: store.adminSettings });
}
