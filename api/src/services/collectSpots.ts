import {
  normalizePublicRow,
  Spot,
  SpotDataset,
  validateSpots,
} from "../domain/spots";

function findRows(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload as Record<string, unknown>[];
  if (!payload || typeof payload !== "object") return [];

  const object = payload as Record<string, unknown>;
  for (const key of ["items", "item", "data", "records", "row"]) {
    const nested = findRows(object[key]);
    if (nested.length > 0) return nested;
  }
  for (const value of Object.values(object)) {
    const nested = findRows(value);
    if (nested.length > 0) return nested;
  }
  return [];
}

function sourceDate(spots: Spot[]): string | undefined {
  return spots
    .map((spot) => spot.sourceUpdatedAt)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);
}

export async function collectSpots(now = new Date()): Promise<{
  dataset: SpotDataset;
  raw: unknown;
}> {
  const sourceUrl = process.env.DATA_SOURCE_URL;
  if (!sourceUrl) {
    throw new Error("DATA_SOURCE_URL 환경 변수가 설정되지 않았습니다.");
  }

  const url = new URL(sourceUrl);
  const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY;
  if (serviceKey && !url.searchParams.has("serviceKey")) {
    url.searchParams.set("serviceKey", serviceKey);
  }
  if (!url.searchParams.has("pageNo")) url.searchParams.set("pageNo", "1");
  if (!url.searchParams.has("numOfRows")) url.searchParams.set("numOfRows", "10000");
  if (!url.searchParams.has("_type")) url.searchParams.set("_type", "json");

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(`공공데이터 API 요청 실패: ${response.status}`);
  }

  const raw: unknown = await response.json();
  const rows = findRows(raw);
  const normalized = rows.map(normalizePublicRow);
  const spots = normalized
    .filter((spot): spot is Spot => spot !== null);
  const rejectedCount = normalized.length - spots.length;
  validateSpots(spots);

  const timestamp = now.toISOString();
  return {
    raw,
    dataset: {
      spots,
      metadata: {
        status: "success",
        source: "data.go.kr",
        sourceDataDate: sourceDate(spots),
        lastAttemptAt: timestamp,
        lastSuccessAt: timestamp,
        recordCount: spots.length,
        version: timestamp.replace(/\D/g, "").slice(0, 14),
        message:
          rejectedCount > 0
            ? `필수값 또는 좌표 오류 데이터 ${rejectedCount}건을 제외했습니다.`
            : undefined,
      },
    },
  };
}
