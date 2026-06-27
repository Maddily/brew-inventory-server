const categoryQueries = require("../db/categoryQueries.js");

async function getCategories(req, res) {
  try {
    const categories = await categoryQueries.getCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getCategory(req, res) {
  try {
    const { id } = req.params;
    const category = await categoryQueries.getCategory(id);
    res.json(category);
  } catch (error) {
    if (error.message === "Category not found") {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
}

async function addCategory(req, res) {
  try {
    const { name, description } = req.body;
    const category = await categoryQueries.addCategory(name, description);
    res.status(201).json(category);
  } catch (error) {
    switch (error.message) {
      case "Name is required": {
        res.status(400).json({ error: error.message });
        break;
      }
      case "Category already exists": {
        res.status(409).json({ error: error.message });
        break;
      }
      default: {
        res.status(500).json({ error: error.message });
      }
    }
  }
}

async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const category = await categoryQueries.updateCategory(
      id,
      name,
      description
    );
    res.json(category);
  } catch (error) {
    switch (error.message) {
      case "Either name or description is required": {
        res.status(400).json({ error: error.message });
        break;
      }
      case "Category not found": {
        res.status(404).json({ error: error.message });
        break;
      }
      default: {
        res.status(500).json({ error: error.message });
      }
    }
  }
}

async function deleteCategory(req, res) {
  try {
    const { id } = req.params;
    const category = await categoryQueries.deleteCategory(id);
    res.json(category);
  } catch (error) {
    if (error.message === "Category not found") {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = {
  getCategories,
  getCategory,
  addCategory,
  updateCategory,
  deleteCategory,
};
