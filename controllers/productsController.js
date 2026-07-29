const { validationResult, matchedData } = require("express-validator");
const productQueries = require("../db/productQueries.js");
const {
  extractAttributes,
} = require("../middleware/validators/productValidators.js");

async function getProducts(req, res) {
  try {
    const { category_id, availability, search, ...attributes } = req.query;
    const products = await productQueries.getProducts(
      category_id,
      availability,
      search,
      attributes
    );
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getProduct(req, res) {
  try {
    const { id } = req.params;
    const product = await productQueries.getProduct(id);
    res.json(product);
  } catch (error) {
    switch (error.message) {
      case "Product not found": {
        res.status(404).json({ error: error.message });
        break;
      }
      default: {
        res.status(500).json({ error: error.message });
      }
    }
  }
}

async function addProduct(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const data = matchedData(req);
    const { name, description, price, stock_quantity, category_id } = data;
    const attributes = extractAttributes(data);
    const product = await productQueries.addProduct(
      name,
      price,
      stock_quantity,
      category_id,
      attributes,
      description
    );
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function updateProduct(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const data = matchedData(req);
    const { name, description, price, stock_quantity, category_id } = data;
    const attributes = extractAttributes(data);

    const product = await productQueries.updateProduct({
      id,
      name,
      description,
      price,
      stock_quantity,
      category_id: Number(category_id),
      attributes,
    });
    res.json(product);
  } catch (error) {
    if (error.message === "Product not found") {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
}

async function deleteProduct(req, res) {
  try {
    const { id } = req.params;

    const product = await productQueries.deleteProduct(id);
    res.json(product);
  } catch (error) {
    if (error.message === "Product not found") {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = {
  getProducts,
  getProduct,
  addProduct,
  updateProduct,
  deleteProduct,
};
