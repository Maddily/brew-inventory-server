const { describe, expect, test } = require("@jest/globals");
const request = require("supertest");
const { main: seedData } = require("../../db/seed.js");
const { app } = require("../../app.js");

beforeEach(async () => {
  await seedData();
});

describe("categories routes", () => {
  test("GET /api/categories reaches getCategories and returns real data", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.body).toEqual([
      {
        id: 1,
        name: "Coffee",
        description: expect.any(String),
        product_count: "0",
      },
      {
        id: 2,
        name: "Tea",
        description: expect.any(String),
        product_count: "0",
      },
      {
        id: 3,
        name: "Ready-to-Drink",
        description: expect.any(String),
        product_count: "0",
      },
      {
        id: 4,
        name: "Accessories",
        description: expect.any(String),
        product_count: "0",
      },
    ]);
  });
  test("GET /api/categories/:id reaches getCategory and returns the right category", async () => {
    const res = await request(app).get("/api/categories/1");
    expect(res.body).toEqual({
      id: 1,
      name: "Coffee",
      description: expect.any(String),
    });
  });
  test("POST /api/categories reaches addCategory and creates a real category", async () => {
    const postRes = await request(app)
      .post("/api/categories")
      .send({ name: "Syrups", description: "Delicious syrups" });

    expect(postRes.status).toBe(201);
    expect(postRes.body).toEqual({
      id: 5,
      name: "Syrups",
      description: "Delicious syrups",
    });

    const getRes = await request(app).get("/api/categories/5");
    expect(getRes.body).toEqual(postRes.body);
  });
  test("PUT /api/categories/:id reaches updateCategory and updates a real category", async () => {
    const putRes = await request(app)
      .put("/api/categories/4")
      .send({ name: "Syrups" });

    expect(putRes.status).toBe(200);
    expect(putRes.body).toEqual({
      id: 4,
      name: "Syrups",
      description: expect.any(String),
    });

    const getRes = await request(app).get("/api/categories/4");
    expect(getRes.body).toEqual(putRes.body);
  });
  test("DELETE /api/categories/:id reaches deleteCategory and deletes a real category", async () => {
    const deleteRes = await request(app).delete("/api/categories/4");
    expect(deleteRes.status).toBe(200);

    const getRes = await request(app).get("/api/categories/4");
    expect(getRes.status).toBe(404);
  });
});
