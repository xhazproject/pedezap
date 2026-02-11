import { NextResponse } from "next/server";
import { readStore } from "@/lib/store";

export async function GET() {
  const store = await readStore();
  return NextResponse.json({ success: true, leads: store.leads });
}
