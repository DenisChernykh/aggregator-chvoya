import {
  getCleanText,
  setTargetContent,
  setTargetImage,
  transferModalData,
} from "./modal-data-transfer.js"

const modalSelector = '[data-modal="modalRoom"]'
const cardSelector = ".room-card"
const detailsSelector = ".room-card__more"
const excludedClickSelector = [
  ".room-card__button",
  ".room-card__more",
  ".room-card__dots",
  ".swiper-pagination",
  ".swiper-pagination-bullet",
].join(",")
let shouldSuppressCardClick = false
let suppressedClickTarget = null
let roomModalSwiper = null

function suppressNextCardClick(target = null) {
  shouldSuppressCardClick = true
  suppressedClickTarget = target
  window.setTimeout(() => {
    shouldSuppressCardClick = false
    suppressedClickTarget = null
  }, 120)
}

function shouldSuppressClick(target) {
  if (!shouldSuppressCardClick) return false
  if (!(target instanceof Element) || !(suppressedClickTarget instanceof Element)) return true

  return (
    target === suppressedClickTarget ||
    target.contains(suppressedClickTarget) ||
    suppressedClickTarget.contains(target)
  )
}

function initRoomsControls() {
  document.querySelectorAll(".rooms").forEach((section) => {
    const list = section.querySelector(".rooms__grid")
    const viewport = section.querySelector(".rooms__viewport")

    if (!(list instanceof HTMLElement)) return

    let didDrag = false
    let startX = 0
    let startY = 0

    const stopDrag = () => {
      if (didDrag) {
        suppressNextCardClick()
      }

      didDrag = false
    }

    list.addEventListener("pointerdown", (event) => {
      didDrag = false
      startX = event.clientX
      startY = event.clientY
    })

    list.addEventListener("pointermove", (event) => {
      const deltaX = event.clientX - startX
      const deltaY = event.clientY - startY

      if (!didDrag && Math.hypot(deltaX, deltaY) > 5) {
        didDrag = true
      }
    })

    list.addEventListener("pointerup", stopDrag)
    list.addEventListener("pointercancel", stopDrag)

    section.querySelectorAll("[data-tab-id]").forEach((tab) => {
      tab.addEventListener("click", () => {
        window.requestAnimationFrame(() => {
          viewport?.swiper?.update?.()
          viewport?.swiper?.slideTo?.(0, 0)
        })
      })
    })
  })
}

function getActiveRoomImage(card) {
  return (
    card.querySelector(".room-card__slider .swiper-slide-active img") ||
    card.querySelector(".room-card__media img")
  )
}

function getRoomGalleryImages(card) {
  const slides = Array.from(
    card.querySelectorAll(".room-card__slider .swiper-slide"),
  ).filter((slide) => !slide.classList.contains("swiper-slide-duplicate"))

  const images = slides
    .map((slide) => slide.querySelector("img"))
    .filter((image) => image instanceof HTMLImageElement)

  if (images.length) return images

  return Array.from(card.querySelectorAll(".room-card__media img")).filter(
    (image) => image instanceof HTMLImageElement,
  )
}

function getRoomInitialSlideIndex(images, activeImage) {
  if (!activeImage) return 0

  const activeSlideIndex = activeImage.closest(".swiper-slide")?.dataset
    ?.swiperSlideIndex

  if (activeSlideIndex !== undefined) {
    const parsedIndex = Number(activeSlideIndex)
    if (
      Number.isInteger(parsedIndex) &&
      parsedIndex >= 0 &&
      parsedIndex < images.length
    ) {
      return parsedIndex
    }
  }

  const activeSrc = activeImage.currentSrc || activeImage.getAttribute("src")
  const activeAlt = activeImage.getAttribute("alt") || ""
  const matchedIndex = images.findIndex((image) => {
    const imageSrc = image.currentSrc || image.getAttribute("src")
    return imageSrc === activeSrc && (image.getAttribute("alt") || "") === activeAlt
  })

  return matchedIndex >= 0 ? matchedIndex : 0
}

async function initRoomModalGallery(card, modal, activeImage) {
  const sliderElement = modal.querySelector("[data-room-modal-slider]")
  const wrapper = modal.querySelector("[data-room-modal-gallery]")
  const pagination = modal.querySelector("[data-room-modal-pagination]")

  if (!(sliderElement instanceof HTMLElement) || !wrapper) return

  const images = getRoomGalleryImages(card)
  const initialSlide = getRoomInitialSlideIndex(images, activeImage)

  roomModalSwiper?.destroy(true, true)
  roomModalSwiper = null
  wrapper.replaceChildren()

  images.forEach((image) => {
    const slide = document.createElement("div")
    const modalImage = document.createElement("img")

    slide.className = "room-modal__slide swiper-slide"
    modalImage.src = image.getAttribute("src") || ""
    modalImage.alt = image.getAttribute("alt") || ""
    modalImage.loading = "lazy"
    slide.appendChild(modalImage)
    wrapper.appendChild(slide)
  })

  if (images.length <= 1 || !pagination) return

  const { default: Swiper } = await import("swiper")
  const { Navigation, Pagination } = await import("swiper/modules")

  roomModalSwiper = new Swiper(sliderElement, {
    modules: [Navigation, Pagination],
    slidesPerView: 1,
    speed: 600,
    initialSlide,
    rewind: images.length > 1,
    watchOverflow: true,
    grabCursor: true,
    pagination: {
      el: pagination,
      clickable: true,
    },
    navigation: {
      prevEl: modal.querySelector("[data-room-modal-prev]"),
      nextEl: modal.querySelector("[data-room-modal-next]"),
    },
  })
}

function fillRoomModal(card, modal) {
  transferModalData(card, modal)

  const activeImage = getActiveRoomImage(card)
  const modalImage = modal.querySelector("[data-room-modal-image]")
  setTargetImage(
    modalImage,
    activeImage?.getAttribute("src") || "",
    activeImage?.getAttribute("alt") || "",
  )

  const priceTarget = modal.querySelector('[data-transfer-text-modal="price"]')
  const priceSource = card.querySelector(".room-card__price")

  if (priceTarget && priceSource) {
    setTargetContent(priceTarget, getCleanText(priceSource), getCleanText(priceSource))
  }

  modal.querySelector(".modal-window")?.scrollTo({ top: 0 })

  return activeImage
}

function shouldIgnoreCardClick(target) {
  return Boolean(target.closest(excludedClickSelector))
}

function openRoomModal(card, modal) {
  const activeImage = fillRoomModal(card, modal)
  window.Modals?.getModal("modalRoom")?.open()
  initRoomModalGallery(card, modal, activeImage)
}

export function initRooms() {
  const modal = document.querySelector(modalSelector)
  if (!modal) return

  initRoomsControls()

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return

    const details = event.target.closest(detailsSelector)
    const card = details?.closest(cardSelector) || event.target.closest(cardSelector)

    if (!(card instanceof HTMLElement)) return
    if (shouldSuppressClick(event.target)) return
    if (!details && shouldIgnoreCardClick(event.target)) return

    event.preventDefault()
    openRoomModal(card, modal)
  }, true)

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return
    if (!(event.target instanceof Element)) return

    const details = event.target.closest(detailsSelector)
    if (!details) return

    const card = details.closest(cardSelector)
    if (!(card instanceof HTMLElement)) return

    event.preventDefault()
    openRoomModal(card, modal)
  })
}
