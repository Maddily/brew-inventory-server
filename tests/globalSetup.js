require("dotenv").config({ path: ".env.test" });
const { main: initSchema } = require("../db/init.js");
const { main: seedData } = require("../db/seed.js");

module.exports = async () => {
  await initSchema();
  await seedData();
};
