const { Client } = require("pg");
const init = require("./init");
const seed = require("./seed");
const seedDummyData = require("./seedDummyData");

async function main() {
  await init.main();

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const { rows } = await client.query("SELECT COUNT(*) FROM categories");
  await client.end();

  if (Number(rows[0].count) > 0) {
    console.log("database already seeded, skipping");
    return;
  }

  await seed.main();
  await seedDummyData.main();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
