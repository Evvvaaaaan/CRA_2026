(() => {
  const groups = document.querySelectorAll("[data-preset-group]");

  groups.forEach((group) => {
    const buttons = Array.from(
      group.querySelectorAll("[data-search-target][data-search-value]"),
    );
    const targetId = buttons[0]?.dataset.searchTarget;
    const input = targetId ? document.getElementById(targetId) : null;

    if (!input) return;

    const syncPressedState = () => {
      const currentValue = input.value.trim();
      buttons.forEach((button) => {
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.searchValue === currentValue),
        );
      });
    };

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        input.value = button.dataset.searchValue;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        syncPressedState();
      });
    });

    input.addEventListener("input", syncPressedState);
    syncPressedState();
  });
})();
