const { describe, expect, it } = require("@jest/globals");
jest.mock("../../db/categoryQueries");
const queries = require("../../db/categoryQueries.js");
const {
  getCategories,
  getCategory,
  addCategory,
  updateCategory,
  deleteCategory,
} = require("../../controllers/categoriesController.js");

describe("getCategories", () => {
  it("returns an array of all categories with the expected shape", async () => {
    const req = {};
    const res = { json: jest.fn() };

    const categories = [
      { id: 1, name: "coffee", description: "" },
      { id: 2, name: "tea", description: "" },
    ];

    queries.getCategories.mockResolvedValue(categories);

    await getCategories(req, res);
    expect(res.json).toHaveBeenCalledWith(categories);
  });

  it("returns an empty array if no categories are found", async () => {
    const req = {};
    const res = { json: jest.fn() };

    queries.getCategories.mockResolvedValue([]);

    await getCategories(req, res);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it("returns 500 status when the database throws an error", async () => {
    const req = {};
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    queries.getCategories.mockRejectedValue(new Error("Internal server error"));

    await getCategories(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});

describe("getCategory", () => {
  it("returns 400 status if no id route parameter", async () => {
    const req = { params: {} };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    queries.getCategory.mockRejectedValue(new Error("id is required"));

    await getCategory(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "id is required" });
  });

  it("returns 404 status if it finds no matching category", async () => {
    const req = { params: { id: 5 } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    queries.getCategory.mockRejectedValue(new Error("Category not found"));

    await getCategory(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Category not found" });
  });

  it("returns 500 status when the database throws an error", async () => {
    const req = { params: {} };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    queries.getCategory.mockRejectedValue(new Error("Internal server error"));

    await getCategory(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  it("returns the matching category", async () => {
    const req = { params: { id: 1 } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    const category = {
      id: 1,
      name: "coffee",
      description: "",
    };

    queries.getCategory.mockResolvedValue(category);

    await getCategory(req, res);
    expect(res.json).toHaveBeenCalledWith(category);
  });
});

describe("addCategory", () => {
  it("returns 400 status if data isn't in request body", async () => {
    const req = { body: {} };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    queries.addCategory.mockRejectedValue(new Error("Name is required"));

    await addCategory(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Name is required" });
  });

  it("returns 500 status when the database throws an error", async () => {
    const req = { body: {} };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    queries.addCategory.mockRejectedValue(new Error("Internal server error"));

    await addCategory(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  it("successfully adds a category to the database", async () => {
    const req = {
      body: { name: "coffee", description: "This is the coffee category" },
    };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    const addedCategory = {
      id: 1,
      name: "coffee",
      description: "This is the coffee category",
    };

    queries.addCategory.mockResolvedValue(addedCategory);

    await addCategory(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(addedCategory);
  });

  it("successfully adds a category when no description is provieded", async () => {
    const req = {
      body: { name: "coffee" },
    };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    const addedCategory = {
      id: 1,
      name: "coffee",
      description: "",
    };

    queries.addCategory.mockResolvedValue(addedCategory);

    await addCategory(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(addedCategory);
  });

  it("doesn't add a category if another exists with the same name", async () => {
    const req = {
      body: { name: "coffee" },
    };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    queries.addCategory.mockRejectedValue(new Error("Category already exists"));

    await addCategory(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: "Category already exists" });
  });
});

describe("updateCategory", () => {
  it("returns 400 status if no id route parameter", async () => {
    const req = { params: {}, body: { name: "coffee", description: "" } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    queries.updateCategory.mockRejectedValue(new Error("id is required"));

    await updateCategory(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "id is required" });
  });

  it("returns 400 status if no data in request body", async () => {
    const req = { params: { id: 1 }, body: {} };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    queries.updateCategory.mockRejectedValue(
      new Error("Either name or description is required")
    );

    await updateCategory(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Either name or description is required",
    });
  });

  it("returns 404 status if it finds no matching category", async () => {
    const req = { params: { id: 5 }, body: {} };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    queries.updateCategory.mockRejectedValue(new Error("Category not found"));

    await updateCategory(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Category not found" });
  });

  it("returns 500 status when the database throws an error", async () => {
    const req = { params: {}, body: {} };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    queries.updateCategory.mockRejectedValue(
      new Error("Internal server error")
    );

    await updateCategory(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  it("successfully updates the category when both name and description are given", async () => {
    const req = {
      params: { id: 1 },
      body: { name: "tea", description: "This is the tea category" },
    };
    const res = { json: jest.fn() };

    const updatedCategory = {
      id: 1,
      name: "tea",
      description: "This is the tea category",
    };

    queries.updateCategory.mockResolvedValue(updatedCategory);

    await updateCategory(req, res);
    expect(res.json).toHaveBeenCalledWith(updatedCategory);
  });

  it("successfully updates the category when only name is given", async () => {
    const req = {
      params: { id: 1 },
      body: { name: "tea" },
    };
    const res = { json: jest.fn() };

    const updatedCategory = {
      id: 1,
      name: "tea",
      description: "",
    };

    queries.updateCategory.mockResolvedValue(updatedCategory);

    await updateCategory(req, res);
    expect(res.json).toHaveBeenCalledWith(updatedCategory);
  });

  it("successfully updates the category when only description is given", async () => {
    const req = {
      params: { id: 1 },
      body: { description: "This is the coffee category" },
    };
    const res = { json: jest.fn() };

    const updatedCategory = {
      id: 1,
      name: "coffee",
      description: "This is the coffee category",
    };

    queries.updateCategory.mockResolvedValue(updatedCategory);

    await updateCategory(req, res);
    expect(res.json).toHaveBeenCalledWith(updatedCategory);
  });
});

describe("deleteCategory", () => {
  it("returns 400 status if no id route parameter", async () => {
    const req = { params: {} };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    queries.deleteCategory.mockRejectedValue(new Error("id is required"));

    await deleteCategory(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "id is required" });
  });

  it("returns 404 status if it finds no matching category", async () => {
    const req = { params: { id: 5 } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    queries.deleteCategory.mockRejectedValue(new Error("Category not found"));

    await deleteCategory(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Category not found" });
  });

  it("returns 500 status when the database throws an error", async () => {
    const req = { params: {} };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    queries.deleteCategory.mockRejectedValue(
      new Error("Internal server error")
    );

    await deleteCategory(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  it("successfully deletes a category", async () => {
    const req = { params: { id: 1 } };
    const res = { json: jest.fn() };

    const deletedCategory = {
      id: 1,
      name: "coffee",
      description: "",
    };

    queries.deleteCategory.mockResolvedValue(deletedCategory);

    await deleteCategory(req, res);
    expect(res.json).toHaveBeenCalledWith(deletedCategory);
  });
});
