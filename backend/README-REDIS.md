# Redis cache (optional)

The API caches AI responses in Redis to save tokens. **Redis is optional**: if you don’t set it up, the app still runs and all routes work; they just won’t use the cache.

## Do I need to do anything?

Only if you want caching (recommended for 200+ users / 200K tokens per day).

### Option A – Use Redis locally (no signup)

1. Install Redis on your machine:
   - **Windows:** [Redis for Windows](https://github.com/microsoftarchive/redis/releases) or use WSL and install Redis there.
   - **Mac:** `brew install redis` then `brew services start redis`.
   - **Linux:** `sudo apt install redis-server` (or your package manager).
2. In `backend/.env` add:
   ```env
   REDIS_URL=redis://localhost:6379
   ```
3. Restart the backend. You should see: `Redis: connected, response cache enabled`.

### Option B – Use a free cloud Redis (sign up once)

1. Sign up for a free Redis instance:
   - **[Redis Cloud](https://redis.com/try-free/)** (redis.com) – free tier, then create a database and copy the “Public endpoint” URL.
   - **[Upstash](https://upstash.com/)** – free tier, create a Redis database and copy the connection URL.
2. In `backend/.env` add:
   ```env
   REDIS_URL=redis://default:YOUR_PASSWORD@YOUR_HOST:PORT
   ```
   (Use the full URL they give you.)
3. Restart the backend. You should see: `Redis: connected, response cache enabled`.

You don’t need to “go on” any other website for your app; the app only needs the Redis URL in `.env`. The cache runs automatically once Redis is connected.
