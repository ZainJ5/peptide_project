import { NextResponse } from "next/server";

const CANONICAL_HOST = "www.mypeptidedosages.com";

export function middleware(request) {
  const url = request.nextUrl.clone();
  const protoHeader = request.headers.get("x-forwarded-proto");
  const effectiveProto = protoHeader || url.protocol.replace(":", "");

  const needsHttps = effectiveProto !== "https";
  const needsHost = url.hostname !== CANONICAL_HOST;

  if (needsHttps || needsHost) {
    url.protocol = "https:";
    url.hostname = CANONICAL_HOST;
    return NextResponse.redirect(url, { status: 301 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
