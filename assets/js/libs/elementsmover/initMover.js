export async function initMovers() {
  const movers = document.querySelector(
    "[data-move-after],[data-move-before],[data-move-prepend],[data-move-append],[data-move-to]",
  );

  if (movers) {
    const { ElementsMover } = await import("./elementsmover.js");
    new ElementsMover();
  }
}
