import { NextResponse } from "next/server";
import { z } from "zod";
import { readStore, writeStore } from "@/lib/store";

const updateRoleSchema = z.object({
  name: z.string().min(2).optional(),
  permissions: z.array(z.string().min(2)).min(1).optional()
});

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const payload = await request.json().catch(() => null);
  const parsed = updateRoleSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Dados invalidos." },
      { status: 400 }
    );
  }

  const store = await readStore();
  const index = store.adminRoles.findIndex((role) => role.id === params.id);
  if (index === -1) {
    return NextResponse.json(
      { success: false, message: "Cargo nao encontrado." },
      { status: 404 }
    );
  }

  if (parsed.data.name) {
    const exists = store.adminRoles.some(
      (role, idx) =>
        idx !== index && role.name.toLowerCase() === parsed.data.name!.toLowerCase()
    );
    if (exists) {
      return NextResponse.json(
        { success: false, message: "Cargo ja existe." },
        { status: 409 }
      );
    }
  }

  const current = store.adminRoles[index];
  store.adminRoles[index] = {
    ...current,
    ...parsed.data,
    name: parsed.data.name ?? current.name,
    permissions: parsed.data.permissions ?? current.permissions
  };

  store.adminUsers = store.adminUsers.map((user) =>
    user.role === current.name
      ? { ...user, permissions: store.adminRoles[index].permissions }
      : user
  );

  await writeStore(store);
  return NextResponse.json({ success: true, role: store.adminRoles[index] });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const store = await readStore();
  const index = store.adminRoles.findIndex((role) => role.id === params.id);
  if (index === -1) {
    return NextResponse.json(
      { success: false, message: "Cargo nao encontrado." },
      { status: 404 }
    );
  }

  const role = store.adminRoles[index];
  const hasUsers = store.adminUsers.some((user) => user.role === role.name);
  if (hasUsers) {
    return NextResponse.json(
      { success: false, message: "Existem usuarios vinculados a este cargo." },
      { status: 409 }
    );
  }

  store.adminRoles.splice(index, 1);
  await writeStore(store);
  return NextResponse.json({ success: true });
}
