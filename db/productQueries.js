const pool = require("./pool.js");

async function getProducts(categoryID = null) {
  if (!categoryID) {
    const { rows } = await pool.query(
      `
    SELECT products.*, categories.name AS category
    FROM products
    JOIN categories ON products.category_id = categories.id
    ORDER BY id
    `
    );
    return rows;
  }

  const { rows } = await pool.query(
    `
    SELECT products.*, categories.name AS category
    FROM products
    JOIN categories ON products.category_id = categories.id
    WHERE
      category_id = $1
    ORDER BY id
    `,
    [categoryID]
  );

  return rows;
}

async function getProduct(id) {
  const { rows, rowCount } = await pool.query(
    "SELECT * FROM products WHERE id = $1",
    [id]
  );

  if (rowCount === 0) {
    throw new Error("Product not found");
  }

  return rows[0];
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
