/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const customer = await prisma.customer.findUnique({
    where: { id: '28e3d0ee-4b24-45eb-ae51-6c057e8f0ee6' },
    select: {
      name: true,
      industry: true,
      location: true,
      challenges: true,
      goals: true,
      preferredKeywords: true,
    },
  });

  console.log(JSON.stringify(customer, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
