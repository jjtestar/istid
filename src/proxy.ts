import type { NextFetchEvent, NextRequest } from "next/server";
import { auth } from "@/lib/auth";

const authenticatedProxy = auth(() => undefined);

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  return authenticatedProxy(request, event);
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|rink-background.png).*)",
  ],
};
