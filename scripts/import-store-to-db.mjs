import { readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DB_STATE_KEY = "app_store";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL nao definido.");
  }

  const raw = await readFile("data/store.json", "utf8");
  const payload = JSON.parse(raw);

  await prisma.systemState.upsert({
    where: { key: DB_STATE_KEY },
    update: { payload },
    create: { key: DB_STATE_KEY, payload }
  });

  console.log("OK: data/store.json importado para SystemState(app_store).");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
