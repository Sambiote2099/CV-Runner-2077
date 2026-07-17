import { PrismaClient } from "@prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
})
const prisma = new PrismaClient({ adapter })

async function main() {
  // upsert = create if doesn't exist, update if it does
  // Safe to run multiple times without creating duplicates
  const builtIns = [
    { name: "Personal Photo", type: "IMAGE" as const },
    { name: "First Name", type: "STRING" as const },
    { name: "Last Name",  type: "STRING" as const },
    { name: "Location",   type: "STRING" as const },
  ]

  for (const attr of builtIns) {
    await prisma.attribute.upsert({
      where: { name: attr.name },
      update: {},
      create: {
        name: attr.name,
        type: attr.type,
        category: "PERSONAL_INFORMATION",
        isBuiltIn: true,
      },
    })
  }

  console.log("Seeded built-in attributes.")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())