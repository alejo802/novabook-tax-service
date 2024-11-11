# **Novabook Tax Service**

## **Overview**

This is a TypeScript-based tax service for Novabook. It allows users to:

1. Ingest transaction events (sales and tax payments).
2. Query tax positions at any given point in time.
3. Amend sales data.

## **Architecture Decisions**

### **1. Separation of Responsibilities**

- **Controllers**: Handle request validation and response construction.
- **Services**: Contain business logic.
- **Repositories**: Handle data persistence.
- **Middleware**: Handles cross-cutting concerns like logging, validation, and error handling.
- **Utilities**: Provide reusable functions for common tasks (e.g., date and tax calculations).

### **2. Consistent Architecture**

- Structured using a clear MVC pattern.
- Centralized error handling with a custom `AppError`.
- Logging implemented via a `logger` middleware.

### **3. Observability**

- Requests are logged with their method, URL, and timestamps.
- Validation errors and internal errors are captured with detailed error messages.

### **4. Testing**

- Comprehensive test suite covering controllers, services, repositories, middleware, and utilities.
- **Jest** and **Supertest** are used for unit and integration tests.
- Tests are run against an in-memory MongoDB instance using **MongoMemoryServer** for fast and isolated tests.

In addition to the unit tests, a comprehensive black box runbook has been created. This runbook includes a series of `curl` commands designed to test the service from an external perspective, ensuring its functionality as a black box. The runbook can be found in the [`api_blackbox_test_runbook.md`](./api_blackbox_test_runbook.md) file.

## **Installation**

### **Prerequisites**

- [Node.js](https://nodejs.org/) (v16 or later)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Docker](https://www.docker.com/) (optional for production)
- **MongoDB** installed locally

### **Install MongoDB Locally**

#### **macOS**

1. Install **Homebrew** (if not already installed):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
2. Install MongoDB:

   ```bash
   brew tap mongodb/brew
   brew install mongodb-community@6.0
   ```

3. Start MongoDB:
   ```bash
   brew services start mongodb/brew/mongodb-community
   ```

#### **Windows**

1. Download MongoDB from the [MongoDB Community Download Center](https://www.mongodb.com/try/download/community).
2. Follow the installer steps and ensure **MongoDB Server** is selected.
3. Start the MongoDB service from **Services** or manually run:
   ```bash
   "C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe"
   ```

#### **Linux**

Follow the installation guide on the [MongoDB website](https://docs.mongodb.com/manual/installation/).

### **Clone the Repository**

```bash
git clone <repository-url>
cd novabook-tax-service
```

### **Install Dependencies**

```bash
npm install
```

---

## **Environment Configuration**

Create a `.env` file in the root directory:

```
PORT=3000
DATABASE_URI=mongodb://localhost:27017/novabook
LOG_LEVEL=debug
ENABLE_OBSERVABILITY=true
```

---

## **Running the Service**

### **Development Mode**

```bash
npm run dev
```

### **Production Mode**

Build the project:

```bash
npm run build
```

Start the server:

```bash
npm start
```

---

## **Running Tests**

To run all tests:

```bash
npm test
```

For test coverage:

```bash
npm run test:coverage
```

---

## **API Endpoints**

### **1. POST /api/transactions**

Ingest sales or tax payment events.

- **Body (Sales Event)**:

```json
{
  "eventType": "SALES",
  "date": "2024-11-08T17:29:39Z",
  "invoiceId": "12345",
  "items": [{ "itemId": "item1", "cost": 1000, "taxRate": 0.2 }]
}
```

- **Body (Tax Payment Event)**:

```json
{
  "eventType": "TAX_PAYMENT",
  "date": "2024-11-08T17:29:39Z",
  "amount": 5000
}
```

Response: `202 Accepted`

**Example cURL Command**:

```bash
curl -X POST http://localhost:3000/api/transactions -H "Content-Type: application/json" -d '{"eventType": "SALES", "date": "2024-11-08T17:29:39Z", "invoiceId": "12345", "items": [{"itemId": "item1", "cost": 1000, "taxRate": 0.2}]}'
```

---

### **2. GET /api/tax-position**

Query the tax position for a given date.

- **Query Params**:
  - `date`: ISO 8601 string (e.g., `2024-11-08T17:29:39Z`)

Response:

```json
{
  "date": "2024-11-08T17:29:39Z",
  "taxPosition": 200
}
```

**Example cURL Command**:

```bash
curl -X GET "http://localhost:3000/api/tax-position?date=2024-11-08T17:29:39Z"
```

---

### **3. PATCH /api/sale**

Amend an existing or future sale.

- **Body**:

```json
{
  "date": "2024-11-08T17:29:39Z",
  "invoiceId": "12345",
  "itemId": "item1",
  "cost": 800,
  "taxRate": 0.15
}
```

Response: `202 Accepted`

**Example cURL Command**:

```bash
curl -X PATCH http://localhost:3000/api/sale -H "Content-Type: application/json" -d '{"date": "2024-11-08T17:29:39Z", "invoiceId": "12345", "itemId": "item1", "cost": 800, "taxRate": 0.15}'
```

---

## **Key Assumptions**

1. **Single-user service**: No authentication required.
2. **No financial years**: Tax position accumulates indefinitely.
3. **Amendments**: Can apply to past or future transactions, even if the sales event hasn't been ingested yet.

---

## **Future Improvements**

- Add authentication for multi-user support.
- Implement rate limiting for API endpoints.
- Optimize database queries with indexes.
- Add caching for frequent tax position queries.

---
