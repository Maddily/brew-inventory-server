const { Client } = require("pg");
require("dotenv").config();

const SQL = `
BEGIN;
TRUNCATE TABLE products RESTART IDENTITY CASCADE;

-- Coffee (category_id: 1)
INSERT INTO products (name, description, price, stock_quantity, category_id)
VALUES
  ('Ethiopia Yirgacheffe', 'A bright, floral washed coffee from Ethiopia''s most celebrated growing region. Expect notes of jasmine, bergamot, and stone fruit with a clean, tea-like finish.', 18, 42, 1),
  ('Colombia Huila', 'A well-balanced medium roast from the Huila department of Colombia. Sweet caramel and red apple notes with a smooth, lingering finish.', 16, 28, 1),
  ('Brazil Santos', 'A bold, full-bodied dark roast from São Paulo state. Rich cocoa and roasted walnut flavors with low acidity and a long, bittersweet finish.', 22, 15, 1),
  ('Guatemala Antigua', 'A medium roast from the volcanic highlands of Antigua. Brown sugar sweetness with hints of dark chocolate and a subtle smoky finish.', 17, 0, 1),
  ('Kenya AA', 'A top-grade light roast from Kenya''s central highlands. Vibrant blackcurrant and grapefruit acidity with a juicy, wine-like body.', 20, 7, 1);

-- Tea (category_id: 2)
INSERT INTO products (name, description, price, stock_quantity, category_id)
VALUES
  ('Japanese Sencha', 'A classic Japanese green tea with a fresh, grassy aroma and a clean, slightly vegetal flavor. Steamed leaves from Shizuoka prefecture.', 12.50, 7, 2),
  ('Darjeeling First Flush', 'The prized first harvest of the season from the Darjeeling hills. Delicate muscatel notes with a light, floral character and brisk finish.', 14.00, 33, 2),
  ('Bai Mu Dan', 'A refined Chinese white tea made from young buds and leaves. Subtle sweetness with hints of melon and a silky, smooth body.', 16.00, 19, 2),
  ('Milk Oolong', 'A lightly oxidized Taiwanese oolong with a naturally creamy texture and notes of warm milk, butter, and orchid blossom.', 15.00, 0, 2),
  ('Moroccan Mint', 'A caffeine-free herbal blend of spearmint and peppermint in the tradition of Moroccan tea culture. Refreshing, cooling, and naturally sweet.', 9.00, 54, 2);

-- Ready-to-Drink (category_id: 3)
INSERT INTO products (name, description, price, stock_quantity, category_id)
VALUES
  ('Cold Brew Original', 'Slow-steeped for 18 hours in cold water, this smooth cold brew delivers rich coffee flavor with low acidity and no bitterness. Best served over ice.', 5.00, 0, 3),
  ('Cold Brew Vanilla', 'Our signature cold brew blended with natural vanilla extract for a subtly sweet, smooth finish. No added sugar.', 5.50, 24, 3),
  ('Canned Oat Latte', 'A creamy blend of cold brew espresso and oat milk, lightly sweetened. Barista-quality in a can, ready straight from the fridge.', 4.50, 11, 3),
  ('Jasmine Green Tea Bottle', 'Delicate green tea scented with fresh jasmine blossoms, lightly sweetened and bottled cold. Floral, refreshing, and naturally light.', 4.00, 38, 3),
  ('Hibiscus Iced Tea', 'A ruby-red herbal infusion of dried hibiscus flowers. Tart, fruity, and naturally caffeine-free — best enjoyed chilled.', 3.50, 6, 3);

-- Accessories (category_id: 4)
INSERT INTO products (name, description, price, stock_quantity, category_id)
VALUES
  ('Hario V60 Dripper', 'Japan''s iconic pour-over brewer. The V60''s spiral ridges and large opening give you full control over extraction for a clean, nuanced cup.', 22.00, 15, 4),
  ('Fellow Stagg Kettle', 'A precision gooseneck kettle with a built-in thermometer and a counterbalanced handle for effortless, controlled pouring. Works on all stovetops.', 65.00, 8, 4),
  ('Baratza Encore Grinder', 'A reliable entry-level burr grinder with 40 grind settings. Consistent particle size from French press to espresso — the standard recommendation for home brewers.', 140.00, 4, 4),
  ('Acaia Pearl Scale', 'A professional-grade brewing scale with real-time flow rate display and auto-timer. Accurate to 0.1g, with a minimalist design built for the coffee bar.', 120.00, 9, 4),
  ('Finum Brewing Basket', 'A fine stainless steel mesh basket that fits most mugs and teapots. Ideal for loose leaf tea, it allows full leaf expansion for a richer infusion.', 18.00, 22, 4);

-- Coffee attributes (attribute_ids: 1=Origin, 2=Roast Level, 3=Format, 4=Weight)
INSERT INTO product_attributes (product_id, attribute_id, value)
VALUES
  (1, 1, 'Ethiopia'),
  (1, 2, 'Light'),
  (1, 3, 'Whole Beans'),
  (1, 4, '250'),
  (2, 1, 'Colombia'),
  (2, 2, 'Medium'),
  (2, 3, 'Ground'),
  (2, 4, '500'),
  (3, 1, 'Brazil'),
  (3, 2, 'Dark'),
  (3, 3, 'Whole Beans'),
  (3, 4, '1000'),
  (4, 1, 'Guatemala'),
  (4, 2, 'Medium'),
  (4, 3, 'Whole Beans'),
  (4, 4, '250'),
  (5, 1, 'Kenya'),
  (5, 2, 'Light'),
  (5, 3, 'Ground'),
  (5, 4, '250');

-- Tea attributes (attribute_ids: 5=Type, 6=Origin, 7=Format, 8=Caffeine Level, 9=Weight)
INSERT INTO product_attributes (product_id, attribute_id, value)
VALUES
  (6, 5, 'Green'),
  (6, 6, 'Japan'),
  (6, 7, 'Loose Leaf'),
  (6, 8, 'Medium'),
  (6, 9, '100'),
  (7, 5, 'Black'),
  (7, 6, 'India'),
  (7, 7, 'Loose Leaf'),
  (7, 8, 'High'),
  (7, 9, '100'),
  (8, 5, 'White'),
  (8, 6, 'China'),
  (8, 7, 'Loose Leaf'),
  (8, 8, 'Low'),
  (8, 9, '50'),
  (9, 5, 'Oolong'),
  (9, 6, 'Taiwan'),
  (9, 7, 'Loose Leaf'),
  (9, 8, 'Medium'),
  (9, 9, '100'),
  (10, 5, 'Herbal'),
  (10, 6, 'Morocco'),
  (10, 7, 'Bagged'),
  (10, 8, 'None'),
  (10, 9, '30');

-- Ready-to-Drink attributes (attribute_ids: 10=Base, 11=Volume)
INSERT INTO product_attributes (product_id, attribute_id, value)
VALUES
  (11, 10, 'Coffee'),
  (11, 11, '330'),
  (12, 10, 'Coffee'),
  (12, 11, '330'),
  (13, 10, 'Coffee'),
  (13, 11, '250'),
  (14, 10, 'Tea'),
  (14, 11, '500'),
  (15, 10, 'Tea'),
  (15, 11, '500');

-- Accessories attributes (attribute_ids: 12=Type, 13=Compatible With)
INSERT INTO product_attributes (product_id, attribute_id, value)
VALUES
  (16, 12, 'Filter'),
  (16, 13, 'Coffee'),
  (17, 12, 'Frother'),
  (17, 13, 'Both'),
  (18, 12, 'Grinder'),
  (18, 13, 'Coffee'),
  (19, 12, 'Scale'),
  (19, 13, 'Both'),
  (20, 12, 'Infuser'),
  (20, 13, 'Tea');

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
