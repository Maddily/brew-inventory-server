const { describe, expect, it } = require("@jest/globals");
const { main: seedData } = require("../../db/seed.js");
const {
  addProduct,
  getProduct,
  getProducts,
  updateProduct,
  deleteProduct,
} = require("../../db/productQueries");
const {
  senchaRows,
  mintRows,
  coldBrewRows,
  v60Rows,
  brazilRows,
  colombiaRows,
  ethiopiaRows,
} = require("./fixtures/productRows.js");
const pool = require("../../db/pool.js");

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

describe("retrieving all products", () => {
  describe("filtering by category", () => {
    it("returns products in a category when given a category id", async () => {
      expect(await getProducts(2)).toEqual([...senchaRows(), ...mintRows()]);
    });

    it("returns products in more than one category when given more than one category id", async () => {
      expect(await getProducts([3, 4])).toEqual([
        ...coldBrewRows(),
        ...v60Rows(),
      ]);
    });

    it("returns products in all categories when not given a category id", async () => {
      expect(await getProducts()).toEqual([
        ...brazilRows(),
        ...colombiaRows(),
        ...ethiopiaRows(),
        ...senchaRows(),
        ...mintRows(),
        ...coldBrewRows(),
        ...v60Rows(),
      ]);
    });
  });

  describe("filtering by availability", () => {
    it("returns in stock products when in stock availability filter is applied", async () => {
      expect(await getProducts(null, "In stock")).toEqual([
        ...ethiopiaRows(),
        ...senchaRows(),
        ...coldBrewRows(),
      ]);
    });

    it("returns low stock products when low stock availability filter is applied", async () => {
      expect(await getProducts(null, "Low stock")).toEqual([
        ...colombiaRows(),
        ...mintRows(),
      ]);
    });

    it("returns out of stock products when out of stock availability filter is applied", async () => {
      expect(await getProducts(null, "Out of stock")).toEqual([
        ...brazilRows(),
        ...v60Rows(),
      ]);
    });

    it("returns in stock and low stock products when both in stock and low stock availability filters are applied", async () => {
      expect(await getProducts(null, ["In stock", "Low stock"])).toEqual([
        ...colombiaRows(),
        ...ethiopiaRows(),
        ...senchaRows(),
        ...mintRows(),
        ...coldBrewRows(),
      ]);
    });

    it("returns in stock and out of stock products when both in stock and out of stock availability filters are applied", async () => {
      expect(await getProducts(null, ["In stock", "Out of stock"])).toEqual([
        ...brazilRows(),
        ...ethiopiaRows(),
        ...senchaRows(),
        ...coldBrewRows(),
        ...v60Rows(),
      ]);
    });

    it("returns low stock and out of stock products when both low stock and out of stock availability filters are applied", async () => {
      expect(await getProducts(null, ["Low stock", "Out of stock"])).toEqual([
        ...brazilRows(),
        ...colombiaRows(),
        ...mintRows(),
        ...v60Rows(),
      ]);
    });

    it("returns all products when all three availability filters are applied", async () => {
      expect(
        await getProducts(null, ["In stock", "Low stock", "Out of stock"])
      ).toEqual([
        ...brazilRows(),
        ...colombiaRows(),
        ...ethiopiaRows(),
        ...senchaRows(),
        ...mintRows(),
        ...coldBrewRows(),
        ...v60Rows(),
      ]);
    });
  });

  describe("filtering by a search term", () => {
    it("returns products that match a given search term, case-insensitively", async () => {
      expect(await getProducts(null, null, "colombia")).toEqual([
        ...colombiaRows(),
      ]);
    });

    it("returns an empty array when no matches are found for a given search term", async () => {
      expect(await getProducts(null, null, "caramel")).toEqual([]);
    });

    it("matches a partial substring of a product name", async () => {
      expect(await getProducts(null, null, "colomb")).toEqual([
        ...colombiaRows(),
      ]);
    });
  });

  describe("filtering by attributes", () => {
    it("returns products that match a given attribute", async () => {
      expect(await getProducts(null, null, null, { Base: "Coffee" })).toEqual([
        ...coldBrewRows(),
      ]);
    });

    it("returns products that match given attributes", async () => {
      expect(
        await getProducts(null, null, null, {
          Format: "Whole Bean",
          Weight: "250",
        })
      ).toEqual([...ethiopiaRows()]);
    });

    it("returns an empty array when no matches are found", async () => {
      expect(
        await getProducts(null, null, null, {
          Format: "Ground",
          Weight: "1000",
        })
      ).toEqual([]);
    });

    it("returns products matching any of multiple values for the same attribute", async () => {
      expect(
        await getProducts(null, null, null, { Weight: ["250", "1000"] })
      ).toEqual([...brazilRows(), ...colombiaRows(), ...ethiopiaRows()]);
    });

    it("does not break when an attribute key contains SQL-meaningful characters", async () => {
      expect(
        await getProducts(null, null, null, { "Origin' OR '1'='1": "value" })
      ).toEqual([]);
    });

    it("does not bypass filtering when an attribute value contains SQL-meaningful characters", async () => {
      expect(
        await getProducts(null, null, null, { Origin: "Ethiopia' OR '1'='1" })
      ).toEqual([]);
    });
  });

  describe("combining filters", () => {
    it("returns products matching both a category filter and an availability filter", async () => {
      expect(await getProducts(1, "Out of stock")).toEqual([...brazilRows()]);
    });

    it("returns products matching both a category filter and a search filter", async () => {
      expect(await getProducts(1, null, "colombia")).toEqual([
        ...colombiaRows(),
      ]);
    });

    it("returns products matching both a category filter and an attribute filter", async () => {
      expect(await getProducts(1, null, null, { Format: "Ground" })).toEqual([
        ...colombiaRows(),
      ]);
    });

    it("returns products matching both an availability filter and a search filter", async () => {
      expect(await getProducts(null, "In stock", "brew")).toEqual([
        ...coldBrewRows(),
      ]);
    });

    it("returns products matching both an availability filter and an attribute filter", async () => {
      expect(
        await getProducts(null, "In stock", null, { Base: "Coffee" })
      ).toEqual([...coldBrewRows()]);
    });

    it("returns products matching both a search filter and an attribute filter", async () => {
      expect(await getProducts(null, null, "brew", { Base: "Coffee" })).toEqual(
        [...coldBrewRows()]
      );
    });

    it("returns products matching a category filter, an availability filter and an attribute filter", async () => {
      expect(await getProducts(1, "In stock", null, { Weight: "250" })).toEqual(
        [...ethiopiaRows()]
      );
    });

    it("returns an empty array when combined filters match no products", async () => {
      expect(await getProducts(3, null, null, { Base: "Tea" })).toEqual([]);
    });
  });

  it("returns products ordered by category then name", async () => {
    expect(await getProducts([1, 3])).toEqual([
      ...brazilRows(),
      ...colombiaRows(),
      ...ethiopiaRows(),
      ...coldBrewRows(),
    ]);
  });
});

