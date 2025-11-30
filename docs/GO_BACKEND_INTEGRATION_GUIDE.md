# Go Backend Integration Guide

This guide explains how to integrate the TypeScript application with the verified Go backend endpoints implemented in Phases 1-4.

## Architecture Overview

```
TypeScript UI/Use Cases
         ↓
  Effect-TS Ports (Application Layer)
         ↓
  Go Adapters (Infrastructure Layer)
         ↓
    openapi-fetch client
         ↓
  BFF Proxy (/api/go-proxy)
         ↓
   Go Backend (localhost:8080)
         ↓
  TigerBeetle / EventStoreDB / PostgreSQL
```

## Prerequisites

### 1. Go Backend Running

The Go backend must be running and accessible. Default configuration:
- **URL**: `http://localhost:8080`
- **Environment Variable**: `GO_BACKEND_URL`

Start the Go backend:
```bash
cd /Users/andrewmathers/tigerbeetle-trial-app-1
go run cmd/api/main.go
```

### 2. Environment Variables

Add to `.env.local`:
```bash
# Go Backend Configuration
GO_BACKEND_URL=http://localhost:8080

# Optional: Direct backend connection (bypass BFF proxy for testing)
NEXT_PUBLIC_GO_BACKEND_DIRECT=false
```

### 3. Test Data

Ensure the Go backend has test data seeded:
```bash
# From Go backend directory
make seed-test-data

# Or manually seed specific data
curl -X POST http://localhost:8080/v1/gl/books \
  -H "Content-Type: application/json" \
  -d '{"book_id":"MAIN","currency":"USD","entity_id":"ENTITY1"}'
```

## Phase 1: Financial Endpoints

### Trial Balance

**Endpoint**: `GET /v1/gl/trial-balance`

**Parameters**:
- `book`: string (e.g., "MAIN")
- `period`: string YYYY-MM format (e.g., "2025-11")
- `currency`: string (e.g., "USD")

**TypeScript Usage**:
```typescript
import { GoFinancialPort } from '@dykstra/application';
import { Effect, Layer } from 'effect';
import { InfrastructureLayer } from '@dykstra/infrastructure';

// In your use case or component
const getTrialBalanceEffect = Effect.gen(function* () {
  const financial = yield* GoFinancialPort;
  const trialBalance = yield* financial.getTrialBalance(new Date('2025-11-30'));
  
  console.log('Trial Balance:', trialBalance);
  console.log('Balanced?', trialBalance.balanced);
  console.log('Total Debits:', trialBalance.totalDebits);
  console.log('Total Credits:', trialBalance.totalCredits);
  
  return trialBalance;
});

// Run with infrastructure layer
Effect.runPromise(
  getTrialBalanceEffect.pipe(
    Effect.provide(InfrastructureLayer)
  )
);
```

**Test with curl**:
```bash
curl "http://localhost:3000/api/go-proxy/v1/gl/trial-balance?book=MAIN&period=2025-11&currency=USD" \
  -H "Cookie: __session=..." # Requires Clerk auth
```

### Balance Sheet

**Endpoint**: `GET /v1/gl/statements/balance-sheet`

**Parameters**:
- `book`: string
- `entity_id`: string (e.g., "ENTITY1")
- `period`: string YYYY-MM format
- `currency`: string
- `gaap`: string (optional, e.g., "US_GAAP")

**TypeScript Usage**:
```typescript
const balanceSheetEffect = Effect.gen(function* () {
  const financial = yield* GoFinancialPort;
  const balanceSheet = yield* financial.generateBalanceSheet(new Date('2025-11-30'));
  
  console.log('Balance Sheet:', balanceSheet);
  console.log('Total Assets:', balanceSheet.totalAssets);
  console.log('Total Liabilities:', balanceSheet.totalLiabilities);
  console.log('Total Equity:', balanceSheet.totalEquity);
  
  return balanceSheet;
});
```

### Cash Flow Statement

**Endpoint**: `GET /v1/gl/statements/cash-flow`

**Parameters**:
- `book`: string
- `entity_id`: string
- `period_from`: string YYYY-MM format
- `period_to`: string YYYY-MM format
- `currency`: string
- `cash_accounts`: array of account IDs (e.g., ["1010", "1020"])

**TypeScript Usage**:
```typescript
const cashFlowEffect = Effect.gen(function* () {
  const financial = yield* GoFinancialPort;
  const cashFlow = yield* financial.generateCashFlowStatement(
    new Date('2025-11-01'),
    new Date('2025-11-30')
  );
  
  console.log('Cash Flow Statement:', cashFlow);
  return cashFlow;
});
```

### Account Balances

**Endpoint**: `POST /accounts/balances`

**Body**:
```json
{
  "accounts": ["hex_id_1", "hex_id_2"]
}
```

**Response**:
```json
{
  "balances": {
    "hex_id_1": "1000",
    "hex_id_2": "2000"
  }
}
```

