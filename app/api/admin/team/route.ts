import { NextResponse } from "next/server";
import { z } from "zod";
import { makeId, readStore, writeStore } from "@/lib/store";
import { hashPassword } from "@/lib/password";

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.string().min(2),
  status: z.enum(["Ativo", "Inativo"]).optional(),
  password: z.string().min(6)
});

export async function GET() {
  const store = await readStore();
  const users = store.adminUsers.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    lastAccessAt: user.lastAccessAt
  }));
  return NextResponse.json({ success: true, users });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = createUserSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Dados invalidos.",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      },
      { status: 400 }
    );
  }

  const store = await readStore();
  const role = store.adminRoles.find((item) => item.name === parsed.data.role);
  if (!role) {
    return NextResponse.json(
      { success: false, message: "Cargo nao encontrado." },
      { status: 404 }
    );
  }
  const email = parsed.data.email.toLowerCase();
  if (store.adminUsers.some((user) => user.email.toLowerCase() === email)) {
    return NextResponse.json(
      { success: false, message: "Email ja cadastrado." },
      { status: 409 }
    );
  }

  const user = {
    id: makeId("adm"),
    name: parsed.data.name,
    email,
    role: role.name,
    status: parsed.data.status ?? ("Ativo" as const),
    password: await hashPassword(parsed.data.password),
    permissions: role.permissions ?? [],
    createdAt: new Date().toISOString(),
    lastAccessAt: null
  };

  store.adminUsers.push(user);
  await writeStore(store);

  return NextResponse.json({ success: true, user });
}
