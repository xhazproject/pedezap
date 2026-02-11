import { NextResponse } from "next/server";
import { z } from "zod";
import { readStore, writeStore } from "@/lib/store";

const configSchema = z.object({
  provider: z.literal("abacaepay"),
  methods: z.object({
    pix: z.object({
      enabled: z.boolean(),
      percentFee: z.number().min(0),
      fixedFee: z.number().min(0)
    }),
    card: z.object({
      enabled: z.boolean(),
      percentFee: z.number().min(0),
      fixedFee: z.number().min(0)
    })
  }),
  payoutSchedule: z.enum(["weekly", "daily"]),
  weeklyPayoutDay: z.number().min(0).max(6),
  dailyEnabled: z.boolean(),
  gatewayApiKey: z.string(),
  autoPayoutD1: z.boolean(),
  autoPayoutD30: z.boolean(),
  notifyWhatsapp: z.boolean()
});

export async function GET() {
  const store = await readStore();
  return NextResponse.json({ success: true, config: store.paymentsConfig });
}

export async function PUT(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = configSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Dados invalidos." },
      { status: 400 }
    );
  }

  const store = await readStore();
  store.paymentsConfig = parsed.data;
  await writeStore(store);
  return NextResponse.json({ success: true, config: store.paymentsConfig });
}
