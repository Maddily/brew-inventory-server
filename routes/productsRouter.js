const express = require("express");
const {
  getProducts,
  getProduct,
  addProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productsController.js");
const {
  validateProduct,
  validatePassword,
} = require("../middleware/validators/productValidators.js");

const productsRouter = express.Router();

productsRouter.get("/", getProducts);
productsRouter.get("/:id", getProduct);
productsRouter.post("/", validateProduct, addProduct);
productsRouter.put("/:id", validateProduct, updateProduct);
productsRouter.delete("/:id", validatePassword, deleteProduct);

module.exports = productsRouter;
