import { HttpResponseInit } from "@azure/functions";

export function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": process.env.FRONTEND_ORIGIN ?? "*",
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    Vary: "Origin",
  };
}

export function jsonResponse(body: unknown, status = 200): HttpResponseInit {
  return { status, headers: corsHeaders(), jsonBody: body };
}
