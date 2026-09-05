const pool = require("../db/pool.js");

afterAll(async () => {
  await pool.end();
});
