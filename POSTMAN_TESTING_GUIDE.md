# Postman Testing Guide

## Auth Microservice

### Base URL
```
http://localhost:3001
```

## Authentication Flow

1. **Register** → Get user account
2. **Login** → Get access token + refresh token
3. **Use Protected Endpoints** → Use access token in Authorization header
4. **Refresh Token** → Get new access token when it expires
5. **Logout** → Invalidate tokens

---

## 1. Health Check

**GET** `/`

**Headers:** None

**Expected Response:**
```json
{
  "success": true,
  "message": "Auth microservice is running",
  "timestamp": "2025-12-06T20:00:00.000Z"
}
```

---

## 2. Register User

**POST** `/internal/auth/register`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "Test1234",
  "repeatPassword": "Test1234"
}
```

**Validation Rules:**
- Username: 3-30 characters, alphanumeric + underscores only
- Email: Valid email format
- Password: Min 8 chars, must have uppercase, lowercase, and number
- repeatPassword: Must match password

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully"
}
```

**Error Examples:**
- **400** - Validation failed (passwords don't match, weak password, etc.)
- **409** - User already exists
- **429** - Too many requests (rate limited)

---

## 3. List Users (Testing Only)

**GET** `/internal/auth/users`

**Headers:** None

**Purpose:** Open endpoint to quickly check current user count and list. Use only for local testing and remove/lock down before production.

**Success Response (200):**
```json
{
  "success": true,
  "message": "User list for verification",
  "count": 1,
  "users": [
    {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com"
    }
  ]
}
```

---

## 4. Login

**POST** `/internal/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "login": "testuser",
  "password": "Test1234"
}
```

**Note:** `login` can be either username OR email

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Examples:**
- **401** - Invalid credentials
- **429** - Too many requests (rate limited)

**Save the tokens!** You'll need them for protected endpoints.

---

## 5. Get Current User Info (Protected)

**GET** `/internal/auth/me`

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Example:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "email": "test@example.com"
  }
}
```

**Error Examples:**
- **401** - No token provided
- **403** - Invalid or expired token

---

## 6. Refresh Access Token

**POST** `/internal/auth/refresh`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Examples:**
- **400** - Refresh token not provided
- **401** - Invalid or expired refresh token

**Note:** Access tokens expire in 3 minutes, refresh tokens in 10 minutes (configurable via env vars)

---

## 7. Logout

**POST** `/internal/auth/logout`

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Error Examples:**
- **400** - Refresh token not provided
- **401** - Invalid access token
- **403** - Invalid or expired token

**Note:** After logout, both tokens are invalidated. You'll need to login again.

---

## Testing Scenarios

### Scenario 1: Complete Flow
1. ✅ Register a new user
2. ✅ Login with credentials
3. ✅ Get user info with access token
4. ✅ Wait 3+ minutes (or use refresh)
5. ✅ Refresh access token
6. ✅ Get user info with new token
7. ✅ Logout
8. ❌ Try to get user info (should fail - token revoked)

### Scenario 2: Error Cases
1. ❌ Register with weak password
2. ❌ Register with mismatched passwords
3. ❌ Register with existing email/username
4. ❌ Login with wrong password
5. ❌ Access protected endpoint without token
6. ❌ Access protected endpoint with expired token
7. ❌ Refresh with invalid token

### Scenario 3: Rate Limiting
1. Try to login 6+ times in 15 minutes
2. Should get 429 error on 6th attempt

---

## Postman Collection Setup

### Environment Variables (Optional but Recommended)

Create a Postman Environment with:
- `base_url`: `http://localhost:3001`
- `access_token`: (will be set automatically)
- `refresh_token`: (will be set automatically)

### Pre-request Scripts

For login endpoint, add this to automatically save tokens:

```javascript
// In Tests tab of Login request
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    pm.environment.set("access_token", jsonData.accessToken);
    pm.environment.set("refresh_token", jsonData.refreshToken);
}
```

### Authorization Setup

For protected endpoints, use:
- Type: Bearer Token
- Token: `{{access_token}}`

Or manually:
- Key: `Authorization`
- Value: `Bearer {{access_token}}`

---

## Quick Test Commands (cURL)

### Register
```bash
curl -X POST http://localhost:3001/internal/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"Test1234","repeatPassword":"Test1234"}'
```

### Login
```bash
curl -X POST http://localhost:3001/internal/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login":"testuser","password":"Test1234"}'
```

