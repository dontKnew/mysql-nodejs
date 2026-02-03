  import mysql from "mysql2/promise";

/*
==================================================
               TABLE OF CONTENTS
==================================================

0.  Overview
1.  MySQL Connection Pool
2.  Query Builder Class (DB)
    2.1  Constructor & State Reset
    2.2  Core SQL Executor (_execute)
    2.3  Select Queries
    2.4  Join Queries
    2.5  Where Conditions
    2.6  Order By & Limit
    2.7  Read Operations (get, first)
    2.8  Write Operations (insert, insertBluk, update, delete, truncate)
    2.9  Pagination
    2.10 Raw SQL Execution
    2.11 Transactions
    2.12 Helper Methods (buildSelect, reset)
    2.13 Count
3. Static Entry Point (DB.table)

==================================================
*/

/* ===============================
   1. MYSQL CONNECTION
================================ */

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
});

/* ===============================
   2. QUERY BUILDER CLASS
================================ */

class DB {
  static debug = false; // 2.1 🔥 Enable / Disable SQL Logging

  constructor(table) {
    this.table = table;     // 2.1.1 Table name
    this._trx = null;       // 2.1.2 Transaction connection
    this.reset();           // 2.1.3 Reset query state
  }

  /* ===============================
     2.2 CORE SQL EXECUTOR
  ================================ */

  async _execute(sql, params = []) {
    if (DB.debug) {
      console.log(
        "\n[SQL]",
        sql.replace(/\s+/g, " ").trim(),
        "\n[PARAMS]",
        params
      );
    }

    return this._trx
      ? this._trx.execute(sql, params)
      : pool.execute(sql, params);
  }

  /* ===============================
     2.3 SELECT
  ================================ */

  select(columns = "*") {
    this.selectCols = Array.isArray(columns)
      ? columns.join(", ")
      : columns;
    return this;
  }

  /* ===============================
     2.4 JOIN
  ================================ */

  join(table, first, operator, second, type = "INNER") {
    this.joins.push(
      `${type} JOIN ${table} ON ${first} ${operator} ${second}`
    );
    return this;
  }

  leftJoin(...args) {
    return this.join(...args, "LEFT");
  }

  rightJoin(...args) {
    return this.join(...args, "RIGHT");
  }

  /* ===============================
     2.5 WHERE
  ================================ */

  where(column, operator, value) {
    this.wheres.push(`${column} ${operator} ?`);
    this.params.push(value);
    return this;
  }

  whereEqual(data = {}) {
    Object.entries(data).forEach(([k, v]) =>
      this.where(k, "=", v)
    );
    return this;
  }

  /* ===============================
     2.6 ORDER & LIMIT
  ================================ */

  orderBy(column, dir = "ASC") {
    this.order = `ORDER BY ${column} ${dir}`;
    return this;
  }

  limit(count, offset = null) {
    this.limitVal =
      offset !== null
        ? `LIMIT ${offset}, ${count}`
        : `LIMIT ${count}`;
    return this;
  }

  /* ===============================
     2.7 READ
  ================================ */

  async get() {
    try {
      const sql = this.buildSelect();
      const [rows] = await this._execute(sql, this.params);
      return rows;
    } catch (err) {
      throw new Error(`GET failed: ${err.message}`);
    } finally {
      this.reset();
    }
  }

  async first() {
    this.limit(1);
    const rows = await this.get();
    return rows[0] ?? null;
  }

  /* ===============================
     2.8 WRITE
  ================================ */

  async insert(data = {}) {
    try {
      for (const [key, value] of Object.entries(data)) {
          if (value === undefined) {
            throw new Error(`Undefined value for column: ${key}-${value}`);
          }
        }
      const keys = Object.keys(data);
      const values = Object.values(data);

      const sql = `
        INSERT INTO ${this.table} (${keys.join(", ")})
        VALUES (${keys.map(() => "?").join(", ")})
      `;

      const [res] = await this._execute(sql, values);
      return res.insertId;
    } catch (err) {
      throw new Error(`INSERT[${this.table}] failed: ${err.message}`);
    }
  }

