# BFF Authentication Testing Guide

This document explains how to test the BFF authentication system (JWT token generation and tenant lookup).

## Overview

The BFF authentication system provides:
- **Tenant ID lookup** from Prisma database
- **JWT token generation** for Go backend authentication
- **In-memory caching** for performance
- **Secure token signing** with HS256 algorithm

## Test Suites

### 1. Unit Tests (Vitest)

**File**: `src/lib/__tests__/bff-auth.test.ts`

**Coverage**:
- ✅ Tenant ID lookup (success, failure, caching)
- ✅ JWT token generation (valid tokens, claims verification)
- ✅ Token security (wrong secret rejection)
- ✅ Cache functionality
- ✅ Error handling

**Run unit tests**:
```bash
# Run all unit tests
pnpm test src/lib/__tests__/bff-auth.test.ts

# Run with coverage
pnpm test --coverage src/lib/__tests__/bff-auth.test.ts

# Run in watch mode
pnpm test --watch src/lib/__tests__/bff-auth.test.ts
```

**What it tests**:
- Mocked Prisma queries (no database required)
- JWT token structure and claims
- Caching behavior
- Error conditions

---

### 2. Manual Integration Tests

**File**: `scripts/test-bff-auth.ts`

**Prerequisites**:
1. Database running and accessible
2. Environment variables set in `.env`:
   ```bash
   DATABASE_URL="postgresql://..."
   GO_BACKEND_JWT_SECRET="your-secret-key-min-32-chars"
   ```

**Run integration tests**:
```bash
pnpm tsx scripts/test-bff-auth.ts
```

**What it tests**:
1. **Environment Setup**: Verifies required environment variables
2. **Database Connection**: Tests Prisma connection and user queries
3. **Tenant ID Lookup**: Real database queries with caching
4. **JWT Generation**: Token creation and verification
5. **Cache Clear**: Cache invalidation functionality

**Expected Output**:
```
╔═══════════════════════════════════════════════════════╗
║   BFF Authentication Test Suite                      ║
╚═══════════════════════════════════════════════════════╝

============================================================
Test 1: Environment Setup
============================================================
✓ DATABASE_URL is set
✓ GO_BACKEND_JWT_SECRET is set

✓ All required environment variables are set

============================================================
Test 2: Database Connection
============================================================
✓ Successfully connected to database
✓ Found 3 user(s) in database

============================================================
Test 3: Get Tenant ID
============================================================
Found user: test@example.com (user_123)
✓ Successfully retrieved tenant ID: funeral-home-456
✓ Tenant ID matches database value

Testing cache...
✓ Cache working (retrieved in 0ms)

============================================================
Test 4: JWT Token Generation
============================================================
Generating JWT token...
✓ Token generated successfully
Token length: 237 characters
✓ Token has correct structure (header.payload.signature)

Verifying token...
✓ Token signature valid

Token Header:
{
  "alg": "HS256",
  "typ": "JWT"
}

Token Payload:
{
  "sub": "user_123",
  "tid": "funeral-home-456",
  "iss": "dykstra-bff",
  "aud": "dykstra-go-backend",
  "iat": 1701388800,
  "exp": 1701392400
}

Verifying claims...
✓ sub (subject): user_123
✓ tid (tenant ID): funeral-home-456
✓ iss (issuer): dykstra-bff
✓ aud (audience): dykstra-go-backend
✓ iat (issued at): 1701388800
✓ exp (expires at): 1701392400
✓ Token expires in 1 hour (3600s)

Testing token rejection with wrong secret...
✓ Token correctly rejected with wrong secret

============================================================
Test 5: Cache Clear Functionality
============================================================
✓ Cache populated
✓ Cache cleared
✓ Cache repopulated after clear

============================================================
Test Summary
============================================================
✓ All tests completed successfully!

You can now use this authentication system in production.
Make sure to set GO_BACKEND_JWT_SECRET to a strong secret in production!
```

---

## Environment Setup

### Required Environment Variables

