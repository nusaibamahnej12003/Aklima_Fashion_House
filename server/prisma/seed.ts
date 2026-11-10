
import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const products = [
  {
    slug: "elegant-silk-saree",
    name: "Elegant Silk Saree",
    category: "শাড়ি",
    price: 2500,
    image: "https://placehold.co/600x750/F1E3D3/6B4F3A?text=Silk+Saree",
    description: "বিশেষ মুহূর্তের জন্য সুন্দর ও আরামদায়ক সিল্ক শাড়ি।",
    sizes: ["Free Size"],
    colors: ["লাল", "মেরুন", "নীল"],
  },
  {
    slug: "premium-three-piece",
    name: "Premium Three Piece",
    category: "থ্রি-পিস",
    price: 1850,
    image: "https://placehold.co/600x750/E9D8C8/6B4F3A?text=Three+Piece",
    description: "দৈনন্দিন ব্যবহার ও অনুষ্ঠানের জন্য আকর্ষণীয় থ্রি-পিস।",
    sizes: ["M", "L", "XL"],
    colors: ["কালো", "সবুজ", "গোলাপি"],
  },
  {
    slug: "classic-womens-kurti",
    name: "Classic Women's Kurti",
    category: "কুর্তি",
    price: 1200,
    image: "https://placehold.co/600x750/E8DCCF/6B4F3A?text=Kurti",
    description: "সিম্পল ডিজাইনের আরামদায়ক কুর্তি।",
    sizes: ["M", "L", "XL"],
    colors: ["সাদা", "কালো", "হলুদ"],
  },
  {
    slug: "elegant-party-gown",
    name: "Elegant Party Gown",
    category: "গাউন",
    price: 3200,
    image: "https://placehold.co/600x750/E5D5C8/6B4F3A?text=Party+Gown",
    description: "পার্টি ও বিশেষ অনুষ্ঠানের জন্য স্টাইলিশ গাউন।",
    sizes: ["S", "M", "L"],
    colors: ["মেরুন", "কালো", "গোলাপি"],
  },
];

async function main() {
  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    });
  }

  console.log("4 sample products added successfully!");
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
