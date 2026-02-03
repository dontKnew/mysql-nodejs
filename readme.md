# MySQL Node.js Database Query Builder

A powerful and flexible database query builder for Node.js with MySQL support. This library provides a clean and intuitive API for constructing database queries.

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

## Import

```javascript
import DB from "./Database";
```

---

## Query Examples

### 1️⃣ Simple SELECT

Select specific columns from a table and retrieve all results.

```javascript
const users = await DB
  .table("users")
  .select(["id", "name", "email"])
  .get();
```

**Returns:** Array of objects containing id, name, and email for all users.

---

### 2️⃣ WHERE + FIRST

Retrieve a single record that matches a condition.

```javascript
const user = await DB
  .table("users")
  .where("id", "=", 1)
  .first();
```

**Returns:** Single user object with id = 1, or null if not found.

---

### 3️⃣ MULTIPLE WHERE (whereEqual)

Query with multiple where conditions using equality checks.

```javascript
const activeUsers = await DB
  .table("users")
  .whereEqual({
    status: "active",
    role: "admin",
  })
  .get();
```

**Returns:** Array of users with status = "active" AND role = "admin".

---

### 4️⃣ JOIN

Combine data from multiple tables using JOINs.

```javascript
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
```

**Returns:** Array of users with their profile information joined together.

---

### 5️⃣ ORDER BY + LIMIT

Sort results and limit the number of records returned.

```javascript
const latestUsers = await DB
  .table("users")
  .orderBy("id", "DESC")
  .limit(5)
  .get();
```

**Returns:** Latest 5 users sorted by id in descending order.

---

### 6️⃣ INSERT

Add a new record to the table.

```javascript
const newUserId = await DB
  .table("users")
  .insert({
    name: "Sajid",
    email: "sajid@test.com",
    status: "active",
  });
```

**Returns:** The ID of the newly inserted record.

---

### 7️⃣ UPDATE

Modify an existing record.

```javascript
await DB
  .table("users")
  .where("id", "=", newUserId)
  .update({
    name: "Sajid Updated",
  });
```

**Returns:** Number of affected rows.

---

### 8️⃣ DELETE

Remove a record from the table.

```javascript
await DB
  .table("users")
  .where("id", "=", 5)
  .delete();
```

**Returns:** Number of deleted rows.

---

### 9️⃣ PAGINATION

Retrieve data with pagination support.

```javascript
const paginated = await DB
  .table("users")
  .where("status", "=", "active")
  .paginate(2, 10);
```

**Returns:**
```javascript
{
  data: [...],           // Array of 10 records from page 2
  meta: {
    total: 120,          // Total number of records
    perPage: 10,         // Records per page
    currentPage: 2,      // Current page number
    lastPage: 12         // Total number of pages
  }
}
```

---

### 🔟 RAW SQL

Execute raw SQL queries with parameter binding for security.

```javascript
const rawUsers = await DB.sql(
  "SELECT * FROM users WHERE status = ?",
  ["active"]
);
```

**Returns:** Array of users with status = "active".

**Note:** Use `?` placeholders for safe parameter binding.

---

### 1️⃣1️⃣ TRANSACTION (IMPORTANT)

Execute multiple operations as a single transaction. If any operation fails, all changes are rolled back.

```javascript
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

  // Uncomment to test rollback
  // throw new Error("Fail");
});
```

**Features:**
- All operations must succeed or all are rolled back
- Use `trx` instead of `DB` inside the transaction
- Throw an error to trigger rollback
- Ensures data integrity for related operations

---

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
