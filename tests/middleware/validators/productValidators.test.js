const { describe, it, expect } = require("@jest/globals");
require("dotenv").config();
const express = require("express");
const request = require("supertest");
const { validationResult } = require("express-validator");
const {
  categoryAttributeKeys,
  extractAttributes,
  validateProduct,
  validatePassword,
} = require("../../../middleware/validators/productValidators");

function buildApp() {
  const app = express();
  app.use(express.json());
  app.post("/test", validateProduct, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    res.status(200).json({ ok: true });
  });
  app.delete("/test", validatePassword, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    res.status(200).json({ ok: true });
  });
  return app;
}

describe("extractAttributes", () => {
  it("returns an empty object when data.category_id isn't 1, 2, 3 or 4", () => {
    expect(
      extractAttributes(
        { category_id: 5, Flavor: "mint" },
        categoryAttributeKeys
      )
    ).toEqual({});
  });

  it("returns the correct object of attributes when data.category_id is 1", () => {
    const data = {
      category_id: 1,
      Origin: "Yemen",
      "Roast Level": "Medium",
      Format: "Whole Bean",
      Weight: "1000",
    };

    expect(extractAttributes(data, categoryAttributeKeys)).toEqual({
      Origin: "Yemen",
      "Roast Level": "Medium",
      Format: "Whole Bean",
      Weight: "1000",
    });
  });

  it("returns the correct object of attributes when data.category_id is 2", () => {
    const data = {
      category_id: 2,
      Type: "Green",
      Origin: "Japan",
      Format: "Loose Leaf",
      "Caffeine Level": "Medium",
      Weight: "250",
    };

    expect(extractAttributes(data, categoryAttributeKeys)).toEqual({
      Type: "Green",
      Origin: "Japan",
      Format: "Loose Leaf",
      "Caffeine Level": "Medium",
      Weight: "250",
    });
  });

  it("returns the correct object of attributes when data.category_id is 3", () => {
    const data = {
      category_id: 3,
      Base: "Coffee",
      Volume: "355",
    };

    expect(extractAttributes(data, categoryAttributeKeys)).toEqual({
      Base: "Coffee",
      Volume: "355",
    });
  });

  it("returns the correct object of attributes when data.category_id is 4", () => {
    const data = {
      category_id: 4,
      Type: "Grinder",
      "Compatible With": "Coffee",
    };

    expect(extractAttributes(data, categoryAttributeKeys)).toEqual({
      Type: "Grinder",
      "Compatible With": "Coffee",
    });
  });

  it("returns undefined for an attribute value when it doesn't exist in the given data", () => {
    const data = {
      category_id: 4,
      Type: "Grinder",
    };

    const attributes = extractAttributes(data, categoryAttributeKeys);

    expect(attributes).toEqual({
      Type: "Grinder",
      "Compatible With": undefined,
    });
    expect(Object.keys(attributes)).toContain("Compatible With");
  });
});