```bash
# Database connection
DATABASE_URL="postgresql://user:password@localhost:5432/dykstra_portal"

# Go backend authentication
GO_BACKEND_JWT_SECRET="your-secret-key-at-least-32-characters-long"
GO_BACKEND_URL="http://localhost:8080"
```

### Generating a Strong Secret

For production, generate a cryptographically secure secret:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32

# Using Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

---

## Test Data Setup

If your database doesn't have test users, the integration test script will automatically create:
- A test funeral home
- A test user associated with that funeral home

You can also manually create test data:

```sql
-- Create a test funeral home
INSERT INTO funeral_homes (id, name, phone, email)
VALUES ('test-fh-1', 'Test Funeral Home', '555-123-4567', 'test@testfh.com');

-- Create a test user
INSERT INTO users (id, email, name, role, "funeralHomeId")
VALUES (
  'test-user-1',
  'testuser@example.com',
  'Test User',
  'STAFF',
  'test-fh-1'
);
```

---

## Testing with Clerk Authentication

To test the full BFF proxy flow with Clerk authentication:

### 1. Start the Development Server

```bash
pnpm dev
```

### 2. Create a Test Request

**Prerequisites**:
- User authenticated via Clerk
- User exists in database with `funeralHomeId`

**Example using curl**:
```bash
# Get your Clerk session token from browser DevTools:
# Application → Cookies → __session

# Make request to BFF proxy
curl -X GET \
  http://localhost:3000/api/go-proxy/v1/contracts \
  -H "Cookie: __session=YOUR_CLERK_SESSION_TOKEN" \
  -v
```

**Expected Behavior**:
1. BFF extracts user ID from Clerk session
2. Looks up tenant ID from database
3. Generates JWT token
4. Forwards request to Go backend with headers:
   - `Authorization: Bearer <JWT>`
   - `X-Tenant-Id: <funeral-home-id>`

**Check Logs**:
```
[BFF Proxy] GET /v1/contracts (user: user_123, tenant: funeral-home-456)
```

---

## Troubleshooting

### "GO_BACKEND_JWT_SECRET environment variable is not set"

**Solution**: Add the variable to your `.env` file:
```bash
GO_BACKEND_JWT_SECRET="your-secret-here"
```

### "User does not have an associated funeral home"

**Solution**: Update the user in the database:
```sql
UPDATE users
SET "funeralHomeId" = 'funeral-home-id-here'
WHERE id = 'user-id-here';
```

### "Database connection failed"

**Solution**: Check your `DATABASE_URL`:
```bash
# Verify database is running
psql $DATABASE_URL -c "SELECT 1"

# Check connection string format
# postgresql://user:password@host:port/database
```

### Token verification fails in Go backend

**Causes**:
1. **Different secrets**: Ensure `GO_BACKEND_JWT_SECRET` matches on both sides
2. **Clock skew**: Check system time on both servers
3. **Algorithm mismatch**: Go backend must use HS256 algorithm

**Verify token manually**:
```bash
# Decode JWT payload
echo 'PASTE_JWT_HERE' | cut -d'.' -f2 | base64 -d | jq
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test BFF Auth
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run unit tests
        run: pnpm test src/lib/__tests__/bff-auth.test.ts
      
      - name: Setup database
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test
        run: pnpm prisma db push
      
      - name: Run integration tests
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test
          GO_BACKEND_JWT_SECRET: test-secret-key-for-ci-only-min-32-chars
        run: pnpm tsx scripts/test-bff-auth.ts
```

---

## Security Checklist

Before deploying to production:

- [ ] `GO_BACKEND_JWT_SECRET` is at least 32 characters
- [ ] Secret is randomly generated (not a dictionary word)
- [ ] Secret is stored securely (environment variable, not in code)
- [ ] Same secret is configured on Go backend
- [ ] Go backend validates JWT signature
- [ ] Go backend validates `iss` and `aud` claims
- [ ] Go backend enforces tenant isolation using `tid` claim
- [ ] HTTPS is enabled for all BFF traffic
- [ ] Clerk authentication is properly configured
- [ ] Database credentials are secure

---

## Additional Resources

- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [jose Library Documentation](https://github.com/panva/jose)
- [Clerk Authentication Docs](https://clerk.com/docs)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
