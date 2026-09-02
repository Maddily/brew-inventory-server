const pool = require("./pool.js");

async function getProducts(
  categoryIds = null,
  availability = null,
  search = null,
  attributes = null
) {
  // Parameterized values passed alongside the SQL string, in order.
  // Every $n placeholder in the query corresponds to a position in this array.
  let values = [];

  const availabilityConditions = {
    "In stock": "stock_quantity > 10",
    "Low stock": "stock_quantity > 0 AND stock_quantity <= 10",
    "Out of stock": "stock_quantity = 0",
  };
  // availability can arrive as a single string or an array of strings
  // (depending on how many availability filters the user picked). Normalize to an array.
  const availabilityArray = Array.isArray(availability)
    ? availability
    : [availability];

  // Each entry here is one full SQL condition. They all get AND-ed together
  // at the end to form the final WHERE clause.
  const whereClauses = [];

  // --- Category filter ---
  if (categoryIds) {
    const idArray = Array.isArray(categoryIds) ? categoryIds : [categoryIds];

    // Build one placeholder per category id: $1, $2, $3...
    const placeholders = idArray.map((_, i) => `$${i + 1}`).join(", ");

    whereClauses.push(`products.category_id IN (${placeholders})`);

    // Category ids are always the first values pushed, so they occupy $1, $2, etc.
    values = idArray;
  }

  // --- Availability filter ---
  // Skip this filter entirely if all 3 availability options are selected.
  // That's equivalent to no filter at all, so there's no need to add SQL for it.
  if (availability && availabilityArray.length < 3) {
    // Turn each selected availability label into its matching SQL condition,
    // e.g. ["In stock", "Low stock"] -> ["stock_quantity > 10", "stock_quantity > 0 AND stock_quantity <= 10"]
    const conditions = availabilityArray.map((a) => availabilityConditions[a]);

    // OR them together: a product only needs to match ONE of the selected availability states.
    whereClauses.push(`(${conditions.join(" OR ")})`);
  }

  // --- Search filter ---
  if (search) {
    // Wrap the search term in % wildcards for a partial, case-insensitive match (ILIKE).
    values.push(`%${search}%`);
    whereClauses.push(`products.name ILIKE $${values.length}`);
  }

  // --- Attribute filters (e.g. Roast Level = Medium, Origin = Ethiopia) ---
  if (attributes) {
    const conditions = [];

    // Each entry is one attribute name mapped to the value(s) selected for it,
    // e.g. { "Roast Level": ["Medium", "Dark"], "Origin": ["Ethiopia"] }
    for (const [attribute, value] of Object.entries(attributes)) {
      // A single attribute can have one or multiple selected values (chips). Normalize to an array.
      const valueArray = Array.isArray(value) ? value : [value];

      // Reserve one placeholder for the attribute NAME first.
      values.push(attribute);
      const nameIndex = values.length;

      // Then reserve one placeholder per selected VALUE for this attribute.
      const startIndex = values.length + 1;
      values.push(...valueArray);
      const placeholders = valueArray
        .map((_, i) => `$${startIndex + i}`)
        .join(", ");

      // EXISTS asks: "does this product have an attribute row whose name and value both match?"
      // Written in plain English: "the product must have a `Roast Level` attribute
      // set to Medium or Dark for this condition to be true."
      conditions.push(
        `EXISTS (
          SELECT 1 FROM product_attributes pa
          JOIN attributes a ON a.id = pa.attribute_id
          WHERE pa.product_id = products.id
          AND LOWER(a.name) = LOWER($${nameIndex})
          AND pa.value IN (${placeholders})
        )`
      );
    }

    // AND every attribute's condition together: a product must satisfy
    // ALL selected attribute filters at once (Roast Level AND Origin, not OR).
    conditions.length && whereClauses.push(`(${conditions.join(" AND ")})`);
  }

  // Combine every active filter (category, availability, search, attributes)
  // into a single WHERE clause. If no filters were applied, whereSQL is empty
  // and every product is returned.
  const whereSQL = whereClauses.length
    ? `WHERE ${whereClauses.join(" AND ")}`
    : "";

  // Final query shape:
  // 1. The inner subquery finds the IDs of products that pass all the filters above.
  //    It only needs to join product_attributes/attributes because attribute
  //    filters reference those tables, category/availability/search don't need the join.
  // 2. The outer query then re-selects those same products, but joins in
  //    EVERY attribute row for each one (not just the filtered attribute),
  //    so the result includes the full attribute set per product, one row per attribute.
  const SQL = `
    SELECT
      products.*,
      categories.name AS category,
      attributes.name AS attribute_name,
      product_attributes.value AS attribute_value
    FROM products
    JOIN categories ON products.category_id = categories.id
    JOIN product_attributes ON products.id = product_attributes.product_id
    JOIN attributes ON attributes.id = product_attributes.attribute_id
    WHERE products.id IN (
      SELECT products.id
      FROM products
      JOIN product_attributes ON products.id = product_attributes.product_id
      JOIN attributes ON attributes.id = product_attributes.attribute_id
      ${whereSQL}
    )
    ORDER BY products.category_id, products.name
    `;

  const { rows } = await pool.query(SQL, values);
  return rows;
}

