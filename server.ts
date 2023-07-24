import express from "express";
import { PrismaClient } from "@prisma/client";
import { rmSync } from "fs";

const prisma = new PrismaClient();
const app = express();
app.use(express.json());

//======================= AND/OR ============================================

app.get("/posts", async (req, res) => {
  const posts = await prisma.post.findMany({
    where: {
      OR: [
        {
          title: { contains: "github" },
        },
        {
          title: { contains: "twitter" },
        },
      ],
      AND: {
        authorId: 3,
      },
    },
  });
  res.json(posts);
});

app.get("/users", async (req, res) => {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        {
          id: {
            not: {
              gt: 2,
            },
          },
        },
        {
          name: {
            startsWith: "s",
          },
        },
      ],
    },
  });
  res.json(users);
});

//======================== RELATIONSHIP FILTERS ============================
// Relation filters for one-to-many and many-many relations are every, some and none
app.get("/users/allPublished", async (req, res) => {
  const users = await prisma.user.findMany({
    where: {
      posts: {
        every: { published: true },
      },
    },
  });
  res.json(users);
});

// Relation filters for many-one and one-one are is and isNot
app.get("/posts/containsName", async (req, res) => {
  const users = await prisma.post.findMany({
    where: {
      author: {
        is: {
          name: "Jack",
        },
        isNot: {
          email: {
            startsWith: "cool",
          },
        },
      },
    },
    // Including a related modal in the result of the query
    include: {
      author: {
        select: {
          name: true,
        },
      },
    },
  });
  res.json(users);
});

//===================== SELECTING ============================
app.get("/posts/selected", async (req, res) => {
  const posts = await prisma.post.findMany({
    // Note - We cannot use "select" and "include" in the same level. We can nest them
    select: {
      title: true,
      author: {
        select: {
          name: true,
        },
      },
    },
  });
  res.json(posts);
});

//==================== AGGREGATION FUNCTIONS =======================
// We can count, sum, avg, min and max
app.get("/posts/likesAggregate", async (req, res) => {
  const posts = await prisma.post.aggregate({
    _sum: {
      likeNum: true,
    },
    _avg: {
      likeNum: true,
    },
    _count: {
      id: true,
    },
    _max: {
      likeNum: true,
    },
    _min: {
      likeNum: true,
    },
  });
  res.json(posts);
});

//======================== GROUP BY ==========================
// Displays the sum and average of likes of post by each author seperately
app.get("/posts/groupBy", async (req, res) => {
  const posts = await prisma.post.groupBy({
    by: ["authorId"],
    _sum: { likeNum: true },
    _avg: {
      likeNum: true,
    },
  });
  res.json(posts);
});

//=================== SORT ===========================
app.get("/posts/sort", async (req, res) => {
  const posts = await prisma.post.findMany({
    orderBy: {
      likeNum: "asc",
    },
  });
  res.json(posts);
});

//====================== PAGINATION =====================================
// The main difference between offset based pagination and cursor based pagination is that, cursor based pagination is scalable because for example we want to fetch the next 10 records after the first 5000, in the offset based pagination our query need to traverse the first 5000 to get the next 10 but in cursor based pagination our query can directly jump to the record which is in the 5000th position
// Offset pagination
app.get("/posts/pagination/:pageNum/:pageSize", async (req, res) => {
  const skipValue = Number(req.params.pageNum);
  const takeValue = Number(req.params.pageSize) || 0;

  const posts = await prisma.post.findMany({
    // You have to increment the skip dynamically from the request params on each call to skip the first n records and take the next 2 records.
    skip: takeValue * skipValue,
    take: takeValue,
  });
  res.json(posts);
});

// Cursor based pagination
app.get("/posts/pagination/cursor/:cursorValue/:pageSize", async (req, res) => {
  const cursorValue = Number(req.params.cursorValue);
  const takeValue = Number(req.params.pageSize) || 0;

  const posts = await prisma.post.findMany({
    // We have to provide id(the value for the field which is sorted) from which we want to take the next n elements specified by the "takeValue"
    cursor: {
      id: cursorValue,
    },
    take: takeValue,
  });
  res.json(posts);
});

