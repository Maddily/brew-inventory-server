# Brew Inventory — Server

REST API for Brew Inventory, a full-stack inventory management app for a specialty tea and coffee store. Built with Node.js, Express, and PostgreSQL.

> **Work in progress.** Deployment coming soon.

## Related repository

[brew-inventory-client](https://github.com/Maddily/brew-inventory-client) — React frontend

## Features

- RESTful API for products and categories
- EAV (Entity-Attribute-Value) schema to support per-category product attributes
- Request validation with express-validator, including conditional attribute validation per category
- Database transactions for multi-step write operations, with rollback on partial failure
- Password-protected destructive actions (update/delete) for products
- Cascading deletes across the category → product → attribute relationship
- Unit and integration tests with Jest and Supertest

## Tech stack

- **Node.js** with **Express**
- **PostgreSQL** with the `pg` driver
- **express-validator** for request validation
- **Jest** for unit testing, **Supertest** for HTTP-level integration tests
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
        └── 📁integration
            └── 📁fixtures
                ├── productRows.js
            ├── categoriesRouter.test.js
            ├── categoryQueries.test.js
            ├── productQueries.test.js
            ├── productsRouter.test.js
        └── 📁middleware
            └── 📁validators
                ├── productValidators.test.js
        ├── globalSetup.js
        ├── loadTestEnv.js
        ├── setupPerFile.js
    ├── .gitignore
    ├── app.js
    ├── jest.config.js
    ├── package-lock.json
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

**Cascading deletes:** `products.category_id` and `attributes.category_id` both reference `categories.id` with `ON DELETE CASCADE`, and `product_attributes.product_id` cascades from `products.id`. Deleting a category deletes all of its products and their attributes. Category deletion isn't exposed in the frontend yet. This is backend-only groundwork for a future admin feature, which would warn the user before deleting a category with existing products.

## Security

Attribute filtering (`GET /api/products?<Attribute Name>=value`) originally interpolated the attribute name directly into SQL, which was a SQL injection vector. Fixed by parameterizing it like any other value. Covered by integration tests confirming that malicious input is treated as a literal value with no matches, rather than executed as SQL.

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
PORT=3000
ADMIN_PASSWORD=brew123
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

Unit tests:

```bash
npm test
```

Integration tests (requires a test database - see below):

```bash
npm run test:integration
```

The test suite is split into two layers:

- **Unit tests** (`tests/controllers`, `tests/middleware`) - controller logic tested with mocked query layers and mocked express-validator, covering success cases, error handling, and validation failures. Validator middleware chains are tested in isolation.
- **Integration tests** (`tests/integration`) - real HTTP requests via Supertest against the actual Express app, backed by a separate test PostgreSQL database. These cover query correctness (filtering, joins, transactions, cascading deletes), full request/response cycles through router → validation → controller → database, and password-protected routes.

### Running integration tests

Integration tests use a separate test database so they don't affect your development data.

1. Create a test database:

```bash
psql -U your_user -c "CREATE DATABASE brew_inventory_test;"
```

2. Create a `.env.test` file:

```
DATABASE_URL=postgresql://username:password@localhost:5432/brew_inventory_test
ADMIN_PASSWORD=testpassword123
```

Integration tests automatically reset and reseed the test database before each test.
