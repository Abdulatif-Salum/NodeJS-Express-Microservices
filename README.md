# Node.js- Express Microservices Architecture

A scalable microservices-based application built with Node.js, Express, MongoDB, Redis, and RabbitMQ. This project demonstrates a complete microservices architecture with an API Gateway pattern, event-driven communication, and distributed caching.

## 🏗️ Architecture Overview

This application consists of five core microservices:

- **API Gateway** - Entry point for all client requests, handles routing and IP rate limiting
- **Identity Service** - User authentication, authorization, and token management
- **Post Service** - Manages user posts and publishes events to other services
- **Media Service** - Handles media uploads via Cloudinary and processes media-related events
- **Search Service** - Indexes and searches posts with event-driven synchronization

### Communication Pattern

- **Synchronous**: API Gateway ↔ Microservices (HTTP/REST)
- **Asynchronous**: Inter-service communication via RabbitMQ (Event-driven)
- **Caching**: Redis for distributed caching across all services

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 16+ (for local development)
- MongoDB Atlas account or local MongoDB instance
- Cloudinary account (for media uploads)

### Run with Docker Compose

```bash
# Clone the repository
git clone https://github.com/Abdulatif-Salum/NodeJS-Express-Microservices.git
cd NodeJS-Express-Microservices

# Start all services
docker-compose up --build
```

The API Gateway will be available at `http://localhost:3000`

### Run Services Locally

```bash
# Example: Running post-service locally
cd post-service
npm install
npm run dev
```

Repeat for other services as needed.

## 📋 Service Details

### API Gateway (Port 3000)

**Responsibilities:**
- Route requests to appropriate microservices
- JWT token validation
- Rate limiting with Redis
- CORS and security headers (Helmet)

**Routes:**
- `/v1/auth/*` → Identity Service
- `/v1/posts/*` → Post Service
- `/v1/media/*` → Media Service
- `/v1/search/*` → Search Service

**Key Dependencies:** `express`, `express-http-proxy`, `express-rate-limit`, `jsonwebtoken`, `ioredis`, `helmet`, `cors`

### Identity Service

**Responsibilities:**
- User registration and login
- JWT access token and refresh token generation
- Password hashing with Argon2
- Token refresh and revocation

**Key Features:**
- Secure password storage using Argon2
- JWT-based authentication
- Refresh token rotation
- Rate limiting for auth endpoints

**Key Dependencies:** `express`, `mongoose`, `jsonwebtoken`, `argon2`, `joi`, `ioredis`

**Models:** `User`, `RefreshToken`

### Post Service

**Responsibilities:**
- CRUD operations for posts
- Publish events when posts are created/deleted
- Cache frequently accessed posts in Redis

**Event Publishing:**
- `post.created` - Notifies search and media services
- `post.deleted` - Triggers cleanup in dependent services

**Key Dependencies:** `express`, `mongoose`, `amqplib`, `joi`, `ioredis`

**Models:** `Post`

### Media Service

**Responsibilities:**
- Upload and manage media files via Cloudinary
- Process post deletion events to clean up associated media
- Cache media metadata

**Event Consumption:**
- `post.deleted` - Removes media associated with deleted posts

**Key Dependencies:** `express`, `mongoose`, `amqplib`, `cloudinary`, `ioredis`

**Models:** `Media`

### Search Service

**Responsibilities:**
- Index posts for fast searching
- Keep search index synchronized via events
- Provide search functionality with caching

**Event Consumption:**
- `post.created` - Adds post to search index
- `post.deleted` - Removes post from search index

**Key Dependencies:** `express`, `mongoose`, `amqplib`, `ioredis`

**Models:** `Search`


## 📡 API Endpoints

### Authentication Endpoints (via API Gateway)

```
POST   /v1/auth/register        - Register new user
POST   /v1/auth/login           - Login user
POST   /v1/auth/refresh-token   - Refresh access token
POST   /v1/auth/logout          - Logout user
```

### Post Endpoints (via API Gateway)

```
GET    /v1/posts               - Get all posts (with pagination)
GET    /v1/posts/:id           - Get post by ID
POST   /v1/posts               - Create new post (authenticated)
PUT    /v1/posts/:id           - Update post (authenticated)
DELETE /v1/posts/:id           - Delete post (authenticated)
```

### Media Endpoints (via API Gateway)

