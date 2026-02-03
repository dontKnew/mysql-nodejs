import DB from "./Database"; 

export default async function Example() {
  DB.debug = false;
  /* ===============================
     1️⃣ SIMPLE SELECT
  ================================ */
  // const users = await DB
  //   .table("users")
  //   .select(["id", "name", "email"])
  //   .get();

  /* ===============================
     2️⃣ WHERE + FIRST
  ================================ */
  // const user = await DB
  //   .table("users")
  //   .where("id", "=", 1)
  //   .first();

  /* ===============================
     3️⃣ MULTIPLE WHERE (whereEqual)
  ================================ */
  // const activeUsers = await DB
  //   .table("users")
  //   .whereEqual({
  //     status: "active",
  //     role: "admin",
  //   })
  //   .get();

  /* ===============================
     4️⃣ JOIN
  ================================ */
  const usersWithProfiles = await DB
    .table("users")
    .select([
      "users.id",
      "users.name",
      "profiles.bio",
    ])
    .leftJoin(
      "profiles",
      "users.id",
      "=",
      "profiles.user_id"
    )
    .get();

  /* ===============================
     5️⃣ ORDER BY + LIMIT
  ================================ */
  // const latestUsers = await DB
  //   .table("users")
  //   .orderBy("id", "DESC")
  //   .limit(5)
  //   .get();

  /* ===============================
     6️⃣ INSERT
  ================================ */
  // const newUserId = await DB
  //   .table("users")
  //   .insert({
  //     name: "Sajid",
  //     email: "sajid@test.com",
  //     status: "active",
  //   });

  /* ===============================
     7️⃣ UPDATE
  ================================ */
  await DB
    .table("users")
    .where("id", "=", newUserId)
    .update({
      name: "Sajid Updated",
    });

  /* ===============================
     8️⃣ DELETE
  ================================ */
  await DB
    .table("users")
    .where("id", "=", 5)
    .delete();

  /* ===============================
     9️⃣ PAGINATION
  ================================ */
  const paginated = await DB
    .table("users")
    .where("status", "=", "active")
    .paginate(2, 10);

  /*
    paginated = {
      data: [...],
      meta: {
        total: 120,
        perPage: 10,
        currentPage: 2,
        lastPage: 12
      }
    }
  */

  /* ===============================
     🔟 RAW SQL
  ================================ */
  const rawUsers = await DB.sql(
    "SELECT * FROM users WHERE status = ?",
    ["active"]
  );

  /* ===============================
     1️⃣1️⃣ TRANSACTION (IMPORTANT)
  ================================ */
  await DB.transaction(async (trx) => {
    const userId = await trx
      .table("users")
      .insert({
        name: "Transaction User",
        email: "trx@test.com",
      });

    await trx
      .table("profiles")
      .insert({
        user_id: userId,
        bio: "Created inside transaction",
      });

    // throw new Error("Fail"); // uncomment to test rollback
  });

  /* ===============================
     OUTPUT
  ================================ */
  console.log({
    users,
    user,
    activeUsers,
    usersWithProfiles,
    latestUsers,
    newUserId,
    paginated,
    rawUsers,
  });
}
