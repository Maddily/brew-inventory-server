const express = require("express");
const {
  getCategories,
  getCategory,
  addCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoriesController.js");

const categoriesRouter = express.Router();

categoriesRouter.get("/", getCategories);
categoriesRouter.get("/:id", getCategory);
categoriesRouter.post("/", addCategory);
categoriesRouter.put("/:id", updateCategory);
categoriesRouter.delete("/:id", deleteCategory);

module.exports = categoriesRouter;
