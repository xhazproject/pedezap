import { NextResponse } from "next/server";
import { z } from "zod";
import { makeId, readStore, writeStore } from "@/lib/store";

const createRoleSchema = z.object({
  name: z.string().min(2),
  permissions: z.array(z.string().min(2)).min(1)
});

export async function GET() {
  const store = await readStore();
  return NextResponse.json({ success: true, roles: store.adminRoles });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = createRoleSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Dados invalidos." },
      { status: 400 }
    );
  }

  const store = await readStore();
  const exists = store.adminRoles.some(
    (role) => role.name.toLowerCase() === parsed.data.name.toLowerCase()
  );
  if (exists) {
    return NextResponse.json(
      { success: false, message: "Cargo ja existe." },
      { status: 409 }
    );
  }

  const role = {
    id: makeId("role"),
    name: parsed.data.name,
    permissions: parsed.data.permissions,
    createdAt: new Date().toISOString()
  };

  store.adminRoles.push(role);
  await writeStore(store);

  return NextResponse.json({ success: true, role });
}
