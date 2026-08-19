import { Pool } from "pg";

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "bookwise",
  password: "P@55w0rd",
  port: 5432,
});

export default pool;
