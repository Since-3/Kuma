// middleware.ts (at root level)
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Protected routes
  const protectedRoutes = [
    "/dashboard",
    "/profile",
    "/trainings",
    "/courses",
    "/settings",
    "/employee",
    "/rooms",
  ];
  const authRoutes = ["/login", "/register", "/forgot-password"];

  // Guest-accessible sub-paths that sit under a protected prefix
  const guestAllowedPaths = [
    "/courses/book/", // success + cancel pages after guest checkout
  ];
  const isGuestAllowed = guestAllowedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  const isProtectedRoute =
    !isGuestAllowed && protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => request.nextUrl.pathname.startsWith(route));
  const isPasswordReset = request.nextUrl.pathname.startsWith("/reset-password");

  // Skip auth check if not a protected, auth, or reset route
  if (!isProtectedRoute && !isAuthRoute && !isPasswordReset) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect logged-in users away from auth routes (except password reset)
  if (user && isAuthRoute && !isPasswordReset) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/data|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
