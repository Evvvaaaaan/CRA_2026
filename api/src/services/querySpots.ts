import { Spot } from "../domain/spots";

export interface SpotQuery {
  q?: string;
  item?: string;
  latitude?: number;
  longitude?: number;
  limit?: number;
}

export function findSpotById(spots: Spot[], id: string): Spot | undefined {
  return spots.find((spot) => spot.id === id);
}

const normalize = (value: string): string =>
  value.toLocaleLowerCase("ko-KR").replace(/\s+/g, "");

const recyclableItems = new Set([
  "페트병",
  "투명페트병",
  "캔",
  "비닐",
  "플라스틱",
  "종이",
]);

function haversineKm(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number,
): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const deltaLatitude = radians(latitude2 - latitude1);
  const deltaLongitude = radians(longitude2 - longitude1);
  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(radians(latitude1)) *
      Math.cos(radians(latitude2)) *
      Math.sin(deltaLongitude / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function querySpots(spots: Spot[], query: SpotQuery): Spot[] {
  const words = (query.q ?? "")
    .split(/\s+/)
    .map(normalize)
    .filter(Boolean);
  const item = normalize(query.item ?? "");
  const hasCoordinates =
    Number.isFinite(query.latitude) && Number.isFinite(query.longitude);

  const result = spots
    .filter((spot) => {
      const searchable = normalize(`${spot.name} ${spot.address}`);
      const matchesLocation = words.every((word) => searchable.includes(word));
      const matchesItem =
        !item ||
        [...spot.items, ...spot.services].some((value) =>
          normalize(value).includes(item),
        ) ||
        (recyclableItems.has(item) && spot.items.includes("재활용"));
      return matchesLocation && matchesItem;
    })
    .map((spot) => {
      if (!hasCoordinates) return { ...spot };
      return {
        ...spot,
        distanceKm: Number(
          haversineKm(
            query.latitude as number,
            query.longitude as number,
            spot.latitude,
            spot.longitude,
          ).toFixed(2),
        ),
      };
    });

  if (hasCoordinates) {
    result.sort(
      (left, right) =>
        (left.distanceKm ?? Number.MAX_VALUE) -
        (right.distanceKm ?? Number.MAX_VALUE),
    );
  }

  return result.slice(0, Math.min(Math.max(query.limit ?? 20, 1), 100));
}
