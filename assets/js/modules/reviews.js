function fillReviewModal(card, modalContent) {
  modalContent.replaceChildren()
  if (!card) return

  const content = document.createElement("article")
  content.className = "reviews-modal"

  const top = card.querySelector(".reviews__card-top")?.cloneNode(true)
  const text = card.querySelector(".reviews__card-text")?.cloneNode(true)

  if (top instanceof HTMLElement) {
    top.classList.add("reviews-modal__top")
    content.appendChild(top)
  }

  if (text instanceof HTMLElement) {
    text.className = "reviews-modal__text"
    content.appendChild(text)
  }

  modalContent.appendChild(content)
}

export function initReviewsModal() {
  const modalElement = document.querySelector('[data-modal="modalReviews"]')
  const modalContent = modalElement?.querySelector(
    "[data-reviews-modal-content]",
  )
  const triggers = document.querySelectorAll(".reviews__more")

  if (!modalElement || !modalContent || !triggers.length) return

  triggers.forEach((trigger) => {
    trigger.setAttribute("data-modal-id", "modalReviews")

    trigger.addEventListener(
      "click",
      () => {
        const card = trigger.closest(".reviews__card")
        fillReviewModal(card, modalContent)
      },
      true,
    )
  })

  window.Modals?.getModal("modalReviews")?.onClose(() => {
    modalContent.replaceChildren()
  })
}

export async function initReviews() {
  initReviewsModal()
}
