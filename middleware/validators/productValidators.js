const { body } = require("express-validator");

const categoryAttributeKeys = {
  1: ["Origin", "Roast Level", "Format", "Weight"],
  2: ["Type", "Origin", "Format", "Caffeine Level", "Weight"],
  3: ["Base", "Volume"],
  4: ["Type", "Compatible With"],
};

const attributeValidators = Object.entries(categoryAttributeKeys).flatMap(
  ([category_id, attrs]) =>
    attrs.map((attr) =>
      body(attr)
        .if(
          body("category_id").isIn([Number(category_id), String(category_id)])
        )
        .trim()
        .notEmpty()
        .withMessage(`${attr} is required`)
    )
);

const validateProduct = [
  body("name").trim().notEmpty().withMessage(`Product name is required.`),
  body("description").trim().optional(),
  body("price").isFloat({ gt: 0 }).withMessage("Price must be greater than 0"),
  body("stock_quantity")
    .isInt({ min: 0 })
    .withMessage("Quantity can't be negative"),
  body("category_id").isInt({ min: 1, max: 4 }).withMessage("Invalid category"),
  ...attributeValidators,
];

function extractAttributes(data) {
  const keys = categoryAttributeKeys[data.category_id] || [];
  return Object.fromEntries(keys.map((key) => [key, data[key]]));
}

module.exports = { validateProduct, extractAttributes };
