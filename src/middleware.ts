import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Initialize Socket.IO server
export function middleware(request: NextRequest) {
  // Call the Socket.IO API route to initialize the server
  if (request.nextUrl.pathname.startsWith('/api/socket')) {
    return NextResponse.next();
  }
  
  return NextResponse.next();
}

// Only run middleware on API routes
export const config = {
  matcher: '/api/:path*',
}; 