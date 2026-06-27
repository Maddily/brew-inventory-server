const { Client } = require("pg");
require("dotenv").config();

const SQL = `
BEGIN;
TRUNCATE TABLE attributes, categories RESTART IDENTITY CASCADE;

INSERT INTO categories (name, description)
VALUES
  ('Coffee', 'Single-origin and blended coffees in a range of roast levels and formats, sourced from farms around the world.'),
  ('Tea', 'Loose leaf and bagged teas spanning green, black, white, oolong, and herbal varieties from renowned growing regions.'),
  ('Ready-to-Drink', 'Bottled cold brews, canned lattes, and chilled tea drinks ready to enjoy straight from the fridge.'),
  ('Accessories', 'Tools and equipment for brewing the perfect cup, from grinders and scales to filters and frothers.');

INSERT INTO attributes (name, category_id)
VALUES
  ('Origin', 1),
  ('Roast Level', 1),
  ('Format', 1),
  ('Weight', 1),
  ('Type', 2),
  ('Origin', 2),
  ('Format', 2),
  ('Caffeine Level', 2),
  ('Weight', 2),
  ('Base', 3),
  ('Volume', 3),
  ('Type', 4),
  ('Compatible With', 4);

  COMMIT;
`;

async function main() {
  console.log("seeding...");
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();
  await client.query(SQL);
  await client.end();
  console.log("done");
}

main();
