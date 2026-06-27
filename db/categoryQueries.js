const pool = require("./pool.js");

async function getCategories() {
  const { rows } = await pool.query("SELECT * FROM categories ORDER BY id");
  return rows;
}

async function getCategory(id) {
  const { rows, rowCount } = await pool.query(
    "SELECT * FROM categories WHERE id = $1",
    [id]
  );

  if (rowCount === 0) {
    throw new Error("Category not found");
  }

  return rows[0];
}

async function addCategory(name, description = null) {
  if (!name) {
    throw new Error("Name is required");
  }

  const { rowCount } = await pool.query(
    "SELECT 1 FROM categories WHERE LOWER(name) = LOWER($1)",
    [name]
  );
  const categoryExists = rowCount > 0;
  if (categoryExists) {
    throw new Error("Category already exists");
  }

  const { rows } = await pool.query(
    "INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *",
    [name, description]
  );

  return rows[0];
}

async function updateCategory(id, name = null, description = null) {
  let response;
  if (name && description) {
    response = await pool.query(
      "UPDATE categories SET name = $1, description = $2 WHERE id = $3 RETURNING *",
      [name, description, id]
    );
  } else if (name && !description) {
    response = await pool.query(
      "UPDATE categories SET name = $1 WHERE id = $2 RETURNING *",
      [name, id]
    );
  } else if (description && !name) {
    response = await pool.query(
      "UPDATE categories SET description = $1 WHERE id = $2 RETURNING *",
      [description, id]
    );
  } else if (!description && !name) {
    throw new Error("Either name or description is required");
  }

  if (!response || response.rowCount === 0) {
    throw new Error("Category not found");
  }

  return response.rows[0];
}

async function deleteCategory(id) {
  const { rows, rowCount } = await pool.query(
    "DELETE FROM categories WHERE id = $1 RETURNING *",
    [id]
  );

  if (rowCount === 0) {
    throw new Error("Category not found");
  }

  return rows[0];
}

module.exports = {
  getCategories,
  getCategory,
  addCategory,
  updateCategory,
  deleteCategory,
};
