import { NextResponse } from "next/server";
import { z } from "zod";
import { readStore, writeStore } from "@/lib/store";
import { hashPassword } from "@/lib/password";

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.string().min(2).optional(),
  status: z.enum(["Ativo", "Inativo"]).optional(),
  password: z.string().min(6).optional()
});

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const payload = await request.json().catch(() => null);
  const parsed = updateUserSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Dados invalidos." },
      { status: 400 }
    );
  }

  const store = await readStore();
  const index = store.adminUsers.findIndex((user) => user.id === params.id);
  if (index === -1) {
    return NextResponse.json(
      { success: false, message: "Usuario nao encontrado." },
      { status: 404 }
    );
  }

  if (parsed.data.email) {
    const email = parsed.data.email.toLowerCase();
    const exists = store.adminUsers.some(
      (user, idx) => idx !== index && user.email.toLowerCase() === email
    );
    if (exists) {
      return NextResponse.json(
        { success: false, message: "Email ja cadastrado." },
        { status: 409 }
      );
    }
  }

  const current = store.adminUsers[index];
  const nextRoleName = parsed.data.role ?? current.role;
  const nextRole = store.adminRoles.find((item) => item.name === nextRoleName);
  if (!nextRole) {
    return NextResponse.json(
      { success: false, message: "Cargo nao encontrado." },
      { status: 404 }
    );
  }

  const hashedPassword = parsed.data.password
    ? await hashPassword(parsed.data.password)
    : undefined;

  store.adminUsers[index] = {
    ...current,
    ...parsed.data,
    password: hashedPassword ?? current.password,
    email: parsed.data.email ? parsed.data.email.toLowerCase() : current.email,
    role: nextRole.name,
    permissions: nextRole.permissions ?? current.permissions
  };

  await writeStore(store);
  return NextResponse.json({ success: true, user: store.adminUsers[index] });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const store = await readStore();
  const index = store.adminUsers.findIndex((user) => user.id === params.id);
  if (index === -1) {
    return NextResponse.json(
      { success: false, message: "Usuario nao encontrado." },
      { status: 404 }
    );
  }

  const user = store.adminUsers[index];
  if (user.role === "Admin Master") {
    const masters = store.adminUsers.filter((item) => item.role === "Admin Master");
    if (masters.length <= 1) {
      return NextResponse.json(
        { success: false, message: "Nao e possivel remover o ultimo admin master." },
        { status: 409 }
      );
    }
  }

  store.adminUsers.splice(index, 1);
  await writeStore(store);
  return NextResponse.json({ success: true });
}
