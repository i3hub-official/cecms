// src/lib/middleware/middlewareChain-edge.ts - Edge compatible
import { NextRequest, NextResponse } from "next/server";
import { validateSessionEdge } from "@/lib/auth-edge";

export type Middleware = (
  req: NextRequest,
  res?: NextResponse
) => Promise<NextResponse> | NextResponse;

export type RouteConfig = {
  path: string;
  methods?: string[];
  public?: boolean;
  apiAuth?: boolean;
};

function mergeResponses(
  base: NextResponse,
  nextRes: NextResponse
): NextResponse {
  nextRes.headers.forEach((value, key) => {
    base.headers.set(key, value);
  });

  if (nextRes.status !== 200 || nextRes.redirected) {
    return nextRes;
  }

  return base;
}

export async function chainMiddlewares(
  req: NextRequest,
  middlewares: Middleware[]
): Promise<NextResponse> {
  let response = NextResponse.next();

  for (const mw of middlewares) {
    const nextRes = await mw(req, response);

    if (nextRes.redirected || nextRes.status !== 200) {
      return mergeResponses(nextRes, response);
    }

    response = mergeResponses(response, nextRes);
  }

  return response;
}

// Edge-compatible path-based authentication
export function withPathsEdge(publicPaths: string[]) {
  return async (req: NextRequest, res?: NextResponse) => {
    const pathname = req.nextUrl.pathname;

    // Check if path is public
    const isPublic = publicPaths.some((publicPath) => {
      const pattern = new RegExp(
        `^${publicPath.replace(/:\w+/g, "[^/]+").replace(/\*/g, ".*")}$`
      );
      return pattern.test(pathname);
    });

    if (isPublic) {
      return res || NextResponse.next();
    }

    // For protected routes, do JWT verification only (no DB calls)
    const sessionResult = await validateSessionEdge(req);

    if (!sessionResult.isValid) {
      const isApiRoute = pathname.startsWith("/api/");

      if (isApiRoute) {
        return new NextResponse(
          JSON.stringify({ error: sessionResult.error || "Unauthorized" }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      } else {
        const loginUrl = new URL("/auth/signin", req.nextUrl.origin);
        // loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }
    }

    const response = res || NextResponse.next();
    response.headers.set("x-user-id", sessionResult.user!.id);
    response.headers.set("x-user-email", sessionResult.user!.email);
    response.headers.set("x-user-role", sessionResult.user!.role);

    return response;
  };
}
