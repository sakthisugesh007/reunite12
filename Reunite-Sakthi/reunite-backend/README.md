# Reunite Backend API

Backend API for the Reunite lost and found platform.

## Features

- User authentication (register/login)
- Item posting (lost/found)
- Real-time messaging between item owners and finders
- 30% commission system for rewards
- Admin dashboard with analytics
- Image upload support
- Location-based search
- Secure payment processing simulation

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Joi** - Input validation

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start MongoDB (make sure it's running on your system)

5. Seed the database (optional):
   ```bash
   npm run seed
   ```

6. Start the server:
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password

### Items
- `GET /api/items` - Get all items (with filters)
- `GET /api/items/:id` - Get single item
- `POST /api/items` - Create new item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item
- `POST /api/items/:id/claim` - Claim found item
- `GET /api/items/user/my-items` - Get user's items

### Conversations
- `GET /api/conversations` - Get user conversations
- `GET /api/conversations/:id` - Get single conversation
- `POST /api/conversations` - Start new conversation
- `POST /api/conversations/:id/messages` - Send message
- `PUT /api/conversations/:id/verify` - Verify claim (owner only)
- `PUT /api/conversations/:id/complete` - Complete reunion (owner only)
- `PUT /api/conversations/:id/archive` - Archive conversation

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/stats` - Get user statistics
- `GET /api/users/search` - Search users
- `GET /api/users/:id` - Get user by ID

### Admin
- `GET /api/admin/stats` - Get dashboard stats
- `GET /api/admin/users` - Get all users
- `GET /api/admin/items` - Get all items
- `GET /api/admin/conversations` - Get all conversations
- `PUT /api/admin/users/:id/role` - Update user role
- `PUT /api/admin/users/:id/verify` - Verify user
- `DELETE /api/admin/users/:id` - Delete user
- `PUT /api/admin/items/:id/status` - Update item status
- `DELETE /api/admin/items/:id` - Delete item
- `GET /api/admin/revenue` - Get revenue analytics

## Data Models

### User
```javascript
{
  name: String,
  email: String,
  password: String,
  phone: String,
  avatar: String,
  isVerified: Boolean,
  role: String, // 'user' or 'admin'
  stats: {
    itemsPosted: Number,
    itemsFound: Number,
    itemsRecovered: Number,
    totalRewardsPaid: Number,
    totalRewardsReceived: Number
  }
}
```

### Item
```javascript
{
  title: String,
  description: String,
  type: String, // 'lost' or 'found'
  category: String,
  tags: [String],
  location: String,
  coordinates: { latitude: Number, longitude: Number },
  images: [{ url: String, publicId: String }],
  reward: Number,
  status: String, // 'active', 'claimed', 'verified', 'completed', 'cancelled'
  postedBy: ObjectId,
  claimedBy: ObjectId,
  // ... other fields
}
```

### Conversation
```javascript
{
  itemId: ObjectId,
  itemTitle: String,
  participants: [{ user: ObjectId, role: String }],
  messages: [{
    sender: ObjectId,
    content: String,
    messageType: String,
    readBy: [{ user: ObjectId, readAt: Date }]
  }],
  status: String, // 'pending', 'verified', 'rejected', 'completed'
  reward: Number,
  commission: Number,
  // ... other fields
}
```

## Commission System

- Lost items require a minimum reward of $10
- Platform takes 30% commission on all rewards
- Finders receive 70% of the reward amount
- Commission is calculated automatically when payments are processed

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation with Joi
- Rate limiting
- CORS protection
- Helmet security headers

## Environment Variables

```bash
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/reunite
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
# Add other variables as needed
```

## Testing

You can test the API using tools like Postman or curl. The seed script creates test users:

- Admin: admin@reunite.com / admin123
- John: john@example.com / password123
- Jane: jane@example.com / password123
- Mike: mike@example.com / password123

## Deployment

1. Set NODE_ENV to production
2. Configure production database
3. Set up proper CORS origins
4. Use a reverse proxy (nginx)
5. Set up SSL certificates
6. Configure environment variables securely

## License

MIT
