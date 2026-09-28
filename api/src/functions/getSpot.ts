import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { jsonResponse } from "../http";
import { findSpotById } from "../services/querySpots";
import { readDataset } from "../services/spotStore";

export async function getSpot(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const dataset = await readDataset();
    const spot = findSpotById(dataset.spots, request.params.id);

    if (!spot) {
      return jsonResponse({ error: "요청한 클린 스팟을 찾지 못했습니다." }, 404);
    }

    return jsonResponse({ data: spot, meta: dataset.metadata });
  } catch (error) {
    context.error("클린 스팟 상세 조회 실패", error);
    return jsonResponse({ error: "클린 스팟 데이터를 불러오지 못했습니다." }, 503);
  }
}

app.http("getSpot", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "spots/{id}",
  handler: getSpot,
});