### Get User Info
```bash
curl -X GET http://localhost:3001/internal/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Refresh Token
```bash
curl -X POST http://localhost:3001/internal/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'
```

### List Users (Testing Only)
```bash
curl -X GET http://localhost:3001/internal/auth/users
```

### Logout
```bash
curl -X POST http://localhost:3001/internal/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'
```

---

## Token Expiration Times

- **Access Token**: 3 minutes (180 seconds)
- **Refresh Token**: 10 minutes (600 seconds)

These can be configured via environment variables:
- `ACCESS_TOKEN_EXPIRY` (in seconds)
- `REFRESH_TOKEN_EXPIRY` (in seconds)

---

## Common Issues

1. **401 Unauthorized**: Token expired or invalid
   - Solution: Use refresh token endpoint to get new access token

2. **403 Forbidden**: Token blacklisted (after logout)
   - Solution: Login again to get new tokens

3. **429 Too Many Requests**: Rate limit exceeded
   - Solution: Wait 15 minutes or adjust rate limit settings

4. **400 Bad Request**: Validation failed
   - Check: Password strength, email format, username rules

5. **500 Internal Server Error**: Server issue
   - Check: Database connection, Redis connection, server logs

---

# Posts Microservice

## Base URL
```
http://localhost:3002
```

## Posts Flow

1. **Create Post** → Create a new post (requires userId for now)
2. **List Posts** → Get paginated list of posts
3. **Get Post** → Get a specific post by ID
4. **Update Post** → Update post title/content
5. **Delete Post** → Remove a post
6. **Get User Posts** → Get all posts by a specific user

---

## 1. Health Check

**GET** `/`

**Headers:** None

**Expected Response:**
```json
{
  "success": true,
  "message": "Posts microservice is running",
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

---

## 2. Create Post

**POST** `/internal/posts`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "title": "My First Post",
  "content": "This is the content of my first post. It can be quite long and detailed.",
  "userId": 1
}
```

**Validation Rules:**
- `title`: Required, string, minimum 1 character
- `content`: Required, string, minimum 1 character
- `userId`: Optional (for now, will be from auth token later)

**Success Response (201):**
```json
{
  "id": 1,
  "title": "My First Post",
  "content": "This is the content of my first post. It can be quite long and detailed.",
  "userId": 1,
  "createdAt": "2025-01-01T12:00:00.000Z",
  "updatedAt": "2025-01-01T12:00:00.000Z"
}
```

**Error Examples:**
- **400** - Validation failed (missing title/content, empty strings)
- **500** - Server error

---

## 3. List All Posts

**GET** `/internal/posts`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `userId` (optional): Filter by user ID

**Example:**
```
GET /internal/posts?page=1&limit=10
GET /internal/posts?userId=1&page=1&limit=5
```

**Headers:** None

**Success Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "title": "My First Post",
      "content": "This is the content...",
      "userId": 1,
      "createdAt": "2025-01-01T12:00:00.000Z",
      "updatedAt": "2025-01-01T12:00:00.000Z"
    },
    {
      "id": 2,
      "title": "Another Post",
      "content": "More content here...",
      "userId": 1,
      "createdAt": "2025-01-01T13:00:00.000Z",
      "updatedAt": "2025-01-01T13:00:00.000Z"
    }
  ],
  "meta": {
    "total": 2,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

**Error Examples:**
- **400** - Invalid query parameters (negative page/limit, limit > 100)

---

## 4. Get Post by ID

**GET** `/internal/posts/:id`

**Example:**
```
GET /internal/posts/1
```

**Headers:** None

**Success Response (200):**
```json
{
  "id": 1,
  "title": "My First Post",
  "content": "This is the content of my first post.",
  "userId": 1,
  "createdAt": "2025-01-01T12:00:00.000Z",
  "updatedAt": "2025-01-01T12:00:00.000Z"
}
```

**Error Examples:**
- **400** - Invalid ID format (must be a number)
- **404** - Post not found

---

## 5. Update Post

**PATCH** `/internal/posts/:id`

**Example:**
```
PATCH /internal/posts/1
```

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "title": "Updated Post Title",
  "content": "Updated content here..."
}
```

**Note:** Both `title` and `content` are optional. You can update just one field.

**Success Response (200):**
```json
{
  "id": 1,
  "title": "Updated Post Title",
  "content": "Updated content here...",
  "userId": 1,
  "createdAt": "2025-01-01T12:00:00.000Z",
  "updatedAt": "2025-01-01T14:00:00.000Z"
}
```

**Error Examples:**
- **400** - Invalid ID format or validation failed
- **404** - Post not found

---

## 6. Delete Post

