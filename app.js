(() => {
  const configuredBase = document
    .querySelector('meta[name="borilje-api-base"]')
    ?.getAttribute("content")
    ?.replace(/\/$/, "");
  const localHostnames = new Set(["localhost", "127.0.0.1"]);
  const apiBase =
    configuredBase ||
    (localHostnames.has(window.location.hostname)
      ? "http://localhost:7071/api"
      : "/api");

  const cards = document.getElementById("spotsCards");
  const heroCount = document.getElementById("heroSpotCount");
  const heroUpdated = document.getElementById("heroUpdatedAt");
  const spotsUpdated = document.getElementById("spotsUpdatedAt");
  const locationInput = document.getElementById("heroLocationInput");
  const itemInput = document.getElementById("heroItemInput");
  const searchButton = document.getElementById("heroSearchBtn");

  const formatUpdatedAt = (metadata) => {
    if (metadata?.status === "sample") return "샘플 데이터 · 공공 API 연결 전";
    if (!metadata?.lastSuccessAt) return "갱신 시각 확인 불가";
    const formatted = new Intl.DateTimeFormat("ko-KR", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Seoul",
    }).format(new Date(metadata.lastSuccessAt));
    return `${formatted} 동기화`;
  };

  const createText = (tag, className, text) => {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = text;
    return element;
  };

  const renderSpots = (spots, metadata) => {
    if (!cards) return;
    cards.replaceChildren();

    if (spots.length === 0) {
      const requestedLocation = locationInput?.value.trim() ?? "";
      const empty = document.createElement("div");
      empty.className = "spots-empty-message";
      empty.append(
        createText(
          "strong",
          "spots-empty-title",
          requestedLocation.includes("서귀포")
            ? "서귀포시는 아직 검색할 수 없습니다."
            : "조건에 맞는 클린 스팟을 찾지 못했습니다.",
        ),
        createText(
          "p",
          "spots-empty-description",
          "현재는 제주시 데이터만 제공합니다. 한림읍, 애월읍, 조천읍, 구좌읍 등 제주시 지역으로 검색해주세요.",
        ),
      );
      cards.append(empty);
    } else {
      spots.slice(0, 3).forEach((spot, index) => {
        const article = document.createElement("a");
        article.className = `spot-card spot-card-link${index === 1 ? " spot-center" : ""}`;
        article.href = `spot.html?id=${encodeURIComponent(spot.id)}`;
        article.setAttribute("aria-label", `${spot.name} 상세 정보 보기`);

        const visual = document.createElement("div");
        visual.className = "spot-card-visual";
        visual.setAttribute("aria-hidden", "true");
        visual.append(
          createText("span", "spot-card-visual-mark", "JEJU"),
          createText("span", "spot-card-photo-note", "공공데이터 사진 미제공"),
        );

        const overlay = document.createElement("div");
        overlay.className = "spot-card-overlay spot-card-overlay-static";
        overlay.append(createText("span", "spot-num-badge", String(index + 1).padStart(2, "0")));

        const content = document.createElement("div");
        content.className = "spot-card-content";
        content.append(createText("h3", "spot-card-title", spot.name));
        const distance = Number.isFinite(spot.distanceKm)
          ? ` · ${spot.distanceKm.toFixed(1)}km`
          : "";
        const hours =
          spot.openTime && spot.closeTime
            ? `${spot.openTime}–${spot.closeTime}`
            : "운영시간 미확인";
        content.append(
          createText(
            "p",
            "spot-card-status",
            `${hours}${distance}`,
          ),
        );
        content.append(
          createText("p", "spot-card-tags", spot.items.join(" · ") || "수거 품목 확인 중"),
        );
        content.append(createText("p", "spot-card-address", spot.address));
        content.append(createText("span", "spot-card-more", "상세 정보 보기 ↗"));
        overlay.append(content);
        article.append(visual, overlay);
        cards.append(article);
      });
    }

    const updatedText = formatUpdatedAt(metadata);
    if (heroCount) heroCount.textContent = String(metadata?.recordCount ?? spots.length);
    if (heroUpdated) heroUpdated.textContent = updatedText;
    if (spotsUpdated) spotsUpdated.textContent = updatedText;
  };

  const showError = () => {
    if (heroUpdated) heroUpdated.textContent = "API 연결을 확인해주세요";
    if (spotsUpdated) spotsUpdated.textContent = "기존 화면 데이터를 표시 중입니다";
  };

  async function loadSpots() {
    if (searchButton) searchButton.disabled = true;
    try {
      const params = new URLSearchParams({ limit: "20" });
      const location = locationInput?.value.trim();
      const item = itemInput?.value.trim();
      if (location) params.set("q", location);
      if (item) params.set("item", item);

      const response = await fetch(`${apiBase}/spots?${params}`);
      if (!response.ok) throw new Error(`API response: ${response.status}`);
      const payload = await response.json();
      renderSpots(payload.data ?? [], payload.meta);
    } catch (error) {
      console.error("클린 스팟 API 연결 실패", error);
      showError();
    } finally {
      if (searchButton) searchButton.disabled = false;
    }
  }

  searchButton?.addEventListener("click", loadSpots);
  [locationInput, itemInput].forEach((input) =>
    input?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") loadSpots();
    }),
  );

  document.addEventListener("DOMContentLoaded", loadSpots);
})();
