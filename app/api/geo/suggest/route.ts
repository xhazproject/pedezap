import { NextResponse } from "next/server";
import { geocodeSuggest } from "@/lib/geo";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 3) {
    return NextResponse.json({ success: true, suggestions: [] });
  }

  const suggestions = await geocodeSuggest(q, 8);

  return NextResponse.json({
    success: true,
    suggestions: suggestions.slice(0, 8)
  });
}
