import { NextResponse } from "next/server";
import { geocodeQuery } from "@/lib/geo";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json(
      { success: false, message: "Endereco obrigatorio." },
      { status: 400 }
    );
  }

  const point = await geocodeQuery(q);

  if (!point) {
    return NextResponse.json(
      { success: false, message: "Nao foi possivel localizar este endereco." },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, location: point });
}