```
POST   /v1/media/upload        - Upload media file (authenticated)
GET    /v1/media/:id           - Get media by ID
DELETE /v1/media/:id           - Delete media (authenticated)
```

### Search Endpoints (via API Gateway)

```
GET    /v1/search?q=query      - Search posts
```

## 🔐 Authentication Flow

1. User registers via `/v1/auth/register`
2. User logs in via `/v1/auth/login` and receives:
   - Access token (short-lived, ~15 minutes)
   - Refresh token (long-lived, ~7 days)
3. Include access token in Authorization header: `Bearer <token>`
4. When access token expires, use `/v1/auth/refresh-token` to get a new one
5. Logout via `/v1/auth/logout` to invalidate refresh token

## 📨 Event-Driven Architecture

### RabbitMQ Setup

- **Exchange:** `facebook_events` (topic exchange)
- **Exchange Type:** Topic
- **Routing Keys:**
  - `post.created`
  - `post.deleted`

### Event Flow Example

```
1. User creates a post via API Gateway
2. Post Service saves post to MongoDB
3. Post Service publishes "post.created" event to RabbitMQ
4. Search Service consumes event and indexes the post
5. Media Service listens for post events (if media attached)
```

## 🗄️ Database Schema

### User (Identity Service)
```javascript
{
  username: String (unique),
  email: String (unique),
  password: String (hashed with Argon2),
  createdAt: Date,
  updatedAt: Date
}
```

### Post (Post Service)
```javascript
{
  userId: ObjectId,
  title: String,
  content: String,
  mediaUrls: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### Media (Media Service)
```javascript
{
  userId: ObjectId,
  postId: ObjectId,
  url: String,
  publicId: String,
  type: String (image/video),
  createdAt: Date
}
```

### Search Index (Search Service)
```javascript
{
  postId: ObjectId,
  userId: ObjectId,
  title: String,
  content: String,
  createdAt: Date
}
```

## 🛠️ Development

### Project Structure

```
.
├── api-gateway/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── server.js
│       ├── middleware/
│       │   ├── authMiddleware.js
│       │   └── errorHandler.js
│       └── utils/
│           └── logger.js
│
├── identity-service/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── server.js
│       ├── controllers/
│       ├── models/
│       ├── routes/
│       ├── middleware/
│       ├── database/
│       └── utils/
│
├── post-service/
├── media-service/
├── search-service/
└── docker-compose.yml
```

### Available Scripts

Each service includes the following npm scripts:

```bash
npm start      # Run in production mode
npm run dev    # Run with nodemon (development)
npm test       # Run tests (to be implemented)
```

### Adding a New Service

1. Create service directory with structure similar to existing services
2. Add Dockerfile for containerization
3. Update `docker-compose.yml` to include the new service
4. Configure RabbitMQ event handlers if needed
5. Update API Gateway routes if exposing HTTP endpoints

## 🔍 Monitoring & Logging

- **Winston Logger**: Centralized logging in each service
- **RabbitMQ Management UI**: Available at `http://localhost:15672` (guest/guest)
- **Redis**: Accessible on port 6379

### Log Levels

- `error`: Error events
- `warn`: Warning messages
- `info`: Informational messages (default)
- `debug`: Debug messages

## 🧪 Testing

```bash
# Run tests for a specific service
cd post-service
npm test
```

*Note: Test suites are to be implemented*

## 🚢 Deployment

### Docker Deployment

```bash
# Build and push images
docker-compose build
docker tag <service>:latest <registry>/<service>:latest
docker push <registry>/<service>:latest
```

### Environment Considerations

- Use environment-specific `.env` files
- Configure MongoDB Atlas for production
- Set up Redis cluster for high availability
- Use RabbitMQ cluster for message broker redundancy
- Enable SSL/TLS for production APIs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👨‍💻 Author

**Abdulatif Salum**

- GitHub: [@Abdulatif-Salum](https://github.com/Abdulatif-Salum)

## 🙏 Acknowledgments

- Built with Node.js and Express
- Uses MongoDB for data persistence
- Redis for caching
- RabbitMQ for message queuing
- Cloudinary for media storage

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [RabbitMQ Tutorials](https://www.rabbitmq.com/getstarted.html)
- [Redis Documentation](https://redis.io/documentation)
- [Microservices Architecture](https://microservices.io/)

---

⭐ If you find this project helpful, please consider giving it a star!
