import { SpotDataset } from "../domain/spots";

export function createSampleDataset(now = new Date()): SpotDataset {
  const syncedAt = now.toISOString();

  return {
    spots: [
      {
        id: "sample-hamdeok-01",
        type: "cleanhouse",
        name: "함덕리 클린하우스",
        address: "제주특별자치도 제주시 조천읍 함덕리",
        latitude: 33.5431,
        longitude: 126.6692,
        openTime: "15:00",
        closeTime: "04:00",
        items: ["투명 페트병", "캔", "유리", "일반쓰레기"],
        services: [],
        source: "sample",
      },
      {
        id: "sample-dongmun-02",
        type: "recycle-center",
        name: "동문시장 인근 재활용도움센터",
        address: "제주특별자치도 제주시 관덕로14길",
        latitude: 33.5127,
        longitude: 126.5284,
        openTime: "06:00",
        closeTime: "24:00",
        items: ["일반쓰레기", "재활용", "음식물", "캔"],
        services: ["소형 폐가전", "폐건전지"],
        source: "sample",
      },
      {
        id: "sample-woljeongri-03",
        type: "cleanhouse",
        name: "월정리 클린하우스",
        address: "제주특별자치도 제주시 구좌읍 월정리",
        latitude: 33.5558,
        longitude: 126.7959,
        openTime: "15:00",
        closeTime: "04:00",
        items: ["캔", "투명 페트병", "비닐", "유리"],
        services: [],
        source: "sample",
      },
    ],
    metadata: {
      status: "sample",
      source: "bundled-sample",
      lastAttemptAt: syncedAt,
      lastSuccessAt: syncedAt,
      recordCount: 3,
      version: `sample-${syncedAt.replace(/\D/g, "").slice(0, 14)}`,
      message: "공공데이터 API 설정 전 샘플 데이터입니다.",
    },
  };
}
