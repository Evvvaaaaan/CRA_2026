(() => {
  const form = document.getElementById("reportForm");
  const status = document.getElementById("reportStatus");

  if (!form || !status) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const report = [
      "[버릴제 장소 정보 제보]",
      `장소명: ${data.get("place")}`,
      `확인한 정보: ${data.get("type")}`,
      `현장 확인 시각: ${data.get("observedAt")}`,
      "",
      String(data.get("details")),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(report);
      status.textContent = "제보 내용이 복사되었습니다. 전달할 채널에 붙여 넣어주세요.";
    } catch {
      status.textContent = "자동 복사를 사용할 수 없습니다. 입력한 내용을 직접 선택해 복사해주세요.";
    }
  });
})();
