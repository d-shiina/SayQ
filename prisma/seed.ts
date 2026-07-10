import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@example.com";
  const password = await bcrypt.hash("password123", 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "山田 太郎",
      password,
      companyName: "サンプル株式会社",
      companyZip: "150-0001",
      companyAddress: "東京都渋谷区神宮前1-2-3",
      companyBuilding: "サンプルビル 5F",
      companyTel: "03-1234-5678",
      companyEmail: "info@example.com",
      invoiceRegNo: "T1234567890123",
      bankInfo:
        "サンプル銀行 渋谷支店 普通 1234567\n口座名義 カ）サンプル",
      sealText: "サンプル",
    },
  });

  const clientA = await prisma.client.create({
    data: {
      userId: user.id,
      name: "株式会社アルファ",
      honorific: "御中",
      contact: "鈴木 一郎",
      zip: "100-0001",
      address: "東京都千代田区丸の内1-1-1",
      tel: "03-1111-2222",
      email: "suzuki@alpha.example.com",
    },
  });

  await prisma.client.create({
    data: {
      userId: user.id,
      name: "ベータ工業株式会社",
      honorific: "御中",
      contact: "田中 花子",
      zip: "530-0001",
      address: "大阪府大阪市北区梅田2-2-2",
      tel: "06-3333-4444",
    },
  });

  await prisma.invoice.create({
    data: {
      userId: user.id,
      clientId: clientA.id,
      invoiceNo: "202607-001",
      title: "御請求書",
      billingMonth: "2026-07",
      issueDate: new Date("2026-07-31"),
      dueDate: new Date("2026-08-31"),
      notes: "お振込手数料は御社にてご負担をお願いいたします。",
      status: "sent",
      taxRounding: "floor",
      items: {
        create: [
          {
            name: "Webサイト保守運用費",
            quantity: 1,
            unit: "式",
            unitPrice: 50000,
            taxRate: 10,
            sortOrder: 0,
          },
          {
            name: "サーバー利用料",
            quantity: 1,
            unit: "式",
            unitPrice: 8000,
            taxRate: 10,
            sortOrder: 1,
          },
        ],
      },
    },
  });

  console.log("Seed 完了: demo@example.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
