import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const expectedUser = process.env.BASIC_AUTH_USER;
  const expectedPass = process.env.BASIC_AUTH_PASSWORD;

  if (!expectedUser && !expectedPass) {
    return NextResponse.next();
  }

  const authHeader = req.headers.get("authorization");

  if (authHeader?.startsWith("Basic ")) {
    const base64 = authHeader.slice(6);
    const decoded = atob(base64);
    const [user, pass] = decoded.split(":");

    if (user === expectedUser && pass === expectedPass) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Prototype", charset="UTF-8"',
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
