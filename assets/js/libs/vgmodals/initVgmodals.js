function bindModalSource() {
  document.addEventListener("click", (e) => {
    if (!(e.target instanceof Element)) return;

    const el = e.target.closest("[data-modal-source]");
    if (!(el instanceof HTMLElement)) return;

    const source = el.dataset.modalSource;
    const modalId = el.dataset.modalId;

    if (!source || !modalId) return;

    const modal = document.querySelector(`[data-modal="${modalId}"]`);
    const form = modal?.querySelector("form");

    if (!form) return;

    let input = form.querySelector('input[name="source"]');

    if (input) {
      input.value = source;
      return;
    }

    input = document.createElement("input");
    input.type = "hidden";
    input.name = "source";
    input.dataset.vgformLabel = "Источник клика";
    input.dataset.vgformEmpty = "";
    input.value = source;
    form.appendChild(input);
  });
}

function bindContactModalContent() {
  const modal = document.querySelector('[data-modal="modalContact"]');
  const title = modal?.querySelector(".modal-title");
  const description = modal?.querySelector(".modal-description");

  if (!modal || !title || !description) return;

  const defaultTitle = title.innerHTML;
  const defaultDescription = description.innerHTML;

  document.addEventListener(
    "click",
    (e) => {
      if (!(e.target instanceof Element)) return;

      const trigger = e.target.closest('[data-modal-id="modalContact"]');
      if (!(trigger instanceof HTMLElement)) return;

      title.innerHTML = trigger.dataset.modalTitle || defaultTitle;
      description.innerHTML =
        trigger.dataset.modalDescription || defaultDescription;
    },
    true,
  );
}

export async function initVgmodals() {
  if (!document.querySelector("[data-modal]")) return;
  const { Modals } = await import("./vgmodals.js");
  window.Modals = Modals;
  bindContactModalContent();
  bindModalSource();
}
