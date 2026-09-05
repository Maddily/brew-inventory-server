const { describe, expect, it } = require("@jest/globals");
const { main: seedData } = require("../../db/seed.js");
const {
  getCategories,
  getCategory,
  addCategory,
  updateCategory,
  deleteCategory,
} = require("../../db/categoryQueries");
const { addProduct, getProduct } = require("../../db/productQueries");

beforeEach(async () => {
  await seedData();
});

describe("retrieving all categories", () => {
  it("returns id, name, description, and an accurate product count for every category, including those with no products, ordered by id", async () => {
    await addProduct("Ethiopia Yirgacheffe", 18, 42, 1, {
      Origin: "Ethiopia",
      "Roast Level": "Light",
      Format: "Whole Bean",
      Weight: "250",
    });
    await addProduct("Colombia Huila", 16, 28, 1, {
      Origin: "Colombia",
      "Roast Level": "Medium",
      Format: "Ground",
      Weight: "250",
    });

    const categoris = await getCategories();
    expect(categoris).toEqual([
      {
        id: 1,
        name: "Coffee",
        description:
          "Single-origin and blended coffees in a range of roast levels and formats, sourced from farms around the world.",
        product_count: "2",
      },
      {
        id: 2,
        name: "Tea",
        description:
          "Loose leaf and bagged teas spanning green, black, white, oolong, and herbal varieties from renowned growing regions.",
        product_count: "0",
      },
      {
        id: 3,
        name: "Ready-to-Drink",
        description:
          "Bottled cold brews, canned lattes, and chilled tea drinks ready to enjoy straight from the fridge.",
        product_count: "0",
      },
      {
        id: 4,
        name: "Accessories",
        description:
          "Tools and equipment for brewing the perfect cup, from grinders and scales to filters and frothers.",
        product_count: "0",
      },
    ]);
  });

  it("returns categories ordered by id", async () => {
    const categoris = await getCategories();
    expect(categoris[0].id).toBe(1);
    expect(categoris[1].id).toBe(2);
    expect(categoris[2].id).toBe(3);
    expect(categoris[3].id).toBe(4);
  });
});

describe("retrieving a category", () => {
  it("returns the category's id, name and description when a match is found", async () => {
    const category = await getCategory(2);
    expect(category).toEqual({
      id: 2,
      name: "Tea",
      description:
        "Loose leaf and bagged teas spanning green, black, white, oolong, and herbal varieties from renowned growing regions.",
    });
  });

  it("throws an error if no matching category is found", async () => {
    await expect(getCategory(5)).rejects.toThrow("Category not found");
  });
});

describe("adding a category", () => {
  it("throws an error when not given a name", async () => {
    await expect(addCategory()).rejects.toThrow("Name is required");
  });

  it("throws an error if a category with the same name exists", async () => {
    await expect(addCategory("Coffee")).rejects.toThrow(
      "Category already exists"
    );
  });

  it("returns the successfully added category, defaulting description when not provided", async () => {
    const category = await addCategory("Syrups");
    expect(category).toEqual({
      id: expect.any(Number),
      name: "Syrups",
      description: null,
    });
  });
});

describe("updating a category", () => {
  it("successfully updates a category when given both name and description", async () => {
    expect(
      await updateCategory(
        4,
        "Syrups",
        "Yummy syrups to make drinks more flavorful"
      )
    ).toEqual({
      id: 4,
      name: "Syrups",
      description: "Yummy syrups to make drinks more flavorful",
    });
  });

  it("updates the description while keeping the name unchanged when updating the description only", async () => {
    expect(await updateCategory(3, null, "Beverages")).toEqual({
      id: 3,
      name: "Ready-to-Drink",
      description: "Beverages",
    });
  });

  it("updates the name while keeping the description unchanged when updating the name only", async () => {
    expect(await updateCategory(3, "Beverages", null)).toEqual({
      id: 3,
      name: "Beverages",
      description:
        "Bottled cold brews, canned lattes, and chilled tea drinks ready to enjoy straight from the fridge.",
    });
  });

  it("throws an error when given neither name nor description", async () => {
    await expect(updateCategory(1)).rejects.toThrow(
      "Either name or description is required"
    );
  });

  it("throws an error when no matching category is found", async () => {
    await expect(updateCategory(50, "Syrups")).rejects.toThrow(
      "Category not found"
    );
  });
});

describe("deleting a category", () => {
  it("throws an error if no matching category is found", async () => {
    await expect(deleteCategory(50)).rejects.toThrow("Category not found");
  });

  it("successfully deletes a category", async () => {
    expect(await deleteCategory(4)).toEqual({
      id: 4,
      name: "Accessories",
      description:
        "Tools and equipment for brewing the perfect cup, from grinders and scales to filters and frothers.",
    });
  });

  it("cascades the delete to the category's products and their attributes", async () => {
    const product = await addProduct("Hario V60 Dripper", 22, 15, 4, {
      Type: "Dripper",
      "Compatible With": "Coffee",
    });

    await deleteCategory(4);

    await expect(getProduct(product.id)).rejects.toThrow("Product not found");
  });
});
