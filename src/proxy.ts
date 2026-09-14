import type { NextFetchEvent, NextMiddleware, NextRequest } from "next/server";
import { auth } from "@/lib/auth";

const authenticatedProxy = auth(() => undefined) as unknown as NextMiddleware;

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  return authenticatedProxy(request, event);
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|rink-background.png|manifest\\.webmanifest$|sw\\.js$|pwa/).*)",
  ],
};
