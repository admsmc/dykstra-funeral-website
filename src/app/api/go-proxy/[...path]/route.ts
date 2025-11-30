import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';

const GO_BACKEND_URL = process.env.GO_BACKEND_URL || 'http://localhost:8080';

/**
 * BFF Proxy - Backend for Frontend
 * 
 * Proxies all requests to the Go ERP backend with authentication and tenant isolation.
 * This is the ONLY way the TypeScript frontend should communicate with Go infrastructure.
 * 
 * Architecture: TypeScript UI → BFF Proxy → Go Backend → TigerBeetle/EventStoreDB/PostgreSQL
 * 
 * Security:
 * - Validates Clerk authentication
 * - Injects Go backend token
 * - Adds tenant isolation headers
 * - Prevents direct Go infrastructure access
 */

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const { userId } = auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const path = params.path.join('/');
  const url = new URL(req.url);
  const searchParams = url.searchParams.toString();
  
  try {
    const response = await fetch(
      `${GO_BACKEND_URL}/${path}${searchParams ? `?${searchParams}` : ''}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await getGoBackendToken(userId)}`,
          'X-Tenant-Id': await getTenantId(userId),
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(30000), // 30s timeout
      }
    );
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[BFF Proxy] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy request to Go backend' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const { userId } = auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const path = params.path.join('/');
  const body = await req.json();
  
  try {
    const response = await fetch(`${GO_BACKEND_URL}/${path}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await getGoBackendToken(userId)}`,
        'X-Tenant-Id': await getTenantId(userId),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000), // 30s timeout
    });
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[BFF Proxy] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy request to Go backend' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const { userId } = auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const path = params.path.join('/');
  const body = await req.json();
  
  try {
    const response = await fetch(`${GO_BACKEND_URL}/${path}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${await getGoBackendToken(userId)}`,
        'X-Tenant-Id': await getTenantId(userId),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000), // 30s timeout
    });
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[BFF Proxy] PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy request to Go backend' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const { userId } = auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const path = params.path.join('/');
  
  try {
    const response = await fetch(`${GO_BACKEND_URL}/${path}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${await getGoBackendToken(userId)}`,
        'X-Tenant-Id': await getTenantId(userId),
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(30000), // 30s timeout
    });
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[BFF Proxy] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy request to Go backend' },
      { status: 500 }
    );
  }
}

/**
 * Get Go backend authentication token for the given Clerk user
 * 
 * TODO: Implement proper token exchange logic
 * Options:
 * 1. Generate JWT signed by shared secret
 * 2. Exchange Clerk session token for Go token
 * 3. Use Clerk JWT template to include Go backend claims
 */
async function getGoBackendToken(userId: string): Promise<string> {
  // For now, return a placeholder token
  // In production, this should:
  // 1. Fetch user's funeral home ID from database
  // 2. Generate/fetch a JWT token for Go backend
  // 3. Cache the token with appropriate TTL
  
  return 'dev-token-' + userId;
}

/**
 * Get tenant ID (funeral home ID) for the given Clerk user
 * 
 * TODO: Implement proper tenant lookup
 * This should query the TypeScript database to find which funeral home
 * the user belongs to, then return that as the tenant ID.
 */
async function getTenantId(userId: string): Promise<string> {
  // For now, return a placeholder tenant
  // In production, this should:
  // 1. Query funeral_home_crm database
  // 2. Find user's associated funeral home
  // 3. Return funeral home ID
  // 4. Cache the result
  
  return 'dykstra-funeral-home';
}
