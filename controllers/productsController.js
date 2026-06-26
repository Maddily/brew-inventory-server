const productQueries = require("../db/productQueries.js");

async function getProducts(req, res) {
  try {
    // Remember to implement filtering by attributes
    const { category_id } = req.query;
    const products = await productQueries.getProducts(category_id);
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
    const { name, description, price, stock_quantity, category_id } = req.body;
    if (!name || !price || !stock_quantity || !category_id) {
      res.status(400).json({ error: "Product details are required" });
      return;
    }

    const attributes = {};
    switch (category_id) {
      case "1": {
        attributes["Origin"] = req.body["Origin"];
        attributes["Roast Level"] = req.body["Roast Level"];
        attributes["Format"] = req.body["Format"];
        attributes["Weight"] = req.body["Weight"];

        if (Object.values(attributes).some((value) => !value)) {
          res.status(400).json({ error: "Product attributes are required" });
          return;
        }

        break;
      }
      case "2": {
        attributes["Type"] = req.body["Type"];
        attributes["Origin"] = req.body["Origin"];
        attributes["Format"] = req.body["Format"];
        attributes["Caffeine Level"] = req.body["Caffeine Level"];
        attributes["Weight"] = req.body["Weight"];

        if (Object.values(attributes).some((value) => !value)) {
          res.status(400).json({ error: "Product attributes are required" });
          return;
        }

        break;
      }
      case "3": {
        attributes["Base"] = req.body["Base"];
        attributes["Volume"] = req.body["Volume"];

        if (Object.values(attributes).some((value) => !value)) {
          res.status(400).json({ error: "Product attributes are required" });
          return;
        }

        break;
      }
      case "4": {
        attributes["Type"] = req.body["Type"];
        attributes["Compatible With"] = req.body["Compatible With"];

        if (Object.values(attributes).some((value) => !value)) {
          res.status(400).json({ error: "Product attributes are required" });
          return;
        }

        break;
      }
    }

    const product = await productQueries.addProduct(
      name,
      price,
      stock_quantity,
      Number(category_id),
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
    const { id } = req.params;
    const { name, description, price, stock_quantity, category_id } = req.body;

    const attributes = {};
    switch (category_id) {
      case "1": {
        attributes["Origin"] = req.body["Origin"];
        attributes["Roast Level"] = req.body["Roast Level"];
        attributes["Format"] = req.body["Format"];
        attributes["Weight"] = req.body["Weight"];
        break;
      }
      case "2": {
        attributes["Type"] = req.body["Type"];
        attributes["Origin"] = req.body["Origin"];
        attributes["Format"] = req.body["Format"];
        attributes["Caffeine Level"] = req.body["Caffeine Level"];
        attributes["Weight"] = req.body["Weight"];
        break;
      }
      case "3": {
        attributes["Base"] = req.body["Base"];
        attributes["Volume"] = req.body["Volume"];
        break;
      }
      case "4": {
        attributes["Type"] = req.body["Type"];
        attributes["Compatible With"] = req.body["Compatible With"];
        break;
      }
    }

    if (
      [name, description, price, stock_quantity].every(
        (value) => value === undefined || value === null
      ) &&
      Object.values(attributes).every(
        (value) => value === undefined || value === null
      )
    ) {
      res.status(400).json({ error: "Must provide data to be updated" });
      return;
    }

    for (const attribute in attributes) {
      if (!attributes[attribute]) {
        delete attributes[attribute];
      }
    }

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
