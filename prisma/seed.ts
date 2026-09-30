import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("GreenLoop Database is configured for live user-registered accounts and agencies.");
  const count = await prisma.wasteAgency.count();
  console.log(`Current registered agencies in database: ${count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
