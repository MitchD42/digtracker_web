import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
  try {
    console.log('Middleware - Request path:', request.nextUrl.pathname);
    
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    const user = await supabase.auth.getUser();
    console.log('Middleware - User:', user.data.user?.email || 'No user');

    if (request.nextUrl.pathname.startsWith("/protected") && user.error) {
      console.log('Middleware - Redirecting to /sign-in - No user found');
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    if (request.nextUrl.pathname === "/" && !user.error) {
      console.log('Middleware - Redirecting to /protected/dashboard - User found');
      return NextResponse.redirect(new URL("/protected/dashboard", request.url));
    }

    return response;
  } catch (e) {
    console.error('Middleware - Error:', e);
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};
