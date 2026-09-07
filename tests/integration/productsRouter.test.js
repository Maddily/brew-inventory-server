const { describe, expect, test } = require("@jest/globals");
const request = require("supertest");
const { main: seedData } = require("../../db/seed.js");
const { app } = require("../../app.js");
const { addProduct } = require("../../db/productQueries.js");
const {
  brazilRows,
  colombiaRows,
  ethiopiaRows,
  mintRows,
  senchaRows,
  coldBrewRows,
  v60Rows,
} = require("./fixtures/productRows.js");

let products;

beforeEach(async () => {
  await seedData();

  products = {};

  // Coffee (category 1) — 3 products, spans all availability tiers
  products.ethiopia = await addProduct("Ethiopia Yirgacheffe", 18, 42, 1, {
    Origin: "Ethiopia",
    "Roast Level": "Light",
    Format: "Whole Bean",
    Weight: "250",
  }); // In stock

  products.colombia = await addProduct("Colombia Huila", 16, 8, 1, {
    Origin: "Colombia",
    "Roast Level": "Medium",
    Format: "Ground",
    Weight: "250",
  }); // Low stock

  products.brazil = await addProduct("Brazil Santos", 14, 0, 1, {
    Origin: "Brazil",
    "Roast Level": "Dark",
    Format: "Whole Bean",
    Weight: "1000",
  }); // Out of stock

  // Tea (category 2) — 2 products, shares "Light" roast-equivalent attribute overlap via Caffeine Level
  products.sencha = await addProduct("Japanese Sencha", 12.5, 15, 2, {
    Type: "Green",
    Origin: "Japan",
    Format: "Loose Leaf",
    "Caffeine Level": "Medium",
    Weight: "100",
  }); // In stock

  products.mint = await addProduct("Moroccan Mint", 9, 3, 2, {
    Type: "Herbal",
    Origin: "Morocco",
    Format: "Bagged",
    "Caffeine Level": "None",
    Weight: "30",
  }); // Low stock

  // Ready-to-Drink (category 3) — 1 product
  products.coldBrew = await addProduct("Cold Brew Original", 5, 20, 3, {
    Base: "Coffee",
    Volume: "355",
  }); // In stock

  // Accessories (category 4) — 1 product
  products.v60 = await addProduct("Hario V60 Dripper", 22, 0, 4, {
    Type: "Dripper",
    "Compatible With": "Coffee",
  }); // Out of stock
});

describe("products routes", () => {
  test("GET /api/products reaches getProducts and returns real data", async () => {
    const res = await request(app).get("/api/products");
    expect(res.body).toEqual([
      ...brazilRows(),
      ...colombiaRows(),
      ...ethiopiaRows(),
      ...senchaRows(),
      ...mintRows(),
      ...coldBrewRows(),
      ...v60Rows(),
    ]);
  });
  test("GET /api/products/:id reaches getProduct and returns the right product", async () => {
    const res = await request(app).get("/api/products/1");
    expect(res.body).toEqual(ethiopiaRows());
  });
  test("POST /api/products reaches addProduct and creates a product", async () => {
    const postRes = await request(app).post("/api/products").send({
      name: "Americano",
      price: "3",
      stock_quantity: 20,
      category_id: 3,
      Base: "Coffee",
      Volume: 300,
    });
    expect(postRes.status).toBe(201);

    const getRes = await request(app).get(`/api/products/${postRes.body.id}`);
    expect(getRes.body).toEqual([
      {
        id: 8,
        name: "Americano",
        description: null,
        price: "3.00",
        stock_quantity: 20,
        category_id: 3,
        category: "Ready-to-Drink",
        attribute_name: "Base",
        attribute_value: "Coffee",
      },
      {
        id: 8,
        name: "Americano",
        description: null,
        price: "3.00",
        stock_quantity: 20,
        category_id: 3,
        category: "Ready-to-Drink",
        attribute_name: "Volume",
        attribute_value: "300",
      },
    ]);
  });
  test("POST /api/products returns 400 when validation fails", async () => {
    const res = await request(app).post("/api/products").send({
      name: "Americano",
      price: "3",
      stock_quantity: 20,
      category_id: 3,
      Base: "Coffee",
    });
    expect(res.status).toBe(400);
  });
  test("PUT /api/products/:id reaches updateProduct and updates a product", async () => {
    const putRes = await request(app).put("/api/products/6").send({
      name: "Americano",
      description: "",
      price: "3.00",
      stock_quantity: 20,
      category_id: 3,
      Base: "Coffee",
      Volume: 300,
    });
    expect(putRes.status).toBe(200);

    const getRes = await request(app).get("/api/products/6");
    expect(getRes.body).toEqual([
      {
        id: 6,
        name: "Americano",
        description: "",
        price: "3.00",
        stock_quantity: 20,
        category_id: 3,
        category: "Ready-to-Drink",
        attribute_name: "Base",
        attribute_value: "Coffee",
      },
      {
        id: 6,
        name: "Americano",
        description: "",
        price: "3.00",
        stock_quantity: 20,
        category_id: 3,
        category: "Ready-to-Drink",
        attribute_name: "Volume",
        attribute_value: "300",
      },
    ]);
  });
  test("PUT /api/products/:id returns 400 when validation fails", async () => {
    const res = await request(app).put("/api/products/6").send({
      name: "Americano",
      price: "3",
      stock_quantity: 20,
      category_id: 3,
      Base: "Coffee",
    });
    expect(res.status).toBe(400);
  });
  test("DELETE /api/products/:id reaches deleteProduct and deletes a product with the correct password", async () => {
    const deleteRes = await request(app)
      .delete("/api/products/6")
      .send({ password: "brew123" });
    expect(deleteRes.status).toBe(200);

    const getRes = await request(app).get("/api/products/6");
    expect(getRes.status).toBe(404);
  });
  test("DELETE /api/products/:id returns 400 when the password is wrong", async () => {
    const deleteRes = await request(app)
      .delete("/api/products/6")
      .send({ password: "brew" });
    expect(deleteRes.status).toBe(400);
  });
});
