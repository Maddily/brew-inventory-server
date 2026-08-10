# Brew Inventory — Server

REST API for Brew Inventory, a full-stack inventory management app for a specialty tea and coffee store. Built with Node.js, Express, and PostgreSQL.

> **Work in progress.** Deployment coming soon.

## Related repository

[brew-inventory-client](https://github.com/Maddily/brew-inventory-client) — React frontend

## Features

- RESTful API for products and categories
- EAV (Entity-Attribute-Value) schema to support per-category product attributes
- Request validation with express-validator, including conditional attribute validation per category
- Database transactions for multi-step write operations
- Unit tests with Jest

## Tech stack

- **Node.js** with **Express**
- **PostgreSQL** with the `pg` driver
- **express-validator** for request validation
- **Jest** for unit testing
- **dotenv** for environment configuration

## Project structure

```
└── 📁brew-inventory-server
    └── 📁controllers
        ├── categoriesController.js
        ├── productsController.js
    └── 📁db
        ├── categoryQueries.js
        ├── init.js
        ├── pool.js
        ├── productQueries.js
        ├── seed.js
        ├── seedDummyData.js
    └── 📁middleware
        └── 📁validators
            ├── productValidators.js
    └── 📁routes
        ├── categoriesRouter.js
        ├── productsRouter.js
    └── 📁tests
        └── 📁controllers
            ├── categoriesController.test.js
            ├── productsController.test.js
    ├── app.js
    ├── package.json
    └── README.md
```

## API endpoints

### Categories

| Method | Endpoint              | Description           |
| ------ | --------------------- | --------------------- |
| GET    | `/api/categories`     | Get all categories    |
| GET    | `/api/categories/:id` | Get a single category |
| POST   | `/api/categories`     | Create a category     |
| PUT    | `/api/categories/:id` | Update a category     |
| DELETE | `/api/categories/:id` | Delete a category     |

### Products

| Method | Endpoint            | Description                                                               |
| ------ | ------------------- | ------------------------------------------------------------------------- |
| GET    | `/api/products`     | Get all products (supports `?category_id=`, `?availability=`, `?search=`) |
| GET    | `/api/products/:id` | Get a single product                                                      |
| POST   | `/api/products`     | Create a product                                                          |
| PUT    | `/api/products/:id` | Update a product                                                          |
| DELETE | `/api/products/:id` | Delete a product                                                          |

## Database schema

Four tables: `categories`, `products`, `attributes`, and `product_attributes`.

The app uses an EAV pattern where each category defines its own set of attributes (e.g. Coffee has Origin, Roast Level, Format, Weight) stored in the `attributes` table, with per-product values stored in `product_attributes`. This keeps the `products` table clean and avoids sparse nullable columns.

## Getting started

### Prerequisites

- Node.js
- PostgreSQL

### Setup

1. Clone the repository

```bash
git clone https://github.com/Maddily/brew-inventory-server.git
cd brew-inventory-server
```

2. Install dependencies

```bash
npm install
```

3. Create a `.env` file in the root directory

```
DATABASE_URL=postgresql://username:password@localhost:5432/brew_inventory
```

4. Set up the database

```bash
node db/init.js
node db/seed.js
```

Optionally, seed the database with sample products:

```bash
node db/seedDummyData.js
```

5. Start the server

```bash
npm start
```

The API will be running at `http://localhost:3000`.

## Running tests

```bash
npm test
```

Tests cover all controller functions (categories and products) using Jest with mocked query layers and mocked express-validator, testing success cases, error handling, and validation failures.
