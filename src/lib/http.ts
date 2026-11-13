import { NextResponse } from "next/server";
import { sameOrigin } from "./utils";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export function originBlock(req: Request) {
  if (!sameOrigin(req)) return bad("Request origin was rejected.", 403);
  return null;
}
