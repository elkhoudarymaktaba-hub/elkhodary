import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  
  // Skip static files, Next.js internal files, and favicon
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname.includes('.') ||
    url.pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Create request headers to forward pathname
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', url.pathname);

  // Paths that should not be blocked
  const isMaintenancePage = url.pathname === '/maintenance';
  const isAdminPage = url.pathname.startsWith('/admin') || url.pathname.startsWith('/veroula-control');

  if (isMaintenancePage || isAdminPage) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      }
    });
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      // Query the database REST API directly to avoid any Edge runtime library issues.
      const res = await fetch(
        `${supabaseUrl}/rest/v1/site_settings?key=eq.maintenance_mode&select=value`,
        {
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          // Cache the response briefly to prevent hammering Supabase on every single navigation
          next: { revalidate: 30 },
        }
      );
      
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0 && data[0].value === 'true') {
          url.pathname = '/maintenance';
          return NextResponse.redirect(url);
        }
      }
    }
  } catch (error) {
    console.error('Error checking maintenance mode in middleware:', error);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    }
  });
}

// Run middleware on all paths except static assets
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

