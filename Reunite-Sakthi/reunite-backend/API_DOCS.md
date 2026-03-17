# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication Headers
```json
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```

## Response Format
All responses follow this format:
```json
{
  "message": "Success message",
  "data": { ... },
  "error": "Error message (if applicable)"
}
```

## Endpoints

### Auth Routes

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Updated",
  "phone": "+1234567890",
  "avatar": "https://example.com/avatar.jpg"
}
```

### Item Routes

#### Get All Items
```http
GET /api/items?type=lost&category=electronics&page=1&limit=20
```

Query Parameters:
- `type`: lost/found
- `category`: electronics/jewelry/documents/etc.
- `status`: active/claimed/verified/completed
- `tags`: tag1,tag2,tag3
- `search`: search query
- `lat`, `lng`, `radius`: location-based search
- `page`: page number
- `limit`: items per page
- `sortBy`: createdAt/reward/viewCount
- `sortOrder`: asc/desc

#### Get Single Item
```http
GET /api/items/:id
```

#### Create Item
```http
POST /api/items
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Lost iPhone 13",
  "description": "Black iPhone 13 lost near park",
  "type": "lost",
  "category": "electronics",
  "tags": ["iphone", "apple", "phone"],
  "location": "Central Park, NY",
  "coordinates": {
    "latitude": 40.7829,
    "longitude": -73.9654
  },
  "reward": 100,
  "contactInfo": {
    "showPhone": true,
    "showEmail": false,
    "preferredContact": "chat"
  },
  "additionalInfo": {
    "color": "Black",
    "brand": "Apple",
    "model": "iPhone 13",
    "dateLost": "2024-03-15T00:00:00.000Z"
  }
}
```

#### Update Item
```http
PUT /api/items/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated description"
}
```

#### Delete Item
```http
DELETE /api/items/:id
Authorization: Bearer <token>
```

#### Claim Item (for found items)
```http
POST /api/items/:id/claim
Authorization: Bearer <token>
```

#### Get User's Items
```http
GET /api/items/user/my-items
Authorization: Bearer <token>
```

### Conversation Routes

#### Get User Conversations
```http
GET /api/conversations
Authorization: Bearer <token>
```

#### Get Single Conversation
```http
GET /api/conversations/:id
Authorization: Bearer <token>
```

#### Start Conversation
```http
POST /api/conversations
Authorization: Bearer <token>
Content-Type: application/json

{
  "itemId": "item_id_here"
}
```

#### Send Message
```http
POST /api/conversations/:id/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "I found your item!",
  "messageType": "text",
  "metadata": {}
}
```

#### Verify Claim (Owner Only)
```http
PUT /api/conversations/:id/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "verificationNotes": "Verified serial number matches",
  "meetingLocation": "Central Park entrance",
  "meetingTime": "2024-03-20T10:00:00.000Z"
}
```

#### Complete Reunion (Owner Only)
```http
PUT /api/conversations/:id/complete
Authorization: Bearer <token>
Content-Type: application/json

{
  "paymentMethod": "credit_card",
  "transactionId": "txn_123456789"
}
```

#### Archive Conversation
```http
PUT /api/conversations/:id/archive
Authorization: Bearer <token>
```

### User Routes

#### Get Profile
```http
GET /api/users/profile
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "phone": "+1234567890",
  "avatar": "https://example.com/avatar.jpg"
}
```

#### Get User Stats
```http
GET /api/users/stats
Authorization: Bearer <token>
```

#### Search Users
```http
GET /api/users/search?q=john&limit=10
Authorization: Bearer <token>
```

#### Get User by ID
```http
GET /api/users/:id
Authorization: Bearer <token>
```

### Admin Routes (Admin Only)

#### Get Dashboard Stats
```http
GET /api/admin/stats
Authorization: Bearer <admin_token>
```

#### Get All Users
```http
GET /api/admin/users?page=1&limit=20&role=user&search=john
Authorization: Bearer <admin_token>
```

#### Get All Items
```http
GET /api/admin/items?type=lost&status=active&page=1
Authorization: Bearer <admin_token>
```

#### Get All Conversations
```http
GET /api/admin/conversations?status=pending&page=1
Authorization: Bearer <admin_token>
```

#### Update User Role
```http
PUT /api/admin/users/:id/role
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "role": "admin"
}
```

#### Verify User
```http
PUT /api/admin/users/:id/verify
Authorization: Bearer <admin_token>
```

#### Delete User
```http
DELETE /api/admin/users/:id
Authorization: Bearer <admin_token>
```

#### Update Item Status
```http
PUT /api/admin/items/:id/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "completed"
}
```

#### Delete Item
```http
DELETE /api/admin/items/:id
Authorization: Bearer <admin_token>
```

#### Get Revenue Analytics
```http
GET /api/admin/revenue?period=month
Authorization: Bearer <admin_token>
```

## Error Codes

- `400` - Bad Request (validation error)
- `401` - Unauthorized (no token or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Example Error Response
```json
{
  "error": "Reward must be at least $10 for lost items"
}
```

## Commission System

- Lost items require minimum $10 reward
- Platform commission: 30%
- Finder payout: 70%
- Commission calculated automatically on payment