**TypeScript Usage**:
```typescript
const balancesEffect = Effect.gen(function* () {
  const financial = yield* GoFinancialPort;
  const balances = yield* financial.getAccountBalances(
    ['account_hex_1', 'account_hex_2']
  );
  
  balances.forEach(balance => {
    console.log(`Account ${balance.accountId}: ${balance.balance}`);
  });
  
  return balances;
});
```

### AP Payment Runs

**Create Payment Run**

**Endpoint**: `POST /ap/payment-runs`

**Body**:
```json
{
  "tenant": "T1",
  "legal_entity": "LE1",
  "currency": "USD"
}
```

**TypeScript Usage**:
```typescript
const createPaymentRunEffect = Effect.gen(function* () {
  const financial = yield* GoFinancialPort;
  const paymentRun = yield* financial.createAPPaymentRun({
    tenant: 'T1',
    legalEntity: 'LE1',
    currency: 'USD',
    paymentMethod: 'ach',
    createdBy: 'user_123',
    runDate: new Date(),
    billIds: [],
  });
  
  console.log('Payment Run Created:', paymentRun.id);
  console.log('Status:', paymentRun.status); // 'draft'
  
  return paymentRun;
});
```

**Get Payment Run**

**Endpoint**: `GET /ap/payment-runs/{id}`

**TypeScript Usage**:
```typescript
const getPaymentRunEffect = Effect.gen(function* () {
  const financial = yield* GoFinancialPort;
  const paymentRun = yield* financial.getAPPaymentRun('PR001');
  
  console.log('Payment Run:', paymentRun);
  console.log('Bill Count:', paymentRun.billIds.length);
  console.log('Total Amount:', paymentRun.totalAmount);
  
  return paymentRun;
});
```

## Phase 2: Timesheet Workflow

### Submit Timesheet

**Endpoint**: `POST /ps/timesheets/submit`

**Body**:
```json
{
  "tenant": "T1",
  "timesheet_id": "TS001",
  "worker_id": "WORKER001",
  "period_start": "2025-11-01T00:00:00Z",
  "period_end": "2025-11-07T23:59:59Z",
  "entries": ["entry_1", "entry_2"],
  "notes": "Weekly timesheet"
}
```

**Response**:
```json
{
  "stream": "timesheet|T1|TS001",
  "event_id": "event_uuid",
  "appended": true
}
```

**TypeScript Usage**:
```typescript
const submitTimesheetEffect = Effect.gen(function* () {
  const payroll = yield* GoPayrollPort;
  const result = yield* payroll.submitTimesheet({
    tenant: 'T1',
    timesheetId: 'TS001',
    workerId: 'WORKER001',
    periodStart: new Date('2025-11-01'),
    periodEnd: new Date('2025-11-07'),
    entries: ['entry_1', 'entry_2'],
    notes: 'Weekly timesheet',
  });
  
  console.log('Timesheet submitted to stream:', result.stream);
  console.log('Event ID:', result.eventId);
  
  return result;
});
```

### Approve Timesheet

**Endpoint**: `POST /ps/timesheets/{id}/approve`

**Body**:
```json
{
  "tenant": "T1",
  "actor": "MANAGER001"
}
```

**TypeScript Usage**:
```typescript
const approveTimesheetEffect = Effect.gen(function* () {
  const payroll = yield* GoPayrollPort;
  const result = yield* payroll.approveTimesheet({
    timesheetId: 'TS001',
    tenant: 'T1',
    actor: 'MANAGER001',
  });
  
  console.log('Timesheet approved');
  return result;
});
```

### Reject Timesheet

**Endpoint**: `POST /ps/timesheets/{id}/reject`

**Body**:
```json
{
  "tenant": "T1",
  "actor": "MANAGER001",
  "reason": "Missing project codes"
}
```

**TypeScript Usage**:
```typescript
const rejectTimesheetEffect = Effect.gen(function* () {
  const payroll = yield* GoPayrollPort;
  const result = yield* payroll.rejectTimesheet({
    timesheetId: 'TS001',
    tenant: 'T1',
    actor: 'MANAGER001',
    reason: 'Missing project codes',
  });
  
  console.log('Timesheet rejected');
  return result;
});
```

### List Timesheets

**Endpoint**: `GET /ps/timesheets`

**Query Parameters**:
- `tenant`: string (required)
- `worker_id`: string (optional)
- `status`: string (optional: "submitted", "approved", "rejected")
- `from`: ISO date (optional)
- `to`: ISO date (optional)
- `limit`: number (optional)
- `offset`: number (optional)

**TypeScript Usage**:
```typescript
const listTimesheetsEffect = Effect.gen(function* () {
  const payroll = yield* GoPayrollPort;
  const result = yield* payroll.listTimesheets({
    tenant: 'T1',
    workerId: 'WORKER001',
    status: 'submitted',
    limit: 10,
    offset: 0,
  });
  
  console.log(`Found ${result.count} timesheets`);
  result.items.forEach(ts => {
    console.log(`- ${ts.timesheetId}: ${ts.status}`);
  });
  
  return result;
});
```

