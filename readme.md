# MySQL Node.js Database Query Builder

A powerful and flexible database query builder for Node.js with MySQL support. This library provides a clean and intuitive API for constructing database queries.

## 📑 Table of Contents

1. [Installation](#installation)
2. [Configuration](#configuration)

4. [Query Examples](#query-examples)

5. [Debug Mode](#debug-mode)
6. [Method Chaining](#method-chaining)
7. [API Reference](#api-reference)
8. [Files](#files)
9. [License](#license)


## Installation

```bash
npm install 
```

## Configuration

Create a `.env` file with your database credentials:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=your_database
```

## Query Examples
```js
import DB from "./Database.js";

/*
=================================================
        MySQL Query Builder FULL Examples
=================================================
*/

async function runExamples() {

  /* ============================================
     1. SIMPLE SELECT
  ============================================ */
  console.log("\n1. SIMPLE SELECT");

  const users = await DB
    .table("users")
    .select(["id", "name", "email"])
    .get();

  console.log(users);


  /* ============================================
     2. WHERE + FIRST (Single Record)
  ============================================ */
  console.log("\n2. WHERE + FIRST");

  const user = await DB
    .table("users")
    .where("id", "=", 1)
    .first();

  console.log(user);


  /* ============================================
     3. whereEqual (Multiple Conditions)
  ============================================ */
  console.log("\n3. WHERE EQUAL");

  const admins = await DB
    .table("users")
    .whereEqual({
      status: "active",
      role: "admin"
    })
    .get();

  console.log(admins);


  /* ============================================
     4. WHERE IN
  ============================================ */
  console.log("\n4. WHERE IN");

  const selectedUsers = await DB
    .table("users")
    .whereIn("id", [1, 2, 3, 4])
    .get();

  console.log(selectedUsers);


  /* ============================================
     5. SEARCH (LIKE)
  ============================================ */
  console.log("\n5. WHERE LIKE");

  const searchUsers = await DB
    .table("users")
    .whereLike("name", "ali")
    .get();

  console.log(searchUsers);


  /* ============================================
     6. GLOBAL SEARCH (ANY LIKE)
  ============================================ */
  console.log("\n6. WHERE ANY LIKE");

  const globalSearch = await DB
    .table("users")
    .whereAnyLike(["name", "email"], "gmail")
    .get();

  console.log(globalSearch);


  /* ============================================
     7. JOIN (LEFT JOIN)
  ============================================ */
  console.log("\n7. LEFT JOIN");

  const usersWithProfiles = await DB
    .table("users")
    .select(["users.id", "users.name", "profiles.bio"])
    .leftJoin("profiles", "users.id", "=", "profiles.user_id")
    .get();

  console.log(usersWithProfiles);


  /* ============================================
     8. RIGHT JOIN
  ============================================ */
  console.log("\n8. RIGHT JOIN");

  const rightJoin = await DB
    .table("orders")
    .rightJoin("users", "orders.user_id", "=", "users.id")
    .get();

  console.log(rightJoin);


  /* ============================================
     9. ORDER BY + LIMIT
  ============================================ */
  console.log("\n9. ORDER BY");

  const latestUsers = await DB
    .table("users")
    .orderBy("id", "DESC")
    .limit(5)
    .get();

  console.log(latestUsers);


  /* ============================================
     10. INSERT
  ============================================ */
  console.log("\n10. INSERT");

  const newUserId = await DB
    .table("users")
    .insert({
      name: "Sajid",
      email: "sajid@test.com",
      status: "active",
      role: "user"
    });

  console.log("Inserted ID:", newUserId);


  /* ============================================
     11. BULK INSERT
  ============================================ */
  console.log("\n11. BULK INSERT");

  const insertedRows = await DB
    .table("users")
    .insertBulk([
      { name: "Ali", email: "ali@test.com", status: "active", role: "user" },
      { name: "John", email: "john@test.com", status: "active", role: "user" },
      { name: "Sara", email: "sara@test.com", status: "inactive", role: "user" }
    ]);

  console.log("Inserted Rows:", insertedRows);


  /* ============================================
     12. UPDATE
  ============================================ */
  console.log("\n12. UPDATE");

  const updated = await DB
    .table("users")
    .where("id", "=", newUserId)
    .update({
      name: "Sajid Updated"
    });

  console.log("Updated rows:", updated);


  /* ============================================
     13. DELETE
  ============================================ */
  console.log("\n13. DELETE");

  const deleted = await DB
    .table("users")
    .where("id", "=", newUserId)
    .delete();

  console.log("Deleted rows:", deleted);


  /* ============================================
     14. COUNT
  ============================================ */
  console.log("\n14. COUNT");

  const totalUsers = await DB
    .table("users")
    .count();

  console.log("Total Users:", totalUsers);


  /* ============================================
     15. EXISTS
  ============================================ */
  console.log("\n15. EXISTS");

  const exists = await DB
    .table("users")
    .where("email", "=", "admin@test.com")
    .exists();

  console.log("User Exists:", exists);


  /* ============================================
     16. PAGINATION
  ============================================ */
  console.log("\n16. PAGINATION");

  const page2 = await DB
    .table("users")
    .where("status", "=", "active")
    .paginate(2, 5);

  console.log(page2);


  /* ============================================
     17. RAW SQL
  ============================================ */
  console.log("\n17. RAW SQL");

  const raw = await DB.sql(
    "SELECT * FROM users WHERE status=?",
    ["active"]
  );

  console.log(raw);


  /* ============================================
     18. TRANSACTION
  ============================================ */
  console.log("\n18. TRANSACTION");

  await DB.transaction(async (trx) => {

    const userId = await trx
      .table("users")
      .insert({
        name: "Transaction User",
        email: "trx@test.com",
        status: "active",
        role: "user"
      });

    await trx
      .table("profiles")
      .insert({
        user_id: userId,
        bio: "Created inside transaction"
      });

    // Uncomment to test rollback
    // throw new Error("Fail Transaction");
  });


  /* ============================================
     19. TRUNCATE (⚠ Dangerous)
  ============================================ */
  // await DB.table("logs").truncate();

}

/* RUN */
runExamples()
  .then(() => {
    console.log("\nAll examples executed.");
    process.exit();
  })
  .catch(err => {
    console.error("ERROR:", err);
    process.exit(1);
  });
```


## Debug Mode

Enable or disable debug logging:

```javascript
DB.debug = false;  // Disable debug logs
DB.debug = true;   // Enable debug logs
```

---

## Method Chaining

All methods return the query builder instance, allowing method chaining:

```javascript
const result = await DB
  .table("users")
  .where("status", "=", "active")
  .orderBy("id", "DESC")
  .limit(10)
  .get();
```

---

## API Reference

| Method | Description |
|--------|-------------|
| `.table(name)` | Select a table |
| `.select(columns)` | Specify columns to retrieve |
| `.where(column, operator, value)` | Add a where condition |
| `.whereEqual(object)` | Multiple equal conditions |
| `.leftJoin(table, col1, operator, col2)` | Left join with another table |
| `.orderBy(column, direction)` | Sort results (ASC/DESC) |
| `.limit(count)` | Limit number of results |
| `.get()` | Get all results |
| `.first()` | Get first result |
| `.insert(data)` | Insert a new record |
| `.update(data)` | Update records |
| `.delete()` | Delete records |
| `.paginate(page, perPage)` | Get paginated results |
| `.sql(query, params)` | Execute raw SQL |
| `.transaction(callback)` | Execute transaction |

---

## Files

- **Database.jsx** - Main database class with query builder logic
- **MysqlExample.jsx** - Example usage of all query methods
- **package.json** - Project dependencies

---

## License

MIT