**DELETE** `/internal/posts/:id`

**Example:**
```
DELETE /internal/posts/1
```

**Headers:** None

**Success Response (204):**
No content (empty body)

**Error Examples:**
- **400** - Invalid ID format
- **404** - Post not found

---

## 7. Get Posts by User ID

**GET** `/internal/posts/user/:userId`

**Example:**
```
GET /internal/posts/user/1?page=1&limit=10
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

**Headers:** None

**Success Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "title": "My First Post",
      "content": "This is the content...",
      "userId": 1,
      "createdAt": "2025-01-01T12:00:00.000Z",
      "updatedAt": "2025-01-01T12:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

**Error Examples:**
- **400** - Invalid userId format or query parameters

---

## Posts Testing Scenarios

### Scenario 1: Complete CRUD Flow
1. ✅ Create a new post
2. ✅ List all posts (verify your post appears)
3. ✅ Get post by ID
4. ✅ Update the post
5. ✅ Verify update (get post again)
6. ✅ Delete the post
7. ❌ Try to get deleted post (should return 404)

### Scenario 2: Pagination Testing
1. ✅ Create multiple posts (5-10 posts)
2. ✅ List posts with `page=1&limit=2` (should show 2 posts)
3. ✅ List posts with `page=2&limit=2` (should show next 2 posts)
4. ✅ Verify `meta.totalPages` is correct
5. ✅ Test with `limit=100` (max limit)
6. ❌ Test with `limit=101` (should fail validation)

### Scenario 3: User Filtering
1. ✅ Create posts with different userIds (1, 2, 3)
2. ✅ List all posts (should show all)
3. ✅ Filter by `userId=1` (should show only user 1's posts)
4. ✅ Use `/internal/posts/user/1` endpoint
5. ✅ Verify both filtering methods return same results

### Scenario 4: Error Cases
1. ❌ Create post without title (should fail validation)
2. ❌ Create post without content (should fail validation)
3. ❌ Create post with empty title string (should fail validation)
4. ❌ Get post with invalid ID (e.g., `/posts/abc`)
5. ❌ Get post with non-existent ID (e.g., `/posts/99999`)
6. ❌ Update non-existent post
7. ❌ Delete non-existent post

---

## Posts Quick Test Commands (cURL)

### Health Check
```bash
curl -X GET http://localhost:3002/
```

### Create Post
```bash
curl -X POST http://localhost:3002/internal/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"My Post","content":"Post content here","userId":1}'
```

### List All Posts
```bash
curl -X GET "http://localhost:3002/internal/posts?page=1&limit=10"
```

### List Posts by User
```bash
curl -X GET "http://localhost:3002/internal/posts?userId=1&page=1&limit=10"
```

### Get Post by ID
```bash
curl -X GET http://localhost:3002/internal/posts/1
```

### Get Posts by User ID (Alternative Endpoint)
```bash
curl -X GET "http://localhost:3002/internal/posts/user/1?page=1&limit=10"
```

### Update Post
```bash
curl -X PATCH http://localhost:3002/internal/posts/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Title","content":"Updated content"}'
```

### Delete Post
```bash
curl -X DELETE http://localhost:3002/internal/posts/1
```

---

## Posts Postman Collection Setup

### Environment Variables

Add to your Postman Environment:
- `posts_base_url`: `http://localhost:3002`
- `test_user_id`: `1` (or get from auth service)
- `test_post_id`: (will be set after creating a post)

### Pre-request Scripts

For Create Post endpoint, add this to save the post ID:

```javascript
// In Tests tab of Create Post request
if (pm.response.code === 201) {
    const jsonData = pm.response.json();
    pm.environment.set("test_post_id", jsonData.id);
}
```

### Collection Organization

Organize your requests:
```
Posts Microservice
├── Health Check
├── Create Post
├── List All Posts
├── List Posts (Filtered by User)
├── Get Post by ID
├── Get Posts by User ID
├── Update Post
└── Delete Post
```

---

## Posts Common Issues

1. **400 Bad Request - Validation Failed**
   - Check: Title and content must be non-empty strings
   - Check: userId must be a number (if provided)

2. **404 Not Found**
   - Check: Post ID exists in database
   - Check: Correct endpoint URL

3. **500 Internal Server Error**
   - Check: Database connection (posts database: `innogram_posts`)
   - Check: Prisma Client is generated correctly
   - Check: Server logs for detailed error

4. **Empty Results**
   - Check: Database has posts
   - Check: Correct userId filter (if filtering)
   - Check: Pagination parameters (might be on different page)