//============================ CREATION =========================
// When creating a user which has a 1-to-many relation with "posts" and "posts" has a many-to-many relation with "categories". We could either create new posts or connect posts which exists to the new user and we could do the either of the two for categories as well. In the below code we have created a new post but we have connected the post to existing categories

app.post("/user/addUser", async (req, res) => {
  const user = await prisma.user.create({
    data: {
      email: "sakura@prisma.io",
      name: "sakura dev",
      role: "USER",
      posts: {
        create: [
          {
            title: "Crash course on prism",
            published: true,
            catgories: {
              connect: [{ id: 1 }, { id: 2 }],
            },
          },
        ],
      },
    },
  });

  res.json(user);
});

// We can make use of "connectOrCreate" to check if a record with the specified id exists. If the record with the id exists we simply connect the record and if it does not exists we create the record with the mentioned properties, in this case we just have the "name" property
app.post("/user/connectOrCreate/addUser", async (req, res) => {
  const user = await prisma.user.create({
    data: {
      email: "sasuke@prisma.io",
      name: "sasuke",
      role: "USER",
      posts: {
        create: [
          {
            title: "Crash course on prism",
            published: true,
            catgories: {
              connectOrCreate: {
                where: {
                  id: 3,
                },
                create: {
                  name: "AI",
                },
              },
            },
          },
        ],
      },
    },
  });
});

// Create many
app.post("/user/connectOrCreate/addManyUsers", async (req, res) => {
  const users = await prisma.user.createMany({
    data: [
      { name: "Yewande", email: "yewande@prisma.io" },
      { name: "Yewande", email: "yewande@prisma.io" },
      { name: "Angelique", email: "angelique@prisma.io" },
    ],
    skipDuplicates: true,
  });

  res.json(users);
});

// Dynamic data
type Body = {
  name: string;
  email: string;
};
app.post("/user/create/dynamic", async (req, res) => {
  const body: Body = req.body;
  const user = await prisma.user.create({
    data: body,
  });

  res.json(user);
});

// ============================== UPDATING ==========================
app.put("/user/updateById/:id", async (req, res) => {
  const id = Number(req.params.id);

  const updatedUser = await prisma.user.update({
    where: {
      id: id,
    },
    data: {
      name: "updated Name",
    },
  });

  res.json(updatedUser);
});
// Update has a similar function to insert for updating many record called updateMany()

// ============================== UPSERT =============================
// If an entity exists, then its updated and if it does not exist then it is created. In this function we have to provide an update and a create object as well, which would be used according to if the record exists or not
app.put("/user/upsert/:id", async (req, res) => {
  const id = Number(req.params.id);

  const updatedUser = await prisma.user.upsert({
    where: {
      id: id,
    },
    update: {
      name: "founder",
    },
    create: {
      name: "captain",
      email: "capatin@f.com",
    },
  });

  res.json(updatedUser);
});

// ============================ DELETE =========================
// delete also has deleteMany
app.delete("/user/delete/:id", async (req, res) => {
  const id = Number(req.params.id);

  const user = await prisma.user.delete({
    where: {
      id: id,
    },
  });

  res.json(user);
});

// ================================ TRANSACTIONS ============================
// It is a group of query, which have to be executed one after the other and if any one of them fail, then all the executed queries are rolled back as well

app.post("/posts/transaction", async (req, res) => {
  // We don't use await here when calling the update function
  const withdrawUpdate = prisma.post.update({
    where: {
      id: 4,
    },
    data: {
      likeNum: {
        decrement: 5,
      },
    },
  });

  const depositUpdate = prisma.post.update({
    where: {
      id: 5,
    },
    data: {
      likeNum: {
        increment: 5,
      },
    },
  });

  const result = await prisma.$transaction([withdrawUpdate, depositUpdate]);

  res.json(result);
});

const server = app.listen(3000);
