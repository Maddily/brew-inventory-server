const pool = require("./pool.js");

async function getProducts(
  categoryIds = null,
  availability = null,
  search = null,
  attributes = null
) {
  let values = [];

  const availabilityConditions = {
    "In stock": "stock_quantity > 10",
    "Low stock": "stock_quantity > 0 AND stock_quantity <= 10",
    "Out of stock": "stock_quantity = 0",
  };
  const availabilityArray = Array.isArray(availability)
    ? availability
    : [availability];

  const whereClauses = [];

  if (categoryIds) {
    const idArray = Array.isArray(categoryIds) ? categoryIds : [categoryIds];
    const placeholders = idArray.map((_, i) => `$${i + 1}`).join(", ");

    whereClauses.push(`products.category_id IN (${placeholders})`);
    values = idArray;
  }

  if (availability && availabilityArray.length < 3) {
    const conditions = availabilityArray.map((a) => availabilityConditions[a]);
    whereClauses.push(`(${conditions.join(" OR ")})`);
  }

  if (search) {
    values.push(`%${search}%`);
    whereClauses.push(`products.name ILIKE $${values.length}`);
  }

  if (attributes) {
    const conditions = [];
    for (const [attribute, value] of Object.entries(attributes)) {
      const valueArray = Array.isArray(value) ? value : [value];
      const startIndex = values.length + 1;
      values = [...values, ...valueArray];
      const placeholders = valueArray
        .map((_, i) => `$${startIndex + i}`)
        .join(", ");

      conditions.push(
        `EXISTS (
          SELECT 1 FROM product_attributes pa
          JOIN attributes a ON a.id = pa.attribute_id
          WHERE pa.product_id = products.id
          AND LOWER(a.name) = LOWER('${attribute}')
          AND pa.value IN (${placeholders})
        )`
      );
    }

    conditions.length && whereClauses.push(`(${conditions.join(" AND ")})`);
  }

  const whereSQL = whereClauses.length
    ? `WHERE ${whereClauses.join(" AND ")}`
    : "";

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
    ORDER BY products.id
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
  await pool.query("BEGIN");
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
    await pool.query("COMMIT");
    return product;
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
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