describe("validateProduct", () => {
  it("returns an error when name is missing", async () => {
    const app = buildApp();

    const res = await request(app).post("/test").send({
      price: 5,
      stock_quantity: 10,
      category_id: 1,
      Origin: "Ethiopia",
      "Roast Level": "Medium",
      Format: "Whole Bean",
      Weight: 250,
    });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ msg: "Product name is required." }),
      ])
    );
  });

  it("returns an error when price is less than 0", async () => {
    const app = buildApp();

    const res = await request(app).post("/test").send({
      name: "Ethiopia Yirgacheffe",
      price: -1,
      stock_quantity: 10,
      category_id: 1,
      Origin: "Ethiopia",
      "Roast Level": "Medium",
      Format: "Whole Bean",
      Weight: 250,
    });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ msg: "Price must be greater than 0" }),
      ])
    );
  });

  it("returns an error when price is 0", async () => {
    const app = buildApp();

    const res = await request(app).post("/test").send({
      name: "Ethiopia Yirgacheffe",
      price: 0,
      stock_quantity: 10,
      category_id: 1,
      Origin: "Ethiopia",
      "Roast Level": "Medium",
      Format: "Whole Bean",
      Weight: 250,
    });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ msg: "Price must be greater than 0" }),
      ])
    );
  });

  it("returns an error when stock_quantity is less than 0", async () => {
    const app = buildApp();

    const res = await request(app).post("/test").send({
      name: "Ethiopia Yirgacheffe",
      price: 5,
      stock_quantity: -2,
      category_id: 1,
      Origin: "Ethiopia",
      "Roast Level": "Medium",
      Format: "Whole Bean",
      Weight: 250,
    });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ msg: "Quantity can't be negative" }),
      ])
    );
  });

  it("returns an error when category_id is less than 1", async () => {
    const app = buildApp();

    const res = await request(app).post("/test").send({
      name: "Ethiopia Yirgacheffe",
      price: 5,
      stock_quantity: 12,
      category_id: 0,
      Origin: "Ethiopia",
      "Roast Level": "Medium",
      Format: "Whole Bean",
      Weight: 250,
    });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ msg: "Invalid category" }),
      ])
    );
  });

  it("returns an error when category_id is greater than 4", async () => {
    const app = buildApp();

    const res = await request(app).post("/test").send({
      name: "Ethiopia Yirgacheffe",
      price: 5,
      stock_quantity: 12,
      category_id: 5,
      Origin: "Ethiopia",
      "Roast Level": "Medium",
      Format: "Whole Bean",
      Weight: 250,
    });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ msg: "Invalid category" }),
      ])
    );
  });

  it("returns an error when id is sent (editing mode) and password is missing", async () => {
    const app = buildApp();

    const res = await request(app).post("/test").send({
      id: 1,
      name: "Ethiopia Yirgacheffe",
      price: 5,
      stock_quantity: 10,
      category_id: 1,
      Origin: "Ethiopia",
      "Roast Level": "Medium",
      Format: "Whole Bean",
      Weight: 250,
    });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ msg: "Incorrect password" }),
      ])
    );
  });

  it("returns an error when id is sent (editing mode) and password is wrong", async () => {
    const app = buildApp();

    const res = await request(app).post("/test").send({
      id: 1,
      name: "Ethiopia Yirgacheffe",
      price: 5,
      stock_quantity: 10,
      category_id: 1,
      Origin: "Ethiopia",
      "Roast Level": "Medium",
      Format: "Whole Bean",
      Weight: 250,
      password: "123",
    });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ msg: "Incorrect password" }),
      ])
    );
  });

  it("returns status 200 when id is not sent and password is missing", async () => {
    const app = buildApp();

    const res = await request(app).post("/test").send({
      name: "Ethiopia Yirgacheffe",
      price: 5,
      stock_quantity: 10,
      category_id: 1,
      Origin: "Ethiopia",
      "Roast Level": "Medium",
      Format: "Whole Bean",
      Weight: 250,
    });

    expect(res.status).toBe(200);
  });

  it("returns an error when a required attribute isn't sent for the selected category", async () => {
    const app = buildApp();

    const res = await request(app).post("/test").send({
      name: "Ethiopia Yirgacheffe",
      price: 5,
      stock_quantity: 10,
      category_id: 1,
      Origin: "Ethiopia",
      "Roast Level": "Medium",
      Format: "Whole Bean",
    });

    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ msg: "Weight is required" }),
      ])
    );
  });

  it("returns status 200 when data is valid", async () => {
    const app = buildApp();

    const res = await request(app).post("/test").send({
      id: 1,
      name: "Ethiopia Yirgacheffe",
      price: 5,
      stock_quantity: 10,
      category_id: 1,
      Origin: "Ethiopia",
      "Roast Level": "Medium",
      Format: "Whole Bean",
      Weight: 250,
      password: process.env.ADMIN_PASSWORD,
    });

    expect(res.status).toBe(200);
  });
});

describe("validatePassword", () => {
  it("returns an error if password is missing", async () => {
    const app = buildApp();

    const res = await request(app).delete("/test").send({});

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ msg: "Incorrect password" }),
      ])
    );
  });

  it("returns an error if password is wrong", async () => {
    const app = buildApp();

    const res = await request(app).delete("/test").send({ password: "123" });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ msg: "Incorrect password" }),
      ])
    );
  });

  it("returns status 200 when the password is correct", async () => {
    const app = buildApp();

    const res = await request(app)
      .delete("/test")
      .send({ password: process.env.ADMIN_PASSWORD });

    expect(res.status).toBe(200);
  });
});
