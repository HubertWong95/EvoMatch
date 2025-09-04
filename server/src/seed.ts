// server/src/seed.ts
import { prisma } from "./prisma";
import { hashPassword } from "./auth";

async function main() {
  console.log("[seed] wiping tables…");

  // Delete in dependency-safe order (children -> parents)
  await prisma.$transaction([
    prisma.answer.deleteMany(),
    prisma.message.deleteMany(),
    prisma.match.deleteMany(),
    prisma.matchSession.deleteMany(),
    prisma.userHobby.deleteMany(),
    prisma.hobby.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  console.log("[seed] creating default hobbies…");
  const hobbyNames = ["Gaming", "Hiking", "Cooking", "Art", "Music", "Reading"];
  await prisma.hobby.createMany({
    data: hobbyNames.map((name) => ({ name })),
    skipDuplicates: true,
  });

  console.log("[seed] creating users Alex & Jordan…");
  const [alex, jordan] = await Promise.all([
    prisma.user.create({
      data: {
        username: "Alex",
        name: "Alex",
        age: 24,
        location: "Vancouver",
        bio: "My favourite color is blue, not yellow!",
        passwordHash: await hashPassword("123456"),
        avatarUrl: null,
      },
    }),
    prisma.user.create({
      data: {
        username: "Jordan",
        name: "Jordan",
        age: 26,
        location: "Vancouver",
        bio: "Demo account",
        passwordHash: await hashPassword("123456"),
        avatarUrl: null,
      },
    }),
  ]);

  console.log("[seed] done:", { alex: alex.username, jordan: jordan.username });
}

main()
  .catch((e) => {
    console.error("[seed] error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
