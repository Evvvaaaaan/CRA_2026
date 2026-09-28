import { app, HttpResponseInit, InvocationContext } from "@azure/functions";
import { jsonResponse } from "../http";
import { readMetadata } from "../services/spotStore";

export async function getSyncStatus(
  _request: unknown,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    return jsonResponse(await readMetadata());
  } catch (error) {
    context.error("동기화 상태 조회 실패", error);
    return jsonResponse({ error: "동기화 상태를 불러오지 못했습니다." }, 503);
  }
}

app.http("getSyncStatus", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "sync-status",
  handler: getSyncStatus,
});
