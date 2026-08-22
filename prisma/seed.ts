import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

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

// ---- 6 supervisor-managed regions (updated per the latest assignment) ----
const REGIONS = [
  {
    supervisor: { name: "江碧雲", email: "jiang@test.com" },
    orgName: "江碧雲督導區",
    clinics: ["天祥醫院", "德仁醫院", "華揚醫院", "聖文診所", "佳昇診所", "杏福診所"],
  },
  {
    supervisor: { name: "李可君", email: "li@test.com" },
    orgName: "李可君督導區",
    clinics: ["憲安診所", "禾安診所", "佳愛診所", "佳崋診所", "欣成診所"],
  },
  {
    supervisor: { name: "黃慧玲", email: "huang@test.com" },
    orgName: "黃慧玲督導區",
    clinics: ["家誼診所", "佳佑診所", "佳禾診所", "慧安診所", "佳晟診所", "榮元診所"],
  },
  {
    supervisor: { name: "賴美惠", email: "lai@test.com" },
    orgName: "賴美惠督導區",
    clinics: ["元翔診所", "佳冠診所", "佳基診所"], // 佳冠診所為新增診所
  },
  {
    supervisor: { name: "麗萍", email: "liping@test.com" },
    orgName: "麗萍督導區",
    clinics: ["佳德診所", "豐榮診所"], // 豐榮診所為新增診所
  },
  {
    supervisor: { name: "秋萍", email: "qiuping@test.com" },
    orgName: "秋萍督導區",
    clinics: ["元福診所", "百齡診所", "青田診所", "慶如診所"],
  },
];

// ---- units not yet assigned to any supervisor — created with organizationId = null ----
const UNASSIGNED_CLINICS = ["天成醫院", "天晟醫院", "新泰醫院", "思原診所", "祐腎診所"];

const SUPER_ADMINS = [
  { name: "思彣", email: "siwen@test.com" },
  { name: "Anita", email: "anita@test.com" },
  { name: "Tiffany", email: "tiffany@test.com" },
];

async function main() {
  for (const sc of staffCodes) {
    await prisma.staffCode.upsert({
      where: { code: sc.code },
      update: {},
      create: sc,
    });
  }

  const regionAdminPassword = await bcrypt.hash("region1234", 10);

  for (const region of REGIONS) {
    const org = await prisma.organization.upsert({
      where: { id: `org-${region.orgName}` },
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
      update: { name: region.supervisor.name, organizationId: org.id },
      create: {
        email: region.supervisor.email,
        password: regionAdminPassword,
        name: region.supervisor.name,
        role: "REGION_ADMIN",
        organizationId: org.id,
      },
    });
  }

  // clinics with no supervisor yet — organizationId left null
  for (const clinicName of UNASSIGNED_CLINICS) {
    await prisma.clinic.upsert({
      where: { id: `clinic-${clinicName}` },
      update: { name: clinicName, organizationId: null },
      create: { id: `clinic-${clinicName}`, name: clinicName, organizationId: null },
    });
  }

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
  console.log(`- ${SUPER_ADMINS.length} 位第一級 (SUPER_ADMIN)，密碼皆為 super1234`);
  console.log(`- ${REGIONS.length} 位第二級督導 (REGION_ADMIN)，密碼皆為 region1234`);
  console.log(`- ${UNASSIGNED_CLINICS.length} 個單位尚未分配督導：${UNASSIGNED_CLINICS.join("、")}`);
  console.log(`- 1 位第三級測試稽核者：auditor@test.com / auditor1234`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
