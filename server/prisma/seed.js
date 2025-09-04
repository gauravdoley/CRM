import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // Clear existing data to ensure a clean slate
  await prisma.lead.deleteMany();
  await prisma.pipelineStage.deleteMany();
  await prisma.user.deleteMany();
  await prisma.customer.deleteMany();

  // Seed Pipeline Stages
  const stagesData = [
    { name: 'New', order: 1 },
    { name: 'Qualified', order: 2 },
    { name: 'Proposition', order: 3 },
    { name: 'Won', order: 4 },
    { name: 'Lost', order: 5 },
  ];

  for (const s of stagesData) {
    const stage = await prisma.pipelineStage.create({
      data: s,
    });
    console.log(`Created stage: ${stage.name}`);
  }

  // Seed a default User
  const defaultUser = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123', // In a real app, this would be hashed
    },
  });
  console.log(`Created default user: ${defaultUser.name}`);

  // Seed a default Customer
  const defaultCustomer = await prisma.customer.create({
    data: {
      name: 'Default Company Inc.',
      email: 'contact@defaultinc.com',
      phone: '555-123-4567',
      address: '123 Main St, Anytown, USA',
    },
  });
  console.log(`Created default customer: ${defaultCustomer.name}`);

  console.log(`Seeding finished.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