async function getProduct(id) {
  const { rows, rowCount } = await pool.query(
    `
    SELECT
      products.*,
      categories.name AS category,
      attributes.name AS attribute_name,
      product_attributes.value AS attribute_value
    FROM products
    JOIN categories ON products.category_id = categories.id
    JOIN product_attributes ON products.id = product_attributes.product_id
    JOIN attributes ON product_attributes.attribute_id = attributes.id
    WHERE products.id = $1
    `,
    [id]
  );

  if (rowCount === 0) {
    throw new Error("Product not found");
  }

  return rows;
}

async function addProduct(
  name,
  price,
  stock_quantity,
  category_id,
  attributes,
  description = null
) {
  const client = await pool.connect();
  await client.query("BEGIN");
  try {
    const { rows } = await pool.query(
      `INSERT INTO products (name, description, price, stock_quantity, category_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *`,
      [name, description, price, stock_quantity, category_id]
    );

    const product = rows[0];

    // Add product attributes
    for (const [attrName, value] of Object.entries(attributes)) {
      await pool.query(
        `INSERT INTO product_attributes (product_id, attribute_id, value)
      VALUES ($1, (SELECT id FROM attributes WHERE LOWER(name) = LOWER($2) AND category_id = $3), $4)`,
        [product.id, attrName, category_id, value]
      );
    }
    await client.query("COMMIT");
    return product;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function updateProduct({
  id,
  name,
  description,
  price,
  stock_quantity,
  category_id,
  attributes = {},
}) {
  await pool.query("BEGIN");
  try {
    const { rows, rowCount } = await pool.query(
      `
      UPDATE products SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        price = COALESCE($3, price),
        stock_quantity = COALESCE($4, stock_quantity)
      WHERE id = $5
      RETURNING *
      `,
      [name, description, price, stock_quantity, id]
    );

    if (rowCount === 0) {
      throw new Error("Product not found");
    }

    const product = rows[0];

    for (const [attrName, value] of Object.entries(attributes)) {
      await pool.query(
        `
      UPDATE product_attributes SET
        value = $1
      FROM attributes
      WHERE
        attributes.id = product_attributes.attribute_id
        AND attribute_id = (SELECT id FROM attributes WHERE LOWER(name) = LOWER($2) AND category_id = $3)
        AND product_attributes.product_id = $4
      `,
        [value, attrName, category_id, id]
      );
    }

    await pool.query("COMMIT");
    return product;
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
}

async function deleteProduct(id) {
  const { rows, rowCount } = await pool.query(
    "DELETE FROM products WHERE id = $1 RETURNING *",
    [id]
  );

  if (rowCount === 0) {
    throw new Error("Product not found");
  }

  return rows[0];
}

module.exports = {
  getProducts,
  getProduct,
  addProduct,
  updateProduct,
  deleteProduct,
};
