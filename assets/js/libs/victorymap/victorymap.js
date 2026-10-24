/**********************************************************/
/*	@copyright	VICTORY group					          */
/*	@support	https://victoryagency.ru/				  */
/**********************************************************/

export function initVGMap() {
  const mapsWraps = document.querySelectorAll("[data-map]");

  if (mapsWraps.length === 0) return;

  let mapClueBottom = document.querySelector(".map-clue-bottom");

  const getOrCreateClueBottom = () => {
    if (!mapClueBottom) {
      mapClueBottom = document.createElement("div");
      mapClueBottom.className = "map-clue-bottom";
      mapClueBottom.textContent = "Выйти из режима просмотра карты";
      document.body.appendChild(mapClueBottom);

      // Навешиваем событие клика ОДИН РАЗ при создании
      mapClueBottom.addEventListener("click", () => {
        const activeMap = document.querySelector(".map-out.hide");
        if (activeMap) {
          const mapWrap = activeMap.closest("[data-map]");
          if (mapWrap) mapWrap.dispatchEvent(new Event("mouseleave"));
        }
      });
    }
    return mapClueBottom;
  };

  for (const mapWrap of mapsWraps) {
    if (!mapWrap) continue;

    const mapClue = document.createElement("div");
    const mapFrame =
      mapWrap.querySelector("iframe") ??
      mapWrap.querySelector("[data-map-frame]");
    const mapOut = document.createElement("div");

    if (!mapFrame) continue; // Пропускаем, если нет карты

    mapWrap.style.position = "relative";
    mapFrame.style.pointerEvents = "none";

    mapOut.className = "map-out";
    mapWrap.appendChild(mapOut);

    mapClue.className = "map-clue";
    mapClue.textContent = "Для управления картой - нажмите на неё";
    mapOut.appendChild(mapClue);

    if (window.screen.availWidth <= 1200) {
      mapClue.style.cssText = `display:flex;bottom:20px;left:20px;right:20px;`;
    }

    // Функция для АКТИВАЦИИ карты
    const activateMap = () => {
      const clueBottom = getOrCreateClueBottom();
      mapFrame.style.pointerEvents = "auto";
      if (mapClue) mapClue.classList.toggle("show");

      if (clueBottom) {
        clueBottom.offsetHeight;
        clueBottom.classList.add("show");
      }
      mapOut.classList.add("hide");
      document.dispatchEvent(new CustomEvent("map:activated"));
    };

    // Функция для ДЕАКТИВАЦИИ карты
    const deactivateMap = () => {
      mapClue.classList.remove("show");
      mapFrame.style.pointerEvents = "none";
      mapOut.classList.remove("hide");

      if (mapClueBottom) {
        mapClueBottom.classList.remove("show");
      }
      document.dispatchEvent(new CustomEvent("map:deactivated"));
    };

    // --- Обработчики событий ---
    mapOut.addEventListener("click", activateMap);

    mapOut.addEventListener("mousemove", (event) => {
      if (window.screen.width > 1200) {
        mapClue.classList.add("show");
        if (event.offsetY > 10) mapClue.style.top = event.offsetY + 20 + "px";
        if (event.offsetX > 10) mapClue.style.left = event.offsetX + 20 + "px";
      }
    });

    mapWrap.addEventListener("mouseleave", deactivateMap);
    mapWrap.addEventListener("touchend", deactivateMap);
  }
}
