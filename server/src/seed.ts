// server/src/seed.ts
import { prisma } from "./prisma";
import { hashPassword } from "./auth";

async function main() {
  const alex = await prisma.user.upsert({
    where: { username: "Alex" },
    update: {},
    create: {
      username: "Alex",
      name: "Alex",
      passwordHash: await hashPassword("123456"),
    },
  });

  const jordan = await prisma.user.upsert({
    where: { username: "Jordan" },
    update: {},
    create: {
      username: "Jordan",
      name: "Jordan",
      passwordHash: await hashPassword("123456"),
    },
  });

  const hobbies = ["Gaming", "Hiking", "Cooking", "Art", "Music", "Reading"];
  for (const name of hobbies) {
    await prisma.hobby.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log("Seeded users:", {
    alex: alex.username,
    jordan: jordan.username,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
