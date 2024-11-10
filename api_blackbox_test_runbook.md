# API Blackbox Test Runbook

## 1. Verify the API is running

```bash
curl -X GET http://localhost:3000/api/health
```

## 2. Ingest Transactions

### a. Sales Event (Valid)

```bash
curl -X POST http://localhost:3000/api/transactions \
-H "Content-Type: application/json" \
-d '{
  "eventType": "SALES",
  "date": "2024-02-22T17:29:39Z",
  "invoiceId": "3419027d-960f-4e8f-b8b7-f7b2b4791824",
  "items": [
    {
      "itemId": "02db47b6-fe68-4005-a827-24c6e962f3df",
      "cost": 1099,
      "taxRate": 0.2
    }
  ]
}'
```

### b. Tax Payment Event (Valid)

```bash
curl -X POST http://localhost:3000/api/transactions \
-H "Content-Type: application/json" \
-d '{
  "eventType": "TAX_PAYMENT",
  "date": "2024-02-22T17:29:39Z",
  "amount": 74901
}'
```

### c. Invalid Event (Missing Fields)

```bash
curl -X POST http://localhost:3000/api/transactions \
-H "Content-Type: application/json" \
-d '{
  "eventType": "SALES",
  "items": []
}'
```

## 3. Query Tax Position

### a. Query with Valid Date

```bash
curl -X GET "http://localhost:3000/api/tax-position?date=2024-02-22T17:29:39Z"
```

### b. Query with Invalid Date

```bash
curl -X GET "http://localhost:3000/api/tax-position?date=invalid-date"
```

## 4. Amend Sale

### a. Valid Amendment

```bash
curl -X PATCH http://localhost:3000/api/sale \
-H "Content-Type: application/json" \
-d '{
  "date": "2024-02-22T17:29:39Z",
  "invoiceId": "3419027d-960f-4e8f-b8b7-f7b2b4791824",
  "itemId": "02db47b6-fe68-4005-a827-24c6e962f3df",
  "cost": 798,
  "taxRate": 0.15
}'
```

### b. Amendment with Missing Fields

```bash
curl -X PATCH http://localhost:3000/api/sale \
-H "Content-Type: application/json" \
-d '{
  "invoiceId": "3419027d-960f-4e8f-b8b7-f7b2b4791824",
  "cost": 798
}'
```

### c. Amendment with Invalid Data

```bash
curl -X PATCH http://localhost:3000/api/sale \
-H "Content-Type: application/json" \
-d '{
  "date": "2024-02-22T17:29:39Z",
  "invoiceId": "3419027d-960f-4e8f-b8b7-f7b2b4791824",
  "itemId": "02db47b6-fe68-4005-a827-24c6e962f3df",
  "cost": -798,
  "taxRate": 1.5
}'
```

## 5. Additional Edge Cases

### a. Large Payload

```bash
curl -X POST http://localhost:3000/api/transactions \
-H "Content-Type: application/json" \
-d '{
  "eventType": "SALES",
  "date": "2024-02-22T17:29:39Z",
  "invoiceId": "large-payload-invoice",
  "items": [
    {
      "itemId": "large-item-1",
      "cost": 9999999,
      "taxRate": 0.5
    },
    {
      "itemId": "large-item-2",
      "cost": 8888888,
      "taxRate": 0.4
    }
  ]
}'
```

### b. Invalid Endpoint

```bash
curl -X GET http://localhost:3000/api/invalid-endpoint
```

### c. Stress Test

```bash
for i in {1..100}; do
  curl -X GET "http://localhost:3000/api/tax-position?date=2024-02-22T17:29:39Z" &
done
wait
```
