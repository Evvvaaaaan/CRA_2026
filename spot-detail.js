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

  const byId = (id) => document.getElementById(id);
  const loading = byId("detailLoading");
  const errorState = byId("detailError");
  const content = byId("detailContent");

  const setText = (id, value) => {
    const element = byId(id);
    if (element) element.textContent = value;
  };

  const renderChips = (id, values, emptyText) => {
    const container = byId(id);
    if (!container) return;
    const labels = values.length ? values : [emptyText];
    container.replaceChildren(
      ...labels.map((value) => {
        const chip = document.createElement("span");
        chip.textContent = value;
        return chip;
      }),
    );
  };

  const formatUpdatedAt = (value) => {
    if (!value) return "갱신일 확인 불가";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return `데이터 기준일 ${value}`;
    return `${new Intl.DateTimeFormat("ko-KR", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Seoul",
    }).format(date)} 동기화`;
  };

  const showError = (message) => {
    loading.hidden = true;
    content.hidden = true;
    errorState.hidden = false;
    setText("detailErrorMessage", message);
  };

  const renderSpot = (spot, metadata) => {
    const type = spot.type === "recycle-center" ? "재활용 도움센터" : "클린하우스";
    const hours =
      spot.openTime || spot.closeTime
        ? `${spot.openTime ?? "시작 시간 미확인"} – ${spot.closeTime ?? "종료 시간 미확인"}`
        : "운영시간 정보 없음";

    document.title = `${spot.name} | 버릴제`;
    setText("detailType", type);
    setText("detailName", spot.name);
    setText("detailAddress", spot.address);
    setText("detailHours", hours);
    setText("detailLocation", spot.address || spot.name || "주소 정보 없음");
    setText("detailSource", `자료 출처 · ${spot.source}`);
    setText("detailUpdated", formatUpdatedAt(metadata?.lastSuccessAt ?? spot.sourceUpdatedAt));
    renderChips("detailItems", spot.items ?? [], "수거 품목 정보 없음");

    const services = spot.services ?? [];
    const servicesPanel = byId("detailServicesPanel");
    if (servicesPanel && services.length) {
      renderChips("detailServices", services, "");
      servicesPanel.hidden = false;
    }

    const mapLink = byId("detailMapLink");
    if (mapLink) {
      mapLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${spot.latitude},${spot.longitude}`)}`;
      mapLink.setAttribute("aria-label", `${spot.name} 위치를 새 창에서 열기`);
    }

    loading.hidden = true;
    content.hidden = false;
  };

  async function loadSpot() {
    const id = new URLSearchParams(window.location.search).get("id")?.trim();
    if (!id) {
      showError("장소 ID가 없습니다. 메인 화면에서 장소를 다시 선택해주세요.");
      return;
    }

    try {
      const response = await fetch(`${apiBase}/spots/${encodeURIComponent(id)}`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? `API response: ${response.status}`);
      }
      renderSpot(payload.data, payload.meta);
    } catch (error) {
      console.error("클린 스팟 상세 API 연결 실패", error);
      showError(error instanceof Error ? error.message : "잠시 후 다시 시도해주세요.");
    }
  }

  document.addEventListener("DOMContentLoaded", loadSpot);
})();