## Testing the Integration

### 1. Health Check

Verify the Go backend is accessible:
```bash
curl http://localhost:8080/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

### 2. Run Integration Tests

The integration tests require a running Go backend:
```bash
cd /Users/andrewmathers/projects/dykstra-funeral-website/packages/infrastructure

# Run all integration tests
npm test

# Run specific test suites
npm test go-financial-adapter.test.ts
npm test go-payroll-adapter.test.ts
```

### 3. Manual Testing via BFF Proxy

Test through the Next.js BFF proxy (requires authentication):
```bash
# Get trial balance
curl "http://localhost:3000/api/go-proxy/v1/gl/trial-balance?book=MAIN&period=2025-11&currency=USD" \
  -H "Cookie: __session=YOUR_SESSION_TOKEN"

# Create payment run
curl -X POST "http://localhost:3000/api/go-proxy/ap/payment-runs" \
  -H "Cookie: __session=YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tenant":"T1","legal_entity":"LE1","currency":"USD"}'

# Submit timesheet
curl -X POST "http://localhost:3000/api/go-proxy/ps/timesheets/submit" \
  -H "Cookie: __session=YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant":"T1",
    "timesheet_id":"TS001",
    "worker_id":"WORKER001",
    "period_start":"2025-11-01T00:00:00Z",
    "period_end":"2025-11-07T23:59:59Z",
    "entries":["e1","e2"]
  }'
```

## Troubleshooting

### Connection Refused

**Problem**: Cannot connect to Go backend

**Solutions**:
1. Verify Go backend is running: `curl http://localhost:8080/health`
2. Check `GO_BACKEND_URL` environment variable
3. Check firewall settings
4. Verify port 8080 is not in use by another process

### Authentication Errors

**Problem**: 401 Unauthorized from BFF proxy

**Solutions**:
1. Verify Clerk authentication is configured
2. Check session cookie is present
3. Verify `getGoBackendToken()` function in BFF proxy

### Tenant Isolation

**Problem**: Cannot see data / Wrong tenant

**Solutions**:
1. Verify `X-Tenant-Id` header is set in BFF proxy
2. Check `getTenantId()` function returns correct tenant
3. Verify Go backend tenant isolation is working

### Type Errors

**Problem**: TypeScript compilation errors

**Solutions**:
1. Run `pnpm type-check` to identify issues
2. Verify all imports are correct
3. Check Effect version compatibility
4. Ensure infrastructure layer is provided

### Network Timeouts

**Problem**: Requests timeout

**Solutions**:
1. Increase timeout in BFF proxy (default: 30s)
2. Check Go backend performance
3. Verify database connections
4. Check TigerBeetle/EventStoreDB status

## Production Considerations

### 1. Authentication

Replace placeholder tokens in BFF proxy:
```typescript
// packages/infrastructure/src/adapters/go-backend/[...path]/route.ts

async function getGoBackendToken(userId: string): Promise<string> {
  // TODO: Implement proper JWT generation
  // Options:
  // 1. Use Clerk JWT templates
  // 2. Generate JWT with shared secret
  // 3. Exchange tokens with Go backend auth service
  
  return 'dev-token-' + userId; // REPLACE IN PRODUCTION
}
```

### 2. Tenant Lookup

Implement proper tenant resolution:
```typescript
async function getTenantId(userId: string): Promise<string> {
  // TODO: Query database for user's funeral home
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { funeralHome: true }
  });
  
  return user?.funeralHome?.id || 'default';
}
```

### 3. Caching

Add caching for frequently accessed data:
- Trial balances
- Account balances
- Timesheet lists

Consider using Redis or Next.js cache.

### 4. Error Handling

Enhance error handling in adapters:
- Retry logic for transient failures
- Circuit breaker pattern
- Detailed error logging
- User-friendly error messages

### 5. Monitoring

Add monitoring and observability:
- Log all Go backend requests
- Track response times
- Monitor error rates
- Set up alerts for failures

## Next Steps

1. **Implement Authentication**: Replace placeholder tokens with production auth
2. **Add Caching**: Implement caching strategy for read-heavy operations
3. **Create Use Cases**: Build higher-level use cases that compose multiple port operations
4. **Build UI Components**: Create React components that use these use cases
5. **Add E2E Tests**: Create end-to-end tests that verify full workflow
6. **Performance Testing**: Load test the integration with realistic data volumes
7. **Documentation**: Document business workflows and data flows

## Support

For issues or questions:
1. Check Go backend logs: `/var/log/go-backend/`
2. Check Next.js logs: Browser console + server logs
3. Review integration test results
4. Consult Go backend OpenAPI documentation
5. Review Phase 1-4 implementation documentation
