import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { jsonResponse } from "../http";
import { querySpots } from "../services/querySpots";
import { readDataset } from "../services/spotStore";

const optionalNumber = (value: string | null): number | undefined => {
  if (value === null || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export async function getSpots(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const dataset = await readDataset();
    const spots = querySpots(dataset.spots, {
      q: request.query.get("q") ?? undefined,
      item: request.query.get("item") ?? undefined,
      latitude: optionalNumber(request.query.get("lat")),
      longitude: optionalNumber(request.query.get("lng")),
      limit: optionalNumber(request.query.get("limit")),
    });

    return jsonResponse({ data: spots, meta: dataset.metadata });
  } catch (error) {
    context.error("클린 스팟 조회 실패", error);
    return jsonResponse({ error: "클린 스팟 데이터를 불러오지 못했습니다." }, 503);
  }
}

app.http("getSpots", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "spots",
  handler: getSpots,
});