describe("retrieving a product", () => {
  it("throws an error if no match is found", async () => {
    await expect(getProduct(50)).rejects.toThrow("Product not found");
  });

  it("returns one row per attribute, each sharing the product's core fields but with a distinct attribute_name and attribute_value", async () => {
    expect(await getProduct(products.coldBrew.id)).toEqual(coldBrewRows());
  });
});

describe("adding a product", () => {
  it("adds a product and its attributes", async () => {
    expect(
      await addProduct(
        "Hibiscus Iced Tea",
        3.5,
        6,
        3,
        {
          Base: "Tea",
          Volume: 500,
        },
        "A refreshing drink"
      )
    ).toEqual({
      id: expect.any(Number),
      name: "Hibiscus Iced Tea",
      description: "A refreshing drink",
      price: "3.50",
      stock_quantity: 6,
      category_id: 3,
    });
  });

  it("adds a product without a description when none is provided", async () => {
    expect(
      await addProduct("Hibiscus Iced Tea", 3.5, 6, 3, {
        Base: "Tea",
        Volume: 500,
      })
    ).toEqual({
      id: expect.any(Number),
      name: "Hibiscus Iced Tea",
      description: null,
      price: "3.50",
      stock_quantity: 6,
      category_id: 3,
    });
  });

  it("persists the product's attributes correctly when later retrieved", async () => {
    const { id } = await addProduct("Hibiscus Iced Tea", 3.5, 6, 3, {
      Base: "Tea",
      Volume: 500,
    });

    expect(await getProduct(id)).toEqual([
      {
        id,
        name: "Hibiscus Iced Tea",
        description: null,
        price: "3.50",
        stock_quantity: 6,
        category_id: 3,
        category: "Ready-to-Drink",
        attribute_name: "Base",
        attribute_value: "Tea",
      },
      {
        id,
        name: "Hibiscus Iced Tea",
        description: null,
        price: "3.50",
        stock_quantity: 6,
        category_id: 3,
        category: "Ready-to-Drink",
        attribute_name: "Volume",
        attribute_value: "500",
      },
    ]);
  });

  it("rolls back the entire insert when an attribute name doesn't exist for the given category", async () => {
    await expect(
      addProduct("Hibiscus Iced Tea", 3.5, 6, 3, {
        Origin: "Egypt",
        Base: "Tea",
        Volume: 500,
      })
    ).rejects.toThrow();

    const products = await getProducts(3);
    const names = products.map((p) => p.name);
    expect(names).not.toContain("Hibiscus Iced Tea");
  });

  it("throws when a required field is missing", async () => {
    await expect(
      addProduct(null, 3.5, 6, 3, {
        Base: "Tea",
        Volume: 500,
      })
    ).rejects.toThrow();
  });
});

