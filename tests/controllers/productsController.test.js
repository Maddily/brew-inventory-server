const { describe, expect, it } = require("@jest/globals");
jest.mock("../../db/productQueries");
const queries = require("../../db/productQueries.js");
const {
  getProducts,
  getProduct,
  addProduct,
  updateProduct,
  deleteProduct,
} = require("../../controllers/productsController.js");

describe("getProducts", () => {
  it("returns 500 status when the database throws an error", async () => {
    const req = { query: {} };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    queries.getProducts.mockRejectedValue(new Error("Internal server error"));

    await getProducts(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  it("returns products in all categories when no category id is provided", async () => {
    const req = { query: {} };
    const res = { json: jest.fn() };

    queries.getProducts.mockResolvedValue([
      {
        id: 1,
        name: "espresso coffee",
        description: "",
        price: 20,
        stock_quantity: 10,
        category_id: 1,
      },
      {
        id: 2,
        name: "red tea",
        description: "",
        price: 10,
        stock_quantity: 30,
        category_id: 2,
      },
      {
        id: 3,
        name: "green tea",
        description: "",
        price: 10,
        stock_quantity: 25,
        category_id: 2,
      },
    ]);

    await getProducts(req, res);
    expect(queries.getProducts).toHaveBeenCalledWith(undefined, undefined);
    expect(res.json).toHaveBeenCalledWith([
      {
        id: 1,
        name: "espresso coffee",
        description: "",
        price: 20,
        stock_quantity: 10,
        category_id: 1,
      },
      {
        id: 2,
        name: "red tea",
        description: "",
        price: 10,
        stock_quantity: 30,
        category_id: 2,
      },
      {
        id: 3,
        name: "green tea",
        description: "",
        price: 10,
        stock_quantity: 25,
        category_id: 2,
      },
    ]);
  });

  it("returns products of a category when category id is provided", async () => {
    const req = { query: { category_id: 1 } };
    const res = { json: jest.fn() };

    queries.getProducts.mockResolvedValue([
      {
        id: 1,
        name: "espresso coffee",
        description: "",
        price: 20,
        stock_quantity: 10,
        category_id: 1,
      },
    ]);

    await getProducts(req, res);
    expect(queries.getProducts).toHaveBeenCalledWith(1, undefined);
    expect(res.json).toHaveBeenCalledWith([
      {
        id: 1,
        name: "espresso coffee",
        description: "",
        price: 20,
        stock_quantity: 10,
        category_id: 1,
      },
    ]);
  });
});

describe("getProduct", () => {
  it("returns 500 status when the database throws an error", async () => {
    const req = { params: {} };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    queries.getProduct.mockRejectedValue(new Error("Internal server error"));

    await getProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  it("returns 404 status when product id given isn't found", async () => {
    const req = { params: { id: 7 } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    queries.getProduct.mockRejectedValue(new Error("Product not found"));

    await getProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Product not found" });
  });

  it("returns a product when the given id exists", async () => {
    const req = { params: { id: 1 } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    queries.getProduct.mockResolvedValue({
      id: 1,
      name: "espresso coffee",
      description: "",
      price: 20,
      stock_quantity: 10,
      category_id: 1,
    });

    await getProduct(req, res);
    expect(res.json).toHaveBeenCalledWith({
      id: 1,
      name: "espresso coffee",
      description: "",
      price: 20,
      stock_quantity: 10,
      category_id: 1,
    });
  });
});

describe("addProduct", () => {
  it("returns 500 status when the database throws an error", async () => {
    const req = {
      body: {
        name: "espresso coffee",
        price: 5,
        stock_quantity: 50,
        category_id: 1,
      },
    };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    queries.addProduct.mockRejectedValue(new Error("Internal server error"));

    await addProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  it("returns 400 status when product details are missing", async () => {
    const req = { body: {} };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await addProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Product details are required",
    });
  });

  it("returns 400 status when attributes are missing", async () => {
    const req = {
      body: {
        name: "espresso coffee",
        price: 5,
        stock_quantity: 50,
        category_id: "1",
      },
    };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await addProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Product attributes are required",
    });
  });

  it("successfully adds a product when given the needed data", async () => {
    const req = {
      body: {
        name: "espresso coffee",
        price: 5,
        stock_quantity: 50,
        category_id: "1",
        Origin: "Colombia",
        "Roast Level": "Medium",
        Format: "Whole Beans",
        Weight: 250,
      },
    };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    queries.addProduct.mockResolvedValue({
      id: 1,
      name: "espresso coffee",
      description: "",
      price: 5,
      stock_quantity: 50,
      category_id: 1,
    });

    await addProduct(req, res);

    expect(queries.addProduct).toHaveBeenCalledWith(
      "espresso coffee",
      5,
      50,
      1,
      {
        Origin: "Colombia",
        "Roast Level": "Medium",
        Format: "Whole Beans",
        Weight: 250,
      },
      undefined
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      id: 1,
      name: "espresso coffee",
      description: "",
      price: 5,
      stock_quantity: 50,
      category_id: 1,
    });
  });
});

describe("updateProduct", () => {
  it("returns 500 status when the database throws an error", async () => {
    const req = { params: { id: 1 }, body: { price: 6 } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    queries.updateProduct.mockRejectedValue(new Error("Internal server error"));

    await updateProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  it("returns 400 status if no data is provided", async () => {
    const req = { params: { id: 1 }, body: {} };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await updateProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Must provide data to be updated",
    });
  });

  it("returns 404 status if product isn't found", async () => {
    const req = { params: { id: 18 }, body: { price: 6 } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    queries.updateProduct.mockRejectedValue(new Error("Product not found"));

    await updateProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: "Product not found",
    });
  });

  it("successfully updates a product", async () => {
    const req = { params: { id: 1 }, body: { price: 6, category_id: "1" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    queries.updateProduct.mockResolvedValue({
      id: 1,
      name: "Espresso Coffee",
      description: "",
      price: 6,
      stock_quantity: 32,
      category_id: 1,
    });

    await updateProduct(req, res);
    expect(queries.updateProduct).toHaveBeenCalledWith({
      id: 1,
      name: undefined,
      description: undefined,
      price: 6,
      stock_quantity: undefined,
      category_id: 1,
      attributes: {},
    });
    expect(res.json).toHaveBeenCalledWith({
      id: 1,
      name: "Espresso Coffee",
      description: "",
      price: 6,
      stock_quantity: 32,
      category_id: 1,
    });
  });
});

describe("deleteProduct", () => {
  it("returns 500 status when the database throws an error", async () => {
    const req = { params: { id: 1 } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    queries.deleteProduct.mockRejectedValue(new Error("Internal server error"));

    await deleteProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  it("returns 404 status if product isn't found", async () => {
    const req = { params: { id: 18 } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    queries.deleteProduct.mockRejectedValue(new Error("Product not found"));

    await deleteProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: "Product not found",
    });
  });

  it("successfully deletes a product", async () => {
    const req = { params: { id: 1 } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    queries.deleteProduct.mockResolvedValue({
      id: 1,
      name: "Espresso Coffee",
      description: "",
      price: 6,
      stock_quantity: 32,
      category_id: 1,
    });

    await deleteProduct(req, res);
    expect(queries.deleteProduct).toHaveBeenCalledWith(1);
    expect(res.json).toHaveBeenCalledWith({
      id: 1,
      name: "Espresso Coffee",
      description: "",
      price: 6,
      stock_quantity: 32,
      category_id: 1,
    });
  });
});
