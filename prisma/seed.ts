import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const clinic = await prisma.clinic.upsert({
    where: { id: "cms8qai170000b4rr4j50tl7t" },
    update: {},
    create: { name: "台北腎臟診所" },
  });

  const staffCodes = [
    { code: "DR", description: "醫師、腎臟科醫師" },
    { code: "N", description: "護士、助理護士" },
    { code: "BL", description: "透析照護技術員" },
    { code: "PC", description: "病患服務助理、助理、書記" },
    { code: "AC", description: "行政助理" },
    { code: "D", description: "清潔人員" },
    { code: "O", description: "其他、志工、工程師等" },
    { code: "AH", description: "其他醫療人員、營養師復健師等" },
  ];

  for (const sc of staffCodes) {
    await prisma.staffCode.upsert({
      where: { code: sc.code },
      update: {},
      create: sc,
    });
  }

  const adminPassword = await bcrypt.hash("admin12345", 10);
  const auditorPassword = await bcrypt.hash("auditor12345", 10);

  await prisma.user.upsert({
    where: { email: "admin@test.com" },
    update: {},
    create: {
      email: "admin@test.com",
      password: adminPassword,
      name: "管理者",
      role: "ADMIN",
      clinicId: clinic.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "auditor@test.com" },
    update: {},
    create: {
      email: "auditor@test.com",
      password: auditorPassword,
      name: "稽核者 A",
      role: "AUDITOR",
      clinicId: clinic.id,
    },
  });

  console.log("Seed 完成,診所 id:", clinic.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });