// We have to add an entry in the package.json at the end, after dependencies, like "prisma": {"seed": "ts-node prisma/seed.ts"}. The seed file will run when we 
// You manually run the "prisma migrate reset" CLI command.
// The database is reset interactively in the context of using "prisma migrate dev" - for example, as a result of migration history conflicts or database schema drift.
// When you want to use prisma migrate dev or prisma migrate reset without seeding, you can pass the --skip-seed flag.
// To run seeder on its own use "npx prisma db seed"
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const userData: Prisma.UserCreateInput[] = [
  {
    name: "John",
    email: "John@prisma.io",
    posts: {
      create: [
        {
          title: "Join the Prisma Slack",
          published: true,
          likeNum: 10,
          catgories: {
            create: [
              {
                name: "Data Base",
              },
              {
                name: "Big Data",
              },
            ],
          },
        },
        {
          title: "Follow Prisma on Twitter",
          catgories: {
            connect: [
              {
                id: 1,
              },
            ],
          },
          published: true,
        },
      ],
    },
  },
  {
    name: "Jack",
    email: "jack@prisma.io",
    posts: {
      create: [
        {
          title: "Follow Prisma on Twitter",
          catgories: {
            connect: [
              {
                id: 1,
              },
            ],
          },
          published: true,
        },
      ],
    },
  },
  {
    name: "sara",
    email: "sara@prisma.io",
    posts: {
      create: [
        {
          title: "Ask a question about Prisma on GitHub",

          published: true,
          catgories: {
            connect: [
              {
                id: 2,
              },
            ],
          },
        },
        {
          title: "Prisma on YouTube",
          catgories: {
            connect: [
              {
                id: 1,
              },
            ],
          },
        },
      ],
    },
  },
];

async function main() {
  console.log(`Start seeding ...`);
  for (const u of userData) {
    const user = await prisma.user.create({
      data: u,
    });
    console.log(`Created user with id: ${user.id}`);
  }
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
