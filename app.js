const express = require("express");
require("dotenv").config();
const categoriesRouter = require("./routes/categoriesRouter.js");
const productsRouter = require("./routes/productsRouter.js");

const app = express();
const PORT = process.env.PORT;

app.use("/api/categories", categoriesRouter);
app.use("/api/products", productsRouter);

app.listen(PORT, (error) => {
  if (error) throw error;
  console.log("App is running...");
});
