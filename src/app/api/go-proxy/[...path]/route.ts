import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getGoBackendToken, getTenantId } from '@/lib/bff-auth';

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
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');
  const url = new URL(req.url);
  const searchParams = url.searchParams.toString();
  
  try {
    // Get tenant ID and authentication token
    const tenantId = await getTenantId(userId);
    if (!tenantId) {
      console.error(`[BFF Proxy] No tenant found for user: ${userId}`);
      return NextResponse.json(
        { error: 'User not associated with a funeral home' },
        { status: 403 }
      );
    }
    
    const token = await getGoBackendToken(userId);
    
    console.log(`[BFF Proxy] GET /${path} (user: ${userId}, tenant: ${tenantId})`);
    
    const response = await fetch(
      `${GO_BACKEND_URL}/${path}${searchParams ? `?${searchParams}` : ''}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-Id': tenantId,
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
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');
  const body = await req.json();
  
  try {
    // Get tenant ID and authentication token
    const tenantId = await getTenantId(userId);
    if (!tenantId) {
      console.error(`[BFF Proxy] No tenant found for user: ${userId}`);
      return NextResponse.json(
        { error: 'User not associated with a funeral home' },
        { status: 403 }
      );
    }
    
    const token = await getGoBackendToken(userId);
    
    console.log(`[BFF Proxy] POST /${path} (user: ${userId}, tenant: ${tenantId})`);
    
    const response = await fetch(`${GO_BACKEND_URL}/${path}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-Id': tenantId,
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
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');
  const body = await req.json();
  
  try {
    // Get tenant ID and authentication token
    const tenantId = await getTenantId(userId);
    if (!tenantId) {
      console.error(`[BFF Proxy] No tenant found for user: ${userId}`);
      return NextResponse.json(
        { error: 'User not associated with a funeral home' },
        { status: 403 }
      );
    }
    
    const token = await getGoBackendToken(userId);
    
    console.log(`[BFF Proxy] PATCH /${path} (user: ${userId}, tenant: ${tenantId})`);
    
    const response = await fetch(`${GO_BACKEND_URL}/${path}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-Id': tenantId,
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
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');
  
  try {
    // Get tenant ID and authentication token
    const tenantId = await getTenantId(userId);
    if (!tenantId) {
      console.error(`[BFF Proxy] No tenant found for user: ${userId}`);
      return NextResponse.json(
        { error: 'User not associated with a funeral home' },
        { status: 403 }
      );
    }
    
    const token = await getGoBackendToken(userId);
    
    console.log(`[BFF Proxy] DELETE /${path} (user: ${userId}, tenant: ${tenantId})`);
    
    const response = await fetch(`${GO_BACKEND_URL}/${path}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-Id': tenantId,
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

// Note: getGoBackendToken and getTenantId are now imported from @/lib/bff-auth
// This provides production-ready JWT generation and tenant lookup with caching.
