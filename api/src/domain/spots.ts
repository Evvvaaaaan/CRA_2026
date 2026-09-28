export type SpotType = "cleanhouse" | "recycle-center";

export interface Spot {
  id: string;
  type: SpotType;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  openTime?: string;
  closeTime?: string;
  items: string[];
  services: string[];
  source: string;
  sourceUpdatedAt?: string;
  distanceKm?: number;
}

export interface SyncMetadata {
  status: "success" | "failed" | "sample";
  source: string;
  sourceDataDate?: string;
  lastAttemptAt: string;
  lastSuccessAt?: string;
  recordCount: number;
  version: string;
  message?: string;
}

export interface SpotDataset {
  spots: Spot[];
  metadata: SyncMetadata;
}

const stringValue = (value: unknown): string =>
  value === undefined || value === null ? "" : String(value).trim();

const pick = (row: Record<string, unknown>, keys: string[]): string => {
  for (const key of keys) {
    const value = stringValue(row[key]);
    if (value) return value;
  }
  return "";
};

const numberValue = (value: string): number | undefined => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const splitValues = (value: string): string[] =>
  value
    .split(/[,/·|]/)
    .map((item) => item.trim())
    .filter(Boolean);

const collectionBoxItems = (row: Record<string, unknown>): string[] => {
  const fields: Array<[string, string]> = [
    ["pysygClctnbxCnt", "종량제"],
    ["recycleClctnbxCnt", "재활용"],
    ["glsbtlClctnbxCnt", "유리병"],
    ["strfClctnbxCnt", "스티로폼"],
    ["dscdBatteryClctnbxCnt", "폐건전지"],
    ["dscdFlrsclmpClctnbxCnt", "폐형광등"],
    ["fddrnkClctnbxCnt", "음식물"],
    ["fddrnkClctnbxMeterCnt", "음식물 계량"],
  ];

  return fields
    .filter(([key]) => (numberValue(stringValue(row[key])) ?? 0) > 0)
    .map(([, item]) => item);
};

const hasJejuCoordinates = (latitude: number, longitude: number): boolean =>
  latitude >= 32.8 &&
  latitude <= 34.0 &&
  longitude >= 125.8 &&
  longitude <= 127.3;

export function normalizePublicRow(
  row: Record<string, unknown>,
  index: number,
): Spot | null {
  const name = pick(row, [
    "name",
    "cleanHouseName",
    "recycleCenterName",
    "hsmpNm",
    "클린하우스명",
    "재활용도움센터명",
    "시설명",
    "읍면동",
  ]);
  const address = pick(row, [
    "address",
    "roadAddress",
    "lotAddress",
    "rnAdres",
    "lnmAdres",
    "소재지도로명주소",
    "소재지지번주소",
    "주소",
  ]);
  const latitude = numberValue(
    pick(row, ["latitude", "lat", "laCrdnt", "위도", "Latitude"]),
  );
  const longitude = numberValue(
    pick(row, ["longitude", "lng", "lon", "loCrdnt", "경도", "Longitude"]),
  );

  if (
    !name ||
    !address ||
    latitude === undefined ||
    longitude === undefined ||
    !hasJejuCoordinates(latitude, longitude)
  ) {
    return null;
  }

  const id =
    pick(row, ["id", "facilityId", "dataCd", "연번", "번호", "관리번호"]) ||
    `${name}-${index + 1}`;
  const typeText = pick(row, ["type", "seNm", "pttnNm", "시설구분", "구분"]);
  const rawItems = pick(row, [
    "items",
    "collectionItems",
    "수거품목",
    "배출품목",
  ]);
  const rawServices = pick(row, ["services", "제공서비스", "특별수거품목"]);
  const items = [...new Set([...splitValues(rawItems), ...collectionBoxItems(row)])];

  return {
    id: id.replace(/\s+/g, "-"),
    type: typeText.includes("도움") ? "recycle-center" : "cleanhouse",
    name,
    address,
    latitude,
    longitude,
    openTime: pick(row, ["openTime", "운영시작시간", "시작시간"]) || undefined,
    closeTime:
      pick(row, ["closeTime", "운영종료시간", "종료시간"]) || undefined,
    items,
    services: splitValues(rawServices),
    source: "data.go.kr",
    sourceUpdatedAt:
      pick(row, ["sourceUpdatedAt", "regDt", "데이터기준일자", "데이터기준일"]) ||
      undefined,
  };
}

export function validateSpots(spots: Spot[]): void {
  if (spots.length === 0) {
    throw new Error("수집 결과가 비어 있습니다.");
  }

  const ids = new Set<string>();
  for (const spot of spots) {
    if (ids.has(spot.id)) {
      throw new Error(`중복 시설 ID가 있습니다: ${spot.id}`);
    }
    ids.add(spot.id);

    if (!hasJejuCoordinates(spot.latitude, spot.longitude)) {
      throw new Error(`제주 범위를 벗어난 좌표입니다: ${spot.id}`);
    }
  }
}
