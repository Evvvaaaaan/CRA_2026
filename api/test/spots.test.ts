import assert from "node:assert/strict";
import test from "node:test";
import { createSampleDataset } from "../src/data/sampleSpots";
import { normalizePublicRow, validateSpots } from "../src/domain/spots";
import { findSpotById, querySpots } from "../src/services/querySpots";

test("공공데이터 행을 공통 클린 스팟 형식으로 변환한다", () => {
  const spot = normalizePublicRow(
    {
      시설명: "테스트 클린하우스",
      주소: "제주특별자치도 제주시 테스트로 1",
      위도: "33.5",
      경도: "126.5",
      수거품목: "투명 페트병, 캔",
      데이터기준일자: "2026-09-25",
    },
    0,
  );

  assert.equal(spot?.name, "테스트 클린하우스");
  assert.deepEqual(spot?.items, ["투명 페트병", "캔"]);
  assert.equal(spot?.sourceUpdatedAt, "2026-09-25");
});

test("제주시 클린하우스 API 필드를 장소와 수거품목으로 변환한다", () => {
  const spot = normalizePublicRow(
    {
      dataCd: "CH-001",
      hsmpNm: "함덕리사무소 앞",
      rnAdres: "제주특별자치도 제주시 조천읍 함덕로 1",
      lnmAdres: "제주특별자치도 제주시 조천읍 함덕리 1",
      laCrdnt: "33.5431",
      loCrdnt: "126.6692",
      seNm: "클린하우스",
      recycleClctnbxCnt: "2",
      glsbtlClctnbxCnt: "1",
      strfClctnbxCnt: "0",
      dscdBatteryClctnbxCnt: "1",
      fddrnkClctnbxCnt: "1",
      regDt: "2025-12-24 10:30:00",
    },
    0,
  );

  assert.equal(spot?.id, "CH-001");
  assert.equal(spot?.name, "함덕리사무소 앞");
  assert.equal(spot?.address, "제주특별자치도 제주시 조천읍 함덕로 1");
  assert.equal(spot?.latitude, 33.5431);
  assert.equal(spot?.longitude, 126.6692);
  assert.deepEqual(spot?.items, ["재활용", "유리병", "폐건전지", "음식물"]);
  assert.equal(spot?.sourceUpdatedAt, "2025-12-24 10:30:00");
});

test("제주시 API의 잘못된 좌표 행은 제외한다", () => {
  const spot = normalizePublicRow(
    {
      dataCd: "CL0888",
      hsmpNm: "좌표 오류 클린하우스",
      rnAdres: "제주특별자치도 제주시 테스트로 1",
      laCrdnt: "33.493886",
      loCrdnt: "0",
    },
    0,
  );

  assert.equal(spot, null);
});

test("페트병 검색은 일반 재활용 수거함을 포함한다", () => {
  const [sample] = createSampleDataset().spots;
  const result = querySpots([{ ...sample, items: ["재활용"] }], {
    item: "페트병",
  });

  assert.equal(result.length, 1);
});

test("위치와 품목으로 검색한다", () => {
  const result = querySpots(createSampleDataset().spots, {
    q: "제주 함덕",
    item: "페트병",
  });

  assert.equal(result.length, 1);
  assert.equal(result[0].id, "sample-hamdeok-01");
});

test("ID가 일치하는 클린 스팟 한 곳을 찾는다", () => {
  const spots = createSampleDataset().spots;

  assert.equal(findSpotById(spots, "sample-hamdeok-01")?.name, "함덕리 클린하우스");
  assert.equal(findSpotById(spots, "not-found"), undefined);
});

test("좌표가 있으면 가까운 순서로 정렬한다", () => {
  const result = querySpots(createSampleDataset().spots, {
    latitude: 33.54,
    longitude: 126.67,
  });

  assert.equal(result[0].id, "sample-hamdeok-01");
  assert.ok((result[0].distanceKm ?? 100) < (result[1].distanceKm ?? 0));
});

test("제주 범위를 벗어난 데이터는 게시하지 않는다", () => {
  const [spot] = createSampleDataset().spots;
  assert.throws(
    () => validateSpots([{ ...spot, latitude: 37.5665 }]),
    /제주 범위를 벗어난 좌표/,
  );
});
