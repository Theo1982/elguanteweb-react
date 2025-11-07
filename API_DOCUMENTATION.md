# 📚 API Documentation - ElGuanteWeb Backend

## Base URL
```
Production: https://your-domain.com/api
Development: http://localhost:3001
```

## Authentication
All endpoints require Firebase Authentication. Include the `Authorization` header with the user's ID token.

## Endpoints

### Health Check
**GET** `/health`

Returns server health status.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "production"
}
```

### Payment Preferences

#### Create Payment Preference
**POST** `/create_preference`

Creates a MercadoPago payment preference.

**Request Body:**
```json
{
  "items": [
    {
      "title": "Product Name",
      "unit_price": 100.50,
      "quantity": 2,
      "currency_id": "ARS",
      "description": "Optional description"
    }
  ],
  "usuarioId": "firebase-user-id",
  "metadata": {
    "total": 201.00,
    "orderId": "optional-order-id"
  }
}
```

**Response:**
```json
{
  "id": "preference-id",
  "init_point": "https://mercadopago.com/payment",
  "sandbox_init_point": "https://sandbox.mercadopago.com/payment"
}
```

**Error Responses:**
- `400`: Invalid items or user ID
- `500`: MercadoPago service error

#### Verify Payment
**GET** `/verify-payment/:paymentId`

Verifies payment status with MercadoPago.

**Parameters:**
- `paymentId` (string): MercadoPago payment ID

**Response:**
```json
{
  "verified": true,
  "status": "approved",
  "paymentId": "123456789",
  "transactionAmount": 201.00,
  "dateApproved": "2024-01-01T00:00:00.000Z"
}
```

### WhatsApp Integration

#### Send WhatsApp Message
**POST** `/send-whatsapp`

Sends a WhatsApp message via Twilio.

**Request Body:**
```json
{
  "to": "5492211234567",
  "message": "Your message content"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "twilio-message-id",
  "status": "queued"
}
```

### Webhooks

#### MercadoPago Webhook
**POST** `/webhook`

Handles MercadoPago payment notifications.

**Headers:**
```
Content-Type: application/json
x-signature: ts=123456789,v1=signature (for secure webhook)
```

**Body:**
```json
{
  "type": "payment",
  "data": {
    "id": "123456789"
  }
}
```

**Security:**
- Validates MercadoPago signature for `/webhook/secure`
- Updates order status and inventory automatically
- Awards user points on successful payment

## Rate Limiting

- **Payment endpoints**: 10 requests per 5 minutes per IP
- **General endpoints**: 100 requests per 15 minutes per IP

## Error Handling

All endpoints return standardized error responses:

```json
{
  "error": "Error description",
  "details": "Additional error information",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Data Models

### Order
```javascript
{
  userId: string,
  userEmail: string,
  userName: string,
  items: Array<{
    id: string,
    nombre: string,
    precio: number,
    quantity: number,
    notes?: string
  }>,
  productIds: string[],
  total: number,
  paymentMethod: string,
  status: 'pending' | 'processing' | 'completed' | 'cancelled',
  paymentId?: string,
  phoneNumber?: string,
  pointsEarned: number,
  timestamp: Timestamp,
  paymentDetails?: {
    paymentId: string,
    status: string,
    transactionAmount: number,
    dateApproved: string
  }
}
```

### User Points
```javascript
{
  userId: string,
  points: number,
  level: 'Sin nivel' | 'Bronce' | 'Plata' | 'Oro',
  history: Array<{
    date: string,
    points: number,
    reason: string
  }>,
  expiresAt: string,
  createdAt: string,
  lastUpdated: string
}
```

### Transaction Logs
```javascript
{
  timestamp: Timestamp,
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG',
  message: string,
  type: string,
  // Additional metadata based on operation
}
```

## Environment Variables

### Required
```env
# Firebase
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# MercadoPago
MP_ACCESS_TOKEN=your_mercadopago_access_token

# WhatsApp (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

### Optional
```env
# Server
PORT=3001
NODE_ENV=production

# Security
MP_WEBHOOK_SECRET=your_webhook_secret

# Frontend
FRONTEND_URL=https://your-domain.com
```

## Monitoring

### Scheduled Tasks
- **Payment timeout checks**: Every hour
- **Expired order cancellation**: Automatic inventory restoration

### Logging
- All payment operations logged to Firestore `transactionLogs`
- Console logging for debugging
- Error tracking with stack traces

## Security Features

- **Rate limiting** on all endpoints
- **CORS** configuration for allowed origins
- **Input validation** on all requests
- **Webhook signature verification** for MercadoPago
- **Firebase Authentication** required for user operations
- **SQL injection protection** via parameterized queries