  async insertBulk(rows = []) {
      try {
        if (!Array.isArray(rows) || rows.length === 0) {
          throw new Error("insertBulk requires a non-empty array");
        }
        // Ensure all rows have the same keys
        const keys = Object.keys(rows[0]);
        for (let i = 0; i < rows.length; i++) {
          for (const key of keys) {
            if (!(key in rows[i])) {
              throw new Error(`Missing column "${key}" in row ${i}`);
            }
            if (rows[i][key] === undefined) {
              throw new Error(`Undefined value for column "${key}" in row ${i}`);
            }
          }
        }

        // Build SQL
        const placeholdersPerRow = `(${keys.map(() => "?").join(", ")})`;
        const placeholders = rows.map(() => placeholdersPerRow).join(", ");

        const sql = `
          INSERT INTO ${this.table} (${keys.join(", ")})
          VALUES ${placeholders}
        `;

        // Flatten values
        const values = rows.flatMap(row => keys.map(k => row[k]));

        const [res] = await this._execute(sql, values);
        return res.affectedRows;
      } catch (err) {
        throw new Error(`BULK INSERT failed: ${err.message}`);
      }
    }


  async update(data = {}) {
    if (!this.wheres.length) {
      throw new Error("UPDATE requires WHERE");
    }

    try {
      const set = Object.keys(data)
        .map(k => `${k}=?`)
        .join(", ");

      const sql = `
        UPDATE ${this.table}
        SET ${set}
        WHERE ${this.wheres.join(" AND ")}
      `;

      const params = [...Object.values(data), ...this.params];
      const [res] = await this._execute(sql, params);
      return res.affectedRows;
    } finally {
      this.reset();
    }
  }

  async delete() {
    if (!this.wheres.length) {
      throw new Error("DELETE requires WHERE");
    }

    try {
      const sql = `
        DELETE FROM ${this.table}
        WHERE ${this.wheres.join(" AND ")}
      `;
      const [res] = await this._execute(sql, this.params);
      return res.affectedRows;
    } finally {
      this.reset();
    }
  }

  async truncate() {
    return this._execute(`TRUNCATE TABLE ${this.table}`);
  }

  /* ===============================
     2.9 PAGINATION
  ================================ */

  async paginate(page = 1, perPage = 10) {
    const offset = (page - 1) * perPage;

    const countSql = `
      SELECT COUNT(*) as total
      FROM ${this.table}
      ${this.joins.join(" ")}
      ${this.wheres.length ? "WHERE " + this.wheres.join(" AND ") : ""}
    `;

    const [countRows] = await this._execute(countSql, this.params);
    const total = countRows[0]?.total || 0;

    this.limit(perPage, offset);
    const data = await this.get();

    return {
      data,
      meta: {
        total,
        perPage,
        currentPage: page,
        lastPage: Math.ceil(total / perPage),
      },
    };
  }

  /* ===============================
     2.10 RAW SQL
  ================================ */

  static async sql(query, params = []) {
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  /* ===============================
     2.11 TRANSACTION
  ================================ */

  static async transaction(callback) {
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const trx = {
        table: (name) => {
          const db = new DB(name);
          db._trx = conn;
          return db;
        },
        sql: (q, p = []) => conn.execute(q, p),
      };
      const result = await callback(trx);
      await conn.commit();
      return result;
    } finally {
      conn.release();
    }
  }

  /* ===============================
     2.12 HELPERS
  ================================ */

  buildSelect() {
    const where = this.wheres.length
      ? `WHERE ${this.wheres.join(" AND ")}`
      : "";

    return `
      SELECT ${this.selectCols}
      FROM ${this.table}
      ${this.joins.join(" ")}
      ${where}
      ${this.order}
      ${this.limitVal}
    `;
  }

  reset() {
    this.selectCols = "*";
    this.joins = [];
    this.wheres = [];
    this.params = [];
    this.order = "";
    this.limitVal = "";
  }


  /* ===============================
     2.14. Count
  ================================ */

  async count(column = "*") {
    try {
      // console.warn(this.wheres, "wheres");
      const sql = `
        SELECT COUNT(${column}) as total
        FROM ${this.table}
        ${this.joins.join(" ")}
        ${this.wheres.length ? "WHERE " + this.wheres.join(" AND ") : ""}
      `;
      const [rows] = await this._execute(sql, this.params);
      return rows[0]?.total || 0;
    } catch (err) {
      throw new Error(`COUNT failed: ${err.message}`);
    } finally {
      this.reset();
    }
  }

  async exists() {
    const count = await this.count();
    return count > 0;
  }




  /* ===============================
     3. STATIC ENTRY
  ================================ */

  static table(name) {
    return new DB(name);
  }
}

export default DB;
