# E-Commerce API

A RESTful API for managing an e-commerce platform with user accounts, products, shopping carts, and orders.

## Features

- **User Authentication**: Secure user registration and login with Passport.js
- **Product Management**: Browse and manage product catalog
- **Shopping Cart**: Add, update, and remove items from cart
- **Order Processing**: Create and track customer orders
- **User Accounts**: Manage user profiles and account information

## Prerequisites

- Node.js (v20 or higher)
- npm or yarn
- Database (PostgreSQL, MySQL, MongoDB, etc.)

## Installation

1. Clone the repository

```bash
git clone <repository-url>
cd e-commerce
```

2. Install dependencies

```bash
npm install
```

3. Configure environment variables

- Update database connection settings in `src/config/db.js`
- Configure Passport authentication in `src/config/passport.js`

## Usage

### Start the Server

**Development**

```bash
npm run dev
```

This starts the server with `nodemon` (uses `.env.test`).

**Production**

```bash
npm start
```

The server will start on the configured port (see `src/main.js`).

### Run Tests

```bash
npm test
```

Tests are included for:

- Main application (`src/main.test.js`)
- Accounts controller (`src/controllers/accounts.test.js`)
- Cart controller (`src/controllers/carts.test.js`)
- Orders controller (`src/controllers/orders.test.js`)
- Products controller (`src/controllers/products.test.js`)

## API Documentation

The API follows RESTful conventions. For detailed API documentation, refer to `swagger.yaml`.

### Main Routes

- **Accounts** (`/accounts`) - User registration, login, and profile management
- **Products** (`/products`) - Browse and retrieve product information
- **Cart** (`/cart`) - Manage shopping cart items
- **Orders** (`/orders`) - Create and view orders

## Project Structure

```
src/
├── main.js                  # Application entry point
├── config/
│   ├── db.js               # Database configuration
│   └── passport.js         # Authentication strategy
├── controllers/            # Request handlers for routes
│   ├── accounts.js
│   ├── cart.js
│   ├── orders.js
│   └── products.js
├── routes/                 # API route definitions
│   ├── accounts.js
│   ├── cart.js
│   ├── orders.js
│   └── products.js
├── middlewares/            # Custom middleware
│   └── auth.js            # Authentication middleware
├── utils/                  # Utility functions
│   └── authHelper.js      # Authentication helpers
└── test/
    └── testHelpers.js     # Testing utilities
```

## Authentication

The API uses Passport.js for authentication. Include authentication tokens in request headers as specified in the API documentation.

## Code Quality

- **Linting**: ESLint is configured for code quality checks
- **Testing**: Comprehensive test coverage for all major components
