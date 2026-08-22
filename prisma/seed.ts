import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ---- staff codes (unchanged from before) ----
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

// ---- 4 supervisor-managed regions, each holding a mix of hospitals + clinics ----
// NOTE: this grouping is a rough first pass — adjust the arrays below any time,
// re-run `npx prisma db seed`, and the `upsert` calls will keep everything in sync.
const REGIONS = [
  {
    supervisor: { name: "江碧雲", email: "jiang@test.com" },
    orgName: "江碧雲督導區",
    clinics: ["天成醫院", "天晟醫院", "禾安診所", "百齡診所", "佳禾診所", "佳佑診所", "佳晟診所"],
  },
  {
    supervisor: { name: "李可君", email: "li@test.com" },
    orgName: "李可君督導區",
    clinics: ["天祥醫院", "華揚醫院", "佳基診所", "佳崋診所", "佳愛診所", "欣成診所", "青田診所"],
  },
  {
    supervisor: { name: "黃慧玲", email: "huang@test.com" },
    orgName: "黃慧玲督導區",
    clinics: ["德仁醫院", "新泰醫院", "思原診所", "家誼診所", "榮元診所", "憲安診所", "元翔診所"],
  },
  {
    supervisor: { name: "賴美惠", email: "lai@test.com" },
    orgName: "賴美惠督導區",
    clinics: ["元福診所", "杏福診所", "佳昇診所", "佳德診所", "祐腎診所", "聖文診所", "慧安診所", "慶如診所"],
  },
];

// ---- 3 super admins, fully equal, can see every organization/clinic ----
const SUPER_ADMINS = [
  { name: "思彣", email: "siwen@test.com" },
  { name: "Anita", email: "anita@test.com" },
  { name: "Tiffany", email: "tiffany@test.com" },
];

async function main() {
  // 1) staff codes
  for (const sc of staffCodes) {
    await prisma.staffCode.upsert({
      where: { code: sc.code },
      update: {},
      create: sc,
    });
  }

  // 2) regions (organizations) + their clinics + the region_admin user
  const regionAdminPassword = await bcrypt.hash("region1234", 10);

  for (const region of REGIONS) {
    const org = await prisma.organization.upsert({
      where: { id: `org-${region.orgName}` }, // stable fake id so re-seeding is idempotent
      update: { name: region.orgName },
      create: { id: `org-${region.orgName}`, name: region.orgName },
    });

    for (const clinicName of region.clinics) {
      await prisma.clinic.upsert({
        where: { id: `clinic-${clinicName}` },
        update: { name: clinicName, organizationId: org.id },
        create: { id: `clinic-${clinicName}`, name: clinicName, organizationId: org.id },
      });
    }

    await prisma.user.upsert({
      where: { email: region.supervisor.email },
      update: {},
      create: {
        email: region.supervisor.email,
        password: regionAdminPassword,
        name: region.supervisor.name,
        role: "REGION_ADMIN",
        organizationId: org.id,
      },
    });
  }

  // 3) super admins — no clinicId, no organizationId, sees everything
  const superAdminPassword = await bcrypt.hash("super1234", 10);
  for (const admin of SUPER_ADMINS) {
    await prisma.user.upsert({
      where: { email: admin.email },
      update: {},
      create: {
        email: admin.email,
        password: superAdminPassword,
        name: admin.name,
        role: "SUPER_ADMIN",
      },
    });
  }

  // 4) a couple of test auditors, kept from the original seed for local testing
  //    (attached to the first clinic in the first region so /audit has data to write against)
  const testClinic = await prisma.clinic.findUnique({ where: { id: "clinic-禾安診所" } });

  const auditorPassword = await bcrypt.hash("auditor1234", 10);
  await prisma.user.upsert({
    where: { email: "auditor@test.com" },
    update: {},
    create: {
      email: "auditor@test.com",
      password: auditorPassword,
      name: "稽核者 A",
      role: "AUDITOR",
      clinicId: testClinic?.id,
    },
  });

  console.log("Seed 完成:");
  console.log(`- ${SUPER_ADMINS.length} 位第一級 (SUPER_ADMIN)`);
  console.log(`- ${REGIONS.length} 位第二級督導 (REGION_ADMIN)，密碼皆為 region1234`);
  console.log(`- 1 位第三級測試稽核者 (AUDITOR)：auditor@test.com / auditor1234`);
  console.log("第一級密碼皆為 super1234，之後請自行改密碼");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