describe("updating a product", () => {
  it("throws an error when a match is not found", async () => {
    await expect(
      updateProduct({
        id: 50,
        name: "Hibiscus Iced Tea",
        price: 3.5,
        stock_quantity: 6,
        category_id: 3,
      })
    ).rejects.toThrow("Product not found");
  });

  it("updates only the given fields, leaving the rest unchanged", async () => {
    expect(
      await updateProduct({ id: products.coldBrew.id, name: "Cold Brew" })
    ).toEqual({
      id: products.coldBrew.id,
      name: "Cold Brew",
      description: null,
      price: "5.00",
      stock_quantity: 20,
      category_id: 3,
    });
  });

  it("updates a product's attributes and leaves untouched attributes unchanged", async () => {
    await updateProduct({
      id: products.coldBrew.id,
      category_id: 3,
      attributes: { Volume: 400 },
    });

    expect(await getProduct(products.coldBrew.id)).toEqual([
      {
        id: products.coldBrew.id,
        name: "Cold Brew Original",
        description: null,
        price: "5.00",
        stock_quantity: 20,
        category_id: 3,
        category: "Ready-to-Drink",
        attribute_name: "Base",
        attribute_value: "Coffee",
      },
      {
        id: products.coldBrew.id,
        name: "Cold Brew Original",
        description: null,
        price: "5.00",
        stock_quantity: 20,
        category_id: 3,
        category: "Ready-to-Drink",
        attribute_name: "Volume",
        attribute_value: "400",
      },
    ]);
  });

  it("persists both the updated core fields and attributes when later retrieved", async () => {
    await updateProduct({
      id: products.coldBrew.id,
      price: 4.5,
      stock_quantity: 25,
      category_id: 3,
      attributes: { Volume: 400 },
    });

    expect(await getProduct(products.coldBrew.id)).toEqual([
      {
        id: products.coldBrew.id,
        name: "Cold Brew Original",
        description: null,
        price: "4.50",
        stock_quantity: 25,
        category_id: 3,
        category: "Ready-to-Drink",
        attribute_name: "Base",
        attribute_value: "Coffee",
      },
      {
        id: products.coldBrew.id,
        name: "Cold Brew Original",
        description: null,
        price: "4.50",
        stock_quantity: 25,
        category_id: 3,
        category: "Ready-to-Drink",
        attribute_name: "Volume",
        attribute_value: "400",
      },
    ]);
  });

  it("rolls back the entire update when an attribute name doesn't exist for the given category", async () => {
    await expect(
      updateProduct({
        id: products.coldBrew.id,
        price: 4.5,
        stock_quantity: 25,
        category_id: 3,
        attributes: { Size: 400 },
      })
    ).rejects.toThrow('Attribute "Size" not found for this category');

    expect(await getProduct(products.coldBrew.id)).toEqual([
      {
        id: products.coldBrew.id,
        name: "Cold Brew Original",
        description: null,
        price: "5.00",
        stock_quantity: 20,
        category_id: 3,
        category: "Ready-to-Drink",
        attribute_name: "Base",
        attribute_value: "Coffee",
      },
      {
        id: products.coldBrew.id,
        name: "Cold Brew Original",
        description: null,
        price: "5.00",
        stock_quantity: 20,
        category_id: 3,
        category: "Ready-to-Drink",
        attribute_name: "Volume",
        attribute_value: "355",
      },
    ]);
  });
});

describe("deleting a product", () => {
  it("throws an error if no match is found", async () => {
    await expect(deleteProduct(50)).rejects.toThrow("Product not found");
  });

  it("successfully deletes a product", async () => {
    await deleteProduct(products.coldBrew.id);

    await expect(getProduct(products.coldBrew.id)).rejects.toThrow(
      "Product not found"
    );
  });

  it("cascades the delete to the products's attributes", async () => {
    const productId = products.coldBrew.id;

    await deleteProduct(productId);

    const { rowCount } = await pool.query(
      "SELECT * FROM product_attributes WHERE product_id = $1",
      [productId]
    );

    expect(rowCount).toBe(0);
  });
});
